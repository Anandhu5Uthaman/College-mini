import rateLimit from 'express-rate-limit';
import { AppError } from './errorHandler.js';

// Global rate limiter - applies to all routes
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Increased from 100 to 200
    message: {
        error: 'Too many requests',
        details: 'Please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Auth routes rate limiter - more lenient during development
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes (changed from 1 hour)
    max: 50, // Increased from 5 to 50 requests per window
    message: {
        error: 'Too many authentication attempts',
        details: 'Please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: true // Don't count failed requests
});

// Blog creation rate limiter
export const blogLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Increased from 10 to 20
    message: {
        error: 'Too many blog posts',
        details: 'Please try again after an hour'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Comment rate limiter
export const commentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Increased from 20 to 30
    message: {
        error: 'Too many comments',
        details: 'Please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});