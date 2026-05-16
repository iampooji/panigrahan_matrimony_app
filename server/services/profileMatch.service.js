const { ProfileMatch, Attachment, Profile, Sequelize } = require("../models");
const { touchLastInteraction } = require("./profile.service");
const { Op, literal } = Sequelize;

const STATUS = { SHARED: 1 };

/* ── create or update status ── */
exports.setStatus = async ({ profileid, matchprofileid, status, reasoncode, notes }) => {
  const [row] = await ProfileMatch.upsert({
    profileid,
    matchprofileid,
    status,
    reasoncode,
    notes
  });

  if (profileid)      await touchLastInteraction(profileid);
  if (matchprofileid) await touchLastInteraction(matchprofileid);

  return row;
};

/* get all interactions */
exports.getAll = (profileid, isRejected) => {
  const andConditions = [];
  const where = {};

  let litProfCond = 'Profile.id IN (SELECT matchprofileid FROM profilematch WHERE profileid =' + profileid +' AND status != 9)';

  if (isRejected == 'true') {
    litProfCond = 'Profile.id IN (SELECT matchprofileid FROM profilematch WHERE profileid = ' + profileid + ' )';
  }

  andConditions.push(
    literal(litProfCond)
  );

  where[Op.and] = andConditions;

  return Profile.findAll({
    where, 
    include: [
      {
        model: Attachment,
        as: "profilePicture",
        attributes: ["file_url"],
        required: false
      }
    ],
  });
};

/* ── get rejected profile ids ── */
exports.getRejectedIds = async (profileid) => {
  const rows = await ProfileMatch.findAll({
    attributes: ["matchprofileid"],
    where: { profileid, status: 9 }
  });
  return rows.map(r => r.matchprofileid);
};

/* ── reject a match ── */
exports.reject = async (profid, body) => {
  const matchrec = await ProfileMatch.findOne({
    where: {
      profileid: profid,
      matchprofileid: body.rejectedprofileid
    },
  });

  if (!matchrec) throw new Error("Match record not found");

  await matchrec.update({
    status: 9,
    reasoncode: body.reasoncode,
    notes: body.notes
  });

  return matchrec;
};

exports.share = async (profileId, matchId) => {

  // BLOCK IF MAIN PROFILE IS INACTIVE
  const profile = await Profile.findByPk(profileId);
  if (!profile || profile.profilests !== 1) {
    throw new Error("Inactive profile cannot share matches");
  }

  // BLOCK IF MATCH PROFILE IS INACTIVE
  const matchProfile = await Profile.findByPk(matchId);
  if (!matchProfile || matchProfile.profilests !== 1) {
    throw new Error("Cannot share inactive profile");
  }

  const [result] = await ProfileMatch.upsert({
    profileid: profileId,
    matchprofileid: matchId,
    status: STATUS.SHARED
  });

  await touchLastInteraction(profileId);
  await touchLastInteraction(matchId);

  return result;
};