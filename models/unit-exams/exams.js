const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    isTask: {
        type: Boolean,
        default: false,
    },
    randomQuestions: {
        type: Boolean,
        default: false,
    },
    name: String,
    number: Number,
    year: Number,
    stage: String,
    unit: String,
    autoCorrect: {
        type: Boolean,
        default: true,
    },
    lessonId: {
        type: String,
        // unique: true,
    },
    lang: {
        type: String,
        default: "1"
    },
    deadLine: {
        type: Date,
        default: new Date(new Date().getTime() + 365*24*60*60*1000)
    },
    publishDate: {
        type: String,
        default: new Date(new Date().getTime()  - 24*60*60*1000).toISOString().substring(0, 10)
    },
    resultPublishDate: {
        type: String,
        default: new Date(new Date().getTime()  - 24*60*60*1000).toISOString().substring(0, 10)
    },
    timer: {
        type: Number,
        default: 60
    },
    fullDegree: Number,
    passingScore: {
        type: Number,
        default: 0
    },
    dependentLesson: {
        type: String,
        // unique: true
    },
    sections: [
        {
            number: Number,
            titleType: {
                type: String,
                default: "text"
            },
            questionsType: {
                type: Number,
                default: 1
            },
            text: {
                type: String,
                default: ""
            },
            mimetype: String,
            questions: [
                {
                    question: String,
                    contentType: String,
                    number: Number,
                    fullDegree: Number,
                    mimetype: String,
                    choices: [String],
                    modelAnswer: String,
                    typicalAnswer: String,
                    userAnswer: {
                        type: String,
                        default: ""
                    },
                    degree: {
                        type: Number,
                        default: 0
                    }
                }
            ]
        }
    ],
});


module.exports = mongoose.model('unit_exams', examSchema);
