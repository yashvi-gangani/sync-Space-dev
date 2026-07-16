const EVENTS = {
    CONNECTION: "connection",
    DISCONNECT: "disconnect",

    CREATE_ROOM: "create-room",
    JOIN_ROOM: "join-room",
    LEAVE_ROOM: "leave-room",

    USER_JOINED: "user-joined",
    USER_LEFT: "user-left",

    SEND_MESSAGE: "send-message",
    RECEIVE_MESSAGE: "receive-message",

    DRAW: "draw",

    CODE_CHANGE: "code-change",

    CURSOR_MOVE: "cursor-move",
};

module.exports = EVENTS;