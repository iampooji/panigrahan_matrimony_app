module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define(
    "Customer",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },

      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },

      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isEmail: true
        }
      },

      phone: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
    },
    {
      tableName: "customers",
      timestamps: true,
      underscored: true
    }
  );

  return Customer;
};