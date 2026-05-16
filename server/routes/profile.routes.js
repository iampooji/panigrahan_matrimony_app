const express    = require("express");
const router     = express.Router();
const authorize  = require("../middlewares/roleauth.middleware");
const { requireAuth } = require("../middlewares/auth.middleware");
const { PERMISSIONS }  = require("../config/roles.config");

const controller     = require("../controllers/profile.controller");
const prefcontroller = require("../controllers/profilePreference.controller");
const matchcontroller = require("../controllers/profileMatch.controller");

router.post("/", requireAuth, authorize(PERMISSIONS.PROFILE_CREATE), controller.create);

router.get("/",        controller.list);
router.get("/:id",     controller.get);
router.put("/:id",     controller.update);
router.delete("/:id",  controller.remove);

router.get("/stats/active-by-gender", requireAuth, controller.activeCountByGender);
router.post("/search",                requireAuth, controller.search);
router.post("/:id/profile-picture",   requireAuth, controller.setProfilePicture);

// Admin routes
router.get("/admin/stats",    requireAuth, controller.getAdminStats);
router.get("/admin/list",     requireAuth, controller.listForAdmin);
router.get("/admin/activity", requireAuth, controller.getStaffActivity);

router.post("/:id/changests",
  requireAuth,
  authorize(PERMISSIONS.PROFILE_EDIT),
  controller.changests
);

// Plan
router.post("/:id/plan",         requireAuth, controller.assignPlan);
router.post("/:id/plan/confirm", requireAuth, controller.confirmPayment);
router.get("/:id/plans",         requireAuth, controller.getPlanHistory);

// Family
router.get("/:id/family",         requireAuth, controller.listFamily);
router.post("/:id/family",        requireAuth, controller.addFamily);
router.put("/family/:familyId",   requireAuth, controller.updateFamily);
router.delete("/family/:familyId",requireAuth, controller.deleteFamily);

// Preferences
router.get("/:id/preferences",  requireAuth, prefcontroller.get);
router.post("/:id/preferences", requireAuth, prefcontroller.save);

// Match
router.get("/:id/match", requireAuth, matchcontroller.match);

// Secret box — all authenticated users
router.post("/secret/verify",            requireAuth, controller.verifySecretPassword);
router.delete("/secret/notes/:noteId",   requireAuth, controller.hideSecretNote);
router.get("/:id/secret/notes",          requireAuth, controller.getSecretNotes);
router.post("/:id/secret/notes",         requireAuth, controller.addSecretNote);

module.exports = router;