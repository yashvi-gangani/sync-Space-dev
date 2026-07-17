import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom, getMyRooms } from "../../services/roomService";

const Dashboard = () => {

    const navigate = useNavigate();

    const [roomName, setRoomName] = useState("");

    const [rooms, setRooms] = useState([]);

    const loadRooms = async () => {

        try {

            const res = await getMyRooms();

            if (res.success) {

                setRooms(res.rooms);

            }

        } catch (err) {

            console.log(err);

        }

    };

    useEffect(() => {

        loadRooms();

    }, []);

    const handleCreateRoom = async () => {

        if (!roomName.trim()) {

            alert("Enter Room Name");

            return;

        }

        try {

            const res = await createRoom(roomName);

            if (res.success) {

                navigate(`/room/${res.room.roomId}`);

            }

        } catch (err) {

            alert(err.response?.data?.message);

        }

    };

    return (

        <div style={{ padding: "30px" }}>

            <h1>Dashboard</h1>

            <br />

            <input
                placeholder="Room Name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
            />

            <button
                onClick={handleCreateRoom}
            >
                Create Room
            </button>

            <hr />

            <h2>My Rooms</h2>

            {

                rooms.map((room) => (

                    <div
                        key={room._id}
                        style={{
                            marginBottom: "15px",
                            cursor: "pointer"
                        }}
                        onClick={() =>
                            navigate(`/room/${room.roomId}`)
                        }
                    >

                        <h3>{room.roomName}</h3>

                    </div>

                ))

            }

        </div>

    );

};

export default Dashboard;