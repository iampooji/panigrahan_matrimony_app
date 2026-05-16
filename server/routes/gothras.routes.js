const express = require("express");
const router = express.Router();

const gothraController = require("../controllers/gothras.controller");

router.get("/", gothraController.getAllGothras);

module.exports = router;