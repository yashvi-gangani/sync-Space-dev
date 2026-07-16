import "./Navbar.css";
import {Link} from "react-router-dom";

const Navbar = () => {

    return(

        <nav className="navbar">

            <h2 className="logo">
                SyncSpace AI
            </h2>

            <div className="nav-links">

                <Link to="/">Home</Link>

                <Link to="/login">Login</Link>

                <Link to="/register">Register</Link>

            </div>

        </nav>

    )

}

export default Navbar;