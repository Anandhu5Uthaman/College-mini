import { useState } from "react";

const InputBox = ({ name, type, placeholder, icon, value, onChange, required = false }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative">
            <input
                name={name}
                type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pl-4 pr-10"
            />
            {icon && (
                <i className={`fi ${icon} absolute right-3 top-1/2 -translate-y-1/2 text-gray-400`}></i>
            )}
            {type === 'password' && (
                <i 
                    className={`fi fi-rr-eye${!showPassword ? "-crossed" : ""} absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer`}
                    onClick={() => setShowPassword(!showPassword)}
                ></i>
            )}
        </div>
    );
};

export default InputBox;