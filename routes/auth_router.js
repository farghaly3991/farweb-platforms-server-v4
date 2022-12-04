const express = require('express');
const router = express.Router();
const usersControl = require('../controls/auth_controller');
const authController = require('../controls/auth_controller');
const adminAuth = require('../middlewares/adminAuthorization');


router.post('/signin', authController.signin);
router.post('/signup', authController.signup);
router.post('/getuserdata', authController.getuserdata);
router.get('/getYoutubeSecret', authController.getYoutubeSecret);
router.post('/updateUserData', authController.updateUserData);
router.post('/updateUserDataAdmin', adminAuth, authController.updateUserDataAdmin);
// router.get('/getmessages/:userEmail', authController.getmessages);
router.post('/getUsers/:skip/:limit', authController.getUsers);
router.get('/getStudentsCount', authController.getStudentsCount);
router.get('/getStageUsers/:stage', authController.getStageUsers);
router.get('/deleteUser/:id', adminAuth, authController.deleteUser);
router.get('/toggleUserRole/:id', adminAuth, authController.toggleUserRole);
router.get('/confirmUser/:id', adminAuth, authController.confirmUser);
router.get('/isConfirmed/:email', authController.isConfirmed);
router.get('/resetPassword/:email', authController.resetPassword);
router.get('/modifyStudents', authController.modifyStudents);
router.get('/backupDatabase/:collection', authController.backupDatabase);
router.put('/restoreDatabase', authController.restoreDatabase);
router.get('/allowRegister/:id', authController.allowRegister);
router.get('/allowAll', authController.allowAll);
router.get('/unconfirmAll', authController.unconfirmAll);

//////////////////////////////////////////////////////////////////

// router.post('/generateCode', authController.generateCode);
router.post('/addMultiCodes', authController.addMultiCodes);
router.post('/getStageCodes/:skip/:limit', authController.getStageCodes);
// router.post('/authGeneralCode', authController.authGeneralCode);
router.post('/deleteExpiredCodes', authController.deleteExpiredCodes);

///////////////////////////////////////////////////////////////////////

router.post('/addMultiLessonCodes/:lessonId', authController.addMultiLessonCodes);
// router.get('/getLessonCodes/:lessonId', authController.getLessonCodes);
// router.get('/getCodeById/:id', authController.getCodeById);
router.post('/updateCode/:id/:type', authController.updateCode);
router.post('/updateCodesExpirationDate/:type', authController.updateCodesExpirationDate);
router.post('/deleteLessonCodes', authController.deleteLessonCodes);
router.delete('/removeCode/:id/:type', authController.removeCode);



router.get('/generateUsers', authController.generateUsers);

module.exports = router;
