const roomHandler = require("./handlers/roomHandler");
const editorHandler = require("./handlers/editorHandler");

const initializeSocket = (io) => {

    io.on("connection", (socket) => {

        console.log("✅ Connected:", socket.id);

        roomHandler(io, socket);
        editorHandler(io, socket);

    });

};

module.exports = initializeSocket;