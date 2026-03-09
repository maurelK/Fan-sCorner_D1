# Fanbase Backend API

Backend NestJS pour l'application Fanbase - Une plateforme de contenu par abonnement.

## 🚀 Technologies

- **NestJS** - Framework Node.js progressif
- **Prisma** - ORM moderne pour PostgreSQL
- **PostgreSQL** (Supabase) - Base de données
- **JWT** - Authentification
- **Swagger** - Documentation API
- **TypeScript** - Langage typé

## 📋 Pré-requis

- Node.js 18+
- npm ou yarn
- Compte Supabase (pour la base de données)

## ⚙️ Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configuration de l'environnement

Copiez le fichier `.env.example` vers `.env` :

```bash
cp .env.example .env
```

Modifiez les variables dans `.env` :

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/database"

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=7d

# CORS
FRONTEND_URL=http://localhost:3000
```

### 3. Générer le client Prisma

```bash
npm run prisma:generate
```

### 4. Lancer les migrations

```bash
npm run prisma:migrate
```

## 🎯 Démarrage

### Mode développement

```bash
npm run start:dev
```

L'API sera disponible sur `http://localhost:3001/api/v1`

### Mode production

```bash
npm run build
npm run start:prod
```

## 📚 Documentation API

Une fois l'application lancée, accédez à la documentation Swagger :

```
http://localhost:3001/api/docs
```

## 🏗️ Architecture

```
src/
├── modules/
│   ├── auth/           # Authentification & autorisation
│   ├── users/          # Gestion des utilisateurs
│   ├── creators/       # Gestion des créateurs
│   ├── posts/          # Gestion des posts
│   ├── subscriptions/  # Gestion des abonnements
│   ├── messages/       # Messagerie
│   ├── payments/       # Paiements
│   └── upload/         # Upload de fichiers
├── prisma/             # Configuration Prisma
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── app.module.ts       # Module principal
└── main.ts             # Point d'entrée
```

## 📡 Endpoints principaux

### Authentication
- `POST /api/v1/auth/register` - Inscription
- `POST /api/v1/auth/login` - Connexion
- `GET /api/v1/auth/me` - Utilisateur actuel
- `POST /api/v1/auth/become-creator` - Devenir créateur

### Posts
- `GET /api/v1/posts` - Liste tous les posts
- `POST /api/v1/posts` - Créer un post (créateurs)
- `GET /api/v1/posts/my-posts` - Mes posts
- `GET /api/v1/posts/subscribed` - Posts des abonnements

### Creators
- `GET /api/v1/creators` - Liste des créateurs
- `GET /api/v1/creators/:id` - Détails d'un créateur
- `PATCH /api/v1/creators/profile` - Mettre à jour le profil

### Subscriptions
- `POST /api/v1/subscriptions` - S'abonner à un créateur
- `GET /api/v1/subscriptions/my-subscriptions` - Mes abonnements
- `DELETE /api/v1/subscriptions/:creatorId` - Se désabonner

### Messages
- `POST /api/v1/messages` - Envoyer un message
- `GET /api/v1/messages/contacts` - Liste des contacts
- `GET /api/v1/messages/conversation/:userId` - Conversation

### Payments
- `POST /api/v1/payments/request` - Créer une demande de paiement
- `POST /api/v1/payments/verify` - Vérifier un paiement
- `GET /api/v1/payments/requests` - Mes demandes de paiement

## 🔐 Authentification

Toutes les routes protégées nécessitent un JWT dans le header :

```
Authorization: Bearer <votre_token_jwt>
```

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e

# Couverture
npm run test:cov
```

## 📦 Scripts disponibles

```bash
npm run build          # Build pour production
npm run start          # Démarrer l'application
npm run start:dev      # Mode développement avec hot-reload
npm run start:prod     # Démarrer en mode production
npm run lint           # Linter le code
npm run format         # Formater le code
npm run prisma:generate # Générer le client Prisma
npm run prisma:migrate # Lancer les migrations
npm run prisma:studio  # Interface Prisma Studio
```

## 🌍 Variables d'environnement

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environnement | `development` |
| `PORT` | Port du serveur | `3001` |
| `API_PREFIX` | Préfixe des routes API | `api/v1` |
| `DATABASE_URL` | URL PostgreSQL | - |
| `SUPABASE_URL` | URL Supabase | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service Supabase | - |
| `JWT_SECRET` | Secret JWT | - |
| `JWT_EXPIRATION` | Durée du token | `7d` |
| `FRONTEND_URL` | URL du frontend | `http://localhost:3000` |

## 🚢 Déploiement

### Avec Docker

```bash
docker build -t fanbase-backend .
docker run -p 3001:3001 fanbase-backend
```

### Sur Heroku, Railway, ou Render

1. Connectez votre repo Git
2. Configurez les variables d'environnement
3. Le déploiement se fera automatiquement

## 📝 Logique Métier

Toute la logique métier est centralisée dans les **Services** :
- Validation des données (DTO + class-validator)
- Règles métier dans les services
- Transactions avec Prisma
- Gestion des erreurs avec les exceptions NestJS

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 License

MIT
