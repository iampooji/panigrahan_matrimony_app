module.exports = (sequelize, DataTypes) => {
  const ProfileMatch = sequelize.define(
    "ProfileMatch",
    {
      profileid: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      matchprofileid: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      reasoncode: {
        type: DataTypes.INTEGER
      },
      notes: {
        type: DataTypes.TEXT
      }
    },
    {
      tableName: "profilematch",
      timestamps: false
    }
  );

  return ProfileMatch;
};
