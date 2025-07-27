const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Token is not valid. User not found.' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Account is deactivated.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token has expired.' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error during authentication.' 
    });
  }
};

// Admin authorization middleware
const adminAuth = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required.' 
      });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
      return res.status(403).json({ 
        message: 'Admin access required.' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error during authorization.' 
    });
  }
};

// Super admin authorization middleware
const superAdminAuth = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required.' 
      });
    }

    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({ 
        message: 'Super admin access required.' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error during authorization.' 
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

// Customer type authorization (for institutional customers)
const institutionalAuth = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required.' 
      });
    }

    const institutionalTypes = ['hospital', 'clinic', 'dental_clinic', 'laboratory', 'ngo', 'government'];
    
    if (!institutionalTypes.includes(req.user.customerType)) {
      return res.status(403).json({ 
        message: 'Institutional customer access required.' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error during authorization.' 
    });
  }
};

// Verify email middleware
const verifiedEmailAuth = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required.' 
      });
    }

    if (!req.user.isVerified) {
      return res.status(403).json({ 
        message: 'Email verification required.' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error during verification check.' 
    });
  }
};

// Role-based authorization middleware factory
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions.' 
      });
    }

    next();
  };
};

// Check if user owns resource or is admin
const ownerOrAdmin = (resourceOwnerField = 'customer') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          message: 'Authentication required.' 
        });
      }

      // Admin can access everything
      if (req.user.role === 'admin' || req.user.role === 'superAdmin') {
        return next();
      }

      // For routes with resource ID in params
      if (req.params.id) {
        const Model = req.baseUrl.includes('orders') ? require('../models/Order') :
                    req.baseUrl.includes('reviews') ? require('../models/Review') :
                    null;

        if (Model) {
          const resource = await Model.findById(req.params.id);
          if (!resource) {
            return res.status(404).json({ message: 'Resource not found.' });
          }

          if (!resource[resourceOwnerField].equals(req.user._id)) {
            return res.status(403).json({ 
              message: 'Access denied. You can only access your own resources.' 
            });
          }
        }
      }

      next();
    } catch (error) {
      res.status(500).json({ 
        message: 'Server error during ownership verification.' 
      });
    }
  };
};

module.exports = {
  auth,
  adminAuth,
  superAdminAuth,
  optionalAuth,
  institutionalAuth,
  verifiedEmailAuth,
  authorize,
  ownerOrAdmin
};