const express = require('express');
var router = express.Router();
const StudentFileController = require('../controls/student-file');

router.get('/getLessonsPlayedByUser/:userId', StudentFileController.getLessonsPlayedByUser);
router.get('/getUserTaskSolutions/:userId', StudentFileController.getUserTaskSolutions);
router.get('/getUserUnitsSolutions/:userId', StudentFileController.getUserUnitsSolutions);
router.get('/getUserData/:userId', StudentFileController.getUserData);



module.exports = router;
