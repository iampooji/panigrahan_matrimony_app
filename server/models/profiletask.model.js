module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "ProfileTask",
    {
      profileid:      DataTypes.INTEGER,
      description:    DataTypes.TEXT,
      status:         DataTypes.INTEGER,
      duedate:        DataTypes.DATE,
      createdby:      DataTypes.INTEGER,
      reason:         DataTypes.TEXT,
      interactionid: {
        type:         DataTypes.INTEGER,
        allowNull:    true,
        defaultValue: null
      },
      createdat: {
        type: DataTypes.DATE
      },
      is_deleted: {
        type:         DataTypes.TINYINT,
        defaultValue: 0
      }
    },
    {
      tableName:  "profiletask",
      timestamps: false
    }
  );
};