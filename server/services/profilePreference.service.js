const { ProfilePreference } = require("../models");

exports.getByProfile = (profileid) =>
  ProfilePreference.findOne({ where: { profileid } });

exports.save = async (profileid, data) => {
  const existing = await exports.getByProfile(profileid);

  if (existing) {
    return existing.update(data);
  }

  return ProfilePreference.create({ profileid, ...data });
};
