import { useNavigate } from "react-router-dom";
import "./Landing.css";

const Landing = () => {
    const navigate = useNavigate();

    return (
        <section className="hero">
            <h1>Collaborate Smarter with SyncSpace AI</h1>

            <p>
                Real-Time Collaborative Whiteboard,
                Code Editor,
                Team Chat,
                Session Replay,
                and Smart Collaboration in one workspace.
            </p>

            <button
                onClick={() => navigate("/login")}>Get Started
            </button>
        </section>
    );
};

export default Landing;