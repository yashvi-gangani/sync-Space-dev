import { useState } from "react";
import { useNavigate } from "react-router-dom";
import generateRoomId from "../../utils/generateRoomId";
import "./Dashboard.css";

const Dashboard = () => {

    const navigate = useNavigate();

    const [joinRoomId, setJoinRoomId] = useState("");

    const handleCreateRoom = () => {

        const roomId = generateRoomId();

        navigate(`/room/${roomId}`);

    };

    const handleJoinRoom = () => {

        if (!joinRoomId.trim()) {

            alert("Please enter a Room ID");

            return;

        }

        navigate(`/room/${joinRoomId}`);

    };

    return (

        <div className="dashboard">

            <div className="dashboard-container">

                <h1>🚀 SyncSpace</h1>

                <p className="subtitle">

                    Real-Time Collaborative Whiteboard & Code Editor

                </p>

                <div className="card-container">

                    <div className="card">

                        <h2>Create New Room</h2>

                        <p>
                            Start a new collaboration session.
                        </p>

                        <button onClick={handleCreateRoom}>

                            Create Room

                        </button>

                    </div>

                    <div className="card">

                        <h2>Join Existing Room</h2>

                        <input
                            type="text"
                            placeholder="Enter Room ID"
                            value={joinRoomId}
                            onChange={(e) => setJoinRoomId(e.target.value)}
                        />

                        <button onClick={handleJoinRoom}>

                            Join Room

                        </button>

                    </div>

                </div>

                <div className="recent">

                    <h2>Recent Sessions</h2>

                    <p>Coming Soon...</p>

                </div>

            </div>

        </div>

    );

};

export default Dashboard;