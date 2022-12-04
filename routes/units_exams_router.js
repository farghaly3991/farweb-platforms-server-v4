const express = require('express');
var router = express.Router();
const examsController = require('../controls/units-exams_controller');
const tasksController = require('../controls/tasks_controller');
const adminAuth = require('../middlewares/adminAuthorization');
const { adjustFilter } = require('../middlewares/helpers');

//////////////////////////////////////////////////////////////////////////////
////////////////////////////// STUDENT_SIDE //////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////


//make sure that the student doesn't pick another exam model by refresh by sending him the same model
//other wise when no solved exam function return a random model for student to solve
router.get('/fetchUnitExamForUser/:examId/:userId/:unit', examsController.fetchUnitExamForUser);
router.get("/fetchUnitExamsForUser/:stage/:unit", examsController.fetchUnitExamsForUser);

router.post("/getUserTaskAndSolution", tasksController.getUserTaskAndSolution);
router.post("/getExamForStudent", examsController.getExamForStudent);
router.get("/getTaskForStudent/:userId/:examId/:lessonId", examsController.getTaskForStudent);
router.post("/getTaskQuestions", examsController.getTaskQuestions);


//get all exams for user by stage to handle in the front end in different places and functions
router.get('/getUnitsExamsByStage/:stage', examsController.getUnitsExamsByStage);

//////////////////////////////////////////////////////////////////////////////
////////////////////////////// ADMIN_SIDE //////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

router.post('/uploadUnitExam', adminAuth, examsController.uploadUnitExam);
// router.get('/fetchExam/:id', examsController.fetchExam);
router.delete('/deleteUnitExam/:id', adminAuth, examsController.deleteUnitExam);

//fetch exam for the admin to put solution model
router.get('/fetchUnitExamById/:id', examsController.fetchUnitExamById);

//filter the exams for the admin
router.post('/filterUnitsExams', examsController.filterUnitsExams);

router.post('/sendUnitExamCorrectionByAdmin/:solutionId', adminAuth, examsController.sendUnitExamCorrectionByAdmin);
router.post('/putUnitExamSolutionModel', adminAuth, examsController.putUnitExamSolutionModel);
router.delete('/removeUnitExamCorrection/:solutionId', adminAuth, examsController.removeUnitExamCorrection);
router.delete('/deleteSolutions/:examId', adminAuth, examsController.deleteSolutions);

//fetch solution model for some exam id whether it is existed or not for the admin to edit or put new one
router.get('/fetchUnitExamSolutionModelForAdmin/:id', adminAuth, examsController.fetchUnitExamSolutionModelForAdmin);

router.get('/deleteUnitExamSolutionsByExamId/:examId', examsController.deleteUnitExamSolutionsByExamId);
router.delete("/deleteUnitExamSolutionModel/:id", adminAuth, examsController.deleteUnitExamSolutionModel);
router.post("/getExamStudentsSolutions/:examId/:skip/:limit", adminAuth, examsController.getExamStudentsSolutions);
router.get("/getUnitExamSolutionById/:solutionId", adminAuth, examsController.getUnitExamSolutionById);
router.get("/getExamsNamesAndIds", examsController.getExamsNamesAndIds);

//////////////////////////////////////////////////////////////////////////////
////////////////////////////// COMMON_FUNCTIONS //////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////


//get student solved exams for user to review ... the results, and admin to correct
router.post('/sendUnitExamSolutionByStudent', examsController.sendUnitExamSolutionByStudent);
router.post('/getUnitExamsFullDegree', adjustFilter, examsController.getUnitExamsFullDegree);
router.get('/getStudentsByStageAndUnit/:stage/:unit', examsController.getStudentsByStageAndUnit);
router.post('/getStudentTotalDegree', adjustFilter, examsController.getStudentTotalDegree);
router.get("/getPdf/:url", examsController.getPdf);

module.exports = router;