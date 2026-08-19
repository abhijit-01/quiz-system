const express = require("express");

const QuizState = require("../models/QuizState");

const router = express.Router();

// ==========================================
// GET QUIZ STATUS
// ==========================================


router.get("/status", async (req, res) => {
  try {
    let quizState = await QuizState.findOne({
      key: "main",
    });

    // Create initial state if it doesn't exist
    if (!quizState) {
      quizState = await QuizState.create({
        key: "main",
        status: "not_started",
      });
    }

    res.json({
      status: quizState.status,
    });
  } catch (error) {
    console.error("Quiz status error:", error);

    res.status(500).json({
      message: "Failed to get quiz status",
    });
  }
});

// ==========================================
// START QUIZ
// ==========================================


router.post("/start", async (req, res) => {
  try {
    let quizState = await QuizState.findOne({
      key: "main",
    });

    if (!quizState) {
      quizState = await QuizState.create({
        key: "main",
        status: "not_started",
      });
    }

    // Already running
    if (quizState.status === "started") {
      return res.status(400).json({
        message: "Quiz is already started",
      });
    }

    // Don't allow starting after ending
    if (quizState.status === "ended") {
      return res.status(400).json({
        message: "Quiz has ended. Reset the quiz before starting again.",
      });
    }

    quizState.status = "started";

    await quizState.save();

    const io = req.app.get("io");

    if (io) {
      io.emit("quizStarted");
    }

    res.json({
      message: "Quiz started successfully",
      status: "started",
    });
  } catch (error) {
    console.error("Start quiz error:", error);

    res.status(500).json({
      message: "Failed to start quiz",
    });
  }
});

router.post("/end", async (req, res) => {
  try {
    const quizState = await QuizState.findOne({
      key: "main",
    });

    if (!quizState) {
      return res.status(400).json({
        message: "Quiz has not started",
      });
    }

    if (quizState.status !== "started") {
      return res.status(400).json({
        message: "Quiz is not currently running",
      });
    }

    quizState.status = "ended";

    await quizState.save();

    const io = req.app.get("io");

    if (io) {
      io.emit("quizEnded");
    }

    res.json({
      message: "Quiz ended successfully",
      status: "ended",
    });
  } catch (error) {
    console.error("End quiz error:", error);

    res.status(500).json({
      message: "Failed to end quiz",
    });
  }
});




// ==========================================
// RESET QUIZ STATE
// ==========================================

router.post("/reset", async (req, res) => {
  try {
    const quizState = await QuizState.findOneAndUpdate(
      {
        key: "main",
      },
      {
        $set: {
          status: "not_started",
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    const io = req.app.get("io");

    if (io) {
      io.emit("quizReset");
    }

    res.json({
      message: "Quiz state reset successfully",
      started: quizState.started,
    });
  } catch (error) {
    console.error("Quiz reset error:", error);

    res.status(500).json({
      message: "Failed to reset quiz state",
    });
  }
});

module.exports = router;
