require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { errorHandler } = require("./middleware/errorHandler");
const routes = require("./routes");
const logger = require("./utils/logger");

// Initialisation de l'application Express
const app = express();
const port = process.env.PORT || 5002;

// Middleware de base
app.use(helmet()); // Sécurité
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
); // Gestion des requêtes cross-origin
app.use(express.json({ limit: "50mb" })); // Parsing du corps des requêtes JSON
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("combined")); // Logging des requêtes HTTP

// Routes de l'API
app.use("/api", routes);

// Middleware de gestion d'erreurs
app.use(errorHandler);

// Démarrage du serveur
app.listen(port, () => {
  logger.info(`Service d'images démarré sur le port ${port}`);
});

module.exports = app; // Pour les tests
