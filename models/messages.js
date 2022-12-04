const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true,
    },
    room: {
        type: String,
        required: true,
    },
    senderId: {
        type: String,
        required: true,
    },
    receiverId: {
        type: String,
        required: true,
    },
    senderName: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
    },
    stage: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    role: {
        type: Number,
        required: true,
    },
    code: {
        type: String,
        required: true,
    },
    type: String,
});
module.exports = new mongoose.model('messages', chatSchema);