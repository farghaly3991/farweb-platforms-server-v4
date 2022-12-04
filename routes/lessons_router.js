const express = require('express');
var router = express.Router();
const lessonsController = require('../controls/lessons_controller');
const videoController = require('../controls/upload_stream_videos');
const contAuthController = require('../controls/content-autherization');
const adminAuth = require('../middlewares/adminAuthorization');
const userAuth = require('../middlewares/userAuthorization');

router.post('/prepareUpload', adminAuth, videoController.prepareUpload);
router.post('/uploadVideo', adminAuth, videoController.uploadVideo);
router.post('/editVideo/:id', adminAuth, videoController.uploadVideo);
router.get('/deleteVideo/:id/:stage', adminAuth, videoController.deleteVideo);
router.post('/uploadVideoByChunks', videoController.uploadVideoByChunks);
router.get('/bufferVideo/:videoName/', videoController.bufferVideo);
///////////////////////////////////////////////////////////////////////////////////

router.post('/fetchVideos', lessonsController.fetchVideos);
router.get('/fetchLessonsAndExamsForStudent/:userId/:stage/:section', lessonsController.fetchLessonsAndExamsForStudent);
router.get('/fetchVideo/:id', lessonsController.fetchVideo);
router.get('/fetchLessonsAndExamsForVisitors/:stage/:section', lessonsController.fetchLessonsAndExamsForVisitors);
router.get('/unwindUnits', lessonsController.unwindUnits);
router.post('/updateAllowedUnits/:id', adminAuth, lessonsController.updateAllowedUnits);
router.post('/downloadFile', lessonsController.downloadFile);
router.post('/addSection', lessonsController.addSection);
router.get('/getSectionsByStage/:stage', lessonsController.getSectionsByStage);
router.get('/getSections', lessonsController.getSections);
router.get('/getSectionsForStudent/:stage/:userId', lessonsController.getSectionsForStudent);
router.get('/getSection/:id', lessonsController.getSection);
router.post('/editSection/:id', lessonsController.editSection);
router.delete('/deleteSection/:id', lessonsController.deleteSection);
router.post('/getUnitPrice', lessonsController.getUnitPrice);
router.get('/downloadFile/:lessonId', lessonsController.downloadFile);
router.post('/addVideoView', lessonsController.addVideoView);
router.get("/streamYoutube/:url/:token/:password", videoController.streamYoutube);
router.get("/authorizeVideo/:unit", videoController.authorizeVideo);
router.get("/addLessonCode/:lessonId/:userId", lessonsController.addLessonCode);
router.get("/getLessonCodes/:lessonId", lessonsController.getLessonCodes);
/////////////////////////////////////////////////////
router.get("/getAllLessons", lessonsController.getAllLessons);

//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////

router.post("/fetcLessonForUser", contAuthController.fetcLessonForUser);


module.exports = router;

