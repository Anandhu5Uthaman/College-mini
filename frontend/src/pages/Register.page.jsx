import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import axios from 'axios';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.baseURL = '/api';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.post['Content-Type'] = 'application/json';

const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

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

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1994 }, (_, i) => currentYear - i);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'role' && value === 'Faculty') {
                newData.ktu_id = '';
                newData.passout_year = '';
            }
            if (name === 'role' && value === 'Student') {
                newData.passout_year = '';
            }
            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
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

            const { retypePassword, ...dataToSend } = formData;

            const response = await axios.post('/api/signup', dataToSend);

            if (response.data) {
                toast.success("Registration successful!");
                navigate('/signin');
            }
        } catch (error) {
            console.error('Registration error:', error);
            toast.error(error.response?.data?.error || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-[450px] bg-white rounded-lg p-8">
                <h1 className="text-[#004B87] text-2xl font-bold text-center mb-8">
                    Register
                    <div className="w-16 h-0.5 bg-black mx-auto mt-2"></div>
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <div className="flex items-center border border-gray-300 rounded-lg shadow-sm">
                            <span className="pl-3 text-gray-500">👤</span>
                            <input
                                type="text"
                                name="fullname"
                                placeholder="Full Name"
                                value={formData.fullname}
                                onChange={handleChange}
                                required
                                className="w-full p-2.5 bg-transparent focus:outline-none text-gray-700"
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <div className="flex items-center border border-gray-300 rounded-lg shadow-sm">
                            <label className="pl-3 text-gray-500">Role</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                                className="w-full p-2.5 bg-transparent focus:outline-none text-gray-700 appearance-none"
                            >
                                <option value="Student">Student</option>
                                <option value="Alumni">Alumni</option>
                                <option value="Faculty">Faculty</option>
                            </select>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="flex items-center border border-gray-300 rounded-lg shadow-sm">
                            <label className="pl-3 text-gray-500">Department</label>
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                required
                                className="w-full p-2.5 bg-transparent focus:outline-none text-gray-700 appearance-none"
                            >
                                <option value="">Select Department</option>
                                {departments.map((dept, index) => (
                                    <option key={index} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {(formData.role === 'Student' || formData.role === 'Alumni') && (
                        <div className="relative">
                            <div className="flex items-center border border-gray-300 rounded-lg shadow-sm">
                                <span className="pl-3 text-gray-500">🆔</span>
                                <input
                                    type="text"
                                    name="ktu_id"
                                    placeholder="KTU ID"
                                    value={formData.ktu_id}
                                    onChange={handleChange}
                                    required
                                    pattern="^(IDK|LIDK)[0-9A-Z]+"
                                    className="w-full p-2.5 bg-transparent focus:outline-none text-gray-700"
                                />
                            </div>
                        </div>
                    )}

                    {formData.role === 'Alumni' && (
                        <div className="relative">
                            <div className="flex items-center border border-gray-300 rounded-lg shadow-sm">
                                <span className="pl-3 text-gray-500">📅</span>
                                <select
                                    name="passout_year"
                                    value={formData.passout_year}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-2.5 bg-transparent focus:outline-none text-gray-700 appearance-none"
                                >
                                    <option value="">Select Passout Year</option>
                                    {years.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="relative">
                        <div className="flex items-center border border-gray-300 rounded-lg shadow-sm">
                            <span className="pl-3 text-gray-500">📞</span>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Phone Number"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                pattern="^\+91[0-9]{10}$"
                                className="w-full p-2.5 bg-transparent focus:outline-none text-gray-700"
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <div className="flex items-center border border-gray-300 rounded-lg shadow-sm">
                            <span className="pl-3 text-gray-500">📧</span>
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                pattern=".*@gecidukki\.ac\.in$"
                                className="w-full p-2.5 bg-transparent focus:outline-none text-gray-700"
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <div className="flex items-center border border-gray-300 rounded-lg shadow-sm">
                            <span className="pl-3 text-gray-500">🔒</span>
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                className="w-full p-2.5 bg-transparent focus:outline-none text-gray-700"
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <div className="flex items-center border border-gray-300 rounded-lg shadow-sm">
                            <span className="pl-3 text-gray-500">🔒</span>
                            <input
                                type="password"
                                name="retypePassword"
                                placeholder="Retype Password"
                                value={formData.retypePassword}
                                onChange={handleChange}
                                required
                                minLength={6}
                                className="w-full p-2.5 bg-transparent focus:outline-none text-gray-700"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#004B87] text-white py-2.5 rounded-lg font-medium hover:bg-[#003B6F] transition-colors mt-4"
                    >
                        {loading ? 'Signing up...' : 'Sign Up'}
                    </button>
                </form>
            </div>
            <Toaster position="top-center" />
        </div>
    );
};

export default Register; 