const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");
const { User } = require("../models");

exports.login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error("Invalid credentials");

  if (user.status === "INACTIVE")
    throw new Error("Your account has been deactivated. Please contact your admin.");

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new Error("Invalid credentials");

  return jwt.sign({
    id:    user.id,
    role:  user.role,
    orgid: user.orgid
  }, process.env.JWT_SECRET, { expiresIn: "7d" });
};