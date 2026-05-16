const {
  Customer,
  CustomerPreference,
  Attachment
} = require("../models");

const AttachmentService = require("./attachment.service");

/**
 * Create a customer
 */
exports.create = async (data) => {
  return Customer.create(data);
};

/**
 * Update a customer
 */
exports.update = async (id, data) => {
  await Customer.update(data, { where: { id } });
  return Customer.findByPk(id);
};

/**
 * Delete a customer
 */
exports.remove = async (id) => {
  return Customer.destroy({ where: { id } });
};

/**
 * Get customer with preferences and attachments
 */
exports.getById = async (id) => {
  return Customer.findByPk(id, {
    include: [
      CustomerPreference,
      {
        model: Attachment,
        where: { attachable_type: "Customer" },
        required: false
      }
    ]
  });
};

/**
 * List customers
 */
exports.list = async () => {
  return Customer.findAll({
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
 * Add office photos (max 6 per customer)
 */
exports.addOfficePhotos = async (customerId, files) => {
  const existingCount = await AttachmentService.countFor(
    "Customer",
    customerId,
    "office_photo"
  );

  if (existingCount + files.length > 6) {
    throw new Error("Maximum 6 office photos allowed per customer");
  }

  return Promise.all(
    files.map(file =>
      AttachmentService.create({
        attachableType: "Customer",
        attachableId: customerId,
        file,
        category: "office_photo"
      })
    )
  );
};

/**
 * Save or update customer preferences
 */
exports.savePreferences = async (customerId, preferences) => {
  const existing = await CustomerPreference.findOne({
    where: { customer_id: customerId }
  });

  if (existing) {
    await existing.update(preferences);
    return existing;
  }

  return CustomerPreference.create({
    ...preferences,
    customer_id: customerId
  });
};

/**
 * DELETE customer
 */
exports.remove = async (id) => {
  const customer = await Customer.findByPk(id);
  if (!customer) return null;

  await customer.destroy();
  return true;
};