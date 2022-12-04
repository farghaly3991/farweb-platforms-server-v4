const Codes = require("../models/lessons-codes");
const CoursesCodes = require("../models/codes");
const AdminData = require("../models/adminData");
const Users = require("../models/users");
const Sections = require("../models/sections");
const Lessons = require("../models/lessons");
const Exams = require("../models/unit-exams/exams");
const Solutions = require("../models/unit-exams/solutions");

exports.fetcLessonForUser = async(req, res) => {
    try {
        const lessonId = req.body.lessonId;
        const userId = req.body.userId;
        const code = req.body.code;
        //////////////////
        const user = await Users.findOne({_id: userId});
        const adminData = await AdminData.findOne({admin: 1});
        const lesson = await Lessons.findOne({_id: lessonId});
        const section = await Sections.findOne({stage: lesson.stage, number: lesson.section});
        ///////////////////
        const dependentExam = await Exams.findOne({dependentLesson: lessonId});
        if(dependentExam) {
            const solution = await Solutions.findOne({examId: dependentExam._id, userId});
            if(!solution) throw({message: `Do the exam: ${dependentExam.name} first`});
            if(solution.totalDegree < dependentExam.passingScore) throw({message: `You didn't pass the test: ${dependentExam.name}`});
        } 
        ///////////////////
        let userLesson = lesson;
        if(!user) throw({message: "User not found"});
        else if(!lesson) throw({message: "Lesson not found"});
        else if(!section) throw({message: "Course not found"});
        ///////////////////
        else if(!lesson.paid) userLesson = lesson;
        else if(section.price == 0) userLesson = lesson;
        else if(!adminData.lessonCodes && !adminData.allLessonsCode && user.units.includes(lesson.section)) userLesson = lesson;
        else if(!adminData.lessonCodes && !adminData.allLessonsCode && !user.units.includes(lesson.section)) throw({message: "غير مشترك في هذه الوحدة تواصل مع المدرس"});
        ///////////////////
        else if(adminData.lessonCodes) {
            return await authLessonCode(code, user, lesson, res);
        }///////////////////
        else if(adminData.allLessonsCode) {
            const auth =  await authGeneralCode(code, user, lesson);
            if(auth.err) throw(auth.err);
        }
        res.json({lesson: userLesson});
    }
    catch(err) {
        console.log(err);
        res.json({err});
    }
}


/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////


const authLessonCode = async(sentCode, user, lesson, res) => {
    try {
        const userId = user._id;
        const username = user.fullname;
        const stage = user.stage;
        ///////////////////////////
        if(!sentCode) {
            const foundCode = await Codes.findOne({userId, lessonId: lesson._id});
            if(!foundCode) throw("No code for this user");
            if(new Date().getTime() > new Date(foundCode.expiration).getTime()) throw("تاريخ صلاحية الكود انتهت");
            const update = await Codes.updateOne({userId: user._id, lessonId: lesson._id}, {$inc: {times: 1}});
            res.status(200).json({lesson});
        } else {
            const codeObj = await Codes.findOne({code: sentCode, lessonId: lesson._id});
            if(!codeObj) throw("هذا الكود خاطئ");
            if(new Date().getTime() > new Date(codeObj.expiration).getTime()) throw("تاريخ صلاحية الكود انتهت");
            if(!codeObj.userId || codeObj.userId == "") {
                const duration = codeObj.duration * 24 * 3600 * 1000;
                const expiration = new Date(new Date().getTime() + duration).toISOString().substring(0, 10);
                const startDate = new Date().toISOString().substring(0, 10);
                const update = await Codes.updateOne({code: sentCode}, {userId, username, startDate, expiration, times: 1});
                if(update.nModified == 0) throw("حاول مرة أخرى");
            }
            else {
                const update = await Codes.updateOne({code: sentCode}, {$inc: {times: 1}});
                if(codeObj.userId != userId) throw("تم أستعمال هذا الكود بواسطة طالب اخر بالفعل");
            }
            res.status(200).json({lesson});
        }
        // throw("حاول مرة أخرى");
    } catch(err) {
        console.log(err);
        res.json({err: {code: true, message: err.message? err.message: err}});
    }
}


/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////


const authGeneralCode = async(sentCode, user, lesson, res) => {
    try {
        const userId = user._id;
        const username = user.fullname;
        const stage = user.stage;
        const section = lesson.section;
        ///////////////////////////
        if(!sentCode) {
            const foundCode = await CoursesCodes.findOne({userId, stage});
            if(!foundCode) throw("No code for this user");
            if(new Date().getTime() > new Date(foundCode.expiration).getTime()) throw("تاريخ صلاحية الكود انتهت");
            if(foundCode.section != "0") {
                if(foundCode.section != section) throw("This code is not for this unit");
            }
            const update = await CoursesCodes.updateOne({userId, stage, section: foundCode.section}, {$inc: {times: 1}});
            return {done: true};
        } else {
            const codeObj = await CoursesCodes.findOne({code: sentCode, stage});
            if(!codeObj) throw("هذا الكود خاطئ");
            if(new Date().getTime() > new Date(codeObj.expiration).getTime()) throw("تاريخ صلاحية الكود انتهت");

            if(codeObj.section != "0") {
                if(codeObj.section != section) throw("This code is not for this unit");
            }
            if(!codeObj.userId || codeObj.userId == "") {
                const duration = codeObj.duration * 24 * 3600 * 1000;
                const expiration = new Date(new Date().getTime() + duration).toISOString().substring(0, 10);
                const startDate = new Date().toISOString().substring(0, 10);
                const update = await CoursesCodes.updateOne({code: sentCode}, {userId, username, startDate, expiration, times: 1});
                if(update.nModified == 0) throw("حاول مرة أخرى");
            }
            else {
                const update = await CoursesCodes.updateOne({code: sentCode}, {$inc: {times: 1}});
                if(codeObj.userId != userId) throw("تم أستعمال هذا الكود بواسطة طالب اخر بالفعل");
            }
            // return res.status(200).json({lesson});
            return {done: true};
        }
        // throw("حاول مرة أخرى");
    } catch(err) {
        console.log(err);
        return {err: {code: true, message: err.message?err.message: err}};
    }
}

exports.authGeneralCodeHandler = authGeneralCode;