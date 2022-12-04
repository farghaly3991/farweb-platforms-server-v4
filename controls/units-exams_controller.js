
const Users = require('../models/users');
const Exam = require('../models/unit-exams/exams');
const exams = require('../models/unit-exams/exams');
const Solutions = require('../models/unit-exams/solutions');
const Sections = require('../models/sections');
const SolutionModels = require('../models/unit-exams/solutionModels');
const http = require("http");
const fs = require("fs");

const { uploadFile } = require('../middlewares/file_upload');
const AdminData = require('../models/adminData');
const { resourceLimits } = require('worker_threads');
const { authGeneralCodeHandler } = require('./content-autherization');


const shuffleArray = (arr) => {
    const questions = [];
    do {
      const i = Math.floor(Math.random() * arr.length);
      if(!questions.includes(arr[i])) questions.push(arr[i]);
    }
    while(arr.length != questions.length);
    return questions;
}

const shuffleExam = (exam) => {
    return {
        ...exam, 
        sections: exam.sections.map(sec => {
            return {...sec, questions: shuffleArray(sec.questions).map(ques => {
                return ques;
            })
            }
        }) 
    };
}

//////////////////////////////////////////////////////////////////////////////
////////////////////////////// USERSIDE //////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////



exports.getUnitsExamsByStage = async(req, res) => {
    const examss = await exams.find({stage: req.params.stage}).sort({number: 1});
    res.json({exams: examss});
}




//////////////////////////////////////////////////////////////////////////////
////////////////////////////// ADMIN_SIDE //////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////



exports.fetchUnitExam = async(req, res) => {
    try {
        const id = req.params.id;
        let exam = await Exam.findOne({_id: id});
        res.json({exam});
    } catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
    }
}

exports.fetchUnitExamForUser = async(req, res) => {
    try {
        const userId = req.params.userId;
        const examId = req.params.examId;
        const unit = req.params.unit;
        ///////////////////
        const user = await Users.findOne({_id: userId});
        ///////////////// SECTIONS-FIX /////////////////
        const section = await Sections.findOne({stage: user.stage, number: unit});
        const adminData = await AdminData.findOne({admin: 1});
        let examCollec = await exams.findOne({_id: examId});

        ////////// IF YOU ARE AUTHENTICATED///////////
        if((!adminData.deactiveStudentConfirmation && user.confirmed == 0)) throw("بأنتظار تأكيد المدرس");
        if(
            !adminData.lessonCodes && 
            !adminData.allLessonsCode &&
            !user.units.includes(unit) &&
            section.price > 0
            ) throw("انتا غير مشترك في هذه الوحدة");
        

        // HAS USER ALREADY ANSWERED THIS EXAM
        const solution = await Solutions.findOne({examId, userId});
        if(solution) {
            //////////// SHOW DATE ////////////
            if(new Date().getTime() < new Date(examCollec.resultPublishDate).getTime()) {
                throw("عرض النتيجة مؤجل .. يمكنك التأكد لاحقا ");
            }
            return res.json({isSolution: true, solution});
        }
        
            
        // IF USER HAS NO START TIME GIVE HIM START TIME FROM NOW
        let startTime = user.lastTime;
        if(user.lastTime < 10000) {
            const updateUser = await Users.updateOne({_id: userId}, {lastTime: new Date().getTime()});
            if(updateUser.nModified != 1) return;
            startTime = new Date().getTime();
        } 
        
        let exam = {...examCollec}._doc;
        // IS EXAM EXPIRED
        if(new Date(exam.deadLine).getTime() < new Date().getTime()) {
            throw("انتهت مهلة الامتحان تواصل مع المدرس");
        }
        if(adminData.randomQuestions) exam = shuffleExam(exam);
        res.json({isExam: true, exam, startTime: startTime});
    } catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
    }
}

exports.deleteUnitExam = async(req, res) => {
    try {
        const id = req.params.id;
        console.log(id);
        const deleteExam = await Exam.deleteOne({_id: id});
        if(deleteExam.n == 0) throw("لم يتم مسح الامتحان");
        const deleteModel = await SolutionModels.deleteOne({examId: id});
        // if(deleteModel.n == 0) throw("لم يتم مسح نموذج الاجابة");
        res.json({done: true});
    } catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
    }
}


exports.filterUnitsExams = async(req, res) => {
    try {
        const filter = {...req.body, isTask: false};
        delete filter['number'];
        delete filter['active'];
        const active = req.body.active;
        if(active == true) filter["publishDate"] = {$lte: new Date().toISOString()};
        else if(!active) filter["publishDate"] = {$gt: new Date().toISOString()};
        filter['isTask'] = {$ne: true};
        const exams = await Exam.find(filter).sort({number: 1});
        res.json({exams})       
    } catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
    }
}


exports.fetchUnitExamById = async(req, res) => {
    try {
        const exam = await Exam.findOne({_id: req.params.id});
        res.json({exam});
    } catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err})
    }
}

exports.putUnitExamSolutionModel = async(req, res) => {
    try {
        const examId=  req.body.examId;
        const models = await SolutionModels.find({examId: examId});
        let id;
        if(models.length > 0) {
            const update = await SolutionModels.findOneAndUpdate({examId}, req.body);
            if(update) {
                id = update._id;
            }
        } else {
            const add = await new SolutionModels(req.body).save();
            if(add) {
                id = add._id;
            }
        }
        res.json({id});
    } catch(err) {
        console.log(err)
    }
}

exports.fetchUnitExamSolutionModelForAdmin = async(req, res) => {
    try {
        const examId=  req.params.id;
        const models = await SolutionModels.find({examId: examId});
        if(models.length > 0 && models[0].sections.length>0) {
            res.json({solution: models[0]})
            } else {
                res.json({})
            }
    } catch(err) {
        console.log(err)
    }
}



exports.sendUnitExamCorrectionByAdmin = async(req, res) => {
    try {
        req.body['done'] = true;
        const correction = await Solutions.updateOne({_id: req.params.solutionId}, req.body);
        if(correction.n == 1) {
            res.json({done: true});
        } else {
            throw("لم يتم أضافة التصحيح حاول مرة أخرى");
        }
    } catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
    }
}



exports.removeUnitExamCorrection = async(req, res) => {
    try {
        const del = await Solutions.deleteOne({_id: req.params.solutionId});
        if(del.n == 0) throw("No thing deleted");
        res.json({done: true});
    } catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
    }
}


exports.deleteSolutions = async(req, res) => {
    try {
        const del = await Solutions.deleteMany({examId: req.params.examId});
        if(del.n == 0) throw("No thing deleted");
        res.json({done: true});
    } catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
    }
}


exports.getUnitExamSolutionById = async(req, res) => {
    try {
        const solutionId= req.params.solutionId;
        const solution = await Solutions.findOne({_id: solutionId});
        res.json({solution});
    }
    catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
    }
}

//////////////////////////////////////////////////////////////////////////////
////////////////////////////// COMMON_FUNCTIONS //////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////



exports.sendUnitExamSolutionByStudent = async(req, res) => {
    try {
        const body = req.body;
        const userId = body.userId;
        const examId = body.examId;
        delete body['_id'];
        /////////////////// ALREADY DONE ///////////////////////
        const solution = await Solutions.findOne({userId, examId});
        if(solution && !req.body.isTask) throw("لقد قمت بأداء هذا الأمتحان بالفعل");
        if(req.body.isTask) {
            const updated = await Solutions.updateOne({examId}, body, {upsert: true});
            if(updated.n == 0) throw("Nothing added..");
        } else {
            const newSolution = await new Solutions(body).save();
            if(!newSolution) throw("Answer didn't saved");
        }
        //////////////////////////////////////////
        //////////////////////////////////////////
        // if(!solutions) throw("There is a problem. try again");

        // const exam = await Exam.findOne({_id: examId});
        if(new Date().getTime() < new Date(body.resultPublishDate).getTime() && !body.isTask) {
            res.json({message: "تمت الأجابة والتصحيح, عرض النتيجة مؤجل .. يمكنك التأكد لاحقا "});
        } else {
            res.json({message: "تمت الاجابة والتصحيح التلقائي بنجاح", solution: body});
            }
         
    } catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
    }
}


exports.deleteUnitExamSolutionsByExamId = async(req, res) => {
    const del = await Solutions.deleteMany({examId: req.params.examId});
    if(del) res.json({done: true});
}

/////////////////////////////////////////////////////////////////////

exports.uploadUnitExam = async(req, res) => {
    try {
        ///////////////////UNIT/////////////////
        const exam = req.body;
        const dLesson = exam.dependentLesson;
        if(!dLesson || dLesson == "undefined" || dLesson == undefined || dLesson == "" || dLesson == null) delete exam['dependentLesson']
        const collec = Exam;
        let existingExam = null;
        let id = exam._id;
        delete exam['_id'];
        if(id) {
            const updated = await collec.findOneAndUpdate({_id: id}, {...exam});
            if(updated.n == 0) throw("لم يتغير شئ");
            if((JSON.stringify(updated.sections) !== (JSON.stringify(exam.sections)))) {
                await SolutionModels.deleteOne({examId: id});
            }
        } else {
            const addNew = await new collec({...exam}).save();
            if(!addNew) throw('مشكلة في رفع الامتحان حاول مرة أخرى');
            id = addNew._id;
        }
        res.json({id});
    } catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
    }
}

exports.deleteUnitExamSolutionModel = async(req, res) => {
    try {
        const del = await SolutionModels.deleteOne({_id: req.params.id});
        if(del.n == 1) {
            res.json({done: true});
        }
    }
    catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
    }
}

exports.fetchUnitExamsForUser = async(req, res) => {
    try {
        const stage = req.params.stage;
        const unit = +req.params.unit;
        const today = new Date().toISOString();
        const unitExams = await exams.find({stage, unit, publishDate: {$lte: today}, isTask: false}).sort({number: 1});
        /////EXAM-NUMBER/////////
        const unitExamsCols = unitExams.map(ex => ({_id: ex.id, number: ex.number, name: ex.name}));
        res.json({exams: unitExamsCols});
    }
    catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
    }
}

exports.getExamStudentsSolutions = async(req, res) => {
    try {
        const examId = req.params.examId;
        const filter = {examId};
        if(req.body.done != "all") filter['done'] = req.body.done;
        if(req.body.username != "") filter['username'] = {$regex: `.*${req.body.username}.*`, $options: "i"};
        if(req.body.phone != "") filter['phone'] = {$regex: `.*${req.body.phone}.*`, $options: "i"};
        const solutions = await Solutions.find(filter).skip(+req.params.skip).limit(+req.params.limit);
        const count = await Solutions.find({examId}).count();

        res.json({solutions, count});
    }
    catch(err) {
        console.log(err);
        res.json({err});
    }
}
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

exports.getUnitExamsFullDegree = async(req, res) => {
    try {
        const body = {...req.body};
        if(req.body.examId) {
            delete body['examId'];
            body['_id'] = req.body.examId
        }
        //////////////////////////////////////
        const filter = {...body, publishDate: {$lte: new Date().toISOString()}};
        const examss = await exams.find(filter);
        const fullDegree = examss.reduce((a, b) => a + b.fullDegree || 0, 0);
        ///////////////////////////////////////////////////
        res.json({fullDegree});
    } catch(err) {
        console.log(err);
    }
}


exports.getStudentsByStageAndUnit = async(req, res) => {
    try {
        const stage = req.params.stage;
        const unit = req.params.unit;
        const filter = {stage};
        if(unit != "null") filter['units'] = +unit;
        const students = await Users.find(filter);
        res.json({students});
    } catch(err) {
        console.log(err);
    }
}


// exports.getStudentTotalDegree = async(req, res) => {
//     try {
//         const stage = req.params.stage;
//         const unit = req.params.unit;
//         const userId = req.params.userId;
//         const filter = {stage, userId};
//         if(unit != "null") filter['unit'] = unit;
//         const solutions = await Solutions.find(filter);
//         const degree = solutions.reduce((a, b) => a + b.totalDegree || 0, 0);
//         res.json({degree});
//     } catch(err) {
//         console.log(err);
//     }
// }


exports.getStudentTotalDegree = async(req, res) => {
    try {
        const body = {...req.body};
        if(req.body.examId) {
            delete body['examId'];
            body['_id'] = req.body.examId
        }
        //////////////////////////////////////
        const examss = await exams.find({...body});
        const filter = {...req.body, examId: {$in: [...examss.map(ex => ex._id.toString())]}};
        console.log(filter)
        const totalDegrees = await Solutions.aggregate([
            {$match: filter},
            {$group: {
                _id: "$username",
                // username: "$username",
                totalDegree: {$sum: "$totalDegree"},
                fullDegree: {$sum: "$fullDegree"},
            }}
        ]).sort({totalDegree: -1}).limit(200);
        res.json({degrees: totalDegrees});
    } catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
    }
}

exports.getPdf = async(req, res) => {
    try {
        const path = decodeURIComponent(req.params.url);
        // const slashes = path.split(".")[2].split("/");
        // let fileName = slashes[slashes.length - 1];
        // fileName = decodeURIComponent(fileName);
        // const name = fileName + ".pdf";
        const request = http.get(path, response => {
            if(response.statusCode == 200) {
                response.pipe(res);
                // const file = fs.createWriteStream(name);
                // response.pipe(file).on("close", () => {
                //     res.setHeader("Content-Type", "application/pdf");
                //     const pdf = fs.readFileSync(name);
                //     console.log(pdf);
                //     res.send(pdf);
                // });
            }
        });
    }
    catch(err) {
        console.log(err);
        res.json({err: err.message?err.message: err});
    }
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

exports.getExamForStudent = async(req, res) => {
    try {
        const userId = req.body.userId;
        const examId = req.body.examId;
        const code = req.body.code;
        let examCollec = await exams.findOne({isTask: false, _id: examId});
        if(!examCollec) throw({message: "Exam no found.."});
        const user = await Users.findOne({_id: userId});
        if(!user) throw({message: "User no found.."});


        // HAS USER ALREADY ANSWERED THIS EXAM
        const solution = await Solutions.findOne({examId, userId});
        if(solution) {
            //////////// SHOW DATE ////////////
            if(new Date().getTime() < new Date(examCollec.resultPublishDate).getTime()) {
                throw({message: "عرض النتيجة مؤجل .. يمكنك التأكد لاحقا "});
            }
            return res.json({isSolution: true, solution});
        }
        // IF USER HAS NO START TIME GIVE HIM START TIME FROM NOW
        let startTime = user.lastTime;
        if(user.lastTime < 10000) {
            const updateUser = await Users.updateOne({_id: userId}, {lastTime: new Date().getTime()});
            if(updateUser.nModified != 1) return;
            startTime = new Date().getTime();
        } 
        
        let exam = {...examCollec}._doc;
        exam = {...exam, sections: exam.sections.map(sec => sec._doc)}
        // IS EXAM EXPIRED
        if(new Date(exam.deadLine).getTime() < new Date().getTime()) {
            throw({message: "انتهت مهلة الامتحان تواصل مع المدرس"});
        }
        if(exam.randomQuestions) exam = shuffleExam(exam);

        //////////////////////////////////////////////////////
        let userExam = exam;
        const stage = examCollec.stage;
        const section = await Sections.findOne({stage, number: examCollec.unit});
        const adminData = await AdminData.findOne({admin: 1});
        if(section.price == 0) userExam = exam;
        else if(!adminData.lessonCodes && !adminData.allLessonsCode && user.units.includes(section.number)) userExam = exam;
        else if(!adminData.lessonCodes && !adminData.allLessonsCode && !user.units.includes(section.number)) throw({message: "غير مشترك في هذه الوحدة تواصل مع المدرس"});
        ///////////////////
        else if(adminData.allLessonsCode) {
            const auth = await authGeneralCodeHandler(code, user, {section: exam.unit});
            if(auth.err) throw(auth.err);
        }
        ////////////////////////////////////////////////////////
        
        res.json({isExam: true, exam: userExam, startTime: startTime});
        
    } catch(err) {
        console.log('549', err)
        res.json({err});
    }
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

exports.getTaskForStudent = async(req, res) => {
    try {
        const userId = req.params.userId;
        const examId = req.params.examId;
        const lessonId = req.params.lessonId;
        // HAS USER ALREADY ANSWERED THIS EXAM
        const solution = await Solutions.findOne({isTask: true, examId, lessonId, userId});
        if(solution) return res.json({isSolution: true, solution});

        //If There Is No Solution
        let exam = await exams.findOne({_id: examId, lessonId});
        if(!exam) throw("Exam no found..")
        exam = exam._doc;
        exam = {...exam, sections: exam.sections.map(sec => sec._doc)}
        if(exam.randomQuestions) exam = shuffleExam(exam);
        res.json({isTask: true, exam});
    } catch(err) {
        console.log(err);
        res.json(err.message? err.message: err);
    }
}


exports.getTaskQuestions = async(req, res) => {
    try {
        const examId = req.body.examId;
        const lessonId = req.body.lessonId;
        let exam = await exams.findOne({_id: examId, lessonId});
        if(!exam) throw("Exam no found..")
        if(exam.randomQuestions) exam = shuffleExam(exam);
        res.json({isTask: true, exam});
    } catch(err) {
        console.log(err);
        res.json(err.message? err.message: err);
    }
}


exports.getExamsNamesAndIds = async(req, res) => {
    try {
        let examss = await exams.find();
        res.json({exams: examss.map(exam => ({name: exam.name, unit: exam.unit, _id: exam._id}))});
    } catch(err) {
        console.log(err);
        res.json(err.message? err.message: err);
    }
}