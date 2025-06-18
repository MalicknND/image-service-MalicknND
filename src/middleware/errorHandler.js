const logger = require("../utils/logger");

/**
 * Middleware de gestion d'erreurs
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`Erreur: ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Erreur de validation
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: "Erreur de validation",
      details: err.message,
    });
  }

  // Erreur d'authentification
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      success: false,
      error: "Token d'authentification invalide",
    });
  }

  // Erreur de base de données
  if (err.code === "23505") {
    return res.status(409).json({
      success: false,
      error: "Conflit de données",
      details: "Une ressource avec ces données existe déjà",
    });
  }

  // Erreur par défaut
  const statusCode = err.statusCode || 500;
  const message = err.message || "Erreur interne du serveur";

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
