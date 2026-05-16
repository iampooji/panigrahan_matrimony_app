const jwt = require("jsonwebtoken");
const { ROLES } = require("../config/roles.config");

/**
 * Token verification middleware
 * Extracts and validates JWT token from Authorization header
 * Sets req.user with decoded token data
 */
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      success: false,
      message: "No token provided" 
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      message: "Invalid or expired token" 
    });
  }
};

/**
 * Admin role check middleware
 * Must be used AFTER requireAuth middleware
 * Verifies that req.user has admin role (99)
 */
const adminCheck = (req, res, next) => {
  if (!req.user || req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ 
      success: false,
      message: "Admin access required" 
    });
  }
  next();
};

module.exports = {
  requireAuth,
  adminCheck
};