const express = require("express");
const router = express.Router();
const Alarm = require("../models/Alarm");
const verifyToken = require("../middleware/verifyToken");



/**
 * @openapi
 * /api/alarms:
 *   get:
 *     summary: Get all alarms
 *     tags:
 *       - Alarms
 *     responses:
 *       200:
 *         description: List of alarms
 */

// GET ALL ALARMS (HISTORY)
router.get("/", async (req, res) => {
  try {
    const alarms = await Alarm.find().sort({ createdAt: -1 });

    res.json(alarms);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching alarms",
    });
  }
});

/**
 * @openapi
 * /api/alarms/active:
 *   get:
 *     summary: Get active alarms
 *     tags:
 *       - Alarms
 *     responses:
 *       200:
 *         description: Active alarms list
 */

// GET ACTIVE ALARMS ONLY
router.get("/active", async (req, res) => {
  try {
    const alarms = await Alarm.find({
      acknowledged: false,
    }).sort({
      createdAt: -1,
    });

    res.json(alarms);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching active alarms",
    });
  }
});

/**
 * @openapi
 * /api/alarms/ack/{id}:
 *   post:
 *     summary: Acknowledge an alarm
 *     tags:
 *       - Alarms
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alarm acknowledged
 *       404:
 *         description: Alarm not found
 */

// ACKNOWLEDGE ALARM
router.post("/ack/:id", verifyToken, async (req, res) => {
  try {
    const alarm = await Alarm.findById(req.params.id);

    if (!alarm) {
      return res.status(404).json({ message: "Alarm not found" });
    }

    // ==============================
    // SCADA ROLE EXTRACTION
    // ==============================
    const userRole = req.user.role;

    // ==============================
    // SCADA ACCESS RULE ENGINE
    // ==============================

    // 🚫 Operator cannot ACK Critical alarms
    if (
      userRole === "Operator" &&
      alarm.severity === "Critical"
    ) {
      return res.status(403).json({
        message:
          "Operator restricted from acknowledging Critical alarms",
      });
    }

    // ✔ Allow ACK
    alarm.acknowledged = true;
    await alarm.save();

    // Optional SCADA log
    console.log("[SCADA EVENT] ALARM ACKNOWLEDGED", {
      alarmId: alarm._id,
      role: userRole,
      severity: alarm.severity,
    });

    return res.json(alarm);
  } catch (err) {
    console.error("ACK ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;