const Visitors = require('../models/visitors');
const Users = require('../models/users');
const Gallery = require('../models/gallery');
const Exam = require('../models/exams');
const exams = require('../models/exams');
const Solutions = require('../models/solutions');
const AdminData = require('../models/adminData');
const { uploadFile } = require('../middlewares/file_upload');
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
})




exports.addVisitor = async(req, res) => {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const day = new Date().toISOString().substring(8, 10);
    console.log("addd visit")
    const info = await Visitors.find({month, year});
    if(info.length > 0) 
        await Visitors.updateOne({month, year, day}, {$inc: {visitors: 1}});
    else 
        await new Visitors({month, year, day, visitors: 1}).save();
        res.json({added: true})
}
exports.getVisits = async(req, res) => {
    try {
        const year = new Date().getFullYear().toString();
        const month = (new Date().getMonth()+1).toString();
        const filter = {year};
        if(req.params.type == "days") filter['month'] = month;
        ////////////////////////////////
        const visits = await Visitors.aggregate([
            {$match: filter},
            {
                $group: {
                    _id: req.params.type == "months"? "$month": "$day",
                    sum: {$sum: "$visitors"}
                }
            }
        ]);
        res.json({visits});
    } catch(err) {
        res.json({err: err.message?err.message: err});
    }
}
exports.getDashboardData = async(req, res) => {
    try {
        const filteredExams = [];
        const c1 =  Exam.find();
        const c2 = Users.find({role: 0}).count();
        const c3 = Solutions.find({done: true}).count();
        const c4 = Solutions.find({done: false}).count();
        const [exams, users, corrected, uncorrected] = await Promise.all([c1, c2, c3, c4]);
        exams.forEach(exam => {
            if(!filteredExams.find(fx => fx.number == exam.number && fx.stage == exam.stage)) filteredExams.push(exam);
        });
        res.status(200).json({exams: filteredExams.length, users, corrected, uncorrected});
    } catch(err) {
        console.log(err)
        res.json({err: err.message?err.message: err});
    }
}

////////////////////////STUDENTS_ORDER//////////////////////////////////////
exports.getStageFullDegree = async(req, res) => {
    try {
        examsNumbers = [];
        let fullDegree = 0;
        const stage = req.params.stage;

        const examss = await exams.find({stage});
        console.log(examss.length)
        if(examss.length === 0) {
            res.json({fullDegree});
        }
        let go = false;
        examss.forEach((exam, i) => {
            if(!examsNumbers.includes(exam.number)) {
                examsNumbers.push(exam.number);
                go = true;
            } else {
                go = false;
            }
            exam.sections.forEach((sec, s) => {
                sec.questions.forEach((ques, q) => {
                if(go) {
                    fullDegree += ques.fullDegree;
                    }
                })
            })
                
            if(i===examss.length-1) {
                res.json({fullDegree});
            }
        });
    } catch(err) {
        console.log(err);
    }
}
exports.getTotalDegreeAndFullDegreeForUserId = async(req, res) => {
    try {
        const userId = req.params.userId;
        const solutions = await Solutions.find({userId, done: true}).sort({_id: -1});
        let totalDegree = 0;
        solutions.forEach(sol => {
            totalDegree += sol.totalDegree;
        });

        res.json({totalDegree});
} catch(err) {
    res.json({message: 'Ad not added category...'});
    }
}
////////////////////////////////////////////////////////////////////////////


exports.sendInstructions = async(req, res) => {
    try {
        const update = await AdminData.update({admin: 1}, {nextExamInstructions: req.body.instructions});
        if(update.nModified === 1) {
            res.json({done: true});
        } else {
            res.json({done: false});
        }
    } catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
    }
}
exports.getAdminData = async(req, res) => {
    try {
        const adminData = await AdminData.find();
        if(adminData.length > 0) {
            res.json({adminData: adminData[0]});
        } else {
            const newData = await new AdminData({admin: 1}).save();
            res.json({adminData: {}});

        }
    } catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
     }
}
exports.updateAdminData = async(req, res) => {
    try {
        const adminData = await AdminData.find({admin: 1});
        if(req.files) {
            const url = await uploadFile(req.files.image, `image1`);
            req.body['image1'] = url;
        }
        if(adminData.length === 0) {
            await new AdminData({admin: 1}).save();
        }
        const update = await AdminData.update({admin: 1}, req.body);
        if(update.nModified === 1) {
            res.json({done: true});
        } else {
            res.json({done: false});
        }
    } catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
     }
}
exports.publishAd = async(req, res) => {
    try {
        const update = await AdminData.updateOne({admin: 1}, req.body);
        if(update.nModified == 0) throw("مشكلة في رفع الاعلان");
        res.json({done: true});
    } catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
    }
}

exports.getStudentsNumbers = async(req, res) => {
    try {
        const users = await Users.find({stage: req.params.stage, role: 0}).count();
        res.json({users});
    } catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
     }
}
////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////

exports.getGallery = async(req, res) => {
    try {
        const images = await Gallery.find().sort({number: 1});
        res.json({images});
    } catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
     }
}

exports.uploadGalleryImage = async(req, res) => {
    try {
        console.log('uploading')
        const url = await uploadFile(req.files.image, `gallery-${req.body.number}`);
        console.log(url);
        const image = {number: req.body.number, url};
        const newImage = await new Gallery(image).save();
        if(!newImage) throw("try again");
        const images = await Gallery.find();
        res.json({images});
    } catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
     }
}

exports.deleteGalleryImage = async(req, res) => {
    try {
        const deleted = await Gallery.deleteOne({_id: req.params.id});
        if(!deleted) throw("try again");
        cloudinary.uploader.destroy(`gallery-${req.params.number}`, (err, result) => {
            if(err) reject(err);

        });
        res.json({done: true});
    } catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
     }
}