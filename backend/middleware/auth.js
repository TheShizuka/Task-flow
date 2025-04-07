const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    console.log('Verifying token...');
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified successfully. User ID:', decoded.id);
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp <= currentTime) {
      console.log('Token has expired');
      return res.status(401).json({ message: 'Token has expired' });
    }

    // Check if user still exists
    console.log('Finding user in database...');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('User found, proceeding with request');
    
    // Add user to request
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email
    };
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = auth;