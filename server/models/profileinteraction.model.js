module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "ProfileInteraction",
    {
      profileid:       DataTypes.INTEGER,
      userid:          DataTypes.INTEGER,
      interactiontype: DataTypes.INTEGER,
      notes:           DataTypes.TEXT,
      createdat: {
        type: DataTypes.DATE
      },
      is_deleted: {
        type:         DataTypes.TINYINT,
        defaultValue: 0
      },
    },
    {
      tableName:  "profileinteraction",
      timestamps: false
    }
  );
};