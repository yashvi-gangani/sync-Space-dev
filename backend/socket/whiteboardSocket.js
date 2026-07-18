module.exports = (io, socket) => {

    socket.on("drawing", ({ roomId, line }) => {
        socket.to(roomId).emit("drawing", line);
    });

    socket.on("clear-board", (roomId) => {
        socket.to(roomId).emit("clear-board");
    });

};