const express = require('express');
var router = express.Router();
const chatController = require('../controls/chat_controller');
const adminAuth = require('../middlewares/adminAuthorization');

router.post('/sendMessage', chatController.sendMessage);
router.post('/uploadChatFile', chatController.uploadChatFile);
router.get('/getMessages/:userId/:skip/:limit', chatController.getMessages);
router.get("/getUnseenMessagesNumber/:userId", chatController.getUnseenMessagesNumber);
router.get("/getUnseenUsersMessagesNumber", chatController.getUnseenUsersMessagesNumber);
// router.get("/getUnseenMessagesNumberForAdmin/:userId", chatController.getUnseenMessagesNumberForAdmin);
router.get("/isSeen/:userId/:peer", chatController.isSeen);

module.exports = router;