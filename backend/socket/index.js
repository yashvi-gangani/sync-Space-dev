const roomSocket = require("./roomSocket");
const whiteboardSocket = require("./whiteboardSocket");

const socketHandler = (io) => {

    io.on("connection", (socket) => {

        console.log("🟢 Connected:", socket.id);

        roomSocket(io, socket);
whiteboardSocket(io, socket);

        socket.on("disconnect", () => {

            console.log("🔴 Disconnected:", socket.id);

        });

    });

};

module.exports = socketHandler;