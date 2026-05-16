module.exports = (sequelize, DataTypes) => {
  const Attachment = sequelize.define(
    "Attachment",
    {
      attachable_type: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "attachable_type"
      },
      attachable_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: "attachable_id"
      },
      category: DataTypes.STRING,
      file_name: DataTypes.STRING,
      file_type: DataTypes.STRING,
      file_url: DataTypes.TEXT,
      file_size: DataTypes.BIGINT
    },
    {
      tableName: "attachments",
      timestamps: true,
      underscored: true
    }
  );

  return Attachment;
};
