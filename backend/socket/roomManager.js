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
            users:[]
        });

    }

    return rooms.get(roomId);

};

const getRoom = (roomId)=>{

    return rooms.get(roomId);

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

    deleteRoom,

    getAllRooms

};