import API from "./api";

export const createRoom = async (roomName) => {
    const res = await API.post("/rooms/create", {
        roomName,
    });

    return res.data;
};

export const getMyRooms = async () => {
    const res = await API.get("/rooms/my-rooms");

    return res.data;
};