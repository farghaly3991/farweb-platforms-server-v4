const express = require('express');
const router = express.Router();
const adjControl = require('../controls/adjustments');

router.get("/adjustLessons", adjControl.adjustLessons);
router.get("/adjustExams", adjControl.adjustExams);

module.exports = router;