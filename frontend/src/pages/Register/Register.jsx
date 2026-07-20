import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { User, Mail, Lock, UserPlus, ArrowRight } from "lucide-react";
import "../Login/Login.css"; // Reuse shared glassmorphism layout styles

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const cleanName = name.trim();
        const cleanEmail = email.trim();

        if (!cleanName || !cleanEmail || !password || !confirmPassword) {
            toast.error("Please fill in all fields");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        setLoading(true);
        try {
            const data = await register(cleanName, cleanEmail, password);
            if (data.success) {
                toast.success("Account created successfully! Welcome to SyncSpace!");
                navigate("/dashboard");
            } else {
                toast.error(data.message || "Registration failed");
            }
        } catch (err) {
            console.error("Register Error:", err);
            toast.error(err.response?.data?.message || "Registration failed. Email might already exist.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <div className="auth-header">
                    <div className="brand-logo">🚀 SyncSpace</div>
                    <h2>Create Account</h2>
                    <p>Join SyncSpace to collaborate in real-time</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Full Name</label>
                        <div className="input-field-wrapper">
                            <User className="field-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Kunal Sharma"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-field-wrapper">
                            <Mail className="field-icon" size={18} />
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-field-wrapper">
                            <Lock className="field-icon" size={18} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <div className="input-field-wrapper">
                            <Lock className="field-icon" size={18} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="auth-submit-btn">
                        <UserPlus size={18} />
                        <span>{loading ? "Creating Account..." : "Create Account"}</span>
                    </button>
                </form>

                <div className="auth-footer">
                    <span>Already have an account? </span>
                    <Link to="/login" className="auth-link">
                        Sign In <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;