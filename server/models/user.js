module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },

      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
      },

      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
      },

      status: {
        type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
        defaultValue: "ACTIVE"
      },

      role: {
        type: DataTypes.TINYINT.UNSIGNED,
        defaultValue: 1
      },

      orgid: {
        type: DataTypes.INTEGER
      }
    },
    {
      tableName: "users",
      timestamps: true,
      underscored: true
    }
  );

  return User;
};