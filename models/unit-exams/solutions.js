const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    examId: {
        type: String,
    },
    userId: {
        type: String,
    },
    username: String,
    phone: String,
    done: {
        type: Boolean,
        default: false,
    },
    totalDegree: {
        type: Number,
        default: 0,
    },
    username: String,
    inTime: Boolean,
    //////////////////////////////////////////////////////
    isTask: {
        type: Boolean,
        default: false,
    },
    name: String,
    number: Number,
    year: Number,
    stage: String,
    unit: String,
    lessonId: {
        type: String,
        // unique: true,
    },
    lang: {
        type: String,
        default: "1"
    },
    fullDegree: Number,
    sections: [
        {
            number: Number,
            titleType: String,
            questionsType: Number,
            text: String,
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


module.exports = mongoose.model('unit_solutions', examSchema);
