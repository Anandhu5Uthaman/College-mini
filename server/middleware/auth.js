import jwt from 'jsonwebtoken';

export const verifyJWT = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        // Log headers for debugging
        console.log('Auth Headers:', {
            authorization: authHeader ? `${authHeader.substring(0, 20)}...` : 'none',
            'content-type': req.headers['content-type']
        });
        
        if (!authHeader) {
            return res.status(401).json({ 
                error: "Authentication required",
                message: "No authorization header found"
            });
        }

        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: "Invalid token format",
                message: "Authorization header must start with Bearer"
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                error: "No token provided",
                message: "Token is required for authentication"
            });
        }

        try {
            // Use JWT_SECRET instead of SECRET_ACCESS_KEY
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token verification successful. User ID:', decoded.id);
            req.user = decoded;
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    error: "Token expired",
                    message: "Please login again"
                });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ 
                    error: "Invalid token",
                    message: "Token validation failed"
                });
            }
            throw error;
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ 
            error: "Authentication error",
            message: "An error occurred during authentication"
        });
    }
};

// Alias for backward compatibility
export const auth = verifyJWT;