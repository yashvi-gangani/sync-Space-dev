import { useAuth } from "../../context/AuthContext";

const Profile = () => {

    const { user } = useAuth();

    if (!user) {
        return <h2>Please login first.</h2>;
    }

    return (
        <div style={{ padding: "30px" }}>

            <h1>My Profile</h1>

            <hr />

            <h3>Name</h3>
            <p>{user.name}</p>

            <h3>Email</h3>
            <p>{user.email}</p>

            <h3>User ID</h3>
            <p>{user.id}</p>

        </div>
    );
};

export default Profile;