import { useContext } from "react";
import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import googleIcon from "../imgs/google.png";
import { Link, Navigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import { storeInSession } from "../common/session";
import { UserContext } from "../App";
import { authWithGoogle } from "../common/firebase";

const UserAuthForm = ({ type }) => {
    let { userAuth: { access_token }, setUserAuth } = useContext(UserContext);

    const userAuthThroughServer = (serverRoute, formData) => {
        // Convert FormData to plain object
        const data = {
            fullname: formData.get('fullname'),
            email: formData.get('email'),
            password: formData.get('password')
        };

        console.log('Sending data:', data); // Debug log
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + serverRoute, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(({ data }) => {
            console.log('Success response:', data); // Debug log
            storeInSession("user", JSON.stringify(data));
            setUserAuth(data);
        })
        .catch((error) => {
            console.error('Error details:', error.response || error); // Debug log
            
            // More detailed error logging
            if (error.response) {
                // The server responded with a status code outside of 2xx
                console.error('Server Error Response:', {
                    data: error.response.data,
                    status: error.response.status,
                    headers: error.response.headers
                });
                toast.error(error.response.data.error || 'Server error during signup');
            } else if (error.request) {
                // The request was made but no response was received
                console.error('No response received:', error.request);
                toast.error('No response from server. Check your connection.');
            } else {
                // Something happened in setting up the request
                console.error('Request setup error:', error.message);
                toast.error('Error setting up request');
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        let form = e.target;
        let formData = new FormData(form);

        let serverRoute = type === "sign-in" ? "/signin" : "/signup";

        // Email and password validation regex
        let emailRegex = /^[\w.-]+@gecidukki\.ac\.in$/;
        let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;
        let email = formData.get('email');
        let password = formData.get('password');
        let fullname = formData.get('fullname');

        // Form validation
        if (type !== "sign-in" && (!fullname || fullname.length < 3)) {
            return toast.error("Fullname must be at least 3 letters long");
        }

        if (!email) return toast.error("Enter Email");
        if (!emailRegex.test(email)) {
            return toast.error("Email must be a valid GECI email (@gecidukki.ac.in)");
        }
        if (!passwordRegex.test(password)) {
            return toast.error("Password should be 6 to 20 characters long with a number, 1 lowercase, and 1 uppercase letter");
        }

        userAuthThroughServer(serverRoute, formData);
    };

    const handleGoogleAuth = (e) => {
        e.preventDefault();
        authWithGoogle().then(user => {
            let serverRoute = "/google-auth";
            let formData = new FormData();
            formData.append("access_token", user.accessToken);

            userAuthThroughServer(serverRoute, formData);
        })
        .catch(err => {
            toast.error('Trouble logging in through Google');
            console.log(err);
        });
    };

    return access_token ? (
        <Navigate to="/" />
    ) : (
        <AnimationWrapper keyValue={type}>
            <section className="h-cover flex items-center justify-center">
                <Toaster />
                <form id="formElement" className="w-[80%] max-w-[400px]" onSubmit={handleSubmit}>
                    <h1 className="text-4xl font-gelasio capitalize text-center mb-24">
                        {type === "sign-in" ? "Welcome Back" : "Join us today"}
                    </h1>

                    {type !== "sign-in" && (
                        <InputBox name="fullname" type="text" placeholder="Full Name" icon="fi-rr-user" />
                    )}

                    <InputBox name="email" type="email" placeholder="College Email" icon="fi-rr-envelope" />
                    <InputBox name="password" type="password" placeholder="Password" icon="fi-rr-key" />

                    <button className="btn-dark center mt-14" type="submit">
                        {type.replace("-", " ")}
                    </button>

                    <div className="relative w-full flex items-center gap-2 my-10 opacity-10 uppercase text-black font-bold">
                        <hr className="w-1/2 border-black" />
                        <p>or</p>
                        <hr className="w-1/2 border-black" />
                    </div>

                    <button className="btn-dark flex items-center justify-center gap-4 w-[90%] center" onClick={handleGoogleAuth}>
                        <img src={googleIcon} className="w-5" />
                        Continue with Google
                    </button>

                    {type === "sign-in" ? (
                        <p className="mt-6 text-dark-grey text-xl text-center">
                            Don't have an account?
                            <Link to="/signup" className="underline text-black text-xl ml-1">
                                Join us today
                            </Link>
                        </p>
                    ) : (
                        <p className="mt-6 text-dark-grey text-xl text-center">
                            Already a Member?
                            <Link to="/signin" className="underline text-black text-xl ml-1">
                                Sign in here
                            </Link>
                        </p>
                    )}
                </form>
            </section>
        </AnimationWrapper>
    );
};

export default UserAuthForm;
