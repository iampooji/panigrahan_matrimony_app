module.exports = (sequelize, DataTypes) => {
  const profileanswers = sequelize.define(
    "profileanswers",
    {
      profileid: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      questionid: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      answer: {
        type: DataTypes.STRING(200),
      },
      createdby: {
        type: DataTypes.INTEGER,
      },

    },
    {
      tableName: "profileanswers",
      timestamps: false
    }
  );

  return profileanswers;
};
