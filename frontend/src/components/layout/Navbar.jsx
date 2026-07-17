import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {

        logout();

        navigate("/login");

    };

    return (

        <nav className="navbar">

            <h2 className="logo">

                SyncSpace AI

            </h2>

            <div className="nav-links">

                <Link to="/">Home</Link>

                {
                    user ? (

                        <>

                            <Link to="/dashboard">

                                Dashboard

                            </Link>

                            <Link to="/profile">

                                {user.name}

                            </Link>

                            <button
                                className="logout-btn"
                                onClick={handleLogout}
                            >

                                Logout

                            </button>

                        </>

                    ) : (

                        <>

                            <Link to="/login">

                                Login

                            </Link>

                            <Link to="/register">

                                Register

                            </Link>

                        </>

                    )
                }

            </div>

        </nav>

    );

};

export default Navbar;