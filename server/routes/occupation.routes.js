const router = require("express").Router();
const controller = require("../controllers/occupation.controller");
const authorize = require("../middlewares/roleauth.middleware");
const { PERMISSIONS } = require("../config/roles.config");

router.get(
  "/:parenttype/:parentid",
  authorize(PERMISSIONS.PROFILE_VIEW),
  controller.list
);

router.post(
  "/:parenttype/:parentid",
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
