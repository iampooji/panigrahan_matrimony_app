const formEnumMapService = require("../services/formEnumMap.service");

const buildEnum = (rows) => {
  const options = [];
  const map = {};

  rows.forEach(r => {
    options.push({
      enumvalue: r.enumvalue,
      strvalue: r.strvalue
    });

    map[r.enumvalue] = r.strvalue;
  });

  return { options, map };
};

/**
 * GET /enumtypes/forms/:form
 * Returns all enums required to render a form
 */
exports.getForForm = async (req, res) => {
  const formName = req.params.form;
  const orgid = req.user.orgid;

  const rows = await formEnumMapService.getEnumsForForm(
    formName,
    orgid
  );

  const grouped = {};

  // console.log(rows[0].enum);

  rows.forEach(r => {
    const e = r.enum || r;

    if (!grouped[e.enumtype]) {
      grouped[e.enumtype] = [];
    }
    grouped[e.enumtype].push(e);
  });

  const response = {};

  Object.keys(grouped).forEach(enumtype => {
    response[enumtype] = buildEnum(grouped[enumtype]);
  });

  res.json(response);
};
