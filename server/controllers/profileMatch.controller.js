const profileService     = require("../services/profile.service");
const matchSearchService = require("../services/profileMatchSearch.service");
const matchService       = require("../services/profileMatch.service");
const questionsService   = require("../services/profilequestions.service");

/* ======================================================
   SEARCH MATCHES
   — Runs purely on what the Match page sends.
   — Validates all pref_ params against the opposite
     gender before passing to the search service.
   ====================================================== */
exports.match = async (req, res, next) => {
  console.log("QUERY:", req.query);
  try {
    const profileId = req.query.profileId || req.params.profileId;
    if (!profileId) return res.status(400).json({ message: "profileId required" });

    const profile = await profileService.findById(profileId, req.user?.role);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    /* ---------- Basic filters — from query string only ---------- */
    const preferences = {
      agegap:      req.query.agegap      ? Number(req.query.agegap)      : undefined,
      minincome:   req.query.minincome   ? Number(req.query.minincome)   : undefined,
      minnetworth: req.query.minnetworth ? Number(req.query.minnetworth) : undefined
    };

    /* ---------- Stars — from query string only ---------- */
    const allowedStars = req.query.birthstar
      ? req.query.birthstar.split(",").map(Number)
      : [];

    const includeRejected = req.query.includeRejected === "1";

    /* ---------- Build allowed question ids for OPPOSITE gender ---------- */
    const oppositeGender = profile.gender === 1 ? 2 : 1;
    const allowedQuestions = await questionsService.listByGender(oppositeGender);
    const allowedQuestionIds = new Set(allowedQuestions.map(q => q.id));

    /* ---------- Preference questions — validated against opposite gender ---------- */
    const prefAnswers = {};
    Object.entries(req.query).forEach(([k, v]) => {
      if (k.startsWith("pref_")) {
        const questionId = parseInt(k.replace("pref_", ""));
        const value      = v?.trim();
        if (!isNaN(questionId) && value && allowedQuestionIds.has(questionId)) {
          prefAnswers[questionId] = value;
        }
      }
    });

    /* ---------- Run search ---------- */
    const matches = await matchSearchService.searchMatches({
      profile,
      preferences,
      allowedStars,
      includeRejected,
      prefAnswers,
      page:     Number(req.query.page)     || 1,
      pageSize: Number(req.query.pageSize) || 20
    });

    res.json(matches);

  } catch (err) {
    next(err);
  }
};

/* ======================================================
   SHARE PROFILE
   ====================================================== */
exports.share = async (req, res, next) => {
  try {
    const { profileId, matchId } = req.body;
    if (!profileId || !matchId)
      return res.status(400).json({ message: "profileId and matchId required" });
    await matchService.share(profileId, matchId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/* ======================================================
   GET INTERACTIONS
   ====================================================== */
exports.getInteractions = async (req, res, next) => {
  try {
    const rows = await matchService.getAll(req.params.profileId, req.query.includeRejected);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/* ======================================================
   SET STATUS
   ====================================================== */
exports.setStatus = async (req, res, next) => {
  try {
    const row = await matchService.setStatus(req.body);
    res.json(row);
  } catch (err) {
    next(err);
  }
};

exports.rejectProfile = async (req, res) => {
  profid = req.params.profileId;
  reqbody = req.body;
  const resp = await matchService.reject(profid, reqbody);
  res.json(resp);
};