const {
  Product,
  Attachment
} = require("../models");

const AttachmentService = require("./attachment.service");

/**
 * Create product
 */
exports.create = async (data) => {
  return Product.create(data);
};

/**
 * Update product
 */
exports.update = async (id, data) => {
  await Product.update(data, { where: { id } });
  return Product.findByPk(id);
};

/**
 * Delete product
 */
exports.remove = async (id) => {
  return Product.destroy({ where: { id } });
};

/**
 * Get product with attachments
 */
exports.getById = async (id) => {
  return Product.findByPk(id, {
    include: [
      {
        model: Attachment,
        as: "attachments",
        required: false
      }
    ]
  });
};

/**
 * List products
 */
exports.list = async () => {
  return Product.findAll({
    include: [
      {
        model: Attachment,
        as: "attachments",
        required: false
      }
    ]
  });
};

/**
 * Add product images
 */
exports.addImages = async (productId, files) => {
  return Promise.all(
    files.map(file =>
      AttachmentService.create({
        attachableType: "Product",
        attachableId: productId,
        file,
        category: "image"
      })
    )
  );
};
