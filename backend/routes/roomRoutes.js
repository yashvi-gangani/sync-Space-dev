const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    createRoom,
    getMyRooms
} = require("../controllers/roomController");

router.post(
    "/create",
    authMiddleware,
    createRoom
);

router.get(
    "/my-rooms",
    authMiddleware,
    getMyRooms
);

module.exports = router;