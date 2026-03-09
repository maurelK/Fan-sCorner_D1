# FANBASE - MVP

Un MVP de plateforme de type Patreon pour l'Afrique, permettant aux créateurs de monétiser leur contenu via des abonnements récurrents.

## 🚀 Technologies

- **Next.js 14** (App Router)
- **Tailwind CSS** (styling)
- **Lucide React** (icônes)
- **Supabase** (authentification et base de données)

## 📋 Prérequis

- Node.js 18+ 
- Un compte Supabase (gratuit) : [supabase.com](https://supabase.com)

## 🛠️ Installation

1. **Cloner le projet et installer les dépendances**
   ```bash
   npm install
   ```

2. **Configurer Supabase**

   - Créez un nouveau projet sur [Supabase](https://app.supabase.com)
   - Allez dans **Settings > API** pour récupérer :
     - `Project URL`
     - `anon public` key

3. **Configurer les variables d'environnement**

   Copiez le fichier d'exemple pour créer votre configuration locale :
   ```bash
   cp .env.example .env.local
   ```

   Puis remplissez les valeurs dans `.env.local` :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=votre_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
   BACKEND_API_URL=http://localhost:3001/api/v1
   BACKEND_API_TOKEN=token_optionnel_pour_routes_backend_protegees
   ```

4. **Créer les tables dans Supabase**

   - Allez dans **SQL Editor** dans votre dashboard Supabase
   - Copiez le contenu de `supabase/schema.sql`
   - Exécutez le script SQL

5. **Configurer Supabase Storage**

   - Suivez les instructions dans `SUPABASE_STORAGE_SETUP.md`
   - Créez un bucket nommé `posts` (public)
   - Configurez les politiques de sécurité pour l'upload d'images

6. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

   Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📁 Structure du projet

```
fanbase/
├── app/
│   ├── login/          # Page de connexion/inscription
│   ├── dashboard/      # Dashboard créateur
│   ├── explore/         # Page d'exploration des créateurs
│   ├── creator/[id]/    # Profil d'un créateur
│   └── auth/callback/   # Callback Supabase Auth
├── components/
│   ├── Navbar.tsx      # Navigation principale
│   └── Footer.tsx       # Footer
├── utils/
│   └── supabase/        # Clients Supabase (client, server, middleware)
├── app/api/
│   ├── posts/           # API route pour les posts (GET, POST)
│   ├── stats/           # API route pour les statistiques
│   └── upload/          # API route pour l'upload d'images
├── supabase/
│   └── schema.sql       # Schéma de base de données (inclut table posts)
└── middleware.ts        # Middleware Next.js pour l'auth
```

## 🎨 Design System

- **Couleur principale** : Orange `#ff6b35`
- **Texte** : Violet foncé `#2d1b4e`
- **Fond** : Blanc cassé `#faf8f5`

## 🔐 Authentification

L'authentification est gérée par Supabase Auth. Les utilisateurs peuvent :
- S'inscrire avec email/mot de passe
- Se connecter
- Choisir leur rôle (Fan ou Créateur)

## 📊 Base de données

Le schéma inclut :
- `users` : Profils utilisateurs (fans et créateurs)
- `creators_profile` : Profils détaillés des créateurs
- `subscriptions` : Abonnements des fans aux créateurs
- `posts` : Posts créés par les créateurs (avec images)

## 🚧 Fonctionnalités

- ✅ Page d'accueil avec Hero et témoignages
- ✅ Page d'exploration avec filtres par catégorie
- ✅ Dashboard créateur avec :
  - Statistiques réelles (Revenus, Abonnés) connectées à Supabase
  - Création de posts avec upload d'images
  - Liste des posts créés
  - Liste des abonnés actifs
- ✅ Profil créateur avec posts (certains verrouillés)
- ✅ Authentification Supabase
- ✅ Upload d'images vers Supabase Storage
- ✅ Navigation responsive

## 📝 Notes

- Les données sont actuellement mockées pour la démonstration
- L'intégration Mobile Money est simulée
- Les posts verrouillés sont visuellement floutés pour les non-abonnés

## 🔄 Prochaines étapes

- [ ] Intégration réelle Mobile Money
- [ ] Système de paiement récurrent
- [ ] Upload de fichiers (images, vidéos)
- [ ] Notifications
- [ ] Système de commentaires

## 📄 Licence

Ce projet est un MVP de démonstration.
