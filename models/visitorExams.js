const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    year: Number,
    stage: String,
    number: Number,
    timer: Number,
    sections: Array,
    name: String,
    unit: Number,
    type: String
});

module.exports = mongoose.model('visitorExams', examSchema);

