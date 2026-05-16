const { Address, Sequelize } = require("../models");

/* ── Get address by id ── */
exports.findById = (id) => {
  return Address.findByPk(id);
};

/* ── Get all addresses by relation (kept for city match query) ── */
exports.findByRelation = (relationtype, relationid) => {
  return Address.findAll({
    where: { relationtype, relationid },
    order: [["id", "ASC"]]
  });
};

/* ── Create a new address row and return its id ── */
exports.create = (data) => {
  return Address.create(data);
};

/* ── Edit: create new row, return new id (old row untouched) ── */
exports.createNew = (data) => {
  return Address.create(data);
};

/* ── Update existing row ── */
exports.update = (id, data) => {
  return Address.update(data, { where: { id } });
};

/* ── Get addresses for a profile by their address ids ── */
exports.findByIds = async (ids) => {
  const validIds = ids.filter(Boolean);
  if (!validIds.length) return [];

  return Address.findAll({
    where: { id: validIds }
  });
};

/* ── Get distinct non-empty cities from address table ── */
exports.getDistinctCities = async () => {
  const rows = await Address.findAll({
    attributes: [
      [Sequelize.fn("DISTINCT", Sequelize.col("city")), "city"]
    ],
    where: {
      city: {
        [Sequelize.Op.and]: [
          { [Sequelize.Op.ne]: null },
          { [Sequelize.Op.ne]: "" }
        ]
      }
    },
    order: [["city", "ASC"]],
    raw: true
  });

  return rows.map(r => r.city).filter(Boolean);
};