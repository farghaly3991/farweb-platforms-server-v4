const mongoose = require('mongoose');

const videosSchema = new mongoose.Schema({
    section: {
        type: Number,
        required: true,
    },
    paid: {
        type: Boolean,
        default: false,
    },
    name: {
        type: String,
        required: true,
    },
    number: {
        type: Number,
        required: true,
    },
    part: {
        type: String,
        // required: true,
    },
    partNumber: {
        type: Number,
        // required: true,
    },
    stage: {
        type: String,
        required: true,
    },
    explain: {
        type: String,
    },
    date: {
        type: Date,
        required: true,
    },
    showDate: {
        type: String,
        // required: true,
    },
    expiration: {
        type: String,
    },
    videoPath: {
        type: String,
        // required: true,
    },
    filePath: {
        type: String,
    },
    students: [],
    codes: [{
        userId: String,
        code: String,
        times: Number,
        date: Date
    }]
});
module.exports = new mongoose.model('lessons', videosSchema);