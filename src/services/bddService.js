const axios = require("axios");
const logger = require("../utils/logger");

class BDDService {
  constructor() {
    this.baseUrl = process.env.BDD_SERVICE_URL || "http://localhost:9002";
  }

  /**
   * Créer une image dans le service BDD
   */
  async createImage(imageData) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/images`,
        imageData
      );
      return response.data;
    } catch (error) {
      logger.error(`Erreur création image dans BDD: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupérer les images d'un utilisateur depuis le service BDD
   */
  async getUserImages(userId, options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      let url = `${this.baseUrl}/api/images?userId=${userId}&page=${page}&limit=${limit}`;

      if (status) {
        url += `&status=${status}`;
      }

      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      logger.error(`Erreur récupération images depuis BDD: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupérer une image par ID depuis le service BDD
   */
  async getImageById(imageId, userId) {
    try {
      let url = `${this.baseUrl}/api/images/${imageId}`;
      if (userId) {
        url += `?user_id=${userId}`;
      }

      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      logger.error(`Erreur récupération image depuis BDD: ${error.message}`);
      throw error;
    }
  }

  /**
   * Supprimer une image depuis le service BDD
   */
  async deleteImage(imageId, userId) {
    try {
      let url = `${this.baseUrl}/api/images/${imageId}`;
      if (userId) {
        url += `?user_id=${userId}`;
      }

      const response = await axios.delete(url);
      return response.data;
    } catch (error) {
      logger.error(`Erreur suppression image depuis BDD: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mettre à jour le statut d'une image dans le service BDD
   */
  async updateImageStatus(imageId, status, userId) {
    try {
      const response = await axios.patch(
        `${this.baseUrl}/api/images/${imageId}/status`,
        {
          status,
          user_id: userId,
        }
      );
      return response.data;
    } catch (error) {
      logger.error(`Erreur mise à jour statut depuis BDD: ${error.message}`);
      throw error;
    }
  }

  /**
   * Vérifier la santé du service BDD
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/health`);
      return response.data;
    } catch (error) {
      logger.error(`Erreur health check BDD: ${error.message}`);
      throw error;
    }
  }
}

module.exports = BDDService;
