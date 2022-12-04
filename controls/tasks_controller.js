
const Users = require('../models/users');
const tasksSolutions = require('../models/tasksSolutions');
const SolutionModels = require('../models/unit-exams/solutionModels');
const Tasks = require('../models/tasks');
const Lessons = require('../models/lessons');
const Sections = require('../models/sections');
const exams = require('../models/unit-exams/exams');



//////////////////////////////////////////////////////////////////////////////
////////////////////////////// USERSIDE //////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////



exports.sendTaskSolution = async(req, res) => {
    try {
        const studentSolution = req.body;
        const solutionModel = await SolutionModels.find({examId: req.body.taskId});
        let totalDegree = 0;
        let fullDegree = 0;
        const filter = {userId: req.body.userId, taskId: req.body.taskId};
        if(solutionModel.length > 0) {
            studentSolution.sections.forEach((sec, s) => {
                sec.questions.forEach((ques, q) => {
                    const ansDegree = ques.fullDegree;
                    const modelQues = solutionModel[0].sections[s].questions.find(q => q.question == ques.question);
                    if(!modelQues) {
                        ques.degree = ansDegree;
                        totalDegree += ansDegree;
                        return;
                    }
                        fullDegree += ansDegree;
                        if(ques.answer === modelQues.answer) {
                            ques.degree = ansDegree;
                            totalDegree += ansDegree;
                        } else if(ques.answer === '') {
                            ques.degree = 0;
                        }
                        else {
                            ques.degree = 0;
                            ques.correction = modelQues.answer;
                         }
                    })
                });
                studentSolution['totalDegree'] = totalDegree;
                studentSolution['fullDegree'] = fullDegree;
            }
            
        if(solutionModel.length > 0) studentSolution['done'] = true;
        ////////////////////////////////////////////////////////////////

        const isTested = await tasksSolutions.find(filter);
        if(isTested.length > 0) {
            const update = await tasksSolutions.updateOne(filter, studentSolution);
            if(update.n == 1) done = true;
            else throw("مشكلة في تحديث الاجابة");
        } else {
            const solution = await new tasksSolutions(studentSolution).save();
            if(solution) done = true;
            else throw("مشكلة في رفع الاجابات");
        }

            if(done) {
                res.json({done: true, exam: studentSolution});
            } else {
                res.json({done: false});
            }
         
    } catch(err) {
        console.log(err);
        res.json({err});
    }
}



exports.fetchTaskByLessonId = async(req, res) => {
    try {
        const exam = await Tasks.findOne({lessonId: req.params.lessonId}).populate('lesson');
        if(!exam) throw("Not found!");
        const obj = {...exam._doc, ...exam.lesson._doc};
        res.json({exam: obj});
    } catch(err) {
        console.log(err);
        res.json({err})
    }
}

exports.fetchTaskByLessonIdForStudent = async(req, res) => {
    try {
        let ok = false;
        const lessonId = req.body.lessonId;
        const userId = req.body.userId;
        const stage = req.body.stage;
        const task = await Tasks.findOne({lessonId});
        /////////////////////////////////////////////
        const lesson = await Lessons.findOne({_id: lessonId});
        const lessonNumber = +lesson.number;
        const section = await Sections.findOne({stage, number: lesson.section});
        const orderedTasks = section.orderedTasks;
        if(!orderedTasks) ok = true;
        else await stage2();
        /////////////////////////////////////////////
        async function stage2() {
            console.log("stage2");
            if(lessonNumber == 1) ok = true;
            else await stage3();
            return;
        }
        /////////////////////////////////////////////
        async function stage3() {
            console.log("stage3");
            const prevLessons = await Lessons.find({stage, section: lesson.section, number: {$lt: lessonNumber}}).sort({number: -1});
            let found = false;
            for(let less of prevLessons) {
                const task = await Tasks.findOne({lessonId: less._id});
                if(task) {
                    found = true;
                    const solution = await tasksSolutions.findOne({userId, lessonId: task.lessonId});
                    if(solution) ok = true;
                    else throw("قم بحل الواجب السابق اولا");
                    break;
                } else continue;
            }
            if(!found) ok = true;
            return;
        }
        console.log(ok)
        if(ok) {
            const obj = {...task._doc, ...lesson._doc};
            res.json({exam: obj});
        }
        else throw("مشكلة اثناء ارسال الواجب حاول مرة أخرى");
        //////////////////////////////////////////////
        //////////////////////////////////////////////
        
        
    } catch(err) {
        console.log(err);
        res.json({err})
    }
}

exports.getUserTaskAndSolution = async(req, res) => {
    try {
        let examId = null;
        const examss = await exams.find();
        const tasks = await exams.find({lessonId: req.body.lessonId});
        if(tasks.length > 0) examId = tasks[0]._id;
        res.json({examId});
    } catch(err) {
        console.log(err);
        res.json({err});
    }
}

exports.getUserTaskSolution = async(req, res) => {
    try {
        const solution = await tasksSolutions.findOne(req.body);
        res.json({solution});
    } catch(err) {
        console.log(err);
        res.json({err});
    }
}


exports.removeTask = async(req, res) => {
    try {
        const lessonId = req.params.lessonId;
        const deleted = await Tasks.deleteOne({lessonId});
        if(deleted.n == 1) {
            const deleted = await SolutionModels.deleteMany({examId: lessonId});
            res.json({done: true});
        } else throw("لم يتم مسح شئ");
    } catch(err) {
        console.log(err);
        res.json({err});
    }
}