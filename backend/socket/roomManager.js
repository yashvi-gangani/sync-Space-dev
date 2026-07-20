const rooms = new Map();

/*
Room Structure

rooms = {

    room123 : {

        roomId : "room123",

        users : [

            {
                socketId,
                id,
                name,
                email
            }

        ]

    }

}

*/

const createRoom = (roomId) => {

    if(!rooms.has(roomId)){

        rooms.set(roomId,{
            roomId,
            users:[],
            code: `// Welcome to SyncSpace Real-Time Code Editor!\nconsole.log("Hello, SyncSpace!");\n`,
            language: "javascript"
        });

    }

    return rooms.get(roomId);

};

const getRoom = (roomId)=>{

    return rooms.get(roomId);

};

const updateRoomCode = (roomId, code) => {
    const room = rooms.get(roomId);
    if (room) {
        room.code = code;
    }
};

const updateRoomLanguage = (roomId, language) => {
    const room = rooms.get(roomId);
    if (room) {
        room.language = language;
    }
};

const deleteRoom=(roomId)=>{

    rooms.delete(roomId);

};

const getAllRooms=()=>{

    return rooms;

};

module.exports={

    rooms,

    createRoom,

    getRoom,

    updateRoomCode,

    updateRoomLanguage,

    deleteRoom,

    getAllRooms

};