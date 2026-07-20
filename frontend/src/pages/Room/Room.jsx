import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import socket from "../../services/socket";
import CodeEditor from "../../components/Room/CodeEditor";
import "./Room.css";

const Room = () => {

    const { roomId } = useParams();
    const navigate = useNavigate();

    const [members, setMembers] = useState([]);

    useEffect(() => {

        const user = {
            id: Date.now(),
            name: "kunal"
        };

        socket.emit("join-room", {
            roomId,
            user
        });

        socket.on("user-joined", ({ room }) => {

            setMembers(room.users);

        });

        socket.on("user-left", ({ room }) => {

            setMembers(room.users);

        });

        return () => {

            socket.emit("leave-room", {
                roomId,
                user
            });

            socket.off("user-joined");
            socket.off("user-left");

        };

    }, [roomId]);

    const leaveRoom = () => {

        navigate("/dashboard");

    };

    return (

        <div className="room-page">

            <header className="room-header">

                <h2>🚀 SyncSpace</h2>

                <div>

                    <strong>Room:</strong> {roomId}

                </div>

                <button onClick={leaveRoom}>

                    Leave Room

                </button>

            </header>

            <div className="workspace">

                <aside className="members-panel">

                    <h3>Members</h3>

                    {
                        members.length === 0 ?

                        <p>No members</p>

                        :

                        members.map((member) => (

                            <div
                                key={member.socketId}
                                className="member"
                            >

                                🟢 {member.name}

                            </div>

                        ))

                    }

                </aside>

                <main className="editor-area">

                    <div className="whiteboard">

                        Whiteboard (Coming Soon)

                    </div>

                    <CodeEditor roomId={roomId} socket={socket} />

                </main>

                <aside className="chat-panel">

                    Chat (Coming Soon)

                </aside>

            </div>

        </div>

    );

};

export default Room;