const { Attachment } = require("../models");
const { Profile } = require("../models");
const { uploadsPublicPath } = require("../config/storage.config");

exports.createMany = async (attachableType, attachableId, files, fileType = "image", photoType = null) => {
  const rows = files.map(file => ({
    attachable_type: attachableType,
    attachable_id: attachableId,
    file_type: fileType,
    file_name: file.originalname,
    file_url: `${uploadsPublicPath}/${file.filename}`,
    mime_type: file.mimetype,
    file_size: file.size,
    category: photoType || null,  // store slot type (horoscope, profile_main, etc.)
  }));

  const attached = await Attachment.bulkCreate(rows);

  if (photoType === "profile_main") {
    await Profile.update(
      { profilePictureId: attached[0].id },
      { where: { id: attachableId } }
    );
  }

  return attached;
};

exports.findByAttachable = (attachableType, attachableId, fileType = null) => {
  const where = {
    attachable_type: attachableType,
    attachable_id: attachableId
  };

  if (fileType) {
    where.file_type = fileType;
  }

  return Attachment.findAll({ where });
};

exports.remove = async (id) => {
  const attachment = await Attachment.findByPk(id);
  if (!attachment) return null;

  const usedAsProfile = await Profile.findOne({
    where: { profilePictureId: id }
  });

  if (usedAsProfile) {
    throw new Error("Cannot delete profile picture");
  }

  await attachment.destroy();
  return attachment;
};