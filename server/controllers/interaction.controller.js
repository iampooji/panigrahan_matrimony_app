const service = require("../services/interaction.service");
const { ProfileTask, ProfileInteraction, Profile } = require("../models");

/* ---------------- HELPERS ---------------- */

/**
 * Safely format any date value to yyyy-MM-dd string for MySQL
 */
const toDateString = (val) => {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
};

/* ---------------- INTERACTIONS ---------------- */

exports.create = async (req, res) => {
  try {
    const row = await service.createInteraction({
      ...req.body,
      userid: req.user.id,
      orgid: req.user.orgid,
    });
    res.json(row);
  } catch (err) {
    console.error("create interaction error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const rows = await service.listByProfile(req.params.profileid);
    res.json(rows);
  } catch (err) {
    console.error("list interactions error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.search = async (req, res) => {
  try {
    const { from, to, profileid, staffid, status } = req.query;
    const orgid = req.user.orgid;

    const rows = await service.search({
      from:      toDateString(from),
      to:        toDateString(to),
      profileid,
      staffid,
      orgid,
      status
    });

    // Guard: if no interactions found, return early with empty tasks
    if (!rows.length) {
      return res.json([]);
    }

    const profileIds = [...new Set(rows.map(r => r.profileid).filter(Boolean))];

    // Guard: skip task fetch if no valid profileIds
    const tasks = profileIds.length > 0
      ? await ProfileTask.findAll({
          where: { profileid: profileIds, is_deleted: 0 },
          attributes: ["id", "profileid", "interactionid", "description", "status", "createdby"]
        })
      : [];

    const tasksByProfile = {};
    tasks.forEach(t => {
      if (!tasksByProfile[t.profileid]) tasksByProfile[t.profileid] = [];
      tasksByProfile[t.profileid].push(t);
    });

    const enrichedRows = rows.map(r => ({
      ...(r.toJSON ? r.toJSON() : r),
      tasks: tasksByProfile[r.profileid] || []
    }));

    res.json(enrichedRows);
  } catch (err) {
    console.error("search interactions error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.updateInteractionDate = async (req, res) => {
  try {
    const { id } = req.params;
    const { createdat } = req.body;
    await service.updateInteractionDate(id, createdat);
    const updated = await ProfileInteraction.findByPk(id);
    res.json(updated);
  } catch (err) {
    console.error("update interaction date error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/* ---------------- PROFILE EXISTS CHECK ---------------- */

exports.checkProfileExists = async (req, res) => {
  try {
    const { profileid } = req.params;
    const profile = await Profile.findByPk(profileid);
    res.json({ exists: !!profile });
  } catch (err) {
    console.error("check profile exists error:", err.message);
    res.status(500).json({ exists: false, error: err.message });
  }
};

/* ---------------- TASKS ---------------- */

exports.createTask = async (req, res) => {
  try {
    const row = await service.createTask({
      ...req.body,
      createdby: req.user.id,
      orgid: req.user.orgid,
    });
    res.json(row);
  } catch (err) {
    console.error("create task error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.tasks = async (req, res) => {
  try {
    const rows = await service.listTasks(req.params.profileid);
    res.json(rows);
  } catch (err) {
    console.error("list tasks error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.searchTasks = async (req, res) => {
  try {
    const { from, to, profileid, staffid, status, notes } = req.query;
    const orgid = req.user.orgid;

    const rows = await service.searchTasks({
      from:      toDateString(from),
      to:        toDateString(to),
      profileid,
      staffid,
      status,
      notes,
      orgid
    });

    res.json(rows);
  } catch (err) {
    console.error("search tasks error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, duedate } = req.body;
    await service.updateTask(id, { status, reason, duedate });
    const updated = await ProfileTask.findByPk(id);
    res.json(updated);
  } catch (err) {
    console.error("update task error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/* ---------------- SOFT DELETE TASK + RELATED INTERACTIONS ---------------- */

exports.softDeleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await ProfileTask.findByPk(id);
    if (!task) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    await ProfileTask.update(
      { is_deleted: 1 },
      { where: { id } }
    );

    // Soft delete the linked interaction if interactionid is set
    if (task.interactionid) {
      await ProfileInteraction.update(
        { is_deleted: 1 },
        { where: { id: task.interactionid } }
      );
    }

    res.json({ success: true, message: "Task and related interaction archived." });
  } catch (err) {
    console.error("soft delete task error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ---------------- SOFT DELETE STANDALONE INTERACTION ---------------- */

exports.softDeleteInteraction = async (req, res) => {
  try {
    const { id } = req.params;

    const interaction = await ProfileInteraction.findByPk(id);
    if (!interaction) {
      return res.status(404).json({ success: false, error: "Interaction not found" });
    }

    await ProfileInteraction.update(
      { is_deleted: 1 },
      { where: { id } }
    );

    res.json({ success: true, message: "Interaction archived." });
  } catch (err) {
    console.error("soft delete interaction error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};