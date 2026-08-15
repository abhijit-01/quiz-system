const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const participantRoutes = require("./routes/participantsRoutes");
const questionRoutes = require("./routes/questionRoutes");
const responseRoutes = require("./routes/responseRoutes");

const connectDB = require("./config/db");

dotenv.config();

// ======================================================
// DATABASE
// ======================================================

connectDB();

// ======================================================
// EXPRESS APP
// ======================================================

const app = express();

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

// ======================================================
// ROUTES
// ======================================================

app.use("/api/participants", participantRoutes);

app.use("/api/questions", questionRoutes);

app.use("/api/responses", responseRoutes);

// ======================================================
// BASIC / HEALTH ROUTE
// ======================================================

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Quiz System API is running",

    status: "OK",
  });
});

// ======================================================
// LOCAL SOCKET.IO
// ======================================================
//
// Socket.IO is kept for your LOCAL development.
// We don't create the HTTP server / Socket.IO
// server when running on Vercel.
//

if (process.env.NODE_ENV !== "production") {
  const http = require("http");

  const { Server } = require("socket.io");

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: "*",

      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  app.set("io", io);

  io.on("connection", (socket) => {
    console.log("Admin/Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  const PORT = process.env.PORT || 5000;

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// ======================================================
// VERCEL
// ======================================================

module.exports = app;
