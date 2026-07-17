import { useState,useEffect  } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import "./Login.css";

const Login = () => {
    const navigate = useNavigate();

    const { login, user } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
    if (user) {
        navigate("/dashboard");
    }
}, [user, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            const res = await API.post("/auth/login", formData);

            if (res.data.success) {
                login(res.data.user, res.data.token);


                navigate("/dashboard");
            }
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Login Failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">

            <div className="auth-box">

                <h2>Login</h2>

                <form onSubmit={handleSubmit}>

                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <button type="submit">

                        {
                            loading
                                ? "Logging in..."
                                : "Login"
                        }

                    </button>

                </form>

            </div>

        </div>
    );
};

export default Login;