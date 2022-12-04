const mongoose = require('mongoose');

const visitorsSchema = new mongoose.Schema({
  month: {
    type: String,
  },
  visitors: {
    type: Number,
  },
  year: {
    type: String,
  },
  day: String,
});

module.exports = mongoose.model('visitors', visitorsSchema);
