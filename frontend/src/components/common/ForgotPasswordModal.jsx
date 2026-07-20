import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { X, Mail, KeyRound, Lock, ArrowRight, CheckCircle } from "lucide-react";
import "./ForgotPasswordModal.css";

const ForgotPasswordModal = ({ isOpen, onClose }) => {
    const { forgotPassword, resetPassword } = useAuth();
    const [step, setStep] = useState(1); // 1: Send OTP, 2: Enter OTP & New Password
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [generatedOtp, setGeneratedOtp] = useState(null);

    if (!isOpen) return null;

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error("Please enter your email address");
            return;
        }

        setLoading(true);
        try {
            const data = await forgotPassword(email);
            if (data.success) {
                toast.success(data.message || "Reset OTP sent successfully!");
                if (data.otp) {
                    setGeneratedOtp(data.otp);
                }
                setStep(2);
            } else {
                toast.error(data.message || "Failed to send reset code");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Error requesting password reset");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!otp || !newPassword || !confirmPassword) {
            toast.error("Please fill in all fields");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        setLoading(true);
        try {
            const data = await resetPassword(email, otp, newPassword);
            if (data.success) {
                toast.success("Password reset successfully! You can now log in.");
                handleClose();
            } else {
                toast.error(data.message || "Failed to reset password");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid or expired OTP code");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setEmail("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setGeneratedOtp(null);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={handleClose}>
                    <X size={20} />
                </button>

                <div className="modal-header">
                    <KeyRound className="modal-icon" size={32} />
                    <h3>{step === 1 ? "Forgot Password?" : "Reset Password"}</h3>
                    <p>
                        {step === 1
                            ? "Enter your registered email to receive a 6-digit Reset OTP."
                            : "Enter the 6-digit OTP code and set a new password."}
                    </p>
                </div>

                {generatedOtp && step === 2 && (
                    <div className="demo-otp-banner">
                        <CheckCircle size={16} />
                        <span>Demo OTP Code: <strong>{generatedOtp}</strong></span>
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleSendOtp} className="modal-form">
                        <div className="input-group">
                            <Mail className="input-icon" size={18} />
                            <input
                                type="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" disabled={loading} className="modal-submit-btn">
                            <span>{loading ? "Sending..." : "Send Reset Code"}</span>
                            <ArrowRight size={18} />
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="modal-form">
                        <div className="input-group">
                            <KeyRound className="input-icon" size={18} />
                            <input
                                type="text"
                                placeholder="6-Digit OTP Code"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <Lock className="input-icon" size={18} />
                            <input
                                type="password"
                                placeholder="New Password (min 6 chars)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <Lock className="input-icon" size={18} />
                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="modal-button-group">
                            <button
                                type="button"
                                className="back-btn"
                                onClick={() => setStep(1)}
                            >
                                Back
                            </button>
                            <button type="submit" disabled={loading} className="modal-submit-btn">
                                {loading ? "Resetting..." : "Reset Password"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordModal;
