const EVENTS = require("../constants");
const {createRoom, getRoom,} = require("../roomManager");
const {addUser,removeUser,} = require("../userManager");

module.exports = (io, socket) => {

    socket.on(EVENTS.CREATE_ROOM, ({ roomId, user }) => {

    createRoom(roomId);

    socket.join(roomId);

    addUser(socket.id,user);

    const room=getRoom(roomId);

    room.users.push({

        socketId:socket.id,

        ...user

    });

    console.log(room);

    io.to(roomId).emit(EVENTS.USER_JOINED,{

        room

    });

});

    socket.on(EVENTS.JOIN_ROOM,({roomId,user})=>{

    const room=getRoom(roomId);

    if(!room){

        return;

    }

    socket.join(roomId);

    addUser(socket.id,user);

    room.users.push({

        socketId:socket.id,

        ...user

    });

    io.to(roomId).emit(EVENTS.USER_JOINED,{

        room

    });

});

    socket.on(EVENTS.LEAVE_ROOM,({roomId})=>{

    const room=getRoom(roomId);

    if(!room) return;

    room.users=room.users.filter(

        user=>user.socketId!==socket.id

    );

    removeUser(socket.id);

    socket.leave(roomId);

    io.to(roomId).emit(EVENTS.USER_LEFT,{

        room

    });

});

    socket.on(EVENTS.DISCONNECT,()=>{

    removeUser(socket.id);

    console.log("Disconnected",socket.id);

});

};