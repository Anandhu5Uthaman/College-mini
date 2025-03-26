import express from 'express';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

// Route to serve user navigation component
router.get('/components/user-navigation', verifyJWT, (req, res) => {
    try {
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to serve blog editor component
router.get('/components/blog-editor', verifyJWT, (req, res) => {
    try {
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to serve publish form component
router.get('/components/publish-form', verifyJWT, (req, res) => {
    try {
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to serve loader component
router.get('/components/loader', (req, res) => {
    try {
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to serve input component
router.get('/components/input', (req, res) => {
    try {
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to serve blog post component
router.get('/components/blog-post', (req, res) => {
    try {
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to serve notification component
router.get('/components/notification', verifyJWT, (req, res) => {
    try {
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router; 