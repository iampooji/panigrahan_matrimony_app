const profileService   = require("../services/profile.service");
const prefService      = require("../services/profilePreference.service");
const starService      = require("../services/profileStarPreference.service");
const questionsService = require("../services/profilequestions.service");
const answerService    = require("../services/profileanswers.service");

/* ======================================================
   GET PREFERENCES
   ====================================================== */
exports.get = async (req, res) => {
  const pref         = await prefService.getByProfile(req.params.id) || {};
  const stars        = await starService.getStars(req.params.id);
  const profile      = await profileService.findById(req.params.id, req.user?.role);

  // Allow gender override for match page (opposite gender questions)
  const genderOverride = req.query.forgender ? Number(req.query.forgender) : null;
  const gender = genderOverride || profile.gender;

  const prefquestions = await questionsService.listByGender(gender);
  const prefanswers  = await answerService.getanswers(req.params.id);

  res.json({ profile, pref, stars, prefquestions, prefanswers });
};

/* ======================================================
   SAVE PREFERENCES
   — Validates answers against the profile's gender
     before saving. Wrong-gender questions are silently
     dropped — they should never have been sent.
   ====================================================== */
exports.save = async (req, res) => {
  try {
    const profile = await profileService.findById(req.params.id, req.user?.role);

    /* ---------- Build set of allowed question ids for this gender ---------- */
    const allowedQuestions  = await questionsService.listByGender(profile.gender);
    const allowedQuestionIds = new Set(allowedQuestions.map(q => q.id));

    /* ---------- Clean basic prefs ---------- */
    const cleanPref = {};
    Object.entries(req.body.pref || {}).forEach(([key, value]) => {
      if (value !== "" && value !== undefined) cleanPref[key] = value;
    });

    await prefService.save(req.params.id, cleanPref);
    await starService.saveStars(req.params.id, req.body.stars);

    /* ---------- Save answers — gender-validated + sanitized ---------- */
    if (req.body.prefanswers?.length) {
      const sanitizedAnswers = req.body.prefanswers
        .filter(a => allowedQuestionIds.has(Number(a.questionid)))
        .map(a => ({
          ...a,
          answer: a.answer.trim().replace(/^,+/, '').trim()
        }))
        .filter(a => a.answer !== '');

      await answerService.saveanswers(req.params.id, sanitizedAnswers, req.user.id);
    }

    res.sendStatus(204);
  } catch (err) {
    console.error("Error saving preferences:", err);
    res.status(500).json({ message: "Failed to save preferences" });
  }
};