const { ProfileQuestion } = require("../models");
const { Op } = require("sequelize");

exports.listByGender = async ( gender ) => {
  const where = {};

  // if (orgid) where.orgid = orgid;

  if (gender) {
    where.forgender = {
      [Op.in]: [gender, 3] // gender + BOTH
    };
  }

  return ProfileQuestion.findAll({
    where,
    order: [["id", "ASC"]]
  });
};

exports.listByOppGender = async ({ gender }) => {
  const where = {};

  gender = (gender === 1) ? 2 : 1

  if (gender) {
    where.forgender = {
      [Op.in]: [gender, 3] // gender + BOTH
    };
  }

  return ProfileQuestion.findAll({
    where,
    order: [["id", "ASC"]]
  });
};
