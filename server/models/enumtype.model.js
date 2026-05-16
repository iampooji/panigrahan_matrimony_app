module.exports = (sequelize, DataTypes) => {
  const EnumType = sequelize.define("EnumType", {
    enumtype: DataTypes.STRING,
    enumvalue: DataTypes.INTEGER,
    strvalue: DataTypes.STRING,
    systemtype: DataTypes.TINYINT.UNSIGNED,
    defaultselect: DataTypes.TINYINT.UNSIGNED,
    typeorder: DataTypes.TINYINT.UNSIGNED,
    orgid: DataTypes.INTEGER,
  }, {
    tableName: "enumtypes",
    timestamps: false
  });

  return EnumType;
};
