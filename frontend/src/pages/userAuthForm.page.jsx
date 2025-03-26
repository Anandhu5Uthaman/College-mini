import { useContext, useState } from "react";
import AnimationWrapper from "../common/page-animation";
import { Link, Navigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { storeInSession } from "../common/session";
import { UserContext } from "../App";
import { authWithGoogle } from "../common/firebase";
import axiosInstance from '../config/axios.config';

const UserAuthForm = ({ type }) => {
    let { userAuth: { access_token }, setUserAuth } = useContext(UserContext);
    const [showPassword, setShowPassword] = useState(false);
    const [showRetypePassword, setShowRetypePassword] = useState(false);
    const [formData, setFormData] = useState({
        fullname: '',
        role: 'Student',
        department: '',
        ktu_id: '',
        passout_year: '',
        phone: '+91',
        email: '',
        password: '',
        retypePassword: ''
    });

    const departments = [
        "Computer Science and Engineering",
        "Electronics and Communication",
        "Electrical and Electronics",
        "Civil Engineering",
        "Mechanical Engineering"
    ];

    // Get current year for passout year validation
    const currentYear = new Date().getFullYear();
    const startYear = 2010; // First batch year
    const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'role') {
                if (value === 'Faculty') {
                    newData.ktu_id = '';
                    newData.passout_year = '';
                } else if (value === 'Student') {
                    newData.passout_year = '';
                }
            }
            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // Validate form data for signup
            if (type === "sign-up") {
                if (formData.password !== formData.retypePassword) {
                    throw new Error("Passwords don't match!");
                }

                if (!formData.phone.startsWith('+91') || formData.phone.length !== 13) {
                    throw new Error("Phone number must start with +91 and be 10 digits");
                }

                if (!formData.email.endsWith('@gecidukki.ac.in')) {
                    throw new Error("Must use a college email (@gecidukki.ac.in)");
                }

                if ((formData.role === 'Student' || formData.role === 'Alumni') && 
                    (!formData.ktu_id || !/^(IDK|LIDK)[0-9A-Z]+$/.test(formData.ktu_id))) {
                    throw new Error("KTU ID must start with IDK or LIDK");
                }

                if (formData.role === 'Alumni' && !formData.passout_year) {
                    throw new Error("Passout year is required for alumni");
                }
            }

            const endpoint = type === "sign-up" ? "signup" : "signin";
            
            // Remove retypePassword from the data sent to server
            const { retypePassword, ...dataToSend } = formData;
            
            console.log('Sending request to:', `${import.meta.env.VITE_SERVER_DOMAIN}/api/${endpoint}`);
            console.log('With data:', dataToSend);

            const response = await axiosInstance.post(`/api/${endpoint}`, dataToSend);

            if (response.data && response.data.access_token) {
                storeInSession("user", JSON.stringify(response.data));
                setUserAuth(response.data);
                toast.success(type === "sign-up" ? "Account created successfully!" : "Signed in successfully!");
            }
        } catch (error) {
            console.error('Auth error:', error);
            const errorMessage = error.response?.data?.error || 
                               error.response?.data?.message || 
                               error.message ||
                               'Authentication failed';
            toast.error(errorMessage);
        }
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

    const inputStyle = "w-full px-4 py-2.5 bg-transparent focus:outline-none text-gray-700 placeholder-gray-500";
    const containerStyle = "bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-3 flex items-center space-x-2";

    return access_token ? (
        <Navigate to="/" />
    ) : (
        <AnimationWrapper keyValue={type}>
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-[450px] bg-white rounded-xl shadow-md p-8">
                    <h1 className="text-[#004B87] text-2xl font-bold text-center">
                        {type === "sign-in" ? "Sign In" : "Register"}
                        <div className="w-16 h-0.5 bg-black mx-auto mt-2 mb-8"></div>
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {type === "sign-up" ? (
                            <>
                                <div className={containerStyle}>
                                    <span className="text-gray-500">👤</span>
                                    <input
                                        type="text"
                                        name="fullname"
                                        placeholder="Full Name"
                                        value={formData.fullname}
                                        onChange={handleChange}
                                        required
                                        className={inputStyle}
                                    />
                                </div>

                                <div className={containerStyle}>
                                    <span className="text-gray-500">Role</span>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        required
                                        className={inputStyle + " appearance-none"}
                                    >
                                        <option value="Student">Student</option>
                                        <option value="Alumni">Alumni</option>
                                        <option value="Faculty">Faculty</option>
                                    </select>
                                </div>

                                <div className={containerStyle}>
                                    <span className="text-gray-500">Department</span>
                                    <select
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        required
                                        className={inputStyle + " appearance-none"}
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map((dept, index) => (
                                            <option key={index} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>

                                {(formData.role === 'Student' || formData.role === 'Alumni') && (
                                    <div className={containerStyle}>
                                        <span className="text-gray-500">🆔</span>
                                        <input
                                            type="text"
                                            name="ktu_id"
                                            placeholder="KTU ID"
                                            value={formData.ktu_id}
                                            onChange={handleChange}
                                            required
                                            pattern="^(IDK|LIDK)[0-9A-Z]+"
                                            className={inputStyle}
                                        />
                                    </div>
                                )}

                                {formData.role === 'Alumni' && (
                                    <div className={containerStyle}>
                                        <span className="text-gray-500">🎓</span>
                                        <select
                                            name="passout_year"
                                            value={formData.passout_year}
                                            onChange={handleChange}
                                            required
                                            className={inputStyle + " appearance-none"}
                                        >
                                            <option value="">Select Passout Year</option>
                                            {years.map((year) => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className={containerStyle}>
                                    <span className="text-gray-500">📞</span>
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="Phone Number"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        pattern="^\+91[0-9]{10}$"
                                        className={inputStyle}
                                    />
                                </div>
                            </>
                        ) : null}

                        <div className={containerStyle}>
                            <span className="text-gray-500">📧</span>
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                pattern=".*@gecidukki\.ac\.in$"
                                className={inputStyle}
                            />
                        </div>

                        <div className={containerStyle}>
                            <span className="text-gray-500">🔒</span>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                className={inputStyle}
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-gray-500 focus:outline-none"
                            >
                                👁️
                            </button>
                        </div>

                        {type === "sign-up" && (
                            <div className={containerStyle}>
                                <span className="text-gray-500">🔒</span>
                                <input
                                    type={showRetypePassword ? "text" : "password"}
                                    name="retypePassword"
                                    placeholder="Retype Password"
                                    value={formData.retypePassword}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                    className={inputStyle}
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowRetypePassword(!showRetypePassword)}
                                    className="text-gray-500 focus:outline-none"
                                >
                                    👁️
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-[#004B87] text-white py-2.5 rounded-lg font-medium hover:bg-[#003B6F] transition-colors mt-6"
                        >
                            {type === "sign-in" ? "Sign In" : "Sign Up"}
                        </button>

                        {type === "sign-in" ? (
                            <p className="mt-6 text-gray-600 text-center">
                                Don't have an account?
                                <Link to="/signup" className="text-[#004B87] font-medium ml-1">
                                    Join us today
                                </Link>
                            </p>
                        ) : (
                            <p className="mt-6 text-gray-600 text-center">
                                Already a member?
                                <Link to="/signin" className="text-[#004B87] font-medium ml-1">
                                    Sign in here
                                </Link>
                            </p>
                        )}
                    </form>
                </div>
                <Toaster position="top-center" />
            </div>
        </AnimationWrapper>
    );
}

export default UserAuthForm;