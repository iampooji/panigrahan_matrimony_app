module.exports = (sequelize, DataTypes) => {
  const ProfilePreference = sequelize.define(
    "ProfilePreference",
    {
      profileid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
      },
      agegap: DataTypes.TINYINT,
      minincome: DataTypes.INTEGER.UNSIGNED,
      minnetworth: {type: DataTypes.INTEGER.UNSIGNED, allowNull: true},
      // educationlevel: DataTypes.TINYINT.UNSIGNED,
    },
    {
      tableName: "profilepreference",
      timestamps: false,
    }
  );

  return ProfilePreference;
};
