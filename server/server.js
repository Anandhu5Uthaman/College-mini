import express from "express";
import connectDB from "./config/db.js";
import cors from "cors";
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from './Schema/User.js';
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";

// Configure dotenv at the start
dotenv.config();

console.log('Environment check:', {
    mongoURI: process.env.MONGODB_URI ? 'Set' : 'Not set',
    port: process.env.PORT,
    secretKey: process.env.SECRET_ACCESS_KEY ? 'Set' : 'Not set'
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Add this middleware to log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
});

// Connect to MongoDB with retry logic
const connectWithRetry = async () => {
    let retries = 5;
    while (retries) {
        try {
            await connectDB();
            console.log('MongoDB connected successfully');
            break;
        } catch (error) {
            retries -= 1;
            console.error(`Failed to connect to MongoDB. Retries left: ${retries}`);
            console.error('Error details:', error);
            if (retries) {
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            } else {
                console.error('Max retries reached. Exiting...');
                process.exit(1);
            }
        }
    }
};

// Initial connection
connectWithRetry();

// Routes
app.get('/test', (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(500).json({ error: 'Database not connected' });
    }
    res.json({ message: 'Server is working!' });
});

// Signup Route
app.post("/signup", async (req, res) => {
    try {
        console.log('Received signup request:', req.body); // Debug log
        
        const { fullname, email, password } = req.body;

        // Validate required fields
        if (!fullname || !email || !password) {
            console.log('Missing fields:', { fullname: !!fullname, email: !!email, password: !!password });
            return res.status(400).json({
                error: 'All fields are required'
            });
        }

        // Email validation
        if (!email.endsWith('@gecidukki.ac.in')) {
            console.log('Invalid email domain:', email);
            return res.status(403).json({
                error: 'Only @gecidukki.ac.in email addresses are allowed'
            });
        }

        // Check existing user
        const existingUser = await User.findOne({
            'personal_info.email': email.toLowerCase()
        });

        if (existingUser) {
            console.log('User already exists:', email);
            return res.status(409).json({
                error: 'Email already exists'
            });
        }

        // Generate username from email
        const username = email.split('@')[0].toLowerCase();

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user object
        const user = new User({
            personal_info: {
                fullname: fullname.toLowerCase(),
                email: email.toLowerCase(),
                password: hashedPassword,
                username: username
            }
        });

        // Log the user object before saving
        console.log('Attempting to save user:', {
            fullname: user.personal_info.fullname,
            email: user.personal_info.email,
            username: user.personal_info.username
        });

        // Save user
        const savedUser = await user.save();
        console.log('User saved successfully:', savedUser._id);

        // Generate token
        const token = jwt.sign(
            { userId: savedUser._id }, 
            process.env.SECRET_ACCESS_KEY,
            { expiresIn: '24h' }
        );

        // Send response
        res.status(201).json({
            access_token: token,
            profile_img: savedUser.personal_info.profile_img,
            username: savedUser.personal_info.username,
            fullname: savedUser.personal_info.fullname
        });

    } catch (error) {
        console.error('Signup Error:', error);
        console.error('Error stack:', error.stack);
        
        // More detailed error response
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation error',
                details: Object.values(error.errors).map(err => err.message)
            });
        }
        
        if (error.code === 11000) {
            return res.status(409).json({
                error: 'Duplicate key error',
                details: 'Email or username already exists'
            });
        }

        res.status(500).json({
            error: 'Server error during signup',
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Handle process termination
process.on('SIGTERM', async () => {
    console.log('SIGTERM received');
    await mongoose.connection.close();
    process.exit(0);
});