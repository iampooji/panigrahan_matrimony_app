const ProductService = require("../services/product.service");

/**
 * GET /api/products
 */
exports.list = async (req, res, next) => {
  try {
    const products = await ProductService.list();
    res.json(products);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const product = await ProductService.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/products
 */
exports.create = async (req, res, next) => {
  try {
    const product = await ProductService.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/products/:id
 */
exports.update = async (req, res, next) => {
  try {
    const product = await ProductService.update(req.params.id, req.body);
    res.json(product);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/products/:id
 */
exports.remove = async (req, res, next) => {
  try {
    await ProductService.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/products/:id/images
 */
exports.addImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const attachments = await ProductService.addImages(
      req.params.id,
      req.files
    );

    res.status(201).json(attachments);
  } catch (err) {
    next(err);
  }
};
