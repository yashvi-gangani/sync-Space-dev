import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import socket from "../../services/socket";
import { useAuth } from "../../context/AuthContext";
import "./Room.css";

const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const { user } = useAuth();

    const [members, setMembers] = useState([]);

    useEffect(() => {

        // Wait until user data is available
        if (!user) return;

        // Join Socket Room
        socket.emit("join-room", {
            roomId,
            user,
        });

        // Receive updated member list
        socket.on("room-users", (users) => {
            setMembers(users);
        });

        // Optional notification
        socket.on("user-joined", (message) => {
            console.log(message);
        });

        return () => {

            socket.emit("leave-room", {
                roomId,
                user,
            });

            socket.off("room-users");
            socket.off("user-joined");

        };

    }, [roomId, user]);

    const leaveRoom = () => {

        socket.emit("leave-room", {
            roomId,
            user,
        });

        navigate("/dashboard");

    };

    return (
        <div className="room-page">

            <header className="room-header">

                <h2>🚀 SyncSpace AI</h2>

                <div>
                    <strong>Room ID:</strong> {roomId}
                </div>

                <button onClick={leaveRoom}>
                    Leave Room
                </button>

            </header>

            <div className="workspace">

                {/* Members Panel */}
                <aside className="members-panel">

                    <h3>Online Members ({members.length})</h3>

                    {
                        members.length === 0 ? (
                            <p>No members online</p>
                        ) : (
                            members.map((member) => (
                                <div
                                    key={member.socketId}
                                    className="member"
                                >
                                    🟢 {member.name}
                                </div>
                            ))
                        )
                    }

                </aside>

                {/* Whiteboard */}
                <main className="editor-area">

                    <div className="whiteboard">

                        <h3>🎨 Whiteboard</h3>

                        <p>Coming in Week 2...</p>

                    </div>

                    <div className="code-editor">

                        <h3>💻 Monaco Editor</h3>

                        <p>Coming in Week 3...</p>

                    </div>

                </main>

                {/* Chat */}
                <aside className="chat-panel">

                    <h3>💬 Team Chat</h3>

                    <p>Coming Soon...</p>

                </aside>

            </div>

        </div>
    );
};

export default Room;