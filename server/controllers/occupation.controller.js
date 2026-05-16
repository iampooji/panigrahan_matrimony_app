const service = require("../services/occupation.service");

exports.list = async (req, res) => {
  const { parenttype, parentid } = req.params;
  const rows = await service.findByRelation(parenttype, parentid);
  res.json(rows);
};

exports.create = async (req, res) => {
  const { parenttype, parentid } = req.params;

  // console.log(req.params);
  console.log(req.body);

  const row = await service.create({
    ...req.body,
    parenttype,
    parentid
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
