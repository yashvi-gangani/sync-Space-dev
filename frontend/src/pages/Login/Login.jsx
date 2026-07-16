import "./Login.css";

const Login = ()=>{

    return(

        <div className="auth-container">

            <div className="auth-box">

                <h2>Login</h2>

                <input placeholder="Email"/>

                <input
                    placeholder="Password"
                    type="password"
                />

                <button>

                    Login

                </button>

            </div>

        </div>

    )

}

export default Login;