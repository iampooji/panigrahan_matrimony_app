module.exports = (sequelize, DataTypes) => {
  const ProfileStarPreference = sequelize.define(
    "ProfileStarPreference",
    {
      profileid: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      birthstar: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false
      }

    },
    {
      tableName: "profilestarpreference",
      timestamps: false
    }
  );

  return ProfileStarPreference;
};
