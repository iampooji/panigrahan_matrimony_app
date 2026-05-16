module.exports = (sequelize, DataTypes) => {
  const Occupation = sequelize.define("Occupation", {
    addressid: {
      type: DataTypes.INTEGER.UNSIGNED,
    },
    parentid: {
      type: DataTypes.INTEGER.UNSIGNED,
    },
    occname: DataTypes.STRING(100),
    occrole: DataTypes.STRING(100),
    income: DataTypes.SMALLINT.UNSIGNED,
    parenttype: DataTypes.STRING(30),
    compname: DataTypes.STRING(50),
    occtype: DataTypes.TINYINT.UNSIGNED,
  },
  {
    tableName: "occupation",
    timestamps: false,
    indexes: [
      { fields: ["parentid"] },
      { fields: ["parenttype"] }
    ]
  }
  );

  return Occupation;
};
