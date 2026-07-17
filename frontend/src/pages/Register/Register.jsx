import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./Register.css";

const Register = () => {

    const navigate = useNavigate();

    const { user } = useAuth();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
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
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            setLoading(true);

            const res = await API.post("/auth/register", formData);

            if (res.data.success) {

                alert("Registration Successful!");

                navigate("/login");

            }

        } catch (error) {

            alert(
                error.response?.data?.message ||
                "Registration Failed"
            );

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="auth-container">

            <div className="auth-box">

                <h2>Create Account</h2>

                <form onSubmit={handleSubmit}>

                    <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />

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
                                ? "Creating..."
                                : "Register"
                        }

                    </button>

                </form>

            </div>

        </div>

    );

};

export default Register;