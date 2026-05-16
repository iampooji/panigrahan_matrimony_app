module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    "Product",
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

      sku: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true
      },

      price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
      },

      status: {
        type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
        defaultValue: "ACTIVE"
      },

      extra_attributes: {
        type: DataTypes.JSON,
        allowNull: true
      }
    },
    {
      tableName: "products",
      timestamps: true,
      underscored: true
    }
  );

  return Product;
};
