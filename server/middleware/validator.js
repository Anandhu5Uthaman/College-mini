import { AppError } from './errorHandler.js';

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@gecidukki\.ac\.in$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    return password.length >= 6;
};

export const validateSignupData = (req, res, next) => {
    const { fullname, email, password, role, department, ktu_id, phone } = req.body;
    const errors = [];

    // Fullname validation
    if (!fullname || fullname.trim().length < 3) {
        errors.push('Fullname must be at least 3 characters long');
    }

    // Email validation
    if (!email || !email.endsWith('@gecidukki.ac.in')) {
        errors.push('Must use a valid @gecidukki.ac.in email address');
    }

    // Password validation
    if (!password || password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }
    if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
        errors.push('Password must contain at least one number, one lowercase and one uppercase letter');
    }

    // Role validation
    if (!role || !['Student', 'Teacher'].includes(role)) {
        errors.push('Role must be either Student or Teacher');
    }

    // Department validation
    const validDepartments = [
        'Computer Science and Engineering',
        'Electronics and Communication',
        'Electrical and Electronics',
        'Civil Engineering',
        'Mechanical Engineering',
        'Information Technology'
    ];
    if (!department || !validDepartments.includes(department)) {
        errors.push('Please select a valid department');
    }

    // KTU ID validation
    if (!ktu_id) {
        errors.push('KTU ID is required');
    }

    // Phone number validation
    if (!phone || !phone.match(/^\+91[0-9]{10}$/)) {
        errors.push('Phone number must start with +91 followed by 10 digits');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors
        });
    }

    next();
};

export const validateBlogData = (req, res, next) => {
    const { title, content, tags } = req.body;

    if (!title || !content) {
        return next(new AppError('Title and content are required', 400));
    }

    if (title.length < 5) {
        return next(new AppError('Title must be at least 5 characters long', 400));
    }

    if (content.length < 100) {
        return next(new AppError('Content must be at least 100 characters long', 400));
    }

    if (tags && !Array.isArray(tags)) {
        return next(new AppError('Tags must be an array', 400));
    }

    next();
};

export const validateCommentData = (req, res, next) => {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
        return next(new AppError('Comment content is required', 400));
    }

    if (content.length > 500) {
        return next(new AppError('Comment must not exceed 500 characters', 400));
    }

    next();
}; 