const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    year: Number,
    stage: String,
    /////EXAM-NUMBER/////////
    // number: {
    //     type: Number,
    // },
    model: String,
    deadLine: Date,
    timer: Number,
    sections: [],
    students: [],
    activated: Boolean
});


module.exports = mongoose.model('exams', examSchema);
