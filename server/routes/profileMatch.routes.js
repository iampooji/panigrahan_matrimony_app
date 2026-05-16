const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth.middleware");
const controller = require("../controllers/profileMatch.controller");

router.post("/share", requireAuth, controller.share);
router.get("/match", requireAuth, controller.match);
router.get("/:profileId/interactions", controller.getInteractions);
router.post("/status", controller.setStatus);
router.post("/:profileId/reject/", controller.rejectProfile);

module.exports = router;