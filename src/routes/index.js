const express = require("express");
const imageRoutes = require("./imageRoutes");

const router = express.Router();

// Routes des images
router.use("/images", imageRoutes);

// Route de santé
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Service d'images opérationnel",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
