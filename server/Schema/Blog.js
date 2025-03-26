import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
        minLength: [3, "Title must be at least 3 characters long"]
    },
    banner: {
        type: String,
        default: ""
    },
    des: {
        type: String,
        required: [true, "Description is required"],
        minLength: [10, "Description must be at least 10 characters long"]
    },
    content: {
        type: String,
        required: [true, "Content is required"]
    },
    tags: {
        type: [String],
        default: []
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    activity: {
        total_likes: {
            type: Number,
            default: 0
        },
        total_comments: {
            type: Number,
            default: 0
        },
        total_reads: {
            type: Number,
            default: 0
        },
        total_parent_comments: {
            type: Number,
            default: 0
        }
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    draft: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Add text indexes for search
blogSchema.index({ title: 'text', des: 'text', content: 'text' });

export default mongoose.model('Blog', blogSchema);