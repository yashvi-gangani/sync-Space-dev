const roomSocket = require("./roomSocket");

const socketHandler = (io) => {

    io.on("connection", (socket) => {

        console.log("🟢 Connected:", socket.id);

        roomSocket(io, socket);

        socket.on("disconnect", () => {

            console.log("🔴 Disconnected:", socket.id);

        });

    });

};

module.exports = socketHandler;