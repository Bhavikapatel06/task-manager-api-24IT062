const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * Validates JSON Web Tokens (JWT) passed in the Authorization header.
 * Attaches the decoded user payload to `req.user`.
 */
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access denied. Missing or malformed Authorization header. Expected format: "Bearer <token>".'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access denied. Token missing.'
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'supersecret_practical7_jwt_signing_key_2026_awdf';
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired. Please log in again to receive a fresh token.'
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token signature. Authentication failed.'
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed. Please log in.'
    });
  }
};

module.exports = auth;
