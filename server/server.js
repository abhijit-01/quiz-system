const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const participantRoutes = require("./routes/participantsRoutes");
const questionRoutes = require("./routes/questionRoutes");
const responseRoutes = require("./routes/responseRoutes");

const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.set("io", io);
// --------------------
// Middleware
// --------------------

app.use(
  cors({
    origin: "*",
  }),
);

app.use(express.json());

// --------------------
// Basic Route
// --------------------

app.use("/api/participants", participantRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/responses", responseRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Quiz System API is running",
  });
});

// --------------------
// Socket.IO
// --------------------

io.on("connection", (socket) => {
  console.log("Admin/Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// --------------------
// Server
// --------------------

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
