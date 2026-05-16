const router = require("express").Router();
const CustomerController = require("../controllers/customer.controller");

router.get("/", CustomerController.list);
router.post("/", CustomerController.create);
router.delete("/:id", CustomerController.remove); 
// router.delete("/:id", CustomerController.remove);

module.exports = router;
