const attachmentService = require("../services/attachment.service");

exports.upload = async (req, res) => {
  const { attachableType, attachableId } = req.params;
  const photoType = req.body.photo_type || null;

  if (!req.files || !req.files.length) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  await attachmentService.createMany(
    attachableType,
    attachableId,
    req.files,
    "image",
    photoType
  );

  res.status(201).json({
    message: "Files uploaded",
    count: req.files.length
  });
};

exports.list = async (req, res) => {
  const { attachableType, attachableId } = req.params;

  const files = await attachmentService.findByAttachable(
    attachableType,
    attachableId
  );

  res.json(files);
};

exports.remove = async (req, res) => {
  console.log("Test");
  console.log(req.params.id);
  try {
    const result = await attachmentService.remove(req.params.id);
    if (!result) return res.status(404).send();
    res.json(result);
  } catch (err) {
    console.log(err.message);
    res.status(400).json({ message: err.message });
  }
};