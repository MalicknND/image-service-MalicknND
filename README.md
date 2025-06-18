# Service Images - Gestion et Stockage d'Images

## 📋 Description

Service de gestion et stockage d'images générées par IA. Ce service fait le pont entre la génération d'images (Service IA) et le stockage persistant (Supabase + Base de données). Il gère l'upload vers Supabase Storage et l'enregistrement des métadonnées dans la base PostgreSQL.

## 🏗️ Architecture

- **Framework** : Express.js
- **Stockage** : Supabase Storage
- **Base de données** : Service BDD (PostgreSQL via Prisma)
- **Authentification** : Clerk
- **Port** : 5002

## 🔄 Workflow

```
Service IA → Service Images → Supabase Storage + Service BDD
     ↓              ↓                    ↓
Génération    Upload + Métadonnées   Stockage + Persistance
```

## 🚀 API Endpoints

### POST `/api/images`
**Créer une nouvelle image (stockage d'une image générée par l'IA)**

**Headers :**
```
Authorization: Bearer <clerk-token>
Content-Type: application/json
```

**Body :**
```json
{
  "prompt": "developer",
  "imageData": "base64-encoded-image-data",
  "metadata": {
    "generated_by": "frontend",
    "timestamp": "2025-06-18T00:39:32.148Z",
    "width": 1024,
    "height": 1024,
    "steps": 30,
    "cfgScale": 7,
    "model": "stability-ai"
  }
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "image_id": "clxxx...",
    "user_id": "user_2ta6NRH0kZxG51Gcn6gCaVzJQPe",
    "prompt": "developer",
    "image_url": "https://supabase.co/storage/v1/object/public/images/...",
    "created_at": "2025-06-18T00:00:00.000Z",
    "status": "generated",
    "metadata": { ... }
  }
}
```

### GET `/api/images?page=1&limit=10&status=generated`
**Récupérer les images d'un utilisateur**

**Headers :**
```
Authorization: Bearer <clerk-token>
```

**Paramètres :**
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'images par page (défaut: 10)
- `status` : Filtrer par statut (optionnel)

### GET `/api/images/:id`
**Récupérer le détail d'une image**

### DELETE `/api/images/:id`
**Supprimer une image (Supabase + Base de données)**

### PATCH `/api/images/:id/status`
**Mettre à jour le statut d'une image**

**Body :**
```json
{
  "status": "printed" // "generated", "printed", "ordered", "deleted"
}
```

## 🔧 Configuration

### Variables d'environnement

```env
# Serveur
PORT=5002

# Clerk (Authentification)
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...

# Supabase (Stockage)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Service BDD
BDD_SERVICE_URL=http://localhost:9002

# Logging
LOG_LEVEL=info
```

### Scripts disponibles

```bash
# Développement
npm run dev

# Production
npm start

# Tests
npm test
```

## 🔐 Sécurité

### Authentification Clerk
- Vérification automatique des tokens JWT
- Extraction de l'ID utilisateur
- Middleware d'authentification sur toutes les routes

### Supabase Storage
- Bucket sécurisé avec RLS (Row Level Security)
- Organisation par utilisateur : `{userId}/{filename}`
- Accès contrôlé via policies

### Validation
- Validation des données entrantes
- Sanitisation des prompts
- Vérification des types de fichiers

## 📁 Structure des fichiers

### Upload Supabase
```
images/
├── user_2ta6NRH0kZxG51Gcn6gCaVzJQPe/
│   ├── 1750207177406_generated_1750207177406.png
│   └── 1750206957579_generated_1750206957579.png
└── user_xxx/
    └── ...
```

### Nommage des fichiers
- Format : `{timestamp}_generated_{timestamp}.png`
- Timestamp : `Date.now()`
- Extension : `.png` (format généré par l'IA)

## 🔗 Intégration

### Services connectés
- **Service IA** : Reçoit les images générées
- **Service BDD** : Enregistre les métadonnées
- **Supabase** : Stockage des fichiers
- **Frontend** : Interface utilisateur

### Communication inter-services
```javascript
// Service IA → Service Images
POST /api/images
{
  prompt, imageData, metadata
}

// Service Images → Service BDD
POST /api/images
{
  userId, prompt, imageUrl, metadata
}
```

## 🐛 Débogage

### Logs structurés
Le service utilise Winston pour des logs détaillés :

```
info: 🔐 Vérification du token Clerk...
info: ✅ Token vérifié. Utilisateur: user_xxx
info: Image uploadée avec succès: user_xxx/filename.png
error: Erreur création image dans BDD: Request failed with status code 500
```

### Erreurs courantes
- **401** : Token Clerk invalide
- **400** : Données manquantes ou invalides
- **413** : Image trop volumineuse
- **500** : Erreur Supabase ou Service BDD

### Health Check
```bash
curl http://localhost:5002/api/health
```

## 📈 Performance

### Optimisations
- **Compression** : Images optimisées avant upload
- **Cache** : Mise en cache des URLs Supabase
- **Connexions** : Pool de connexions HTTP
- **Validation** : Validation rapide des données

### Limites
- **Taille max** : 10MB par image
- **Format** : PNG uniquement
- **Rate limiting** : 100 requêtes/minute par utilisateur

## 🔄 Workflow détaillé

### 1. Réception d'image
```javascript
// Service IA envoie
{
  prompt: "developer",
  imageData: "base64...",
  metadata: { ... }
}
```

### 2. Upload Supabase
```javascript
// Conversion base64 → Buffer
const imageBuffer = Buffer.from(imageData, "base64");

// Upload vers Supabase
const imageUrl = await supabaseService.uploadImage(
  imageBuffer, 
  fileName, 
  userId
);
```

### 3. Enregistrement BDD
```javascript
// Envoi vers Service BDD
const bddResponse = await bddService.createImage({
  userId,
  prompt,
  imageUrl,
  metadata
});
```

### 4. Réponse finale
```javascript
// Retour au Service IA
{
  success: true,
  data: { image_id, user_id, prompt, image_url, ... }
}
```

## 🧪 Tests

### Tests unitaires
```bash
npm test
```

### Tests d'intégration
```bash
# Test complet IA → Images → BDD
node test-integration.js
```

### Tests manuels
```bash
# Test d'upload
curl -X POST http://localhost:5002/api/images \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","imageData":"base64..."}'
```

## 📝 Notes de développement

- **Stateless** : Aucune session côté serveur
- **Idempotent** : Même requête = même résultat
- **Fault-tolerant** : Gestion des erreurs Supabase/BDD
- **Scalable** : Architecture microservices
- **Monitoring** : Logs structurés pour observabilité 