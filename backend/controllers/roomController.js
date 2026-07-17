const Room = require("../models/Room");
const { v4: uuidv4 } = require("uuid");

// Create Room
const createRoom = async (req, res) => {
    try {

        const { roomName } = req.body;

        if (!roomName) {
            return res.status(400).json({
                success: false,
                message: "Room name is required"
            });
        }

        const room = await Room.create({
            roomId: uuidv4(),
            roomName,
            owner: req.user._id,
            members: [req.user._id],
        });

        res.status(201).json({
            success: true,
            room
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
};

// Get My Rooms
const getMyRooms = async (req, res) => {

    try {

        const rooms = await Room.find({
            members: req.user._id
        });

        res.status(200).json({
            success: true,
            rooms
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

};

module.exports = {
    createRoom,
    getMyRooms
};