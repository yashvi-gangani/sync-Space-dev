const users = new Map();

const addUser=(socketId,user)=>{

    users.set(socketId,user);

};

const removeUser=(socketId)=>{

    users.delete(socketId);

};

const getUser=(socketId)=>{

    return users.get(socketId);

};

const getAllUsers=()=>{

    return users;

};

module.exports={

    addUser,

    removeUser,

    getUser,

    getAllUsers

};