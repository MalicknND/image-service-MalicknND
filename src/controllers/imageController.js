const SupabaseService = require("../services/supabaseService");
const BDDService = require("../services/bddService");
const logger = require("../utils/logger");

class ImageController {
  constructor() {
    this.supabaseService = new SupabaseService();
    this.bddService = new BDDService();
  }

  /**
   * Créer une nouvelle image (stockage d'une image générée par l'IA)
   */
  createImage = async (req, res, next) => {
    try {
      const { prompt, imageData, metadata = {} } = req.body;
      const userId = req.user.id;

      if (!prompt || !imageData) {
        return res.status(400).json({
          success: false,
          error: "Prompt et données d'image requis",
        });
      }

      // Convertir les données base64 en Buffer
      const imageBuffer = Buffer.from(imageData, "base64");
      const fileName = `generated_${Date.now()}.png`;

      // Upload vers Supabase Storage
      const imageUrl = await this.supabaseService.uploadImage(
        imageBuffer,
        fileName,
        userId
      );

      // Enregistrer dans le service BDD (SANS les données image)
      const bddResponse = await this.bddService.createImage({
        userId: userId,
        prompt,
        imageUrl: imageUrl,
        metadata,
      });

      const image = bddResponse.data;

      logger.info(`Image créée avec succès: ${image.id}`);

      res.status(201).json({
        success: true,
        data: {
          image_id: image.id,
          user_id: userId,
          prompt,
          image_url: imageUrl,
          created_at: image.createdAt,
          status: "generated",
          metadata,
        },
      });
    } catch (error) {
      logger.error(`Erreur création image: ${error.message}`);
      next(error);
    }
  };

  /**
   * Récupérer les images d'un utilisateur
   */
  getUserImages = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;

      const bddResponse = await this.bddService.getUserImages(userId, {
        page,
        limit,
        status,
      });

      logger.info(
        `Images récupérées pour l'utilisateur ${userId}: ${bddResponse.data.images.length}`
      );

      res.json(bddResponse);
    } catch (error) {
      logger.error(`Erreur récupération images: ${error.message}`);
      next(error);
    }
  };

  /**
   * Récupérer le détail d'une image
   */
  getImageById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const bddResponse = await this.bddService.getImageById(id, userId);

      logger.info(`Image récupérée: ${id}`);

      res.json(bddResponse);
    } catch (error) {
      logger.error(`Erreur récupération image: ${error.message}`);
      next(error);
    }
  };

  /**
   * Supprimer une image
   */
  deleteImage = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Récupérer l'image pour obtenir l'URL avant de la supprimer
      const imageResponse = await this.bddService.getImageById(id, userId);
      const imageUrl = imageResponse.data.image_url;

      // Supprimer de Supabase Storage
      await this.supabaseService.deleteImage(imageUrl);

      // Supprimer du service BDD
      await this.bddService.deleteImage(id, userId);

      logger.info(`Image supprimée: ${id}`);

      res.json({
        success: true,
        message: "Image supprimée avec succès",
      });
    } catch (error) {
      logger.error(`Erreur suppression image: ${error.message}`);
      next(error);
    }
  };

  /**
   * Mettre à jour le statut d'une image
   */
  updateImageStatus = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      const validStatuses = ["generated", "printed", "ordered", "deleted"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: "Statut invalide",
        });
      }

      const bddResponse = await this.bddService.updateImageStatus(
        id,
        status,
        userId
      );

      logger.info(`Statut image mis à jour: ${id} -> ${status}`);

      res.json(bddResponse);
    } catch (error) {
      logger.error(`Erreur mise à jour statut: ${error.message}`);
      next(error);
    }
  };
}

module.exports = new ImageController();
