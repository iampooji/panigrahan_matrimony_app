const { Education } = require("../models");

exports.findByProfile = (profile_id) => {
  return Education.findAll({
    where: { profile_id },
    order: [["sort_order", "ASC"], ["id", "ASC"]]
  });
};

exports.create = (data) => {
  return Education.create(data);
};

exports.update = (id, data) => {
  return Education.update(data, { where: { id } });
};

exports.remove = (id) => {
  return Education.destroy({ where: { id } });
};

exports.findById = (id) => {
  return Education.findByPk(id);
};