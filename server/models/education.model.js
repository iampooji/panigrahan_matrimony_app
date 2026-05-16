module.exports = (sequelize, DataTypes) => {
  const Education = sequelize.define("Education", {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    profile_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    degree: {
      type: DataTypes.STRING(100),
    },
    college: {
      type: DataTypes.STRING(100),
    },
    fieldstudy: {
      type: DataTypes.STRING(100),
    },
    year: {
      type: DataTypes.INTEGER,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    tableName: "education",
    timestamps: false,
    indexes: [
      { fields: ["profile_id"] },
      { fields: ["degree"] },
      { fields: ["college"] }
    ]
  }
  );

  return Education;
};