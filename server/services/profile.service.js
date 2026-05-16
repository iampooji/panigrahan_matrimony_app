const { Profile, ProfileMatch, ProfilePlan, Attachment, gothras, Sequelize, User } = require("../models");
const bcrypt = require("bcrypt");
const { Op } = Sequelize;

/* ── Build filter WHERE from common filters ── */
const buildWhere = (filters) => {
  const where = {};
   // orgid is mandatory for all queries
  if (filters.orgid)              where.orgid              = filters.orgid;
  if (filters.client_id)          where.client_id          = filters.client_id;
  if (filters.phonenumber) where.phonenumber  = filters.phonenumber;
  if (filters.name)        where[Op.or]       = [
    { firstname: { [Op.like]: `%${filters.name}%` } },
    { lastname:  { [Op.like]: `%${filters.name}%` } }
  ];
  if (filters.gender)   where.gender     = filters.gender;
  if (filters.city) {
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push(Sequelize.literal(`EXISTS (
      SELECT 1 FROM address a
      WHERE a.relationtype = 'profile' AND a.relationid = Profile.id
      AND a.city LIKE '%${filters.city}%'
    )`));
  }
  if (filters.state) {
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push(Sequelize.literal(`EXISTS (
      SELECT 1 FROM address a
      WHERE a.relationtype = 'profile' AND a.relationid = Profile.id
      AND a.state LIKE '%${filters.state}%'
    )`));
  }
  if (filters.district) where.birthdist  = filters.district;

  if (filters.birthstar?.length > 0) {
    where.birthstar = { [Op.in]: filters.birthstar.map(v => parseInt(v)) };
  }

  if (filters.minAge || filters.maxAge) {
    const today = new Date();
    const dob = {};
    if (filters.minAge) dob[Op.lte] = new Date(today.getFullYear() - filters.minAge, today.getMonth(), today.getDate());
    if (filters.maxAge) dob[Op.gte] = new Date(today.getFullYear() - filters.maxAge - 1, today.getMonth(), today.getDate());
    where.birthdate = dob;
  }

  let whereHeightClause = {};
  if (filters.minHeight && Number(filters.minHeight) > 0) {
    whereHeightClause[Op.gte] = filters.minHeight;
  }
  if (filters.maxHeight && Number(filters.maxHeight) > 0) {
    whereHeightClause[Op.lte] = filters.maxHeight;
  }

  if ((Number(filters.maxHeight) > 0) || Number(filters.minHeight) > 0) {
    where.height = whereHeightClause;
  }

  if (filters.income && Number(filters.income) > 0) {
    where.income = { [Op.gte]: filters.income }
  }

  if (filters.networth && Number(filters.networth) > 0) {
    where.networth = { [Op.gte]: filters.networth }
  }



  if (filters.swagothra) {
    where.swagothra = filters.swagothra;
  }

  //occupation and suboccupation filters 
  if (filters.occtype?.length > 0) {
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push(Sequelize.literal(`EXISTS (
      SELECT 1 FROM occupation occ
      WHERE occ.parentid = Profile.id
        AND occ.parenttype = 'profile'
        AND occ.occtype IN (${filters.occtype.map(v => parseInt(v)).join(",")})
    )`));
  }

  if (filters.subocctype?.length > 0) {
    where[Op.and] = where[Op.and] || [];

    where[Op.and].push(Sequelize.literal(`
      EXISTS (
        SELECT 1 FROM occupation occ
        WHERE occ.parentid = Profile.id
          AND occ.parenttype = 'profile'
          AND occ.subocctype IN (${filters.subocctype.map(v => parseInt(v)).join(",")})
      )
    `));
  }

 if (filters.otherProfession) {
  where[Op.and] = where[Op.and] || [];

  const synonyms = {
    dr: "doctor",
    doc: "doctor",
    eng: "engineer"
  };

  let input = filters.otherProfession.toLowerCase().trim();
  input = synonyms[input] || input;

  const keywords = input.split(" ").filter(Boolean);

  const conditions = keywords.map(word => {
    const safeWord = word.replace(/'/g, "''");
    return `LOWER(occ.occname) LIKE '%${safeWord}%'`;
  }).join(" OR ");

    where[Op.and].push(Sequelize.literal(`
      EXISTS (
        SELECT 1 FROM occupation occ
        WHERE occ.parentid = Profile.id
          AND occ.parenttype = 'profile'
          AND (${conditions})
      )
    `));
  }


  if (filters.birthyear && filters.birthyear.length > 0) {
    where[Op.and] = where[Op.and] || [];

    where[Op.and].push(
      Sequelize.where(
        Sequelize.fn("YEAR", Sequelize.col("birthdate")),
        {
          [Op.in]: filters.birthyear.map(Number) //op.in is used incase of array of years, if it's a single year it will still work as it will be treated as an array with one element
        }
      )
    );
  }

  // if (filters.education) {
  //   where[Op.and] = where[Op.and] || [];

  //   const values = filters.education.split(",").map(e => e.trim());

  //   where[Op.and].push({
  //     [Op.or]: values.map(edu => ({
  //       [Op.or]: [
  //         { education1: { [Op.like]: `%${edu}%` } },
  //         { education2: { [Op.like]: `%${edu}%` } }
  //       ]
  //     }))
  //   });
  // }

  // status: "" or undefined = active only, 0 = all, 1 = active, 2 = inactive
  if (filters.status === 0 || filters.status === "0") {
    // show all — no filter
  } else if (filters.status) {
    where.profilests = filters.status;
  } else {
    where.profilests = 1; // default active only
  }

  return where;
};

/* ── Attach latest plan to each profile row ── */
const attachPlans = async (profiles) => {
  if (!profiles.length) return profiles;
  const ids = profiles.map(p => p.id ?? p.dataValues?.id);
  const plans = await ProfilePlan.findAll({
    where: { profileid: { [Op.in]: ids } },
    order: [["id", "DESC"]],
    raw: true
  });
  const planMap = {};
  for (const plan of plans) {
    if (!planMap[plan.profileid]) planMap[plan.profileid] = plan;
  }
  return profiles.map(p => {
    const pid = p.id ?? p.dataValues?.id;
    p.dataValues ? (p.dataValues.latestPlan = planMap[pid] || null)
                 : (p.latestPlan = planMap[pid] || null);
    return p;
  });
};

exports.create = async (data, userId) => {

  if (!data.client_id || data.client_id.trim() === "") {
    return {
      field: "client_id",
      message: "Client ID is required"
    };
  }

  //  FIRST find existing
  const existing = await Profile.findOne({
    where: {
      orgid: data.orgid,
      client_id: data.client_id
    }
  });

  //  THEN check
  if (existing) {
    return {
      field: "client_id",
      message: "Client ID already exists"
    };
  }

  return Profile.create({
    ...data,
    createdby: userId,
    last_interaction: new Date()
  });
};

exports.findAll = () => {
  return Profile.findAll({
    attributes: {
      include: [
        [Sequelize.literal("TIMESTAMPDIFF(YEAR, birthdate, CURDATE())"), "age"]
      ]
    },
    order: [["createdon", "DESC"]]
  });
};

/* Staff/admin sees all profiles, others only paid/expiring */
exports.findById = async (id, role) => {
  const { ROLES } = require("../config/roles.config");
  const isStaff = role === ROLES.ADMIN || role === ROLES.VIEWER;

  const where = isStaff ? { id } : {
    id,
    [Op.and]: [Sequelize.literal(`EXISTS (
      SELECT 1 FROM profileplans pp
      WHERE pp.profileid = Profile.id
        AND pp.payment_status IN ('paid', 'expiring')
        AND pp.id = (SELECT MAX(id) FROM profileplans pp2 WHERE pp2.profileid = Profile.id)
    )`)]
  };

  return Profile.findOne({
    where,
    attributes: {
      include: [
        [Sequelize.fn("TIMESTAMPDIFF", Sequelize.literal("YEAR"),
          Sequelize.col("birthdate"), Sequelize.fn("CURDATE")), "age"]
      ]
    },
    include: [
      { model: gothras, as: "swagothranm", attributes: ["gothraname"], required: false },
      { model: gothras, as: "mamagothranm", attributes: ["gothraname"], required: false },
      { model: Attachment, as: "profilePicture", attributes: ["file_url"], required: false }
    ]
  });
};

exports.update = async (id, data, userId) => {
  const profile = await Profile.findByPk(id);
  if (!profile) return null;

  // ALWAYS check uniqueness if client_id is provided
  if (data.client_id) {
    const exists = await Profile.findOne({
      where: {
        orgid: profile.orgid,
        client_id: data.client_id,
        id: { [Op.ne]: id } 
      }
    });

    if (exists) {
      return {
        field: "client_id",
        message: "Client ID already exists"
      };
    }
  }

  return profile.update({
    ...data,
    updatedby: userId,
    last_interaction: new Date()
  });
};

exports.remove = async (id) => {
  const profile = await Profile.findByPk(id);
  if (!profile) return null;
  await profile.destroy();
  return true;
};

/* Count all profiles by gender */
exports.countActiveByGender = async () => {
  return Profile.findAll({
    attributes: [
      "gender",
      [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]
    ],
    group: ["gender"]
  });
};

exports.setProfilePicture = async (profileId, attachmentId) => {
  const attachment = await Attachment.findOne({
    where: { id: attachmentId, attachable_type: "profile", attachable_id: profileId }
  });
  if (!attachment) throw new Error("Invalid attachment for profile");
  await Profile.update({ profilePictureId: attachmentId }, { where: { id: profileId } });
};

/* Main search — all profiles visible, paginated, optional plan filters */
exports.searchWithMatchCount = async (filters, includePlan = false, page = 1, limit = 10) => {
  // console.log(filters);
  const where  = buildWhere(filters);
  const offset = (page - 1) * limit;

  if (filters.subscriptionName) {
    where[Sequelize.Op.and] = where[Sequelize.Op.and] || [];
    where[Sequelize.Op.and].push(Sequelize.literal(`EXISTS (
      SELECT 1 FROM profileplans pp
      WHERE pp.profileid = Profile.id
        AND pp.subscription_name = '${filters.subscriptionName}'
        AND pp.id = (SELECT MAX(id) FROM profileplans pp2 WHERE pp2.profileid = Profile.id)
    )`));
  }

  if (filters.paymentStatus) {
    where[Sequelize.Op.and] = where[Sequelize.Op.and] || [];
    if (filters.paymentStatus === 'unpaid') {
      where[Sequelize.Op.and].push(Sequelize.literal(`(
        NOT EXISTS (SELECT 1 FROM profileplans pp WHERE pp.profileid = Profile.id)
        OR (
          SELECT payment_status FROM profileplans pp
          WHERE pp.profileid = Profile.id
          ORDER BY pp.id DESC LIMIT 1
        ) = 'unpaid'
      )`));
    } else {
      where[Sequelize.Op.and].push(Sequelize.literal(`(
        SELECT payment_status FROM profileplans pp
        WHERE pp.profileid = Profile.id
        ORDER BY pp.id DESC LIMIT 1
      ) = '${filters.paymentStatus}'`));
    }
  }

  const total = await Profile.count({ where });

  const profiles = await Profile.findAll({
    where,
    attributes: {
      include: [
        [Sequelize.literal("TIMESTAMPDIFF(YEAR, birthdate, CURDATE())"), "age"],
        [Sequelize.fn("COUNT", Sequelize.col("ProfileMatches.id")), "matchcount"]
      ]
    },
    include: [
      { model: ProfileMatch, attributes: [], required: false },
      { model: Attachment, as: "profilePicture", attributes: ["file_url"], required: false }
    ],
    order: [["createdon", "DESC"]],
    group: ["Profile.id", "profilePicture.id"],
    limit,
    offset,
    subQuery: false
  });

  exports.changests = async (id, sts) => {
  const profile = await Profile.findByPk(id);
  if (!profile) return null;

  await profile.update({
    profilests: sts   // 1 = ACTIVE
  });

  return profile;
}

  const data = includePlan ? await attachPlans(profiles) : profiles;

  return { data, total, page, pages: Math.ceil(total / limit) };
};

exports.touchLastInteraction = async (profileId) => {
  await Profile.update(
    { last_interaction: new Date() },
    { where: { id: profileId } }
  );
};

/* ─────────────────────────────────────────
   Secret Notes
   Structure: [{ id, text, staffid, profileid, hidden }]
   - id: Date.now().toString() — unique per note
   - profileid: profile id or null for general notes
───────────────────────────────────────── */

/* Get visible notes for this staff on this profile */
exports.getSecretNotes = async (profileid, staffid) => {
  const profile = await Profile.findByPk(profileid, { attributes: ["secret_notes"] });
  if (!profile) throw new Error("Profile not found");
  const sid = parseInt(staffid);
  const all = profile.secret_notes || [];
  return all.filter(n => parseInt(n.staffid) === sid && !n.hidden);
};

/* Add a profile-specific note */
exports.addSecretNote = async (profileid, staffid, text) => {
  const profile = await Profile.findByPk(profileid, { attributes: ["id", "secret_notes"] });
  if (!profile) throw new Error("Profile not found");
  const sid = parseInt(staffid);
  const existing = profile.secret_notes || [];
  const newNote = { id: Date.now().toString(), text, staffid: sid, profileid: parseInt(profileid), hidden: false };
  const notes = [...existing, newNote];
  await profile.update({ secret_notes: notes }, { fields: ["secret_notes"] });
  return notes.filter(n => parseInt(n.staffid) === sid && !n.hidden);
};

/* Soft-delete by note id — scans all profiles */
exports.hideSecretNote = async (noteId, staffid) => {
  const sid = parseInt(staffid);
  const profiles = await Profile.findAll({ attributes: ["id", "secret_notes"] });
  for (const profile of profiles) {
    const notes = profile.secret_notes || [];
    const idx = notes.findIndex(n => String(n.id) === String(noteId) && parseInt(n.staffid) === sid);
    if (idx !== -1) {
      const updated = notes.map((n, i) => i === idx ? { ...n, hidden: true } : { ...n });
      await profile.update({ secret_notes: updated }, { fields: ["secret_notes"] });
      return true;
    }
  }
  throw new Error("Note not found");
};

/* Get all profile-specific notes for this staff — grouped by profile */
exports.getAllStaffNotes = async (staffid) => {
  const sid = parseInt(staffid);
  const profiles = await Profile.findAll({
    attributes: ["id", "firstname", "lastname", "secret_notes"]
  });
  const grouped = [];
  for (const p of profiles) {
    const notes = (p.secret_notes || []).filter(n => parseInt(n.staffid) === sid && !n.hidden);
    if (notes.length > 0) {
      grouped.push({
        profileid: p.id,
        name:      `${p.firstname} ${p.lastname}`,
        notes
      });
    }
  }
  return grouped;
};
/* ── Secret Box — verify staff password ── */
exports.verifySecretPassword = async (userId, password) => {
  const user = await User.findByPk(userId, { attributes: ["password_hash"] });
  if (!user) throw new Error("User not found");
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new Error("Incorrect password");
  return true;
};