const { Occupation } = require("../models");

exports.findByRelation = (parenttype , parentid) => {
  return Occupation.findAll({
    where: { parenttype , parentid },
    order: [["id", "ASC"]]
  });
};

exports.create = (data) => {
  return Occupation.create(data);
};

exports.update = (id, data) => {
  return Occupation.update(data, { where: { id } });
};

exports.remove = (id) => {
  return Occupation.destroy({ where: { id } });
};

exports.findById = (id) => {
  return Occupation.findByPk(id);
};