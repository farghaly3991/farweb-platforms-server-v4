const Lessons = require("../models/lessons");
const Users = require("../models/users");
const Solutions = require("../models/unit-exams/solutions");
const TasksSolutions = require("../models/tasksSolutions");


exports.getLessonsPlayedByUser = async(req, res) => {
    try {
        const lessons = await Lessons.find({students: req.params.userId});
        res.json({lessons});
    }
    catch(err) {
        console.log(err);
        res.json({err});
    }
}

exports.getUserTaskSolutions = async(req, res) => {
    try {
        const solutions = await TasksSolutions.find({userId: req.params.userId});
        res.json({solutions});
    }
    catch(err) {
        console.log(err);
        res.json({err});
    }
}

exports.getUserUnitsSolutions = async(req, res) => {
    try {
        const solutions = await Solutions.find({userId: req.params.userId, inTime: false});
        res.json({solutions});
    }
    catch(err) {
        console.log(err);
        res.json({err});
    }
}


exports.getUserData = async(req, res) => {
    const userData = await Users.find({_id: req.params.userId});
    res.status(200).json({userData});
}