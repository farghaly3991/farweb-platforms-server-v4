const mongoose = require('mongoose');

const codes = new mongoose.Schema({
    code: String,
    userId: String,
    username: String,
    stage: String,
    startDate: String,
    expiration: String,
    duration: Number,
    created_at: Date,
    section: {
        type: String,
    },
    times: {
        type: Number,
        default: 0,
    }
});
module.exports = new mongoose.model('codes', codes);