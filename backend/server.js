const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

const User = require("./models/User");
const GroupMessage = require("./models/GroupMessage");
const PrivateMessage = require("./models/PrivateMessage");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

// Store active users
const users = {};

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // **Join Room**
    socket.on("joinRoom", ({ username, room }) => {
        socket.join(room);
        users[socket.id] = { username, room };

        console.log(`${username} joined room: ${room}`);

        // Notify other users
        socket.to(room).emit("message", { from_user: "System", message: `${username} has joined the room.` });
    });

    // **Leave Room**
    socket.on("leaveRoom", () => {
        const user = users[socket.id];
        if (user) {
            socket.leave(user.room);
            socket.to(user.room).emit("message", { from_user: "System", message: `${user.username} has left the room.` });
            delete users[socket.id];
        }
    });

    // **Send Message in Room**
    socket.on("sendMessage", async ({ from_user, room, message }) => {
        const newMessage = new GroupMessage({ from_user, room, message });
        await newMessage.save();

        io.to(room).emit("message", { from_user, message });
    });

    // **Send Private Message**
    socket.on("sendPrivateMessage", async ({ from_user, to_user, message }) => {
        const newMessage = new PrivateMessage({ from_user, to_user, message });
        await newMessage.save();

        // Notify the recipient if they are online
        for (let id in users) {
            if (users[id].username === to_user) {
                io.to(id).emit("privateMessage", { from_user, message });
            }
        }
    });

    // **User Typing Indicator**
    socket.on("typing", ({ username, room }) => {
        socket.to(room).emit("userTyping", username);
    });

    // **Disconnect Event**
    socket.on("disconnect", () => {
        const user = users[socket.id];
        if (user) {
            socket.to(user.room).emit("message", { from_user: "System", message: `${user.username} has disconnected.` });
            delete users[socket.id];
        }
        console.log("User disconnected:", socket.id);
    });
});

const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
