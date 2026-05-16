module.exports = (sequelize, DataTypes) => {
  const ProfilePlan = sequelize.define(
    "ProfilePlan",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      profileid: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      plan_start: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      plan_expiry: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      subscription_name: {
        type: DataTypes.ENUM("bronze", "silver", "gold", "diamond"),
        allowNull: false
      },
      payment_status: {
        type: DataTypes.ENUM("unpaid", "paid", "expiring", "expired"),
        defaultValue: "unpaid"
      },
      payment_confirmed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      },  
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      tableName: "profileplans",
      timestamps: false
    }
  );

  return ProfilePlan;
};