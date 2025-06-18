# Image Service

Service de gestion et stockage d'images générées par l'IA.

## Architecture

Ce service fait partie d'une architecture microservices et utilise :
- **Supabase Storage** pour le stockage des fichiers images
- **Service BDD** pour la gestion des métadonnées (PostgreSQL)
- **Clerk** pour l'authentification des utilisateurs

## Fonctionnalités

- Stockage d'images dans Supabase Storage
- Gestion des métadonnées via le service BDD
- Authentification avec Clerk
- CRUD complet pour les images
- Pagination et filtrage
- Gestion des statuts d'images

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer les variables d'environnement :
```bash
cp env.example .env
```

3. Configurer les variables dans `.env` :
   - **Service BDD** : URL du service de base de données
   - **Supabase** : Stockage des fichiers images
   - **Clerk** : Authentification des utilisateurs

## Structure des données

Les métadonnées sont gérées par le service BDD avec la table `images` :

```sql
CREATE TABLE images (
  image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_data BYTEA,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'generated',
  metadata JSONB DEFAULT '{}'
);
```

## API Endpoints

### POST /api/images
Créer une nouvelle image (stockage d'une image générée par l'IA)

**Headers :**
```
Authorization: Bearer <clerk_token>
```

**Body :**
```json
{
  "prompt": "Description de l'image générée",
  "imageData": "base64_encoded_image_data",
  "metadata": {
    "width": 1024,
    "height": 1024,
    "model": "stable-diffusion"
  }
}
```

### GET /api/images
Récupérer les images d'un utilisateur

**Headers :**
```
Authorization: Bearer <clerk_token>
```

**Query Parameters :**
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'images par page (défaut: 10, max: 100)
- `status` : Filtrer par statut (generated, printed, ordered, deleted)

### GET /api/images/:id
Récupérer le détail d'une image

**Headers :**
```
Authorization: Bearer <clerk_token>
```

### DELETE /api/images/:id
Supprimer une image

**Headers :**
```
Authorization: Bearer <clerk_token>
```

### PATCH /api/images/:id/status
Mettre à jour le statut d'une image

**Headers :**
```
Authorization: Bearer <clerk_token>
```

**Body :**
```json
{
  "status": "printed"
}
```

## Statuts d'images

- `generated` : Image générée par l'IA
- `printed` : Image imprimée
- `ordered` : Image commandée
- `deleted` : Image supprimée

## Démarrage

```bash
# Développement
npm run dev

# Production
npm start
```

Le service démarre sur le port 5002 par défaut.

## Intégration avec le service IA

Ce service est conçu pour fonctionner avec le service IA existant. Après génération d'une image par l'IA, vous pouvez l'envoyer à ce service pour la stocker :

```javascript
// Exemple d'intégration
const response = await fetch('http://localhost:5002/api/images', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${clerkToken}`
  },
  body: JSON.stringify({
    prompt: "Prompt utilisé pour générer l'image",
    imageData: base64ImageData,
    metadata: {
      width: 1024,
      height: 1024,
      model: "stable-diffusion"
    }
  })
});
```

## Communication avec le service BDD

Ce service communique avec le service BDD pour toutes les opérations de base de données :

- **Création** : POST vers `/api/images` du service BDD
- **Lecture** : GET vers `/api/images/user/:user_id` du service BDD
- **Mise à jour** : PATCH vers `/api/images/:id/status` du service BDD
- **Suppression** : DELETE vers `/api/images/:id` du service BDD

## Prérequis

- Service BDD démarré sur le port 9002
- Base de données PostgreSQL configurée
- Compte Supabase configuré
- Compte Clerk configuré 