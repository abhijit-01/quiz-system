const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    psNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    vertical: {
      type: String,
      required: true,
      enum: [
        "Power Electronics",
        "ESDM",
        "Mobility",
        "Robotics and Automation",
        "Strategic EPS",
      ],
    },

    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Participant", participantSchema);
