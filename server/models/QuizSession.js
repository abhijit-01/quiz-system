const mongoose = require("mongoose");

const quizSessionSchema = new mongoose.Schema(
  {
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Participant",
      required: true,
    },

    currentQuestion: {
      type: Number,
      default: 0,
    },

    questionStartedAt: {
      type: Date,
      default: null,
    },

    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("QuizSession", quizSessionSchema);
