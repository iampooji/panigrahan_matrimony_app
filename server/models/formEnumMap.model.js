module.exports = (sequelize, DataTypes) => {
  const FormEnumMap = sequelize.define("FormEnumMap", {
    formname: DataTypes.STRING,
    enumtype: DataTypes.STRING,
    fieldname: DataTypes.STRING,
    required: DataTypes.INTEGER,
    disporder: DataTypes.INTEGER,
    orgid: DataTypes.INTEGER
  }, {
    tableName: "formenumap",   // 👈 your new table name
    timestamps: false
  });

  return FormEnumMap;
};
