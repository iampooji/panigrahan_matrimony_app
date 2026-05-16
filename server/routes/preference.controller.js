const { Product, Preference } = require("../models");
const { Op } = require("sequelize");

exports.matches = async (req, res) => {
  const pref = await Preference.findOne({
    where: { customerId: req.params.customerId }
  });

  const products = await Product.findAll({
    where: {
      color: pref.preferredColor,
      price: { [Op.lte]: pref.maxPrice }
    }
  });

  res.json(products);
};
