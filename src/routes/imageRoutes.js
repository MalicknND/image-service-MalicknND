const express = require("express");
const { body, query, param } = require("express-validator");
const { validateRequest } = require("../middleware/validator");
const { authenticateToken } = require("../middleware/auth");
const imageController = require("../controllers/imageController");

const router = express.Router();

/**
 * @route GET /api/health
 * @desc Vérifier la santé du service
 * @access Public
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Service Images opérationnel",
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route POST /api/images
 * @desc Créer une nouvelle image (stockage d'une image générée par l'IA)
 * @access Private
 */
router.post(
  "/",
  authenticateToken,
  [
    body("prompt")
      .notEmpty()
      .withMessage("Le prompt est requis")
      .isLength({ max: 1000 })
      .withMessage("Le prompt ne peut pas dépasser 1000 caractères"),
    body("imageData")
      .notEmpty()
      .withMessage("Les données d'image sont requises")
      .isBase64()
      .withMessage("Les données d'image doivent être en base64"),
    body("metadata")
      .optional()
      .isObject()
      .withMessage("Les métadonnées doivent être un objet"),
    validateRequest,
  ],
  imageController.createImage
);

/**
 * @route GET /api/images
 * @desc Récupérer les images d'un utilisateur
 * @access Private
 */
router.get(
  "/",
  authenticateToken,
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("La page doit être un nombre positif"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("La limite doit être entre 1 et 100"),
    query("status")
      .optional()
      .isIn(["generated", "printed", "ordered", "deleted"])
      .withMessage("Statut invalide"),
    validateRequest,
  ],
  imageController.getUserImages
);

/**
 * @route GET /api/images/:id
 * @desc Récupérer le détail d'une image
 * @access Private
 */
router.get(
  "/:id",
  authenticateToken,
  [
    param("id")
      .isUUID()
      .withMessage("L'ID de l'image doit être un UUID valide"),
    validateRequest,
  ],
  imageController.getImageById
);

/**
 * @route DELETE /api/images/:id
 * @desc Supprimer une image
 * @access Private
 */
router.delete(
  "/:id",
  authenticateToken,
  [
    param("id")
      .isUUID()
      .withMessage("L'ID de l'image doit être un UUID valide"),
    validateRequest,
  ],
  imageController.deleteImage
);

/**
 * @route PATCH /api/images/:id/status
 * @desc Mettre à jour le statut d'une image
 * @access Private
 */
router.patch(
  "/:id/status",
  authenticateToken,
  [
    param("id")
      .isUUID()
      .withMessage("L'ID de l'image doit être un UUID valide"),
    body("status")
      .isIn(["generated", "printed", "ordered", "deleted"])
      .withMessage("Statut invalide"),
    validateRequest,
  ],
  imageController.updateImageStatus
);

module.exports = router;
