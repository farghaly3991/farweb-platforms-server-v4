const fs = require("fs-extra");
const Videos = require("../models/lessons");
const Users = require("../models/users");
const path = require("path")
const { uploadFile } = require('../middlewares/file_upload');
// const request = require("request");
const { createWriteStream } = require("fs");
const ytdl = require("ytdl-core");
const jwt = require("jsonwebtoken");
const solutionModels = require("../models/solutionModels");
const tasks = require("../models/tasks");


exports.uploadVideo = async(req, res) => {
    try {
        if(req.files && req.files.file) {
            const url = await uploadFile(req.files.file, req.body.fileName);
            req.body.filePath = url;
        } else {
            req.body.filePath = req.body.file;
        }
        if(!req.params.id) {
            const obj = {section: req.body.section, number: +req.body.number, partNumber: +req.body.partNumber, stage: req.body.stage};
            // const videos = await Videos.find(obj);
            // if(videos.length > 0) {
            //     throw("رقم الدرس في هذه الدورة لهده السنة الدراسية بالفعل موجود");
            // } else {
                let newVideo = await Videos.findOneAndUpdate(obj, req.body);
                if(!newVideo) {
                    newVideo = await new Videos(req.body).save();
                }
                if(newVideo) res.json({done: true, id: newVideo._id, videoName: req.body.videoPath});
                else throw("لم يتم رفع الدرس حاول مجددا");
            // }
        }
        else if(req.params.id) {
            console.log("update lesson")
            const updated = await Videos.updateOne({_id: req.params.id}, req.body);
            if(updated.n == 1) res.json({done: true, id: req.params.id, videoName: req.body.videoPath});
            else throw("upload failed");
       }
        
    } catch(err) {
        console.log(err);
        res.json({done: false, err})
    }
}


exports.deleteVideo = async(req, res) => {
    const del = await Videos.deleteOne({_id: req.params.id});
    const del2 = await tasks.deleteOne({lessonId: req.params.id});
    const task = await tasks.findOne({lessonId: req.params.id});
    if(task) await solutionModels.deleteOne({examdId: task._id});
    if(del) {
        const videos = await Videos.find({stage: req.params.stage});
        res.json({videos, done: true});
    } else {
        res.json({done: true});
    }
}


exports.prepareUpload = async(req, res) => {
    try {
        let chunksLen = 0;
        const stamp = req.body.file;
        const dir_tmp = "./tmp";
        if(!fs.existsSync(dir_tmp)) return res.json({chunksLen});
        /////////////////////////////
        const files = fs.readdirSync(dir_tmp);
        if(files.length == 0) return res.json({chunksLen});
        //////////////////////////////
        const last = files.find(file => file.includes("last"));
        if(last) {
            fs.emptyDirSync(dir_tmp);
            return res.json({chunksLen});
        }
        //////////////////////////////
        const uploaded = files.filter(file => file.includes(stamp));
        if(uploaded.length == 0) {
            fs.emptyDirSync(dir_tmp);
            return res.json({chunksLen: 0});
        }
        ///////////////////////////////
        const chanks_nums = [];
        uploaded.forEach(up => {
            const num = +up.split('tmp-')[1].split("-")[0];
            chanks_nums.push(num);
        });
        const lastChunck = Math.max(...chanks_nums);
        fs.unlinkSync(`${dir_tmp}/tmp-${lastChunck}-${stamp}`);
        return res.json({chunksLen: uploaded.length - 1});
        ///////////////////////
    }
    catch(err) {
        console.log(err);
        res.json({err});
    }
}


exports.uploadVideoByChunks = async(req, res) => {
    try {
        if(!req.files.chunk) throw("No chunk found");
        const chunk = req.files.chunk;
        const type = chunk.mimetype.split("/")[1];
        const body = req.body;
        const dir = `./videos`;
        const dir_tmp = `./tmp`;
        const videoFile = `${body.fileName}.${type}`;

        if(!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {recursive: true});
        }
        if(!fs.existsSync(dir_tmp)) {
            fs.mkdirSync(dir_tmp, {recursive: true});
        }
        /////////////////////////////////////////////////
        const newTmp = `${dir_tmp}/${req.body.tmpName}`;
        fs.renameSync(chunk.tempFilePath, newTmp);
        /////////////////////////////////////////////////
        
        if(body.isLast == 'true') {
            const allFiles = fs.readdirSync(dir_tmp);
            const files = allFiles.sort((a, b) => {
                const num1 = +a.split('tmp-')[1].split("-")[0];
                const num2 = +b.split('tmp-')[1].split("-")[0];
                return num1 - num2;

            });
            for(let i = 0; i < files.length; i++) {
                const data = fs.readFileSync(dir_tmp + "/" + files[i]);
                fs.appendFileSync(`${dir_tmp}/${videoFile}`, data);
            }
            fs.moveSync(`${dir_tmp}/${videoFile}`, `${dir}/${videoFile}`, {overwrite: true});

            fs.emptyDirSync(dir_tmp);
            res.json({done: true, videoFile});
        }
        else res.json({done: false});
    }
    catch(err) {
        console.log(err);
    }
}

exports.bufferVideo = (req, res) => {
    const range = req.headers.range;
    if (!range) {
        res.status(400).send("Requires Range header");
    }
    const videoName = req.params.videoName;
    const videoPath = path.join(__dirname, "..", "videos", videoName);
    const videoSize = fs.statSync(videoPath).size;
    const CHUNK_SIZE = 10 ** 6;
    // const start = Number(range.replace(/\D/g, ""));
    const start = Number(range.split("bytes=")[1].split("-")[0]);

    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

    const contentLength = end - start + 1;
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    };

    res.writeHead(206, headers);

    // create video read stream for this particular chunk
    const videoStream = fs.createReadStream(videoPath, { start, end });

    // Stream the video chunk to the client
    videoStream.pipe(res);
}

let video_autorizations = [];

exports.streamYoutube = async(req, res) => {
    try {
        const range = req.headers.range;
        if (!range) {
            res.status(400).send("Requires Range header");
        }
        if(range.split("bytes=")[1].split("-")[1]) throw("Not authorized...");
        ///////////////////////////////////////
        const url = decodeURIComponent(req.params.url);
        const info = await ytdl.getInfo(url);
        let format = ytdl.chooseFormat(info.formats, { quality: 'highest' });
        const videoSize = format.contentLength;
        const CHUNK_SIZE = 5 * 10 ** 6;
        const start = Number(range.split("bytes=")[1].split("-")[0]);
        const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
        const contentLength = end - start + 1;
        ///////////////////////////////////////
        //////////////////////////////////////

        const headers = {
            "Content-Range": `bytes ${start}-${end}/${videoSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": contentLength,
            "Content-Type": "video/mp4",
        };

        res.writeHead(206, headers);
        ytdl(url, {format: "mp4", quality: "highest", range:  {start, end}}).pipe(res);
    }
    catch(err) {
        console.log(err);
    }
}
exports.authorizeVideo = async(req, res) => {
    try {
        const token = req.headers.authorization;
        const email = jwt.decode(token).email;
        const unit = req.params.unit;
        const users = await Users.find({email, units: +unit});
        if(users.length > 0) {
            const password = Math.random().toString(36).substring(1, 11);
            const index = video_autorizations.findIndex(va => va.email == email);
            if(index < 0) video_autorizations.push({email, password, noOfChunks: 0});
            else video_autorizations[index].password = password;
            res.json({password});
        } else throw("غير مصرح لك");
    }
    catch(err) {
        console.log(err);
        res.json({err});
    }
}


// exports.streamYoutube = async(req, res) => {
//     try {
//         console.log(req.headers);
//         const range = req.headers.range;
//         if (!range) {
//             res.status(400).send("Requires Range header");
//         }
//         ///////////////////////////////////////
//         const url = decodeURIComponent(req.params.url);
//         const info = await ytdl.getInfo(url);
//         let format = ytdl.chooseFormat(info.formats, { quality: 'highest' });
//         const videoSize = format.contentLength;
//         const CHUNK_SIZE = 5 * 10 ** 6;
//         const start = Number(range.split("bytes=")[1].split("-")[0]);
//         const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
//         const contentLength = end - start + 1;
//         ///////////////////////////////////////
//         const token = req.params.token;
//         const password = req.params.password;
//         const email = jwt.decode(token).email;
//         const lastChunck = videoSize;
//         const vid_auth = video_autorizations.find(va => va.email == email);
//         if(!vid_auth) throw(" غير مصرح لك واحد");
//         if(vid_auth.password != password) throw("غير مصرح لك اتنين");
//         const index = video_autorizations.findIndex(va => va.email == email);
//         console.log(vid_auth.lastChunck, lastChunck)
//         if(lastChunck - vid_auth.lastChunck <= 100) {
//             video_autorizations.splice(index, 1);
//             throw("أعد فتح الفيديو من صفحة الدرس في المنصة");
//         }
//         video_autorizations[index].lastChunck = end;
//         //////////////////////////////////////

//         const headers = {
//             "Content-Range": `bytes ${start}-${end}/${videoSize}`,
//             "Accept-Ranges": "bytes",
//             "Content-Length": contentLength,
//             "Content-Type": "video/mp4",
//         };

//         res.writeHead(206, headers);
//         ytdl(url, {format: "mp4", quality: "highest", range:  {start, end}}).pipe(res);
//     }
//     catch(err) {
//         console.log(err);
//     }
// }