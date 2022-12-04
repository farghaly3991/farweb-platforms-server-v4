const mongoose = require('mongoose');

const sections = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        // unique: true
    },
    number: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        default: 0
    },
    stage: {
        type: String,
        default: "6"
    },
    image: {
        type: String,
        default: 'http://res.cloudinary.com/farghaly-developments/raw/upload/v1645925290/osama-learning/%D8%A7%D9%84%D9%88%D8%AD%D8%AF%D8%A9%20%D8%A7%D9%84%D8%A3%D9%88%D9%84%D9%89_1.jpeg'
    },
    orderedTasks: {
        type: Boolean,
        required: true,
        default: false
    }
});

module.exports = new mongoose.model('sections', sections);