module.exports = (sequelize, DataTypes) => {
  const gothra = sequelize.define("gothra", {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },

      gothraname: {
        type: DataTypes.STRING(50),
      },

      gothrarushi: {
        type: DataTypes.STRING(50),
      },

      gothranum: {
        type: DataTypes.TINYINT.UNSIGNED,
      },
      aliases: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
  },
  {
    tableName: "gothra",
    timestamps: false,
  }
  );

  return gothra;
};
