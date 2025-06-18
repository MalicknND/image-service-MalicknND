const { createClient } = require("@supabase/supabase-js");
const logger = require("../utils/logger");

class SupabaseService {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    // CHANGÉ : Utilise la clé de service au lieu de la clé anon
    this.supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    this.bucketName = process.env.SUPABASE_BUCKET_NAME || "images";

    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error("Configuration Supabase manquante (URL ou SERVICE_KEY)");
    }

    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  /**
   * Uploader une image vers Supabase Storage
   * @param {Buffer} imageBuffer - Buffer de l'image
   * @param {string} fileName - Nom du fichier
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<string>} URL de l'image
   */
  async uploadImage(imageBuffer, fileName, userId) {
    try {
      // Créer un nom de fichier unique
      const timestamp = Date.now();
      const uniqueFileName = `${userId}/${timestamp}_${fileName}`;

      // Upload vers Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(uniqueFileName, imageBuffer, {
          contentType: "image/png",
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        logger.error(`Erreur upload Supabase: ${error.message}`);
        throw new Error(`Erreur lors de l'upload: ${error.message}`);
      }

      // Générer l'URL publique
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(uniqueFileName);

      logger.info(`Image uploadée avec succès: ${uniqueFileName}`);
      return urlData.publicUrl;
    } catch (error) {
      logger.error(`Erreur dans uploadImage: ${error.message}`);
      throw error;
    }
  }

  /**
   * Supprimer une image de Supabase Storage
   * @param {string} imageUrl - URL de l'image à supprimer
   * @returns {Promise<boolean>} Succès de la suppression
   */
  async deleteImage(imageUrl) {
    try {
      // Extraire le chemin du fichier depuis l'URL
      const urlParts = imageUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const filePath = urlParts.slice(-2).join("/"); // user_id/filename

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        logger.error(`Erreur suppression Supabase: ${error.message}`);
        throw new Error(`Erreur lors de la suppression: ${error.message}`);
      }

      logger.info(`Image supprimée avec succès: ${filePath}`);
      return true;
    } catch (error) {
      logger.error(`Erreur dans deleteImage: ${error.message}`);
      throw error;
    }
  }

  /**
   * Créer le bucket s'il n'existe pas
   */
  async ensureBucketExists() {
    try {
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const bucketExists = buckets.some(
        (bucket) => bucket.name === this.bucketName
      );

      if (!bucketExists) {
        const { error } = await this.supabase.storage.createBucket(
          this.bucketName,
          {
            public: true,
            allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg"],
            fileSizeLimit: 52428800, // 50MB
          }
        );

        if (error) {
          logger.error(`Erreur création bucket: ${error.message}`);
          throw error;
        }

        logger.info(`Bucket créé: ${this.bucketName}`);
      }
    } catch (error) {
      logger.error(`Erreur dans ensureBucketExists: ${error.message}`);
      throw error;
    }
  }
}

module.exports = SupabaseService;
