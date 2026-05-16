const router = require("express").Router();
const controller = require("../controllers/enumtype.controller");
const { requireAuth } = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/roleauth.middleware");
const { PERMISSIONS } = require("../config/roles.config");

router.get(
  "/forms/:form",
  requireAuth,
  authorize(PERMISSIONS.PROFILE_VIEW),
  controller.getForForm
);

module.exports = router;
