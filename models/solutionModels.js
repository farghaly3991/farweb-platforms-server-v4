const mongoose = require('mongoose');

const solutionSchema = new mongoose.Schema({
    examId: String,
    sections: Object
});

module.exports = mongoose.model('solutionModels', solutionSchema);
