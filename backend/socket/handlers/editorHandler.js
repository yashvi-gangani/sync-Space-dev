const EVENTS = require("../constants");
const { getRoom, updateRoomCode, updateRoomLanguage } = require("../roomManager");

module.exports = (io, socket) => {
    // Sync code modifications to other users in the room
    socket.on(EVENTS.CODE_CHANGE, ({ roomId, code }) => {
        updateRoomCode(roomId, code);
        socket.to(roomId).emit(EVENTS.CODE_CHANGE, { code });
    });

    // Sync language switching to other users in the room
    socket.on(EVENTS.LANGUAGE_CHANGE, ({ roomId, language, code }) => {
        updateRoomLanguage(roomId, language);
        if (code !== undefined) {
            updateRoomCode(roomId, code);
        }
        socket.to(roomId).emit(EVENTS.LANGUAGE_CHANGE, { language, code });
    });

    // Sync current room code state to newly joined user
    socket.on(EVENTS.SYNC_CODE, ({ roomId }) => {
        const room = getRoom(roomId);
        if (room) {
            socket.emit(EVENTS.SYNC_CODE, {
                code: room.code,
                language: room.language,
            });
        }
    });
};