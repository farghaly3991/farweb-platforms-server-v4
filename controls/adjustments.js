const Exams = require("../models/unit-exams/exams");
const Lessons = require("../models/lessons");
const SolutionModels = require("../models/unit-exams/solutionModels");

exports.adjustLessons = async(req, res) => {
    try {
        const update = await Lessons.updateMany({partName: {$exists: false}}, {
            part: "المحاضرة كاملة",
            partNumber: 1,
            paid: true,
            showDate: new Date(new Date().getTime() - 24*60*60*1000).toISOString().substring(0, 10),
            expiration: new Date(new Date().getTime() + 365*24*60*60*1000).toISOString().substring(0, 10)
        })
        if(update.nModified == 0) throw("Nothing changed");
        // const lessons = await Lessons.find({part: {$exists: false}}).count();
        // console.log(lessons);
        res.json({done: true});
    }
    catch(err) {
        console.log(err);
        res.json({err})
    }
}


exports.adjustExams = async(exams) => {
    try {
        // const exams = await Exams.find({"sections.$.questionsType": {$exists: false}});
        // return console.log(exams);
        const solutionModels = await SolutionModels.find();
        const newExams = exams.map(exam => {
            const ansModel = solutionModels.find(sm => sm.examId == exam._id);
            // const exam = examObj._doc;
            return {
               ...exam,
               isTask: false,
               randomQuestions: false,
               autoCorrect: true,
               passingScore: 0,
               sections: exam.sections.map((sec, s) => {
                // const sec = secObj._doc;
                return {
                    ...sec,
                    text: sec.type,
                    questionsType: sec.quesType || 1,
                    // titleType: "text",
                    questions: sec.questions.map((ques, q) => {
                        // const ques = quesObj._doc;
                        const question =  {
                            ...ques,
                            userAnswer: "",
                            typicalAnswer: "",
                            degree: 0,
                        }
                        ////////////////////////////
                        let modelAnswer = "";
                        if(ansModel) {
                            const section = ansModel.sections[s];
                            if(section) {
                                const sec_ques = section.questions.find(quest => quest.question == ques.question);
                                if(sec_ques) {
                                    modelAnswer = sec_ques.answer;
                                }
                            }
                        }
                        ////////////////////////////
                        question['modelAnswer'] = modelAnswer;
                        return question;
                    })
                }
               })
            }
        });
        return newExams;
    }
    catch(err) {
        console.log(err);
        res.json({err})
    }
}