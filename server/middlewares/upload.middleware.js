const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { uploadsDir } = require("../config/storage.config");

// Base upload directory
// const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

// Ensure upload directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // All uploads go under /uploads
    // You can later split by entity if needed
    cb(null, uploadsDir);
  },

  filename: (req, file, cb) => {
    const unique =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, unique + path.extname(file.originalname));
  }
});

// Multer instance
const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB per file
  },

  fileFilter: (req, file, cb) => {
    // Allow only images (for now)
    if (!file.mimetype.startsWith("image/")) {
      return cb(
        new Error("Only image files are allowed"),
        false
      );
    }
    cb(null, true);
  }
});

module.exports = upload;
