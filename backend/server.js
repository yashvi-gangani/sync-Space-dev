const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const initializeSocket = require("./socket");
const authMiddleware = require("./middleware/authMiddleware");
const roomRoutes = require("./routes/roomRoutes");

dotenv.config();

// Connect Database
connectDB();

const app = express();

// Middleware
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

app.get("/", (req, res) => {
    res.send("🚀 SyncSpace Backend Running...");
});

app.get("/api/test", authMiddleware, (req, res) => {

    res.json({
        success: true,
        message: "Protected Route Working",
        user: req.user
    });

});

// Create HTTP Server
const server = http.createServer(app);

// Attach Socket.io
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"],
    },
});

// Initialize Socket Events
initializeSocket(io);

const PORT = process.env.PORT || 5000;

// Start Server
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});