const mongoose = require("mongoose");
const logger = require("../utils/logger");

// Configuration de la connexion MongoDB
const connectDatabase = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/image_service";

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info("Connexion à MongoDB réussie");

    // Créer les index pour optimiser les performances
    await createIndexes();
  } catch (error) {
    logger.error(`Erreur de connexion à MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Création des index pour optimiser les performances
const createIndexes = async () => {
  try {
    // Index pour la collection images
    await mongoose.connection.db
      .collection("images")
      .createIndex({ user_id: 1 });
    await mongoose.connection.db
      .collection("images")
      .createIndex({ created_at: -1 });
    await mongoose.connection.db
      .collection("images")
      .createIndex({ status: 1 });
    await mongoose.connection.db.collection("images").createIndex({
      user_id: 1,
      created_at: -1,
    });

    logger.info("Index MongoDB créés avec succès");
  } catch (error) {
    logger.error(`Erreur lors de la création des index: ${error.message}`);
  }
};

// Schéma Mongoose pour les images
const imageSchema = new mongoose.Schema(
  {
    image_id: {
      type: String,
      required: true,
      unique: true,
      default: () => generateUUID(),
    },
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    image_url: {
      type: String,
      required: true,
    },
    image_data: {
      type: Buffer,
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ["generated", "printed", "ordered", "deleted"],
      default: "generated",
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: "images",
  }
);

// Générer un UUID
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Modèle Image
const Image = mongoose.model("Image", imageSchema);

// Fonctions utilitaires pour les requêtes
const query = {
  // Insérer une image
  insert: async (imageData) => {
    try {
      const image = new Image(imageData);
      return await image.save();
    } catch (error) {
      logger.error(`Erreur insertion MongoDB: ${error.message}`);
      throw error;
    }
  },

  // Trouver des images avec pagination
  findWithPagination: async (filter, page = 1, limit = 10) => {
    try {
      const skip = (page - 1) * limit;

      const [images, total] = await Promise.all([
        Image.find(filter)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Image.countDocuments(filter),
      ]);

      return {
        images,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Erreur requête MongoDB: ${error.message}`);
      throw error;
    }
  },

  // Trouver une image par ID
  findById: async (imageId, userId) => {
    try {
      return await Image.findOne({ image_id: imageId, user_id: userId }).lean();
    } catch (error) {
      logger.error(`Erreur requête MongoDB: ${error.message}`);
      throw error;
    }
  },

  // Supprimer une image
  deleteById: async (imageId, userId) => {
    try {
      return await Image.deleteOne({ image_id: imageId, user_id: userId });
    } catch (error) {
      logger.error(`Erreur suppression MongoDB: ${error.message}`);
      throw error;
    }
  },

  // Mettre à jour le statut d'une image
  updateStatus: async (imageId, userId, status) => {
    try {
      return await Image.findOneAndUpdate(
        { image_id: imageId, user_id: userId },
        { status },
        { new: true }
      ).lean();
    } catch (error) {
      logger.error(`Erreur mise à jour MongoDB: ${error.message}`);
      throw error;
    }
  },
};

module.exports = {
  connectDatabase,
  query,
  Image,
  generateUUID,
  mongoose,
};
