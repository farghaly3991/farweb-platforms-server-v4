const express = require('express');
var router = express.Router();
const examsController = require('../controls/exams_controller');
const tasksController = require('../controls/tasks_controller');
const adminAuth = require('../middlewares/adminAuthorization');

//////////////////////////////////////////////////////////////////////////////
////////////////////////////// STUDENT_SIDE //////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

//get unsolved exams numbers for the student to perform
router.get('/getUnsolvedExams/:stage/:userId', examsController.getUnsolvedExams);

//make sure that the student doesn't pick another exam model by refresh by sending him the same model
//other wise when no solved exam function return a random model for student to solve
router.get('/fetchExamForUser/:stage/:userId/:number', examsController.fetchExamForUser);

//after bringing exam to perform making sure that there is no solution by this user to tis exam number
// router.get('/testedOrNot/:stage/:number/:userId', examsController.testedOrNot);


//get all exams for user by stage to handle in the front end in different places and functions
router.get('/getExamsByStage/:stage', examsController.getExamsByStage);

//startExam by setting start time of the exam in User row
// router.get('/startExam/:userId', examsController.startExam);

//////////////////////////////////////////////////////////////////////////////
////////////////////////////// ADMIN_SIDE //////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

router.post('/uploadQuestions', adminAuth, examsController.uploadQuestions);
// router.get('/fetchExam/:id', examsController.fetchExam);
router.get('/deleteExam/:id/:year/:stage', adminAuth, examsController.deleteExam);

//fetch exam for the admin to put solution model
router.get('/fetchExamById/:id', examsController.fetchExamById);

//filter the exams for the admin
router.post('/filterExams', examsController.filterExams);

router.post('/sendCorrection/:solutionId', adminAuth, examsController.sendCorrection);
router.post('/putSolution', adminAuth, examsController.putSolution);
router.delete('/removeCorrection/:id/:examId/:userId', adminAuth, examsController.removeCorrection);

//fetch solution model for some exam id whether it is existed or not for the admin to edit or put new one
router.get('/fetchSolutionModelForAdmin/:id', adminAuth, examsController.fetchSolutionModelForAdmin);
router.get('/getStudentsToBeCorrected/:stage', examsController.getStudentsToBeCorrected);
router.get('/getSolutionById/:id', examsController.getSolutionById);

router.get('/deleteSolutionsByExamId/:examId', examsController.deleteSolutionsByExamId);
router.delete("/deleteSolutionModel/:id", adminAuth, examsController.deleteSolutionModel);


//////////////////////////////////////////////////////////////////////////////
////////////////////////////// COMMON_FUNCTIONS //////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////


//get student solved exams for user to review ... the results, and admin to correct
router.get('/getStudentExams/:userId', examsController.getStudentExams);
router.get('/getUnsolvedSolutions', examsController.getUnsolvedSolutions);
router.post('/sendSolution', examsController.sendSolution);

//////////////////////////////////////////////////////////////////////////////
////////////////////////////// TASKS //////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

router.get('/fetchTaskByLessonId/:lessonId', tasksController.fetchTaskByLessonId);
router.post('/fetchTaskByLessonIdForStudent', tasksController.fetchTaskByLessonIdForStudent);
router.post("/sendTaskSolution", tasksController.sendTaskSolution);
router.post("/getUserTaskAndSolution", tasksController.getUserTaskAndSolution);
router.post("/getUserTaskSolution", tasksController.getUserTaskSolution);
router.delete("/removeTask/:lessonId", tasksController.removeTask);
module.exports = router;