const express = require("express");

const Participant = require("../models/Participants");

const router = express.Router();

// REGISTER PARTICIPANT
router.post("/register", async (req, res) => {
  try {
    const { name, psNo, vertical } = req.body;

    // Validation
    if (!name || !psNo || !vertical) {
      return res.status(400).json({
        message: "Name, PS No. and Vertical are required",
      });
    }

    // Check existing participant
    const existingParticipant = await Participant.findOne({
      psNo,
    });

    if (existingParticipant) {
      return res.status(400).json({
        message: "Participant with this PS No. already registered",
      });
    }

    // Create participant
    const participant = await Participant.create({
      name,
      psNo,
      vertical,
    });

    // Notify admin through Socket.IO
    const io = req.app.get("io");

    if (io) {
      io.emit("participantRegistered", {
        name: participant.name,
        psNo: participant.psNo,
        vertical: participant.vertical,
      });
    }

    // Response
    res.status(201).json({
      message: "Registration successful",

      participant: {
        id: participant._id,
        name: participant.name,
        psNo: participant.psNo,
        vertical: participant.vertical,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// GET ALL PARTICIPANTS
router.get("/", async (req, res) => {
  try {
    const participants = await Participant.find().sort({ registeredAt: -1 });

    res.json(participants);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;
