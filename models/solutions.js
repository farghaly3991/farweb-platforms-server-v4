const mongoose = require('mongoose');

const solutionSchema = new mongoose.Schema({
    type: String,
    examId: String,
    year: Number,
    number: Number,
    stage: String,
    userId: String,
    sections: Object,
    inTime: {
        type: Boolean,
        default: true
    },
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
    }
});

module.exports = mongoose.model('solutions', solutionSchema);
