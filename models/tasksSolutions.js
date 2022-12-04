const mongoose = require('mongoose');

const solutionSchema = new mongoose.Schema({
    lessonId: String,
    taskId: String,
    userId: String,
    sections: Object,
    section: Number,
    lesson: Number,
    stage: String,
    name: String,
    totalDegree: {
        type: Number,
        default: 0
    },
    fullDegree: {
        type: Number,
        default: 0
    },
    done: {
        type: Boolean,
        default: false
    },
    lang: {
        type: String,
        default: "arabic"
    }
});

module.exports = mongoose.model('tasksSolutions', solutionSchema);
