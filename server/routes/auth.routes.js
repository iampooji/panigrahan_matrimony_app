const router = require("express").Router();
const AuthController = require("../controllers/auth.controller");
const { requireAuth, adminCheck } = require("../middlewares/auth.middleware");

/* ── Public ── */
router.post("/login",           AuthController.login);
router.post("/forgot-password", AuthController.forgotPassword);

/* ── Protected ── */
router.post("/secret/verify",   requireAuth, AuthController.verifySecret);

/* ── Admin — User Management ── */
router.get("/admin/users",                requireAuth, adminCheck, AuthController.listUsers);
router.post("/admin/users",               requireAuth, adminCheck, AuthController.createUser);
router.put("/admin/users/:id/password",   requireAuth, adminCheck, AuthController.resetPassword);
router.put("/admin/users/:id/status",     requireAuth, adminCheck, AuthController.toggleStatus);

module.exports = router;