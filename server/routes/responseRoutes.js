const express = require("express");

const Participant = require("../models/Participants");
const Question = require("../models/Question");
const Response = require("../models/Response");
const QuizSession = require("../models/QuizSession");

const router = express.Router();

// ======================================================
// START QUIZ
// ======================================================

router.post("/start", async (req, res) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({
        message: "Participant ID required",
      });
    }

    const participant = await Participant.findById(participantId);

    if (!participant) {
      return res.status(404).json({
        message: "Participant not found",
      });
    }

    // --------------------------------------------------
    // CHECK IF PARTICIPANT ALREADY HAS A SESSION
    // --------------------------------------------------

    let session = await QuizSession.findOne({
      participant: participantId,
    });

    // --------------------------------------------------
    // EXISTING SESSION
    // --------------------------------------------------

    if (session) {
      // Quiz already completed
      if (session.completed) {
        return res.json({
          sessionId: session._id,
          completed: true,
        });
      }

      const question = await Question.findOne({
        active: true,
        order: session.currentQuestion + 1,
      }).select("-correctAnswer");

      if (!question) {
        return res.status(404).json({
          message: "Question not found",
        });
      }

      const elapsed =
        Date.now() - new Date(session.questionStartedAt).getTime();

      const remainingMs = Math.max(0, 30000 - elapsed);

      return res.json({
        sessionId: session._id,
        question,
        questionNumber: session.currentQuestion + 1,
        totalQuestions: await Question.countDocuments({
          active: true,
        }),
        remainingMs,
        serverTime: new Date(),
      });
    }

    // --------------------------------------------------
    // CREATE NEW SESSION
    // --------------------------------------------------

    session = await QuizSession.create({
      participant: participantId,
      currentQuestion: 0,
      questionStartedAt: new Date(),
      completed: false,
    });

    const question = await Question.findOne({
      active: true,
      order: 1,
    }).select("-correctAnswer");

    if (!question) {
      await QuizSession.findByIdAndDelete(session._id);

      return res.status(404).json({
        message: "No questions available",
      });
    }

    const totalQuestions = await Question.countDocuments({
      active: true,
    });

    res.status(201).json({
      sessionId: session._id,

      question,

      questionNumber: 1,

      totalQuestions,

      remainingMs: 30000,

      serverTime: new Date(),
    });
  } catch (error) {
    console.error("Start quiz error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// ======================================================
// FASTEST FINGER FIRST
// IMPORTANT: KEEP THIS BEFORE /:sessionId/current
// ======================================================

router.get("/fastest", async (req, res) => {
  try {
    const fastest = await Response.find({
      isCorrect: true,
    })
      .populate("participant", "psNo vertical")
      .populate("question", "questionText order")
      .sort({
        responseTime: 1,
      })
      .limit(10);

    res.json(fastest);
  } catch (error) {
    console.error("Fastest response error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// ======================================================
// GET ALL RESPONSES
// ======================================================

router.get("/", async (req, res) => {
  try {
    const responses = await Response.find()
      .populate("participant", "psNo vertical")
      .populate("question", "questionText order")
      .sort({
        submittedAt: -1,
      });

    res.json(responses);
  } catch (error) {
    console.error("Get responses error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// ======================================================
// GET CURRENT QUESTION
// ======================================================

router.get("/:sessionId/current", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await QuizSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    // ----------------------------------------------
    // QUIZ COMPLETED
    // ----------------------------------------------

    if (session.completed) {
      return res.json({
        completed: true,
      });
    }

    // ----------------------------------------------
    // FIND QUESTION
    // ----------------------------------------------

    const question = await Question.findOne({
      active: true,
      order: session.currentQuestion + 1,
    }).select("-correctAnswer");

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    // ----------------------------------------------
    // SERVER-SIDE TIMER
    // ----------------------------------------------

    const elapsed = Date.now() - new Date(session.questionStartedAt).getTime();

    const remainingMs = Math.max(0, 30000 - elapsed);

    // ----------------------------------------------
    // RESPONSE
    // ----------------------------------------------

    res.json({
      sessionId: session._id,

      question,

      questionNumber: session.currentQuestion + 1,

      totalQuestions: await Question.countDocuments({
        active: true,
      }),

      remainingMs,

      serverTime: new Date(),
    });
  } catch (error) {
    console.error("Current question error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// ======================================================
// SUBMIT ANSWER
// ======================================================

router.post("/submit", async (req, res) => {
  try {
    const { sessionId, answer } = req.body;

    // ----------------------------------------------
    // VALIDATION
    // ----------------------------------------------

    if (!sessionId) {
      return res.status(400).json({
        message: "Session ID required",
      });
    }

    // ----------------------------------------------
    // GET SESSION
    // ----------------------------------------------

    const session =
      await QuizSession.findById(sessionId).populate("participant");

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    // ----------------------------------------------
    // CHECK COMPLETION
    // ----------------------------------------------

    if (session.completed) {
      return res.status(400).json({
        message: "Quiz already completed",
      });
    }

    // ----------------------------------------------
    // GET CURRENT QUESTION
    // ----------------------------------------------

    const question = await Question.findOne({
      active: true,
      order: session.currentQuestion + 1,
    });

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    // ----------------------------------------------
    // SERVER TIME
    // ----------------------------------------------

    const submittedAt = new Date();

    // ----------------------------------------------
    // CALCULATE RESPONSE TIME
    // ----------------------------------------------

    let responseTime =
      submittedAt.getTime() - new Date(session.questionStartedAt).getTime();

    // Never allow negative time

    responseTime = Math.max(0, responseTime);

    // Maximum 30 seconds

    responseTime = Math.min(responseTime, 30000);

    // ----------------------------------------------
    // CHECK ANSWER
    // ----------------------------------------------

    const isCorrect = answer === question.correctAnswer;

    // ----------------------------------------------
    // PREVENT DUPLICATE ANSWER
    // ----------------------------------------------

    const existingResponse = await Response.findOne({
      participant: session.participant._id,

      question: question._id,
    });

    if (existingResponse) {
      return res.status(400).json({
        message: "Answer already submitted",
      });
    }

    // ----------------------------------------------
    // SAVE RESPONSE
    // ----------------------------------------------

    await Response.create({
      participant: session.participant._id,

      question: question._id,

      answer: answer || null,

      isCorrect,

      startedAt: session.questionStartedAt,

      submittedAt,

      responseTime,
    });

    // ----------------------------------------------
    // GET TOTAL QUESTIONS
    // ----------------------------------------------

    const totalQuestions = await Question.countDocuments({
      active: true,
    });

    // ----------------------------------------------
    // CHECK IF THIS WAS LAST QUESTION
    // ----------------------------------------------

    const nextQuestionNumber = session.currentQuestion + 2;

    if (nextQuestionNumber > totalQuestions) {
      session.completed = true;

      await session.save();

      // ------------------------------------------
      // REAL-TIME ADMIN UPDATE
      // ------------------------------------------

      const io = req.app.get("io");

      if (io) {
        io.emit("answerSubmitted", {
          psNo: session.participant.psNo,

          vertical: session.participant.vertical,

          questionId: question._id,

          questionNumber: question.order,

          isCorrect,

          responseTime,
        });
      }

      return res.json({
        completed: true,

        isCorrect,

        responseTime,
      });
    }

    // ----------------------------------------------
    // MOVE TO NEXT QUESTION
    // ----------------------------------------------

    session.currentQuestion += 1;

    session.questionStartedAt = new Date();

    await session.save();

    // ----------------------------------------------
    // GET NEXT QUESTION
    // ----------------------------------------------

    const nextQuestion = await Question.findOne({
      active: true,

      order: session.currentQuestion + 1,
    }).select("-correctAnswer");

    if (!nextQuestion) {
      session.completed = true;

      await session.save();

      return res.json({
        completed: true,
        isCorrect,
        responseTime,
      });
    }

    // ----------------------------------------------
    // REAL-TIME ADMIN UPDATE
    // ----------------------------------------------

    const io = req.app.get("io");

    if (io) {
      io.emit("answerSubmitted", {
        psNo: session.participant.psNo,

        vertical: session.participant.vertical,

        questionId: question._id,

        questionNumber: question.order,

        isCorrect,

        responseTime,
      });
    }

    // ----------------------------------------------
    // RETURN NEXT QUESTION
    // ----------------------------------------------

    res.json({
      completed: false,

      isCorrect,

      responseTime,

      question: nextQuestion,

      questionNumber: session.currentQuestion + 1,

      totalQuestions,

      remainingMs: 30000,

      serverTime: new Date(),
    });
  } catch (error) {
    console.error("Submit answer error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;
