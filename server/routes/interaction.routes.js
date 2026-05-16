const router = require("express").Router();
const controller = require("../controllers/interaction.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

/* ---------------- INTERACTIONS ---------------- */
router.post("/", requireAuth, controller.create);
router.get("/search", requireAuth, controller.search);
router.patch("/:id/update", requireAuth, controller.updateInteractionDate);
router.patch("/:id/soft-delete", requireAuth, controller.softDeleteInteraction);

/* ---------------- TASKS ---------------- */
router.post("/task", requireAuth, controller.createTask);
router.get("/task/:profileid", requireAuth, controller.tasks);
router.get("/tasks/search", requireAuth, controller.searchTasks);
router.post("/tasks/:id/update", requireAuth, controller.updateTask);
router.patch("/tasks/:id/soft-delete", requireAuth, controller.softDeleteTask);

/* ---------------- PROFILE EXISTS CHECK ---------------- */
router.get("/profiles/:profileid/exists", requireAuth, controller.checkProfileExists);

/* ---------------- PROFILE INTERACTIONS ---------------- */
router.get("/:profileid", requireAuth, controller.list);

module.exports = router;