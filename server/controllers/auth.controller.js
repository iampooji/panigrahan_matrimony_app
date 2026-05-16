const AuthService  = require("../services/auth.service");
const adminService = require("../services/admin.service");

exports.login = async (req, res) => {
  try {
    const token = await AuthService.login(req.body);
    res.json({ token });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  res.json({ message: "Reset link sent" });
};

/* ── Admin — User Management ── */
const validatePassword = (pwd) => {
  if (!pwd || pwd.length < 6)  return "Password must be at least 6 characters";
  if (!/[0-9]/.test(pwd))      return "Must include at least one number";
  return null;
};

exports.listUsers = async (req, res) => {
  try {
    const users = await adminService.listUsers();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { password } = req.body;
    const pwdError = validatePassword(password);
    if (pwdError) return res.status(400).json({ success: false, message: pwdError });
    const user = await adminService.createUser(req.body, req.user.orgid);
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const pwdError = validatePassword(password);
    if (pwdError) return res.status(400).json({ success: false, message: pwdError });
    await adminService.resetPassword(req.params.id, password);
    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const newStatus = await adminService.toggleStatus(req.params.id);
    res.json({ success: true, status: newStatus });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.verifySecret = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, message: "Password required" });

    const user = await require("../models").User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const match = await require("bcrypt").compare(password, user.password_hash);
    if (!match) return res.status(401).json({ success: false, message: "Incorrect password" });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};