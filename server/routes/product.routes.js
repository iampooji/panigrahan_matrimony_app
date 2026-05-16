const router = require("express").Router();
const ProductController = require("../controllers/product.controller");
const upload = require("../middlewares/upload.middleware");

/**
 * Product CRUD
 */
router.get("/", ProductController.list);
router.get("/:id", ProductController.getById);
router.post("/", ProductController.create);
router.put("/:id", ProductController.update);
router.delete("/:id", ProductController.remove);

/**
 * Upload product images (attachments)
 * POST /api/products/:id/images
 */
router.post(
  "/:id/images",
  upload.array("files", 10),
  ProductController.addImages
);

module.exports = router;
