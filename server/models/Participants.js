const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    psNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    
    name: {
      type: String,
      required: true,
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
        "Support Staff",
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
