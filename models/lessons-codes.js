const mongoose = require('mongoose');

const codes = new mongoose.Schema({
    code: String,
    userId: String,
    username: String,
    lessonId: String,
    startDate: String,
    expiration: String,
    duration: Number,
    created_at: Date,
    times: {
        type: Number,
        default: 0,
    }
});
module.exports = new mongoose.model('lessonscodes', codes);