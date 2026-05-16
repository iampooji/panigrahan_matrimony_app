const CustomerService = require("../services/customer.service");

exports.create = async (req, res) =>
  res.json(await CustomerService.create(req.body));

exports.list = async (req, res) => {
  res.json(await CustomerService.list());
}

/**
 * DELETE /api/customers/:id
 */
exports.remove = async (req, res, next) => {
  try {
    const deleted = await CustomerService.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Correct REST response
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};