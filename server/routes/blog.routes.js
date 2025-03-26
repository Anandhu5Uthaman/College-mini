import express from 'express';
import Blog from '../Schema/Blog.js';
import { verifyJWT } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure AWS S3
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Configure multer for blog image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'blog-images');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
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

// Get signed URL for image upload
router.get("/get-upload-url", verifyJWT, async (req, res) => {
    try {
        const fileName = `${uuidv4()}.jpg`; // Generate unique filename
        const bucketName = process.env.AWS_BUCKET_NAME;

        // Generate pre-signed URL
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            ContentType: 'image/jpeg'
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        res.json({
            uploadUrl,
            key: fileName
        });
    } catch (error) {
        console.error("Error generating upload URL:", error);
        res.status(500).json({
            error: "Failed to generate upload URL",
            message: error.message
        });
    }
});

// Get latest blogs with pagination
router.route('/latest-blogs')
    .get(async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const totalBlogs = await Blog.countDocuments({ draft: false });
            const totalPages = Math.ceil(totalBlogs / limit);

            const blogs = await Blog.find({ draft: false })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('author', 'personal_info')
                .select('title des banner activity tags createdAt');

            res.status(200).json({
                blogs,
                currentPage: page,
                totalPages,
                totalBlogs
            });
        } catch (error) {
            console.error('Error fetching latest blogs:', error);
            res.status(500).json({ error: 'Failed to fetch latest blogs' });
        }
    })
    .post(async (req, res) => {
        try {
            const { page = 1, limit = 10 } = req.body;
            const skip = (page - 1) * limit;

            const totalBlogs = await Blog.countDocuments({ draft: false });
            const totalPages = Math.ceil(totalBlogs / limit);

            const blogs = await Blog.find({ draft: false })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('author', 'personal_info')
                .select('title des banner activity tags createdAt');

            res.status(200).json({
                blogs,
                currentPage: page,
                totalPages,
                totalBlogs
            });
        } catch (error) {
            console.error('Error fetching latest blogs:', error);
            res.status(500).json({ error: 'Failed to fetch latest blogs' });
        }
    });

// Get trending blogs
router.get('/trending-blogs', async (req, res) => {
    try {
        const blogs = await Blog.find({ draft: false })
            .sort({ 'activity.total_reads': -1 })
            .limit(5)
            .populate('author', 'personal_info')
            .select('title des banner activity tags createdAt');

        res.status(200).json(blogs);
    } catch (error) {
        console.error('Error fetching trending blogs:', error);
        res.status(500).json({ error: 'Failed to fetch trending blogs' });
    }
});

// Get blog by ID
router.get('/blog/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id)
            .populate('author', 'personal_info')
            .populate({
                path: 'comments',
                populate: {
                    path: 'author',
                    select: 'personal_info'
                }
            });

        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        // Increment read count
        blog.activity.total_reads += 1;
        await blog.save();

        res.status(200).json(blog);
    } catch (error) {
        console.error('Error fetching blog:', error);
        res.status(500).json({ error: 'Failed to fetch blog' });
    }
});

// Create new blog
router.post('/create-blog', verifyJWT, async (req, res) => {
    try {
        const { title, des, banner, content, tags, draft = false } = req.body;
        
        const blog = new Blog({
            title,
            des,
            banner,
            content,
            tags,
            author: req.user._id,
            draft
        });

        await blog.save();
        res.status(201).json(blog);
    } catch (error) {
        console.error('Error creating blog:', error);
        res.status(500).json({ error: 'Failed to create blog' });
    }
});

// Search blogs
router.post("/search-blogs", async (req, res) => {
    try {
        const { query, page = 1, limit = 10 } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: "Search query is required" });
        }

        const searchRegex = new RegExp(query, 'i');
        
        const blogs = await Blog.find({
            $or: [
                { title: searchRegex },
                { "content.blocks.text": searchRegex },
                { tags: searchRegex }
            ],
            draft: false,
            isPublished: true
        })
        .populate('author', 'personal_info.fullname personal_info.profile_img personal_info.username')
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

        const total = await Blog.countDocuments({
            $or: [
                { title: searchRegex },
                { "content.blocks.text": searchRegex },
                { tags: searchRegex }
            ],
            draft: false,
            isPublished: true
        });

        res.json({
            blogs,
            total,
            hasMore: total > page * limit
        });

    } catch (error) {
        console.error('Blog search error:', error);
        res.status(500).json({ 
            error: "Failed to search blogs",
            details: error.message 
        });
    }
});

// Get blogs with filters
router.post("/get-blogs", async (req, res) => {
    try {
        const { page = 1, draft = false, tag, author, search, limit = 10 } = req.body;
        
        if (!page || page < 1) {
            return res.status(400).json({ error: "Invalid page number" });
        }

        const skip = (page - 1) * limit;
        let query = { draft };
        
        if (tag) {
            query.tags = tag;
        }
        if (author) {
            query.author = author;
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { des: { $regex: search, $options: 'i' } }
            ];
        }

        const [blogs, total] = await Promise.all([
            Blog.find(query)
                .populate("author", "personal_info")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Blog.countDocuments(query)
        ]);

        return res.status(200).json({
            blogs,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        console.error("Error fetching blogs:", error);
        return res.status(500).json({ 
            error: "Failed to fetch blogs",
            message: error.message 
        });
    }
});

// Like/Unlike blog
router.post("/like/:id", verifyJWT, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }

        const userId = req.user.id;
        const isLiked = blog.likes.includes(userId);

        if (isLiked) {
            blog.likes.pull(userId);
        } else {
            blog.likes.push(userId);
        }

        await blog.save();
        return res.status(200).json({ likes: blog.likes.length, isLiked: !isLiked });
    } catch (error) {
        console.error("Like blog error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Get total blog count
router.post('/all-latest-blogs-count', async (req, res) => {
    try {
        const totalDocs = await Blog.countDocuments({ draft: false });
        res.json({ totalDocs });
    } catch (error) {
        console.error('Error getting blog count:', error);
        res.status(500).json({ error: 'Failed to get blog count' });
    }
});

// Upload banner image
router.post('/upload-banner', verifyJWT, (req, res) => {
    console.log('Banner upload request received');
    
    upload.single('banner')(req, res, (err) => {
        if (err) {
            console.error('Banner upload error:', err);
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        error: 'File size is too large. Maximum size is 5MB'
                    });
                }
                return res.status(400).json({
                    error: err.message
                });
            }
            return res.status(500).json({
                error: 'Failed to upload banner',
                details: err.message
            });
        }

        if (!req.file) {
            console.error('No file received in request');
            return res.status(400).json({
                error: 'No file uploaded'
            });
        }

        console.log('File received:', {
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        // Construct the URL path for the uploaded file
        const imageUrl = `/uploads/blog-images/${req.file.filename}`;

        console.log('Generated image URL:', imageUrl);

        res.json({
            success: true,
            message: 'Banner uploaded successfully',
            imageUrl: imageUrl
        });
    });
});

// Upload blog content image
router.post('/upload-image', verifyJWT, (req, res) => {
    console.log('Image upload request received');
    
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error('Image upload error:', err);
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        error: 'File size is too large. Maximum size is 5MB'
                    });
                }
                return res.status(400).json({
                    error: err.message
                });
            }
            return res.status(500).json({
                error: 'Failed to upload image',
                details: err.message
            });
        }

        if (!req.file) {
            console.error('No file received in request');
            return res.status(400).json({
                error: 'No file uploaded'
            });
        }

        console.log('File received:', {
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        // Construct the URL path for the uploaded file
        const imageUrl = `/uploads/blog-images/${req.file.filename}`;

        console.log('Generated image URL:', imageUrl);

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl: imageUrl
        });
    });
});

export default router; 