const onlineUsers = {};

module.exports = (io, socket) => {

    socket.on("join-room", ({ roomId, user }) => {

        socket.join(roomId);

        socket.roomId = roomId;
        socket.user = user;

        if (!onlineUsers[roomId]) {
            onlineUsers[roomId] = [];
        }

        // Prevent duplicate entries
        const alreadyExists = onlineUsers[roomId].find(
            (u) => u.email === user.email
        );

        if (!alreadyExists) {
            onlineUsers[roomId].push({
                socketId: socket.id,
                name: user.name,
                email: user.email,
            });
        }

        io.to(roomId).emit(
            "room-users",
            onlineUsers[roomId]
        );

        io.to(roomId).emit(
            "user-joined",
            `${user.name} joined the room`
        );

    });

    socket.on("leave-room", ({ roomId }) => {

        if (!onlineUsers[roomId]) return;

        socket.leave(roomId);

        onlineUsers[roomId] =
            onlineUsers[roomId].filter(
                (u) => u.socketId !== socket.id
            );

        io.to(roomId).emit(
            "room-users",
            onlineUsers[roomId]
        );

    });

    socket.on("disconnect", () => {

        const roomId = socket.roomId;

        if (!roomId || !onlineUsers[roomId]) return;

        onlineUsers[roomId] =
            onlineUsers[roomId].filter(
                (u) => u.socketId !== socket.id
            );

        io.to(roomId).emit(
            "room-users",
            onlineUsers[roomId]
        );

    });

};