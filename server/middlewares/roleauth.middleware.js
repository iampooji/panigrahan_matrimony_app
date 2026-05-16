/* server/middlewares/roleauth.middleware.js
const { ROLE_PERMISSIONS } = require("../config/roles.config");

const authorize = (requiredPermission) => {
  return (req, res, next) => {
    const role = req.user?.role;

    const permissions = ROLE_PERMISSIONS[role] || [];

    if (!permissions.includes(requiredPermission)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
};

module.exports = authorize;
*/

const { ROLE_PERMISSIONS } = require("../config/roles.config");

const authorize = (requiredPermission) => {
  return (req, res, next) => {
    const role = req.user?.role;
    
    const permissions = ROLE_PERMISSIONS[parseInt(role)] || ROLE_PERMISSIONS[role] || [];

    if (!permissions.includes(requiredPermission)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
};

module.exports = authorize;