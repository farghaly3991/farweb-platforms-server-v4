const express = require('express');
var router = express.Router();
const publicController = require('../controls/pubic_controller');
const adminAuth = require('../middlewares/adminAuthorization');




router.get('/addVisitor', publicController.addVisitor);
router.get('/getVisits/:type', adminAuth, publicController.getVisits);
router.get('/getDashboardData', adminAuth, publicController.getDashboardData);


router.post('/sendInstructions', publicController.sendInstructions);
router.patch('/updateAdminData', adminAuth, publicController.updateAdminData);
router.put('/publishAd', adminAuth, publicController.publishAd);
router.get('/getAdminData', publicController.getAdminData);

///////////////////////////////
router.get('/getStageFullDegree/:stage', publicController.getStageFullDegree);
router.get('/getTotalDegreeAndFullDegreeForUserId/:userId', publicController.getTotalDegreeAndFullDegreeForUserId);
//////////////////////////////



router.get('/getStudentsNumbers/:stage', publicController.getStudentsNumbers);
////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////
router.get('/getGallery', publicController.getGallery);
router.post('/uploadGalleryImage', publicController.uploadGalleryImage);
router.delete('/deleteGalleryImage/:id/:number', publicController.deleteGalleryImage);

// router.patch('/putBonus/:user/:degree', adminAuth, publicController.putBonus);
// router.post('/setExamsOut', adminAuth, publicController.setExamsOut);
// router.get('/getOutExams/:stage', adminAuth, publicController.getOutExams);
// router.get('/getVisitorExams/:stage/:unit', publicController.getVisitorExams);
// router.get('/getVisitorExam/:id/:userId', publicController.getVisitorExam);


module.exports = router;
