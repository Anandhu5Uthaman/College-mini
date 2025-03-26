import axios from 'axios';

const instance = axios.create({
    baseURL: import.meta.env.VITE_SERVER_DOMAIN || 'http://localhost:5176',
    withCredentials: true,
    timeout: 30000, // 30 seconds
});

// Request interceptor
instance.interceptors.request.use(
    (config) => {
        // Get token from session storage
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        const token = user?.access_token;

        // If token exists, add it to headers
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Axios Error:', {
            status: error.response?.status,
            data: error.response?.data,
            config: error.config
        });
        return Promise.reject(error);
    }
);

export default instance; 