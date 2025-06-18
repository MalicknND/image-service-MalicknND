const winston = require("winston");

// Configuration du logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "image-service" },
  transports: [
    // Écrire tous les logs avec le niveau 'error' et moins vers 'error.log'
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    // Écrire tous les logs avec le niveau 'info' et moins vers 'combined.log'
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

// Si nous ne sommes pas en production, log aussi vers la console
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

module.exports = logger;
