const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    lessonId: {
        type: String,
        unique: true
    },
    sections: [],
    activated: Boolean,
    lang: {
        type: String,
        default: "1"
    }
}, {
    getters: true,
});

examSchema.virtual("lesson", {
    ref: "lessons",
    localField: "lessonId",
    foreignField: "_id",
    justOne: true
});

module.exports = mongoose.model('tasks', examSchema);
