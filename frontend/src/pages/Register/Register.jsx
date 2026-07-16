import "./Register.css";

const Register = ()=>{

    return(

        <div className="auth-container">

            <div className="auth-box">

                <h2>Register</h2>

                <input placeholder="Email"/>

                <input
                    placeholder="Password"
                    type="password"
                />

                <button>

                    Register

                </button>

            </div>

        </div>

    )

}

export default Register;