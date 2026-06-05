const mongoose = require("mongoose");

const telemetrySchema = new mongoose.Schema({
  data: Object,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Telemetry", telemetrySchema);