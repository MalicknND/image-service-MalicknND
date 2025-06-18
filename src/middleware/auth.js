const { verifyClerkToken } = require("../utils/verifyClerkToken");
const logger = require("../utils/logger");

/**
 * Middleware d'authentification avec Clerk
 * Utilise la nouvelle méthode verifyClerkToken avec jose
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Token d'authentification manquant",
      });
    }

    // Vérifier le token avec notre nouvelle méthode
    const payload = await verifyClerkToken(token);

    // Ajouter les informations utilisateur à la requête
    req.user = {
      id: payload.sub,
      email: payload.email,
      firstName: payload.first_name,
      lastName: payload.last_name,
    };

    logger.info(`Utilisateur authentifié: ${req.user.id}`);
    next();
  } catch (error) {
    logger.error(`Erreur d'authentification Clerk: ${error.message}`);
    return res.status(401).json({
      success: false,
      error: "Token d'authentification Clerk invalide",
    });
  }
};

/**
 * Middleware optionnel d'authentification (pour les routes publiques)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const payload = await verifyClerkToken(token);

      req.user = {
        id: payload.sub,
        email: payload.email,
        firstName: payload.first_name,
        lastName: payload.last_name,
      };
    }

    next();
  } catch (error) {
    // En cas d'erreur, continuer sans authentification
    logger.warn(`Authentification optionnelle échouée: ${error.message}`);
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
};
