import express from "express";
import connectDB from "./config/db.js";
import cors from "cors";
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';

// Schema imports
import User from './Schema/User.js';
import Blog from './Schema/Blog.js';
import Comment from './Schema/Comment.js';
import Notification from './Schema/Notification.js';

// Route imports
import userRoutes from './routes/user.routes.js';
import blogRoutes from './routes/blog.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import commentRoutes from './routes/comment.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import componentRoutes from './routes/component.routes.js';

// Middleware imports
import { auth } from './middleware/auth.js';
import { globalLimiter, authLimiter, blogLimiter, commentLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { validateSignupData, validateBlogData, validateCommentData } from './middleware/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv at the start
dotenv.config();

// Validate essential environment variables
const requiredEnvVars = ['MONGODB_URI', 'SECRET_ACCESS_KEY'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`Error: ${envVar} is not set in environment variables`);
        process.exit(1);
    }
}

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

// Create required directories
const uploadDirs = [
    path.join(__dirname, 'public'),
    path.join(__dirname, 'public', 'uploads'),
    path.join(__dirname, 'public', 'uploads', 'profile-images'),
    path.join(__dirname, 'public', 'uploads', 'blog-images')
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
    }
});

// CORS Configuration
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Handle preflight requests
app.options('*', cors());

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    next();
});

// Health check route
app.get('/health', (req, res) => {
    try {
        const dbState = mongoose.connection.readyState;
        res.json({
            status: 'ok',
            db_connected: dbState === 1,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Error handler for rate limit exceeded
const rateLimitExceededHandler = (req, res, next) => {
    if (req.rateLimit && req.rateLimit.remaining === 0) {
        return res.status(429).json({
            error: 'Rate limit exceeded',
            details: `Please try again after ${Math.ceil(req.rateLimit.resetTime / 1000 / 60)} minutes`,
            resetTime: req.rateLimit.resetTime
        });
    }
    next();
};

// Apply rate limiting
app.use(globalLimiter);
app.use(rateLimitExceededHandler);
app.use('/api/login', authLimiter);
app.use('/api/signup', authLimiter);
app.use('/api/blogs/create', blogLimiter);
app.use('/api/blogs/:blogId/comments', commentLimiter);

// Serve static files with detailed logging
app.use('/uploads', (req, res, next) => {
    console.log('Static file request:', {
        url: req.url,
        method: req.method,
        headers: req.headers
    });
    
    const staticPath = path.join(__dirname, 'public', 'uploads');
    const filePath = path.join(staticPath, req.url);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
        console.log('File found:', filePath);
        express.static(staticPath)(req, res, next);
    } else {
        console.error('File not found:', filePath);
        res.status(404).json({
            error: 'File not found',
            path: req.url
        });
    }
});

// General static file serving
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`, {
        contentType: req.headers['content-type'],
        authorization: req.headers['authorization'] ? 'Present' : 'Missing'
    });
    next();
});

// API routes
app.use('/api', [
    userRoutes,
    blogRoutes,
    notificationRoutes,
    commentRoutes,
    uploadRoutes,
    componentRoutes
]);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    
    // Handle Multer errors
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File size is too large. Maximum size is 5MB'
            });
        }
        return res.status(400).json({
            error: err.message || 'File upload error'
        });
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: err.message
        });
    }

    // Handle file type validation errors
    if (err.message && err.message.includes('file type')) {
        return res.status(400).json({
            error: err.message
        });
    }

    // Generic error response
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Handle 404 routes
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Static files are being served from: ${path.join(__dirname, 'public')}`);
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
});