import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { verifyJWT } from '../middleware/auth.js';
import User from '../Schema/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'profile-images');
        // Ensure directory exists
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, JPG and PNG files are allowed.'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Upload profile image
router.post('/upload-image', verifyJWT, (req, res, next) => {
    console.log('Upload request received:', {
        contentType: req.headers['content-type'],
        userId: req.user?.id
    });

    upload.single('profile_image')(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            return next(err);
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('File uploaded successfully:', {
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        // Construct the URL path for the uploaded file
        const imageUrl = `/uploads/profile-images/${req.file.filename}`;

        res.json({
            success: true,
            message: 'File uploaded successfully',
            imageUrl: imageUrl
        });
    });
});

export default router;