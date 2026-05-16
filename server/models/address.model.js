module.exports = (sequelize, DataTypes) => {
  const Address = sequelize.define("Address", {
    relationtype: {
      type: DataTypes.STRING,
      allowNull: true
    },
    relationid: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    addone: DataTypes.STRING,
    addtwo: DataTypes.STRING,
    addthree: DataTypes.STRING,
    city: DataTypes.STRING,
    district: DataTypes.STRING,
    state: DataTypes.STRING,
    country: DataTypes.STRING,
    zipcode: DataTypes.STRING
  },
  {
    tableName: "address",
    timestamps: false,
    indexes: [
      { fields: ["relationtype"] },
      { fields: ["relationid"] }
    ]
  });

  return Address;
};