const { EnumType } = require("../models");

exports.getByType = async (enumtype, orgid = null) => {
  return EnumType.findAll({
    where: {
      enumtype,
      ...(orgid && { orgid: orgid })
    },
    order: [["typeorder", "ASC"]]
  });
};

exports.getMultipleTypes = async (types = [], orgid = null) => {
  return EnumType.findAll({
    where: {
      enumtype: types,
      ...(orgid && { orgid: orgid })
    },
    order: [
      ["enumtype", "ASC"],
      ["typeorder", "ASC"]
    ]
  });
};
