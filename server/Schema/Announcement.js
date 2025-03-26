import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
        trim: true,
        minLength: [5, "Title must be at least 5 characters long"],
        maxLength: [100, "Title cannot exceed 100 characters"]
    },
    content: {
        type: String,
        required: [true, "Content is required"],
        trim: true,
        minLength: [10, "Content must be at least 10 characters long"]
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    department: {
        type: String,
        required: true,
        enum: [
            "Computer Science and Engineering",
            "Electronics and Communication",
            "Electrical and Electronics",
            "Civil Engineering",
            "Mechanical Engineering"
        ]
    },
    isImportant: {
        type: Boolean,
        default: false
    },
    attachments: [{
        name: String,
        url: String,
        type: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
announcementSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model("Announcement", announcementSchema); 