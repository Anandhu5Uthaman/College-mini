import express from 'express';
import bcrypt from 'bcrypt';
import User from '../Schema/User.js';
import { generateUsername } from '../utils/username-generator.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        let { personal_info } = req.body;

        // Validate required fields
        if (!personal_info.email || !personal_info.password || !personal_info.fullname || !personal_info.role || !personal_info.department) {
            return res.status(400).json({ error: "All required fields must be filled" });
        }

        // Validate email domain
        if (!personal_info.email.endsWith('@gecidukki.ac.in')) {
            return res.status(400).json({ error: "Must use @gecidukki.ac.in email" });
        }

        // Check if email already exists
        const emailExists = await User.findOne({ 'personal_info.email': personal_info.email });
        if (emailExists) {
            return res.status(400).json({ error: "Email already exists" });
        }

        // Validate role-specific requirements
        if ((personal_info.role === 'Student' || personal_info.role === 'Alumni') && !personal_info.ktu_id) {
            return res.status(400).json({ error: "KTU ID is required for students and alumni" });
        }

        if (personal_info.role === 'Alumni' && !personal_info.passout_year) {
            return res.status(400).json({ error: "Passout year is required for alumni" });
        }

        // Validate KTU ID format for students and alumni
        if ((personal_info.role === 'Student' || personal_info.role === 'Alumni') && 
            !personal_info.ktu_id.match(/^(IDK|LIDK)[0-9A-Z]+$/)) {
            return res.status(400).json({ error: "Invalid KTU ID format" });
        }

        // Validate passout year for alumni
        if (personal_info.role === 'Alumni') {
            const currentYear = new Date().getFullYear();
            const passoutYear = parseInt(personal_info.passout_year);
            if (passoutYear < 1995 || passoutYear > currentYear) {
                return res.status(400).json({ error: "Invalid passout year" });
            }
        }

        // Generate username if not provided
        if (!personal_info.username) {
            personal_info.username = generateUsername(personal_info.fullname);
        }

        // Check if username already exists
        const usernameExists = await User.findOne({ 'personal_info.username': personal_info.username });
        if (usernameExists) {
            return res.status(400).json({ error: "Username already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        personal_info.password = await bcrypt.hash(personal_info.password, salt);

        // Create new user
        const user = new User({
            personal_info: {
                ...personal_info,
                profile_img: `https://api.dicebear.com/6.x/avataaars/svg?seed=${personal_info.username}`
            }
        });

        // Save user
        await user.save();

        res.status(200).json({
            success: true,
            message: "Account created successfully"
        });

    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ error: messages[0] });
        }
        res.status(500).json({ error: "Error creating account" });
    }
});

export default router; 