const express = require("express");
const cors = require("cors");
const { authMiddleware } = require("./middlewares/auth.middleware");
const routes = require("./routes");

const app = express();
app.use(cors());
app.use(express.json());
console.log("requireAuth typeof:", typeof authMiddleware);
app.use(authMiddleware);
app.use("/api", routes);

module.exports = app;
