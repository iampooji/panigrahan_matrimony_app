const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload.middleware");
const controller = require("../controllers/attachment.controller");

router.post(
  "/:attachableType/:attachableId",
  upload.array("files", 10),
  controller.upload
);

router.get(
  "/:attachableType/:attachableId",
  controller.list
);

router.post("/:id", controller.remove);


module.exports = router;
