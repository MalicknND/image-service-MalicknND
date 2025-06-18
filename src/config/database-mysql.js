const mysql = require("mysql2/promise");
const logger = require("../utils/logger");

// Configuration de la base de données MySQL
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "image_service",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
};

// Pool de connexions MySQL
let pool;

// Test de connexion
const connectDatabase = async () => {
  try {
    pool = mysql.createPool(dbConfig);

    // Tester la connexion
    const connection = await pool.getConnection();
    logger.info("Connexion à MySQL réussie");

    // Créer la table images si elle n'existe pas
    await createImagesTable(connection);

    connection.release();
  } catch (error) {
    logger.error(`Erreur de connexion à MySQL: ${error.message}`);
    process.exit(1);
  }
};

// Création de la table images
const createImagesTable = async (connection) => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS images (
      image_id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      prompt TEXT NOT NULL,
      image_url TEXT NOT NULL,
      image_data LONGBLOB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status ENUM('generated', 'printed', 'ordered', 'deleted') DEFAULT 'generated',
      metadata JSON,
      INDEX idx_user_id (user_id),
      INDEX idx_created_at (created_at),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await connection.execute(createTableQuery);
    logger.info("Table images créée ou déjà existante");
  } catch (error) {
    logger.error(`Erreur lors de la création de la table: ${error.message}`);
    throw error;
  }
};

// Fonction pour exécuter des requêtes
const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    logger.error(`Erreur de requête MySQL: ${error.message}`);
    throw error;
  }
};

// Fonction pour exécuter des requêtes avec plusieurs résultats
const queryMultiple = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    logger.error(`Erreur de requête MySQL: ${error.message}`);
    throw error;
  }
};

// Générer un UUID
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

module.exports = {
  connectDatabase,
  query,
  queryMultiple,
  generateUUID,
  pool,
};
