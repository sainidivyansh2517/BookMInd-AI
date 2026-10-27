const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not configured.');
  }
  return secret;
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Invalid authentication token structure.' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Authentication session expired. Please log in again.' });
    }
    if (error.message.includes('JWT_SECRET')) {
      console.error('CRITICAL: Server configuration error - missing JWT_SECRET');
      return res.status(500).json({ message: 'Authentication configuration error.' });
    }
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
};

module.exports = authMiddleware;
