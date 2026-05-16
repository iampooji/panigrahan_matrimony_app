const router = require("express").Router();
const controller = require("../controllers/education.controller");
const authorize = require("../middlewares/roleauth.middleware");
const { PERMISSIONS } = require("../config/roles.config");

router.get(
  "/:profile_id",
  authorize(PERMISSIONS.PROFILE_VIEW),
  controller.list
);

router.post(
  "/:profile_id",
  authorize(PERMISSIONS.PROFILE_EDIT),
  controller.create
);

router.put(
  "/:id",
  authorize(PERMISSIONS.PROFILE_EDIT),
  controller.update
);

router.delete(
  "/:id",
  authorize(PERMISSIONS.PROFILE_EDIT),
  controller.remove
);

module.exports = router;