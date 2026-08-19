const mongoose = require("mongoose");

const quizStateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "main",
      unique: true,
    },

    status: {
      type: String,
      enum: ["not_started", "started", "ended"],
      default: "not_started",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("QuizState", quizStateSchema);
