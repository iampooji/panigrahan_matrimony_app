const gothraService = require("../services/gothras.service");

exports.getAllGothras = async (req, res) => {
  try {
    const gothra = await gothraService.getAllGothras();
    res.status(200).json(gothra);
  } catch (error) {
    console.error("Error fetching gothras:", error);
    res.status(500).json({
      message: "Failed to fetch gothras"
    });
  }
};