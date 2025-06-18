const { Pool } = require("pg");
const logger = require("../utils/logger");

// Configuration de la base de données PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "image_service",
  password: process.env.DB_PASSWORD || "password",
  port: process.env.DB_PORT || 5432,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Test de connexion
const connectDatabase = async () => {
  try {
    const client = await pool.connect();
    logger.info("Connexion à PostgreSQL réussie");

    // Créer la table images si elle n'existe pas
    await createImagesTable(client);

    client.release();
  } catch (error) {
    logger.error(`Erreur de connexion à PostgreSQL: ${error.message}`);
    process.exit(1);
  }
};

// Création de la table images
const createImagesTable = async (client) => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS images (
      image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) NOT NULL,
      prompt TEXT NOT NULL,
      image_url TEXT NOT NULL,
      image_data BYTEA,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(50) DEFAULT 'generated',
      metadata JSONB DEFAULT '{}',
      CONSTRAINT valid_status CHECK (status IN ('generated', 'printed', 'ordered', 'deleted'))
    );
    
    -- Index pour améliorer les performances
    CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
    CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);
    CREATE INDEX IF NOT EXISTS idx_images_status ON images(status);
  `;

  try {
    await client.query(createTableQuery);
    logger.info("Table images créée ou déjà existante");
  } catch (error) {
    logger.error(`Erreur lors de la création de la table: ${error.message}`);
    throw error;
  }
};

// Fonction pour exécuter des requêtes
const query = (text, params) => pool.query(text, params);

module.exports = {
  connectDatabase,
  query,
  pool,
};
