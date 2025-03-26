import express from 'express';
import User from '../Schema/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { verifyJWT } from '../middleware/auth.js';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '../public/uploads/profile-images');
try {
    if (!fs.existsSync(path.join(__dirname, '../public'))) {
        fs.mkdirSync(path.join(__dirname, '../public'));
    }
    if (!fs.existsSync(path.join(__dirname, '../public/uploads'))) {
        fs.mkdirSync(path.join(__dirname, '../public/uploads'));
    }
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
} catch (error) {
    console.error('Error creating upload directories:', error);
}

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure directory exists before saving
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create a safe filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `profile-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, JPG and PNG files are allowed.'));
    }
};

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// Health check endpoint
router.get("/health", (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Auth Routes
router.post("/signup", async (req, res) => {
    try {
        const { fullname, role, department, ktu_id, phone, email, password, passout_year } = req.body;

        // Basic validation
        if (!fullname || !role || !department || !email || !password || !phone) {
            return res.status(400).json({
                error: "All required fields must be filled"
            });
        }

        // Role-specific validations
        if ((role === 'Student' || role === 'Alumni') && !ktu_id) {
            return res.status(400).json({
                error: "KTU ID is required for students and alumni"
            });
        }

        if (role === 'Alumni' && !passout_year) {
            return res.status(400).json({
                error: "Passout year is required for alumni"
            });
        }

        // Format validations
        if (!email.endsWith('@gecidukki.ac.in')) {
            return res.status(400).json({
                error: "Must use a valid @gecidukki.ac.in email"
            });
        }

        if (!phone.match(/^\+91[0-9]{10}$/)) {
            return res.status(400).json({
                error: "Phone number must start with +91 followed by 10 digits"
            });
        }

        if ((role === 'Student' || role === 'Alumni') && !ktu_id.match(/^(IDK|LIDK)[0-9A-Z]+$/)) {
            return res.status(400).json({
                error: "KTU ID must start with IDK or LIDK followed by numbers and uppercase letters"
            });
        }

        if (role === 'Alumni') {
            const currentYear = new Date().getFullYear();
            if (passout_year < 2010 || passout_year > currentYear) {
                return res.status(400).json({
                    error: "Passout year must be between 2010 and current year"
                });
            }
        }

        // Check for existing user
        const existingUser = await User.findOne({
            $or: [
                { "personal_info.email": email },
                { "personal_info.ktu_id": ktu_id },
                { "personal_info.phone": phone }
            ]
        });

        if (existingUser) {
            if (existingUser.personal_info.email === email) {
                return res.status(409).json({ error: "Email already registered" });
            }
            if (existingUser.personal_info.ktu_id === ktu_id) {
                return res.status(409).json({ error: "KTU ID already registered" });
            }
            if (existingUser.personal_info.phone === phone) {
                return res.status(409).json({ error: "Phone number already registered" });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            personal_info: {
                fullname,
                email,
                password: hashedPassword,
                username: email.split('@')[0],
                role,
                department,
                ktu_id: role === 'Faculty' ? undefined : ktu_id,
                passout_year: role === 'Alumni' ? passout_year : undefined,
                phone
            }
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Send response
        res.status(201).json({
            message: "Account created successfully",
            access_token: token,
            profile_img: user.personal_info.profile_img,
            username: user.personal_info.username,
            fullname: user.personal_info.fullname,
            role: user.personal_info.role
        });

    } catch (error) {
        console.error("Signup error:", error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                error: "Validation failed",
                details: errors
            });
        }

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0].split('.')[1];
            return res.status(409).json({
                error: `${field.charAt(0).toUpperCase() + field.slice(1)} is already registered`
            });
        }

        res.status(500).json({
            error: "Registration failed",
            message: "An error occurred during registration"
        });
    }
});

router.post("/signin", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // Find user
        const user = await User.findOne({ "personal_info.email": email });
        if (!user) {
            return res.status(403).json({ error: "Email not found" });
        }

        // Compare password
        const validPassword = await bcrypt.compare(password, user.personal_info.password);
        if (!validPassword) {
            return res.status(403).json({ error: "Incorrect password" });
        }

        // Generate token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Send response
        res.status(200).json({
            access_token: token,
            profile_img: user.personal_info.profile_img,
            username: user.personal_info.username,
            fullname: user.personal_info.fullname,
            role: user.personal_info.role
        });

    } catch (error) {
        console.error("Signin error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Profile Routes
router.get("/profile", verifyJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-personal_info.password");
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.get("/profile/:username", async (req, res) => {
    try {
        let user;
        const { username } = req.params;

        // First try to find by username
        user = await User.findOne({ "personal_info.username": username })
            .select("-personal_info.password");

        // If not found by username, try to find by ID (if username is a valid ObjectId)
        if (!user && mongoose.Types.ObjectId.isValid(username)) {
            user = await User.findById(username)
                .select("-personal_info.password");
        }
        
        if (!user) {
            return res.status(404).json({ 
                error: "User not found",
                message: "No user found with the provided username or ID"
            });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error("Profile fetch error:", error);
        return res.status(500).json({ 
            error: "Internal server error",
            message: error.message 
        });
    }
});

router.put("/profile", verifyJWT, async (req, res) => {
    try {
        const { 
            fullname, 
            department, 
            phone, 
            bio, 
            social_links,
            ktu_id,
            passout_year,
            role 
        } = req.body;
        const userId = req.user.id;

        // Get the current user
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Validate phone number if provided
        if (phone && !phone.match(/^\+91[0-9]{10}$/)) {
            return res.status(400).json({
                error: "Phone number must start with +91 followed by 10 digits"
            });
        }

        // Validate KTU ID if provided for Student/Alumni
        if (ktu_id && (role === 'Student' || role === 'Alumni')) {
            if (!ktu_id.match(/^(IDK|LIDK)[0-9A-Z]+$/)) {
                return res.status(400).json({
                    error: "KTU ID must start with IDK or LIDK followed by numbers and uppercase letters"
                });
            }
        }

        // Validate passout year for Alumni
        if (passout_year && role === 'Alumni') {
            const currentYear = new Date().getFullYear();
            if (passout_year < 2010 || passout_year > currentYear) {
                return res.status(400).json({
                    error: "Passout year must be between 2010 and current year"
                });
            }
        }

        // Check if phone number is already used by another user
        if (phone && phone !== currentUser.personal_info.phone) {
            const existingUserWithPhone = await User.findOne({
                _id: { $ne: userId },
                "personal_info.phone": phone
            });
            if (existingUserWithPhone) {
                return res.status(409).json({ error: "Phone number already registered" });
            }
        }

        // Check if KTU ID is already used by another user
        if (ktu_id && ktu_id !== currentUser.personal_info.ktu_id) {
            const existingUserWithKtuId = await User.findOne({
                _id: { $ne: userId },
                "personal_info.ktu_id": ktu_id
            });
            if (existingUserWithKtuId) {
                return res.status(409).json({ error: "KTU ID already registered" });
            }
        }

        // Build update object
        const updateData = {
            "personal_info.fullname": fullname || currentUser.personal_info.fullname,
            "personal_info.department": department || currentUser.personal_info.department,
            "personal_info.phone": phone || currentUser.personal_info.phone,
            "personal_info.bio": bio || currentUser.personal_info.bio,
            "personal_info.ktu_id": ktu_id || currentUser.personal_info.ktu_id,
            "personal_info.passout_year": passout_year || currentUser.personal_info.passout_year
        };

        if (social_links) {
            updateData.social_links = {
                ...currentUser.social_links,
                ...social_links
            };
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-personal_info.password");

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("Profile update error:", error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: "Validation failed",
                details: Object.values(error.errors).map(err => err.message)
            });
        }

        return res.status(500).json({ 
            error: "Profile update failed",
            message: error.message 
        });
    }
});

// Password Routes
router.post("/change-password", verifyJWT, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current password and new password are required" });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, user.personal_info.password);
        if (!validPassword) {
            return res.status(403).json({ error: "Current password is incorrect" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await User.findByIdAndUpdate(userId, {
            $set: { "personal_info.password": hashedPassword }
        });

        return res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Change password error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Profile image upload route
router.post('/upload-profile-image', verifyJWT, upload.single('profileImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Log upload details
        console.log('File upload details:', {
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype,
            path: req.file.path
        });

        // Create the image URL using the correct path
        const profileImageUrl = `/uploads/profile-images/${req.file.filename}`;

        // Update user's profile image in database
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { 
                'personal_info.profile_img': profileImageUrl 
            },
            { new: true }
        );

        if (!user) {
            // If user not found, delete the uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('Profile image updated successfully:', profileImageUrl);

        res.json({ 
            profileImageUrl,
            message: 'Profile image updated successfully' 
        });

    } catch (error) {
        console.error('Profile image upload error:', error);
        // If there's an error, try to delete the uploaded file if it exists
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting file after failed upload:', unlinkError);
            }
        }
        res.status(500).json({ 
            error: error.message || 'Failed to upload image' 
        });
    }
});

export default router; 