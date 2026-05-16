const { ProfileStarPreference } = require("../models");

exports.getStars = (profileid) =>
  ProfileStarPreference.findAll({ where: { profileid } });

exports.saveStars = async (profileid, stars = []) => {
  await ProfileStarPreference.destroy({ where: { profileid } });

  return ProfileStarPreference.bulkCreate(
    stars.map(birthstar => ({ profileid, birthstar }))
  );
};
