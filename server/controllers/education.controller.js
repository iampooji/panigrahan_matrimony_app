const service = require("../services/education.service");

exports.list = async (req, res) => {
  const { profile_id } = req.params;
  const rows = await service.findByProfile(profile_id);
  res.json(rows);
};

exports.create = async (req, res) => {
  const { profile_id } = req.params;

  // console.log(req.body);

  const row = await service.create({
    ...req.body,
    profile_id
  });

  res.json(row);
};

exports.update = async (req, res) => {
  await service.update(req.params.id, req.body);
  res.sendStatus(204);
};

exports.remove = async (req, res) => {
  await service.remove(req.params.id);
  res.sendStatus(204);
};