const router = require("express").Router();
const controller = require("../controllers/address.controller");
const authorize = require("../middlewares/roleauth.middleware");
const { PERMISSIONS } = require("../config/roles.config");

/* ── Distinct cities (for preference dropdowns) ── */
router.get(
  "/cities",
  authorize(PERMISSIONS.PROFILE_VIEW),
  controller.getCities
);

/* ── Profile addresses ── */
router.get(
  "/profile/:profileid",
  authorize(PERMISSIONS.PROFILE_VIEW),
  controller.getForProfile
);

router.post(
  "/profile/:profileid",
  authorize(PERMISSIONS.PROFILE_EDIT),
  controller.saveForProfile
);

// Bulk save — handles same-as-current by sharing one address row
router.post(
  "/profile/:profileid/bulk",
  authorize(PERMISSIONS.PROFILE_EDIT),
  controller.saveBulkForProfile
);

router.put(
  "/profile/:profileid",
  authorize(PERMISSIONS.PROFILE_EDIT),
  controller.editForProfile
);

// Edit merged current+permanent — creates one row, points both FKs at it
// Or splits into two if user unchecked "same as current"
router.put(
  "/profile/:profileid/merged",
  authorize(PERMISSIONS.PROFILE_EDIT),
  controller.editMergedForProfile
);

/* ── Family addresses ── */
router.get(
  "/family/:familyid",
  authorize(PERMISSIONS.PROFILE_VIEW),
  controller.getForFamily
);

router.post(
  "/family/:familyid",
  authorize(PERMISSIONS.PROFILE_EDIT),
  controller.saveForFamily
);

// Bulk save for family
router.post(
  "/family/:familyid/bulk",
  authorize(PERMISSIONS.PROFILE_EDIT),
  controller.saveBulkForFamily
);

router.put(
  "/family/:familyid",
  authorize(PERMISSIONS.PROFILE_EDIT),
  controller.editForFamily
);

// Edit merged current+permanent for family
router.put(
  "/family/:familyid/merged",
  authorize(PERMISSIONS.PROFILE_EDIT),
  controller.editMergedForFamily
);

module.exports = router;