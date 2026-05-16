module.exports = (sequelize, DataTypes) => {
  const ProfileQuestion = sequelize.define(
    "ProfileQuestion",
    {
      questiontxt: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      answertype: {
        type: DataTypes.TINYINT,
        allowNull: false
      },
      ansopts: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      createdby: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      orgid: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      forgender: {
        type: DataTypes.TINYINT,
        allowNull: true
      }
    },
    {
      tableName: "profilequestions",
      timestamps: false,
      indexes: [
      { fields: ["orgid"] },
    ]
    }
  );

  return ProfileQuestion;
};
