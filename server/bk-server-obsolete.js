require("dotenv").config(); // MUST be first
const app = require("./app");
const { sequelize } = require("./models");

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected");

    app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();


const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const customerRoutes = require("./routes/customer.routes");

const { requireAuth } = require("./middlewares/auth.middleware");

// const app = express();
app.use(express.json);

var corsOptions = {
  origin: "http://localhost:8081"
};

app.use(cors(corsOptions));

// // parse requests of content-type - application/json
app.use(express.json());

/**
 * PUBLIC ROUTES
 */
app.use("/api/auth", authRoutes);

/**
 * GLOBAL AUTH MIDDLEWARE
 */
app.use(requireAuth);

/**
 * PROTECTED ROUTES
 */
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);

// // parse requests of content-type - application/x-www-form-urlencoded
// app.use(express.urlencoded({ extended: true }));

// // const db = require("./app/models");

// // db.sequelize.sync();

// // simple route
// app.get("/", (req, res) => {
//   // res.json({ message: "Welcome to bezkoder application." });
//   res.send('<h1>This is CVV App</h1>');
// });

// // set port, listen for requests
// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}.`);
// });
