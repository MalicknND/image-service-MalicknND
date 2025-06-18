const { jwtVerify, createRemoteJWKSet } = require("jose");
const logger = require("./logger");

const JWKS = createRemoteJWKSet(new URL(process.env.CLERK_JWKS_URL));

/**
 * Vérifie un token JWT émis par Clerk
 * @param {string} token - Le JWT à vérifier
 * @returns {Promise<Object>} - Le payload JWT décodé
 */
async function verifyClerkToken(token) {
  try {
    logger.info(`🔐 Vérification du token Clerk...`);

    if (!process.env.CLERK_JWKS_URL || !process.env.CLERK_ISSUER) {
      throw new Error("Variables CLERK_JWKS_URL ou CLERK_ISSUER manquantes");
    }

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.CLERK_ISSUER,
    });

    logger.info(`✅ Token vérifié. Utilisateur: ${payload.sub}`);
    return payload;
  } catch (error) {
    logger.error(`❌ Erreur de vérification du token Clerk: ${error.message}`);
    throw error;
  }
}

module.exports = {
  verifyClerkToken,
};
