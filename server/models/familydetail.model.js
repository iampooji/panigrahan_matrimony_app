module.exports = (sequelize, DataTypes) => {
  const FamilyDetail = sequelize.define("FamilyDetail", {
    firstname: DataTypes.STRING,
    lastname: DataTypes.STRING,
    relationtype: DataTypes.INTEGER,
    profileid: DataTypes.INTEGER,
    familyname: DataTypes.STRING(30),
    surname: DataTypes.STRING(30),
    current_address_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    permanent_address_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    work_address_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    maritalsts: DataTypes.TINYINT.UNSIGNED,
    livingstatus: DataTypes.TINYINT.UNSIGNED,
    gender: DataTypes.TINYINT.UNSIGNED,
    cellphone: DataTypes.STRING(15),
    homephone: DataTypes.STRING(15),
    otherphone: DataTypes.STRING(15),
    emailaddress: DataTypes.STRING(100),
    placeoforigin: DataTypes.STRING(50),
    occtype: DataTypes.TINYINT.UNSIGNED,
  },
  {
    tableName: "familydetails",
    timestamps: false,
    indexes: [
      { fields: ["relationtype"] },
      { fields: ["profileid"] }
    ]
  });

  return FamilyDetail;
};