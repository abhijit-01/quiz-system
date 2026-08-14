const express = require("express");

const Question = require("../models/Question");

const router = express.Router();

// ==========================================
// CREATE QUESTION
// ==========================================

router.post("/", async (req, res) => {
  try {
    const { questionText, options, correctAnswer, order } = req.body;

    if (!questionText || !options || !correctAnswer || order === undefined) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (options.length !== 4) {
      return res.status(400).json({
        message: "Exactly 4 options are required",
      });
    }

    const question = await Question.create({
      questionText,
      options,
      correctAnswer,
      order,
    });

    res.status(201).json({
      message: "Question created successfully",
      question,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// ==========================================
// GET QUESTIONS - ADMIN
// ==========================================

router.get("/admin", async (req, res) => {
  try {
    const questions = await Question.find({
      active: true,
    }).sort({
      order: 1,
    });

    res.json(questions);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
});

// ==========================================
// GET QUESTIONS - PARTICIPANT
// ==========================================

router.get("/", async (req, res) => {
  try {
    const questions = await Question.find({
      active: true,
    })
      .select("-correctAnswer")
      .sort({
        order: 1,
      });

    res.json(questions);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// ==========================================
// DELETE QUESTION
// ==========================================

router.delete("/:id", async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    res.json({
      message: "Question deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;
