import axios from 'axios';
import { toast } from 'react-hot-toast';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_SERVER_DOMAIN;

export const uploadImage = async (file, access_token) => {
    try {
        // Validate file
        if (!file) {
            toast.error("No file selected");
            return null;
        }

        // Validate access token
        if (!access_token) {
            toast.error("Please login to upload images");
            return null;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.");
            return null;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File too large. Maximum size is 5MB");
            return null;
        }

        // Create FormData
        const formData = new FormData();
        formData.append('image', file);

        // Send to server
        const response = await axios.post('/api/upload-image', formData, {
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'multipart/form-data'
            },
            withCredentials: true,
            timeout: 30000, // 30 second timeout
            maxContentLength: 10 * 1024 * 1024, // 10MB max size
            maxBodyLength: 10 * 1024 * 1024 // 10MB max size
        });

        if (!response.data) {
            throw new Error('No response data received');
        }

        return response.data.url;

    } catch (error) {
        console.error('Upload error:', error);
        
        if (error.code === 'ECONNABORTED') {
            toast.error("Upload timed out. Please try again.");
            return null;
        }
        
        // Handle specific error cases
        if (error.response) {
            switch (error.response.status) {
                case 400:
                    toast.error(error.response.data.message || "Invalid request");
                    break;
                case 401:
                    toast.error("Please login again, your session has expired");
                    break;
                case 413:
                    toast.error("File too large. Maximum size is 5MB");
                    break;
                case 500:
                    toast.error("Server error. Please try again later");
                    break;
                default:
                    toast.error("Upload failed. Please try again");
            }
        } else if (error.request) {
            toast.error("Network error. Please check your connection");
        } else {
            toast.error("Upload failed: " + error.message);
        }
        
        return null;
    }
}; 