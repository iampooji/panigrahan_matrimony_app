const path = require("path");

const UPLOADS_DIR = process.env.UPLOADS_DIR || "uploads";
const UPLOADS_PUBLIC_PATH =
  process.env.UPLOADS_PUBLIC_PATH || "/uploads";
const BASE_URL = process.env.BASE_URL || "";

module.exports = {
  // Absolute path on disk
  uploadsDir: path.join(__dirname, "..", UPLOADS_DIR),

  // Public URL prefix (relative)
  uploadsPublicPath: UPLOADS_PUBLIC_PATH,

  // Optional absolute URL
  uploadsBaseUrl: BASE_URL
    ? `${BASE_URL}${UPLOADS_PUBLIC_PATH}`
    : UPLOADS_PUBLIC_PATH
};
