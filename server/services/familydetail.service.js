const { FamilyDetail } = require("../models");

exports.findByProfile = (profileId) => {
  return FamilyDetail.findAll({
    where: { profileid: profileId },
    order: [["relationtype", "ASC"]]
  });
};

exports.create = (data) => {
  return FamilyDetail.create(data);
};

exports.update = (id, data) => {
  return FamilyDetail.update(data, {
    where: { id }
  });
};

exports.remove = (id) => {
  return FamilyDetail.destroy({
    where: { id }
  });
};

exports.findById = (id) => {
  return FamilyDetail.findByPk(id);
};
