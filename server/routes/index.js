const router = require("express").Router();

router.use("/auth", require("./auth.routes"));
router.use("/customers", require("./customer.routes"));
router.use("/products", require("./product.routes"));
router.use("/profiles", require("./profile.routes"));
router.use("/enumtypes", require("./enumtype.routes"));
router.use("/interactions", require("./interaction.routes"));
router.use("/gothras", require("./gothras.routes"));

module.exports = router;
