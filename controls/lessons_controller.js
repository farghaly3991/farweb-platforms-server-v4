const Users = require('../models/users');;
const Videos = require('../models/lessons');
const Sections = require('../models/sections');
const fs = require("fs");
const http = require("http");
const pathh = require("path");
const cloudinary = require('cloudinary').v2;
const { uploadFile } = require('../middlewares/file_upload');
const { generateRandomString } = require('../helper-funcs');
const AdminData = require('../models/adminData');
const LessonsCodes = require('../models/lessons-codes');
const Exams = require('../models/unit-exams/exams');

// cloudinary.config({
//     cloud_name: 'farghaly-cloud2',
//     api_key: '714525226192736',
//     api_secret: '9GTTECbD3vIgWIEoaLi30OEpXuA'
// });
// const folder = 'fuhrer-deutsch';


cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
})
const folder = process.env.cloud_folder;


/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////



exports.unwindUnits = async(req, res) => {
    try {
        const getUnits = (stage) => {
            return new Promise((resolve, reject) => {
                Videos.aggregate([
                    {$match: {'stage': stage}},
                    {$unwind: '$unit'},
                    {$group: {_id: '$section'}},
                    {$sort: {'unit': 1}}
                ],
                    function(err, data) {
                        if(err) return reject(err);
                        return resolve(data);
                    }
                );
            });
        }
        const one = await getUnits('one');
        const two = await getUnits('two');
        const three = await getUnits('three');
        res.json({one, two, three});
        } catch(err) {
            console.log(err)
        }
}

exports.fetchVideos = async(req, res) => {
    try {
        const videos = await Videos.find(req.body).sort({number: 1, partNumber: 1});
        res.json({videos});
    } catch(err) {
        console.log(err);
    }
}

exports.fetchLessonsAndExamsForStudent = async(req, res) => {
    try {
        const obj = {stage: req.params.stage, section: +req.params.section};
        /////////////////////////////////
        const user = await Users.findOne({_id: req.params.userId});
        const section = await Sections.findOne({stage: req.params.stage, number: +req.params.section});
        const adminData = await AdminData.findOne({admin: 1});
        // if(!adminData.deactiveStudentConfirmation && user.confirmed == 0) throw("بأنتظار تأكيد المدرس");
        //////
        const userUnits = user.units;
        let videos = await Videos.find(obj).sort({number: 1, partNumber: 1});
        videos = [...videos].filter(vid => {
            if(!vid.showDate || vid.showDate == '') return true;
            if (new Date(vid.showDate).getTime() > new Date().getTime()) return false;
            if(!vid.expiration || vid.expiration == '') return true;
            else {
                return new Date(vid.expiration).getTime() >= new Date().getTime()
            };
        });
        /////////////////////////////
        const today = new Date().toISOString();
        // Exams.updateMany({publishDate: {$lte: today}}, {deadLine: new Date(new Date().getTime() - 1000000)}).then(res => {})
       
        const exams = await Exams.find({stage: req.params.stage, unit: req.params.section, publishDate: {$lte: today}, isTask: false}).sort({number: 1});
        /////////////////////////////
        let filteredVideos = [];
        let filteredExams = [];
        if(
            !adminData.lessonCodes && 
            !adminData.allLessonsCode &&
            !userUnits.includes(+req.params.section) &&
            section.price > 0
            ) {
                filteredVideos = videos.map(vid => {
                    if(vid.paid) return {name: vid.name, number: vid.number, part: vid.part, partNumber: vid.partNumber};
                    else return {_id: vid._id, name: vid.name, number: vid.number, part: vid.part, partNumber: vid.partNumber};
                });
                //////////////////////
                filteredExams = exams.map(exam => ({name: exam.name, number: exam.number}));
                
            } else {
                filteredVideos = videos.map(vid => ({_id: vid._id, name: vid.name, number: vid.number, part: vid.part, partNumber: vid.partNumber}));
                filteredExams = exams.map(exam => ({_id: exam._id, name: exam.name, number: exam.number}));
            }
            

        res.json({videos: filteredVideos, exams: filteredExams});
    } catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
    }
}

exports.fetchVideo = async(req, res) => {
    try {
        const video = await Videos.findOne({_id: req.params.id});
        const exam = await Exams.findOne({lessonId: req.params.id});
        const obj = {video};
        if(exam) obj['examId'] = exam._id;
        res.json(obj);
    } catch(err) {
        console.log(err);
    }
}


exports.fetchLessonsAndExamsForVisitors = async(req, res) => {
    try {
        const stage = req.params.stage;
        const section = req.params.section;
        
        const videos = await Videos.find({stage, section: section}).sort({number: 1, partNumber: 1});
        const filtered = [...videos].filter(vid => {
            if(!vid.showDate || vid.showDate == '') return true;
            if (new Date(vid.showDate).getTime() > new Date().getTime()) return false;
            if(!vid.expiration || vid.expiration == '') return true;
            else {
                return new Date(vid.expiration).getTime() >= new Date().getTime()
            };
        });
        const lessons = filtered.map(vid => ({name: vid.name, number: vid.number, part: vid.part, partNumber: vid.partNumber}));
        /////////////////////////////////
        
        const today = new Date().toISOString();
        const unitExams = await Exams.find({stage, unit: section, publishDate: {$lte: today}}).sort({number: 1});
        const exams = unitExams.map(ex => ({ number: ex.number, name: ex.name}));
        res.json({videos: lessons, exams});
    } catch(err) {
        console.log(err);
        res.json(err.message? err.message: err);
    }
}

exports.updateAllowedUnits = async(req, res) => {
    try {
        const update = await Users.updateOne({_id: req.params.id}, {units: req.body.units});
        if(update.nModified === 1) {
            const user = await Users.findOne({_id: req.params.id});
            res.json({user , done: true});
        } else {
            res.json({done: false});
        }
    } catch(err) {
        res.json({done: false});
    }
}

exports.downloadFile = async(req, res) => {
    try {
        const lessons = await Videos.find({_id: req.params.lessonId});
        if(lessons.length == 0) throw("lesson not found");
        const path = lessons[0].filePath;
        if(!path || path == "") throw("file not found");
        // const path = Buffer.from(req.params.url, "base64").toString("ascii");
        const ext = path.split(".")[3];
        const slashes = path.split(".")[2].split("/");
        let fileName = slashes[slashes.length - 1];
        fileName = decodeURIComponent(fileName);
        console.log(fileName);
        let name;
        switch (ext) {
          case "pd":
            name = fileName + ".pdf";
            break;
          case "zi":
            name = fileName + ".zip";
            break;
          case "ra":
            name = fileName + ".rar";
            break;
          case "plain":
            name = fileName + ".txt";
            break;
          case "octet-stream":
            name = fileName + ".rar";
            break;
          default:
            name = fileName + "." + ext;
            break;
        }
        const request = http.get(path, response => {
            if(response.statusCode == 200) {
                const file = fs.createWriteStream(name);
                response.pipe(file).on("close", () => {
                    res.download(name, (err) => {
                        fs.unlinkSync(name);
                        if(err) console.log(err);
                    });
                    
                });
            }
                // const read = fs.createReadStream(name);
                // read.pipe(res);
                // return;
        });
        // request(path, (err, response, body) => {
        //     if(err) return console.error('error:', err); // Print the error if one occurred
        //     console.log('statusCode:', response && response.statusCode);
        //     const file = fs.createWriteStream(name);
        //         response.pipe(file);
                
                // res.download(name, body, (err) => {
                //     // fs.unlinkSync(name);
                //     if(err) console.log(err);
                // });
        // });
    }
    catch(err) {
        console.log(err);
    }
}

exports.addSection = async(req, res) => {
    try {
        const body = req.body;
        const existed = await Sections.find({number: body.number, stage: body.stage});
        if(existed.length > 0) {
            throw("رقم هذه الدورة موجود بالفعل لهده السنة الدراسية");
        }
        if(req.files && req.files.image) {
            const url = await uploadFile(req.files.image, body.imageName);
            body.image = url;
        }
        const addSection = await new Sections(body).save();
        if(addSection) {
            res.status(200).json({done: true});
        } else res.json({done: false});
    }
    catch(err) {
       console.log(err);
       res.json({done: false, err})
    }
}

exports.getSectionsForStudent = async(req, res) => {
    try {
        const stage = req.params.stage;
        const userId = req.params.userId;
        
        if(userId == "null" || stage == "null") {
            const stagesSections = {};
            const sections = await Sections.find();
            if(sections.length == 0) throw({code: 404});
            sections.forEach(sec => {
                if(stagesSections[sec.stage]) stagesSections[sec.stage].push(sec);
                else stagesSections[sec.stage] = [sec];
            });
            return res.json({sections: stagesSections});
        }

        const student = await Users.findOne({_id: userId});
        const allowedUnits = student.units;
        const sections = await Sections.find({stage}).sort({number: 1});
        const modifiedSections = sections.map(sec => {
            if(allowedUnits.includes(sec.number)) {
                return {...sec._doc, allowed: true}
            } else return {...sec._doc, allowed: false}
        });
        res.status(200).json({sections: modifiedSections});
    }
    catch(err) {
       console.log(err);
       res.json({err: err.message?err.message: err});
    }
}

exports.getSectionsByStage = async(req, res) => {
    try {
        const stage = req.params.stage;
        const sections = await Sections.find({stage}).sort({number: 1});
        res.status(200).json({sections});
    }
    catch(err) {
       console.log(err);
       res.json({done: false, err})
    }
}

exports.getSections = async(req, res) => {
    try {
        const sections = await Sections.find().sort({number: 1});
        res.status(200).json({sections});
    }
    catch(err) {
       console.log(err);
       res.json({done: false})
    }
}

exports.getSection = async(req, res) => {
    try {
        const sections = await Sections.find({_id: req.params.id});
        res.status(200).json({section: sections[0]});
    }
    catch(err) {
       console.log(err);
       res.json({done: false})
    }
}

exports.editSection = async(req, res) => {
    try {
        const body = req.body;
        delete body['stage'];
        delete body['number'];
        const id = req.params.id;
        const update = await Sections.updateOne({_id: id}, req.body);
        if(update.nModified != 1) throw("no thing updated");
        res.status(200).json({done: true});
    }
    catch(err) {
       console.log(err);
       res.json({error: err.message? err.message: err});
    }
}

exports.deleteSection = async(req, res) => {
    try {
        const id = req.params.id;
        let done = false;
        const deleted = await Sections.deleteOne({_id: id});
        if(deleted) done = true;
        else done = false;
        res.status(200).json({done});
    }
    catch(err) {
       console.log(err);
       res.json({done: false})
    }
}

exports.addVideoView = async(req, res) => {
    try {
        const userId = req.body.userId;
        const lessonId = req.body.lessonId;
        const update = await Videos.updateOne({_id: lessonId, students: {$ne: userId}}, {$push: {students: userId}});
        
        res.status(200).json({done: true});
    }
    catch(err) {
       console.log(err);
       res.json({done: false})
    }
}
///////////////////////////////////////////

exports.addLessonCode = async(req, res) => {
    try {
        const userId = req.params.userId;
        const lessonId = req.params.lessonId;
        const code = generateRandomString(8);
        const date = new Date();
        const userCode = await Videos.findOne({_id: lessonId, "codes.userId": userId});
        if(userCode) {
            const update = await Videos.updateOne({_id: lessonId, "codes.userId": userId}, {"$set": {"codes.$.code": code, "codes.$.times": 0, "codes.$.date": date}});
            if(update.n == 0) throw("problem updating code");
        }
        else {
            const newCode = await Videos.updateOne({_id: lessonId}, {$push: {codes: {userId, code, times: 0, date}}});
            if(!newCode) throw("problem generating code");
        }
        res.status(200).json({code});
    }
    catch(err) {
       console.log(err);
       res.json({err: err.message?err.message: err});
    }
}

exports.getLessonCodes = async(req, res) => {
    try {
        const lessonId = req.params.lessonId;
        const video = await Videos.findOne({_id: lessonId});
        const codes = video.codes;
        res.status(200).json({codes});
    }
    catch(err) {
       console.log(err);
       res.json({err: err.message?err.message: err});
    }
}

exports.getUnitPrice = async(req, res) => {
    try {
        const unit = await Sections.findOne(req.body);
        if(!unit) throw("لا وجود لهده الوحدة");
        res.status(200).json({price: unit.price});
    }
    catch(err) {
       console.log(err);
       res.json({err: err.message?err.message: err});
    }
}


exports.getAllLessons = async(req, res) => {
    try {
        const lessons = await Videos.find();
        res.status(200).json({lessons});
    }
    catch(err) {
       console.log(err);
       res.json({err: err.message?err.message: err});
    }
}