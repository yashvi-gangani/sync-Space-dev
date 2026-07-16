const roomHandler = require("./handlers/roomHandler");

const initializeSocket = (io) => {

    io.on("connection", (socket) => {

        console.log("✅ Connected:", socket.id);

        roomHandler(io, socket);

    });

};

module.exports = initializeSocket;