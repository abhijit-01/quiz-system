const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Question = require("./models/Question");

dotenv.config();

const questions = [
  {
    questionText: "In which year was L&T established?",
    options: ["1938", "1947", "1950", "1962"],
    correctAnswer: "1938",
    order: 1,
  },

  {
    questionText: "L&T began its journey primarily as a:",
    options: [
      "Construction company",
      "Importing and trading company",
      "Software company",
      "Manufacturing company",
    ],
    correctAnswer: "Importing and trading company",
    order: 2,
  },

  {
    questionText: "L&T operates across which of these areas?",
    options: [
      "Engineering & Construction",
      "Technology",
      "Energy",
      "All of the above",
    ],
    correctAnswer: "All of the above",
    order: 3,
  },

  {
    questionText:
      "L&T's businesses are spread across which of these geographical markets?",
    options: [
      "India only",
      "India and selected international markets",
      "Europe only",
      "Asia only",
    ],
    correctAnswer: "India and selected international markets",
    order: 4,
  },

  {
    questionText: "How many verticals are there in L&T EPS?",
    options: ["3", "4", "5", "6"],
    correctAnswer: "5",
    order: 5,
  },

  {
    questionText:
      "L&T's businesses are spread across which of these geographical markets?",
    options: [
      "India only",
      "India and selected international markets",
      "Europe only",
      "Asia only",
    ],
    correctAnswer: "India and selected international markets",
    order: 6,
  },

  {
    questionText:
      "Which usually comes first in a typical product-development process?",
    options: [
      "Requirement → Design → Testing",
      "Testing → Requirement → Design",
      "Design → Testing → Requirement",
      "Production → Requirement → Design",
    ],
    correctAnswer: "Requirement → Design → Testing",
    order: 7,
  },

  {
    questionText:
      "Which one does NOT belong in a typical product-development cycle?",
    options: ["Requirement", "Design", "Validation", "Guessing"],
    correctAnswer: "Guessing",
    order: 8,
  },

  {
    questionText:
      "For a new L&T employee, what is one of the most important things to understand about the organization?",
    options: [
      "Its businesses and verticals",
      "Its project portfolio",
      "Its values and culture",
      "All of the above",
    ],
    correctAnswer: "All of the above",
    order: 9,
  },

  {
    questionText:
      "Which of the following EPS Vertical → Head combinations is WRONG?",
    options: [
      "Power Electronics → Chandrakumar S.",
      "Mobility → Sudeepth Puthumana",
      "Industrial Robotics & Automation → Virupakshappa Hovale",
      "ESDM → Nilesh Parulekar",
    ],
    correctAnswer: "ESDM → Nilesh Parulekar",
    order: 10,
  },

  {
    questionText: "Spot the WRONG EPS leadership combination:",
    options: [
      "Strategic Electronics & Technology → Nilesh Parulekar",
      "ESDM → Sathya Doraisamy R.",
      "Mobility → Virupakshappa Hovale",
      "Power Electronics → Chandrakumar S.",
    ],
    correctAnswer: "Mobility → Virupakshappa Hovale",
    order: 11,
  },

  {
    questionText: "Who is the current Chairman & Managing Director of L&T?",
    options: [
      "A. M. Naik",
      "S. N. Subrahmanyan",
      "R. Shankar Raman",
      "Subramanian Sarma",
    ],
    correctAnswer: "S. N. Subrahmanyan",
    order: 12,
  },

  {
    questionText:
      "Before becoming L&T's Chairman & Managing Director, SNS started his L&T journey in which role?",
    options: [
      "Project Planning Engineer",
      "CEO",
      "Deputy Managing Director",
      "Whole-Time Director",
    ],
    correctAnswer: "Project Planning Engineer",
    order: 13,
  },

  {
    questionText:
      "Which of the following is most closely associated with L&T EPS?",
    options: [
      "Electronic and engineering product solutions",
      "Hotel management",
      "Food processing",
      "Textile manufacturing",
    ],
    correctAnswer: "Electronic and engineering product solutions",
    order: 14,
  },

  {
    questionText: "Who is the current Head of L&T EPS?",
    options: [
      "Chandrakumar S.",
      "Prashant Jain",
      "Nilesh Parulekar",
      "Sudeepth Puthumana",
    ],
    correctAnswer: "Prashant Jain",
    order: 15,
  },
];

const seedQuestions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    // Remove existing questions

    await Question.deleteMany({});

    console.log("Existing questions removed");

    // Insert questions

    await Question.insertMany(questions);

    console.log(`${questions.length} questions inserted successfully`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding questions:", error);

    process.exit(1);
  }
};

seedQuestions();
