const express = require("express");
const cors = require("cors");

const authRoutes        = require("./routes/auth.routes");
const attachmentRoutes  = require("./routes/attachment.routes");
const productRoutes     = require("./routes/product.routes");
const customerRoutes    = require("./routes/customer.routes");
const profileRoutes     = require("./routes/profile.routes");
const enumRoutes        = require("./routes/enumtype.routes");
const addressRoutes     = require("./routes/address.routes");
const profileMatchRoutes = require("./routes/profileMatch.routes");
const occupationRoutes  = require("./routes/occupation.routes");
const interactionRoutes = require("./routes/interaction.routes");
const gothraRoutes = require("./routes/gothras.routes");
const educationRoutes = require("./routes/education.routes");


const { requireAuth } = require("./middlewares/auth.middleware");
const { uploadsPublicPath, uploadsDir } = require("./config/storage.config");

const app = express();

app.use(cors({
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

/* static */
app.use(uploadsPublicPath, express.static(uploadsDir));
app.use("/uploads", express.static("uploads"));

/* parsers */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* public routes */
app.use("/api/auth", authRoutes);

/* protected routes */
app.use(requireAuth);
app.use("/api/products",     productRoutes);
app.use("/api/customers",    customerRoutes);
app.use("/api/profiles",     profileRoutes);
app.use("/api/profilematch", profileMatchRoutes);
app.use("/api/enumtypes",    enumRoutes);
app.use("/api/addresses",    addressRoutes);
app.use("/api/attachments",  attachmentRoutes);
app.use("/api/interactions", interactionRoutes);
app.use("/api/occupation", occupationRoutes);
app.use("/api/gothra", gothraRoutes);
app.use("/api/education", educationRoutes);



module.exports = app;