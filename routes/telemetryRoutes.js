const express = require("express");
const router = express.Router();

const Telemetry = require("../models/Telemetry");

// GET latest data
router.get("/latest", async (req, res) => {
  const data = await Telemetry.findOne().sort({ time: -1 });
  res.json(data);
});

// GET last 20 records
router.get("/history", async (req, res) => {
  const data = await Telemetry.find().sort({ time: -1 }).limit(20);
  res.json(data);
});

module.exports = router;