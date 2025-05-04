import jwt from 'jsonwebtoken';
import * as process from 'process';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized - No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Not authorized - Invalid token' });
    }
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(500).json({ message: 'Server error in authentication' });
  }
};

const isSeller = (req, res, next) => {
  if (req.user && req.user.role === 'seller') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as a seller' });
  }
};

const isBuyer = (req, res, next) => {
  if (req.user && req.user.role === 'buyer') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as a buyer' });
  }
};

export { protect, isSeller, isBuyer };