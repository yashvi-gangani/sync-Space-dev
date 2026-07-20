import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ForgotPasswordModal from "../../components/common/ForgotPasswordModal";
import toast from "react-hot-toast";
import { Mail, Lock, LogIn, ArrowRight } from "lucide-react";
import "./Login.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const cleanEmail = email.trim();
        if (!cleanEmail || !password) {
            toast.error("Please enter email and password");
            return;
        }

        setLoading(true);
        try {
            const data = await login(cleanEmail, password);
            if (data.success) {
                toast.success("Welcome back to SyncSpace!");
                navigate("/dashboard");
            } else {
                toast.error(data.message || "Invalid credentials");
            }
        } catch (err) {
            console.error("Login Submission Error:", err);
            toast.error(err.response?.data?.message || "Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <div className="auth-header">
                    <div className="brand-logo">🚀 SyncSpace</div>
                    <h2>Welcome Back</h2>
                    <p>Enter your credentials to access your collaborative workspace</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
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
                        <div className="password-header">
                            <label>Password</label>
                            <button
                                type="button"
                                className="forgot-link-btn"
                                onClick={() => setIsForgotModalOpen(true)}
                            >
                                Forgot Password?
                            </button>
                        </div>
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

                    <button type="submit" disabled={loading} className="auth-submit-btn">
                        <LogIn size={18} />
                        <span>{loading ? "Signing In..." : "Sign In"}</span>
                    </button>
                </form>

                <div className="auth-footer">
                    <span>Don't have an account? </span>
                    <Link to="/register" className="auth-link">
                        Create an account <ArrowRight size={14} />
                    </Link>
                </div>
            </div>

            <ForgotPasswordModal
                isOpen={isForgotModalOpen}
                onClose={() => setIsForgotModalOpen(false)}
            />
        </div>
    );
};

export default Login;