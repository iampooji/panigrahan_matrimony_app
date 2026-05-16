const { Profile, Attachment, gothras, Sequelize } = require("../models");
const { Op, literal } = Sequelize;

// ─────────────────────────────────────────────
// Questions that describe the profile itself,
// not preferences about the spouse.
// These are skipped as candidate filters.
// e.g. Q6 = "how would you describe your nature"
// ─────────────────────────────────────────────
const NON_FILTER_QUESTIONS = [6];

// ─────────────────────────────────────────────
// Values that mean "no filter" — when a
// preference is set to one of these, skip
// adding it as a search condition entirely.
// e.g. Q3 = "No Preference" → show all females
// ─────────────────────────────────────────────
const NO_FILTER_VALUES = ["no preference", "any", ""];

const CITY_QUESTION_ID = 5;

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────
exports.findMatches = async ({
  profile,
  preferences = {},
  allowedStars = [],
  includeRejected = false,
  prefAnswers = {},
  page = 1,
  pageSize = 20
}) => {
  const where = {
    id: { [Op.ne]: profile.id },
    gender: { [Op.ne]: profile.gender },
    swagothra: { [Op.or]: [{ [Op.is]: null }, {[Op.ne]: profile.swagothra}] },
    profilests: 1
  };

  const andConditions = [];

  andConditions.push(
    literal(`
      Profile.id NOT IN (
        SELECT matchprofileid
        FROM profilematch
        WHERE profileid = ${profile.id}
      )
    `)
  );

  /* AGE GAP */
  if (preferences.agegap && profile.birthdate) {
    const pd =  new Date(profile.birthdate);
    if (profile.gender == 1) {
      pd.setFullYear(pd.getFullYear() + preferences.agegap);
      const formattedDate = pd.toISOString().split('T')[0];
      where.birthdate = { [Op.between]: [ profile.birthdate, formattedDate ] }
    }
    if (profile.gender == 2) {
      pd.setFullYear(pd.getFullYear() - preferences.agegap);
      const formattedDate = pd.toISOString().split('T')[0];
      where.birthdate = { [Op.between]: [ formattedDate, profile.birthdate ] }
    }
  }

  /* ── INCOME ── */
  if (preferences.minincome && Number(preferences.minincome) > 0) {
    where.income = { [Op.gte]: Number(preferences.minincome) };
  }

  /* ── NETWORTH ── */
  if (preferences.minnetworth && Number(preferences.minnetworth) > 0) {
    where.networth = { [Op.gte]: Number(preferences.minnetworth) };
  }

  /* ── STARS ── */
  if (allowedStars?.length) {
    where.birthstar = { [Op.in]: allowedStars };
  }

  /* ── PREFERENCE QUESTIONS ── */
  const questionIds = Object.keys(prefAnswers);

  if (questionIds.length) {
    questionIds.forEach(questionId => {
      const raw    = prefAnswers[questionId];
      const values = raw.split(",").map(v => v.trim()).filter(Boolean);
      if (!values.length) return;

      // Skip descriptive questions — not preferences about the spouse
      if (NON_FILTER_QUESTIONS.includes(Number(questionId))) return;

      // Skip if all values mean "no preference" — don't add as a filter
      if (values.every(v => NO_FILTER_VALUES.includes(v.toLowerCase()))) return;

      // City — match against address table
      if (Number(questionId) === CITY_QUESTION_ID) {
        const escaped = values[0].replace(/'/g, "''");
        andConditions.push(literal(`
          EXISTS (
            SELECT 1 FROM address a
            WHERE a.id IN (
              SELECT current_address_id FROM profiles WHERE id = Profile.id
              UNION
              SELECT permanent_address_id FROM profiles WHERE id = Profile.id
            )
            AND LOWER(TRIM(a.city)) LIKE LOWER('%${escaped}%')
          )
        `));
        return;
      }

      // All other questions — match against profileanswers
      if (values.length === 1) {
        const escaped = values[0].replace(/'/g, "''");
        andConditions.push(literal(`
          EXISTS (
            SELECT 1 FROM profileanswers pa
            WHERE pa.profileid = Profile.id
              AND pa.questionid = ${questionId}
              AND TRIM(pa.answer) = '${escaped}'
          )
        `));
      } else {
        const escapedList    = values.map(v => `'${v.replace(/'/g, "''")}'`).join(", ");
        const likeConditions = values.map(v => `TRIM(pa.answer) LIKE '%${v.replace(/'/g, "''")}%'`).join(" OR ");
        andConditions.push(literal(`
          EXISTS (
            SELECT 1 FROM profileanswers pa
            WHERE pa.profileid = Profile.id
              AND pa.questionid = ${questionId}
              AND (
                TRIM(pa.answer) IN (${escapedList})
                OR ${likeConditions}
              )
          )
        `));
      }
    });
  }

  if (andConditions.length) {
    where[Op.and] = andConditions;
  }

  /* ── FETCH PAGINATED MATCHES ── */
  const offset = (page - 1) * pageSize;

  const { count: totalCount, rows: matches } = await Profile.findAndCountAll({
    where,
    attributes: {
      include: [
        [Sequelize.literal("TIMESTAMPDIFF(YEAR, birthdate, CURDATE())"), "age"]
      ]
    },
    include: [
      { model: gothras, as: "swagothranm", attributes: ["gothraname"], required: false },
      { model: gothras, as: "mamagothranm", attributes: ["gothraname"], required: false },
      { model: Attachment, as: "profilePicture", attributes: ["file_url"], required: false }
    ],
    order:    [["createdon", "DESC"]],
    limit:    pageSize,
    offset,
    subQuery: false
  });

  return {
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
    results: matches.map(m => m.toJSON())
  };
};

exports.searchMatches = exports.findMatches;