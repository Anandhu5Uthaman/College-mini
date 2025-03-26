import express from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { validateCommentData } from '../middleware/validator.js';
import { commentLimiter } from '../middleware/rateLimiter.js';
import Comment from '../Schema/Comment.js';
import Blog from '../Schema/Blog.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Create a comment
router.post('/blogs/:blogId/comments', verifyJWT, commentLimiter, validateCommentData, async (req, res, next) => {
    try {
        const { blogId } = req.params;
        const { content } = req.body;
        const userId = req.user.userId;

        // Check if blog exists
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return next(new AppError('Blog not found', 404));
        }

        const comment = new Comment({
            content,
            author: userId,
            blog: blogId
        });

        await comment.save();

        // Update blog's comments array
        await Blog.findByIdAndUpdate(blogId, {
            $push: { comments: comment._id }
        });

        res.status(201).json({
            status: 'success',
            data: comment
        });
    } catch (error) {
        next(error);
    }
});

// Get all comments for a blog
router.get('/blogs/:blogId/comments', async (req, res, next) => {
    try {
        const { blogId } = req.params;
        const comments = await Comment.find({ blog: blogId })
            .populate('author', 'personal_info.fullname personal_info.username personal_info.profile_img')
            .sort({ createdAt: -1 });

        res.json({
            status: 'success',
            data: comments
        });
    } catch (error) {
        next(error);
    }
});

// Update a comment
router.put('/comments/:commentId', verifyJWT, validateCommentData, async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const userId = req.user.userId;

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return next(new AppError('Comment not found', 404));
        }

        // Check if user is the author
        if (comment.author.toString() !== userId) {
            return next(new AppError('Not authorized to update this comment', 403));
        }

        comment.content = content;
        comment.edited = true;
        await comment.save();

        res.json({
            status: 'success',
            data: comment
        });
    } catch (error) {
        next(error);
    }
});

// Delete a comment
router.delete('/comments/:commentId', verifyJWT, async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.userId;

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return next(new AppError('Comment not found', 404));
        }

        // Check if user is the author
        if (comment.author.toString() !== userId) {
            return next(new AppError('Not authorized to delete this comment', 403));
        }

        // Remove comment from blog's comments array
        await Blog.findByIdAndUpdate(comment.blog, {
            $pull: { comments: commentId }
        });

        await Comment.findByIdAndDelete(commentId);

        res.json({
            status: 'success',
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

export default router; 