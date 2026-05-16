const bcrypt = require("bcrypt");
const { User } = require("../models");

/* ── List all staff users (role != 99) ── */
exports.listUsers = async () => {
  return User.findAll({
    attributes: ["id", "email", "role", "status", "created_at"],
    order: [["created_at", "DESC"]]
  });
};

/* ── Create new staff user ── */
exports.createUser = async ({ email, password }, orgid) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) throw new Error("Email already exists");

  const password_hash = await bcrypt.hash(password, 10);

  return User.create({
    email,
    password_hash,
    role: 1, // staff by default
    status: "ACTIVE",
    orgid
  });
};

/* ── Reset a user's password ── */
exports.resetPassword = async (id, newPassword) => {
  const user = await User.findByPk(id);
  if (!user) throw new Error("User not found");

  const password_hash = await bcrypt.hash(newPassword, 10);
  await user.update({ password_hash });
  return true;
};

/* ── Toggle user status ACTIVE <-> INACTIVE ── */
exports.toggleStatus = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw new Error("User not found");
  if (user.role === 99) throw new Error("Cannot modify admin status");

  const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await user.update({ status: newStatus });
  return newStatus;
};