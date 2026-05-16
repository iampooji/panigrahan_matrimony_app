const { FormEnumMap, EnumType } = require("../models");
const { literal } = require("sequelize");


exports.getEnumsForForm = async (formname, orgid) => {
  return FormEnumMap.findAll({
    where: {
      formname: formname,
      ...(orgid && { orgid: orgid })
    },
    include: [{
      model: EnumType,
      as: "enum",
      on: {
        enumtype: literal(
          "`FormEnumMap`.`enumtype` = `enum`.`enumtype` AND `enum`.`orgid` = `FormEnumMap`.`orgid`"
        )
      }
    }],
    order:  [["disporder", "ASC"], ["enum", "typeorder", "ASC"]]
  });
};
