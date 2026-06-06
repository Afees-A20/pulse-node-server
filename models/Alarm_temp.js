const mongoose = require("mongoose");

const alarmSchema = new mongoose.Schema({
  message: String,
  severity: {
    type: String,
    enum: ["Warning", "Critical"],
  },
  acknowledged: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Alarm", alarmSchema);