const express = require("express");
const router = express.Router();
const GroupMessage = require("../models/GroupMessage");
const PrivateMessage = require("../models/PrivateMessage");

// ✅ **Save a Group Message**
router.post("/group", async (req, res) => {
    try {
        const { from_user, room, message } = req.body;

        if (!from_user || !room || !message) {
            return res.status(400).json({ error: "All fields are required." });
        }

        const newMessage = new GroupMessage({ from_user, room, message });
        await newMessage.save();

        res.status(201).json({ message: "Group message saved!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ **Get Group Chat History (Retrieve all messages for a specific room)**
router.get("/group/:room", async (req, res) => {
    try {
        const { room } = req.params;
        const messages = await GroupMessage.find({ room }).sort({ date_sent: 1 });

        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ **Save a Private Message**
router.post("/private", async (req, res) => {
    try {
        const { from_user, to_user, message } = req.body;

        if (!from_user || !to_user || !message) {
            return res.status(400).json({ error: "All fields are required." });
        }

        const newMessage = new PrivateMessage({ from_user, to_user, message });
        await newMessage.save();

        res.status(201).json({ message: "Private message saved!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ **Get Private Chat History (Retrieve all messages between two users)**
router.get("/private/:from_user/:to_user", async (req, res) => {
    try {
        const { from_user, to_user } = req.params;
        
        const messages = await PrivateMessage.find({
            $or: [
                { from_user, to_user },
                { from_user: to_user, to_user: from_user }
            ]
        }).sort({ date_sent: 1 });

        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
