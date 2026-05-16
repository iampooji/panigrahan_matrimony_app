const profileService = require("../services/profile.service");
const familyService  = require("../services/familydetail.service");
const planService    = require("../services/plan.service");
const { Attachment } = require("../models");

exports.create = async (req, res) => {
  try {
    const result = await profileService.create(req.body, req.user.id);

    //  handle validation response
    if (result?.field) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  const profiles = await profileService.findAll();
  res.json(profiles);
};

exports.changests = async (req, res) => {
  try {
    const { sts } = req.body;
    const profile = await profileService.update(req.params.id, { profilests: sts }, req.user.id);
    if (!profile) return res.sendStatus(404);
    res.json(profile);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  const profile = await profileService.findById(req.params.id, req.user?.role);
  if (!profile) return res.sendStatus(404);
  res.json(profile);
};

exports.update = async (req, res) => {
  const result = await profileService.update(
    req.params.id,
    req.body,
    req.user.id
  );

  if (!result) return res.sendStatus(404);

  //  handle validation error
  if (result?.field) {
    return res.status(400).json(result);
  }

  res.json(result);
};

exports.remove = async (req, res) => {
  const ok = await profileService.remove(req.params.id);
  if (!ok) return res.sendStatus(404);
  res.sendStatus(204);
};

exports.activeCountByGender = async (req, res) => {
  const rows = await profileService.countActiveByGender();
  const result = { male: 0, female: 0 };
  rows.forEach(r => {
    if (r.gender === 1) result.male   = r.get("count");
    if (r.gender === 2) result.female = r.get("count");
  });
  res.json(result);
};

exports.search = async (req, res) => {
  const filters     = { ...req.body, orgid: req.user.orgid };
  const includePlan = req.query.includeplan === "true";
  const page        = Math.max(1, parseInt(req.query.page)  || 1);
  const limit       = Math.min(50, parseInt(req.query.limit) || 10);
  const result      = await profileService.searchWithMatchCount(filters, includePlan, page, limit);
  res.json(result);
};

exports.setProfilePicture = async (req, res) => {
  const profileId      = req.params.id;
  const { attachmentId } = req.body;
  await profileService.setProfilePicture(profileId, attachmentId);
  res.sendStatus(204);
};

exports.assignPlan = async (req, res) => {
  try {
    const { subscription_name } = req.body;
    if (!subscription_name)
      return res.status(400).json({ success: false, message: "subscription_name is required" });
    const plan = await planService.assignPlan(req.params.id, subscription_name, req.user?.id);
    res.json({
      success: true,
      plan_start:        plan.plan_start,
      plan_expiry:       plan.plan_expiry,
      subscription_name: plan.subscription_name,
      payment_status:    plan.payment_status
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getPlanHistory = async (req, res) => {
  try {
    const plans = await planService.getPlanHistory(req.params.id);
    res.json(plans);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const plan = await planService.confirmPayment(req.params.id);
    res.json({ success: true, payment_status: plan.payment_status, payment_confirmed_at: plan.payment_confirmed_at });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAdminStats = async (req, res) => {
  try {
    const { ProfilePlan, Profile, Sequelize } = require("../models");
    const { refreshAllPaymentStatuses }        = require("../services/plan.service");

    await refreshAllPaymentStatuses();

    const totalProfiles = await Profile.count();
    const planCounts    = await ProfilePlan.findAll({
      attributes: [
        "payment_status",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]
      ],
      where: Sequelize.literal(
        `id = (SELECT MAX(id) FROM profileplans pp2 WHERE pp2.profileid = ProfilePlan.profileid)`
      ),
      group: ["payment_status"],
      raw: true
    });

    const counts = { paid: 0, expiring: 0, expired: 0, unpaid: 0 };
    for (const row of planCounts) {
      if (counts[row.payment_status] !== undefined)
        counts[row.payment_status] = parseInt(row.count);
    }
    const profilesWithPlan = Object.values(counts).reduce((a, b) => a + b, 0);
    counts.unpaid += totalProfiles - profilesWithPlan;

    res.json({ success: true, stats: { total: totalProfiles, ...counts } });
  } catch (err) {
    console.error("getAdminStats error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listForAdmin = async (req, res) => {
  try {
    const { ProfilePlan, Profile, Sequelize } = require("../models");
    const { Op } = Sequelize;

    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;
    const { paymentStatus, search, sort } = req.query;

    const where = {};
    if (search) {
      where[Op.or] = [
        { firstname: { [Op.like]: `%${search}%` } },
        { lastname:  { [Op.like]: `%${search}%` } },
        { email:     { [Op.like]: `%${search}%` } }
      ];
    }

    if (paymentStatus && paymentStatus !== "all") {
      if (paymentStatus === "unpaid") {
        where[Op.and] = [Sequelize.literal(`(
          NOT EXISTS (SELECT 1 FROM profileplans pp WHERE pp.profileid = Profile.id)
          OR (SELECT payment_status FROM profileplans pp WHERE pp.profileid = Profile.id ORDER BY pp.id DESC LIMIT 1) = 'unpaid'
        )`)];
      } else {
        where[Op.and] = [Sequelize.literal(`(
          SELECT payment_status FROM profileplans pp WHERE pp.profileid = Profile.id ORDER BY pp.id DESC LIMIT 1
        ) = '${paymentStatus}'`)];
      }
    }

    const order = sort === "expiring"
      ? [Sequelize.literal(`(SELECT plan_expiry FROM profileplans pp WHERE pp.profileid = Profile.id ORDER BY pp.id DESC LIMIT 1) ASC`)]
      : [["createdon", "DESC"]];

    const { count, rows: profiles } = await Profile.findAndCountAll({ where, order, limit, offset, raw: true });

    if (profiles.length === 0)
      return res.json({ success: true, data: [], total: count, page, pages: Math.ceil(count / limit) });

    const profileIds = profiles.map(p => p.id);
    const plans = await ProfilePlan.findAll({
      where: { profileid: { [Op.in]: profileIds } },
      order: [["id", "DESC"]],
      raw: true
    });

    const planMap = {};
    for (const plan of plans) {
      if (!planMap[plan.profileid]) planMap[plan.profileid] = plan;
    }

    const result = profiles.map(p => ({ ...p, latestPlan: planMap[p.id] || null }));
    res.json({ success: true, data: result, total: count, page, pages: Math.ceil(count / limit) });
  } catch (err) {
    console.error("listForAdmin error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStaffActivity = async (req, res) => {
  try {
    const { ActivityLog } = require("../models");
    const limit     = parseInt(req.query.limit)  || 50;
    const offset    = parseInt(req.query.offset) || 0;
    const activities = await ActivityLog.findAll({ order: [["createdAt", "DESC"]], limit, offset });
    const total      = await ActivityLog.count();
    res.json({ success: true, data: activities, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listFamily  = async (req, res) => res.json(await familyService.findByProfile(req.params.id));
exports.addFamily   = async (req, res) => res.json(await familyService.create({ ...req.body, profileid: req.params.id }));
exports.updateFamily = async (req, res) => { await familyService.update(req.params.familyId, req.body); res.sendStatus(204); };
exports.deleteFamily = async (req, res) => { await familyService.remove(req.params.familyId); res.sendStatus(204); };

/* ─────────────────────────────────────────
   Secret Notes
───────────────────────────────────────── */

/* GET /profiles/:id/secret/notes */
exports.getSecretNotes = async (req, res) => {
  try {
    const notes = await profileService.getSecretNotes(req.params.id, req.user.id);
    res.json({ success: true, notes });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/* POST /profiles/:id/secret/notes  — profileid from params, general notes via /profiles/secret/notes */
exports.addSecretNote = async (req, res) => {
  try {
    const { note } = req.body;
    if (!note || !note.trim())
      return res.status(400).json({ success: false, message: "Note cannot be empty" });
    // req.params.id is undefined for general notes route, pass null
    const profileid = req.params.id || null;
    const notes = await profileService.addSecretNote(profileid, req.user.id, note.trim());
    res.json({ success: true, notes });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/* DELETE /profiles/secret/notes/:noteId — soft delete by note id */
exports.hideSecretNote = async (req, res) => {
  try {
    await profileService.hideSecretNote(req.params.noteId, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/* GET /profiles/secret/all — all notes by this staff grouped */
exports.getAllStaffNotes = async (req, res) => {
  try {
    const data = await profileService.getAllStaffNotes(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
/* ── Secret Box — verify password ── */
exports.verifySecretPassword = async (req, res) => {
  try {
    await profileService.verifySecretPassword(req.user.id, req.body.password);
    res.json({ success: true });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
};