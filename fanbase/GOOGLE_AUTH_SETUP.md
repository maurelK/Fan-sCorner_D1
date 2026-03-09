# Configuration de l'authentification Google OAuth

Ce guide explique comment activer l'authentification Google dans votre application Fan's Corner.

## 🎯 Résumé

L'authentification Google permet aux utilisateurs de se connecter avec leur compte Google en un clic, sans créer de mot de passe.

## 📋 Prérequis

- Un compte Google (pour Google Cloud Console)
- Accès à votre projet Supabase
- L'application doit être accessible (localhost ou domaine)

---

## Partie 1 : Configuration Google Cloud Console

### Étape 1 : Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Connectez-vous avec votre compte Google
3. Cliquez sur **"Select a project"** → **"New Project"**
4. Nom du projet : `fanscorner` (ou autre)
5. Cliquez sur **"Create"**

### Étape 2 : Activer l'API Google+

1. Dans le menu de gauche, allez dans **"APIs & Services"** → **"Library"**
2. Recherchez **"Google+ API"**
3. Cliquez dessus puis cliquez sur **"Enable"**

### Étape 3 : Configurer l'écran de consentement OAuth

1. Allez dans **"APIs & Services"** → **"OAuth consent screen"**
2. Sélectionnez **"External"** (pour permettre à n'importe qui de se connecter)
3. Cliquez sur **"Create"**

**Remplissez les informations :**

- **App name** : `Fan's Corner`
- **User support email** : votre email (ex: fanscorner2@gmail.com)
- **App logo** : (optionnel, vous pouvez l'ajouter plus tard)
- **App domain** : laissez vide pour l'instant
- **Authorized domains** : ajoutez votre domaine si vous en avez un
- **Developer contact information** : votre email

4. Cliquez sur **"Save and Continue"**
5. **Scopes** : Cliquez sur **"Add or Remove Scopes"**
   - Cochez `.../auth/userinfo.email`
   - Cochez `.../auth/userinfo.profile`
   - Cliquez sur **"Update"** puis **"Save and Continue"**
6. **Test users** : Cliquez sur **"Save and Continue"** (vous pouvez ajouter des emails de test si besoin)
7. Cliquez sur **"Back to Dashboard"**

### Étape 4 : Créer les identifiants OAuth

1. Allez dans **"APIs & Services"** → **"Credentials"**
2. Cliquez sur **"Create Credentials"** → **"OAuth client ID"**
3. **Application type** : Sélectionnez **"Web application"**
4. **Name** : `Fan's Corner Web Client`

**Authorized JavaScript origins :**
```
http://localhost:3000
https://votre-domaine.com (si vous avez un domaine)
```

**Authorized redirect URIs :**
```
https://aitibnbrqkcqmpmzflwn.supabase.co/auth/v1/callback
http://localhost:3000/auth/callback
```

5. Cliquez sur **"Create"**

### Étape 5 : Copier les identifiants

Une popup s'affiche avec :
- **Client ID** : `123456789-abcdefg.apps.googleusercontent.com`
- **Client Secret** : `GOCSPX-xyz123...`

**⚠️ COPIEZ CES DEUX VALEURS** (vous en aurez besoin pour Supabase)

---

## Partie 2 : Configuration Supabase

### Étape 1 : Ouvrir Supabase Dashboard

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Connectez-vous
3. Sélectionnez votre projet (`aitibnbrqkcqmpmzflwn`)

### Étape 2 : Activer Google Provider

1. Dans le menu de gauche, cliquez sur **"Authentication"**
2. Cliquez sur **"Providers"**
3. Cherchez **"Google"** dans la liste
4. Cliquez sur **"Google"** pour l'ouvrir

### Étape 3 : Configurer Google Provider

1. **Enable Sign in with Google** : Activez le toggle (ON)
2. **Client ID** : Collez le Client ID de Google Cloud Console
3. **Client Secret** : Collez le Client Secret de Google Cloud Console
4. **Authorized Client IDs** : laissez vide (optionnel)
5. Cliquez sur **"Save"**

### Étape 4 : Copier l'URL de callback Supabase

Supabase affiche une URL de callback :
```
https://aitibnbrqkcqmpmzflwn.supabase.co/auth/v1/callback
```

**Assurez-vous que cette URL est bien dans les "Authorized redirect URIs" de Google Cloud Console** (étape 1.4).

---

## Partie 3 : Test de l'authentification

### Étape 1 : Redémarrer le serveur

```bash
cd /home/edwin/EPITECH/EIP/Developer/fanbase
npm run dev
```

### Étape 2 : Tester la connexion

1. Ouvrez votre navigateur sur **http://localhost:3000/login**
2. Vous devriez voir le bouton **"Continuer avec Google"** avec le logo Google
3. Cliquez dessus
4. Une popup Google s'ouvre
5. Sélectionnez votre compte Google
6. Autorisez l'application
7. Vous êtes redirigé vers `/fan/dashboard` (rôle par défaut)

### Étape 3 : Vérifier dans Supabase

1. Allez dans **"Authentication"** → **"Users"** dans Supabase
2. Vous devriez voir votre nouvel utilisateur avec :
   - **Provider** : `google`
   - **Email** : votre email Google
3. Vérifiez aussi dans **"Table Editor"** → **"users"** que le user a été créé automatiquement

---

## 🔧 Fonctionnalités implémentées

✅ **Authentification Google OAuth**
- Bouton "Continuer avec Google" sur la page de connexion
- Logo Google officiel avec design moderne
- Séparateur "OU" pour distinguer email/password et OAuth

✅ **Création automatique du user**
- Quand un user se connecte avec Google pour la première fois
- Insertion automatique dans la table `users` avec :
  - `role: 'fan'` (par défaut)
  - `full_name` depuis les métadonnées Google
  - `status: 'active'`

✅ **Redirection intelligente**
- Fans → `/fan/dashboard`
- Créateurs → `/dashboard`

✅ **Gestion d'erreurs**
- Affichage des erreurs de connexion
- Fallback vers `/login` en cas d'échec

---

## 🐛 Dépannage

### Problème : "Error 400: redirect_uri_mismatch"

**Cause** : L'URL de redirection n'est pas autorisée dans Google Cloud Console

**Solution** :
1. Retournez dans Google Cloud Console → **Credentials**
2. Éditez votre OAuth client ID
3. Vérifiez que l'URL de callback Supabase est dans **Authorized redirect URIs**

### Problème : "Access blocked: This app's request is invalid"

**Cause** : L'écran de consentement OAuth n'est pas configuré

**Solution** :
1. Retournez dans Google Cloud Console → **OAuth consent screen**
2. Complétez toutes les informations requises
3. Ajoutez les scopes `.../auth/userinfo.email` et `.../auth/userinfo.profile`

### Problème : Le user n'est pas créé dans la table `users`

**Cause** : Erreur dans la callback route ou permissions RLS

**Solution** :
1. Vérifiez les logs du serveur Next.js
2. Vérifiez que la table `users` existe dans Supabase
3. Vérifiez les politiques RLS de la table `users`

### Problème : Redirection vers la mauvaise page

**Cause** : La détection du rôle échoue

**Solution** :
1. Vérifiez dans Supabase Table Editor que le user a bien un `role` défini
2. Regardez les logs serveur pour voir les erreurs de requête

---

## 📧 Email de contact pour support

Si vous rencontrez des problèmes, consultez la table `contact_messages` dans Supabase ou envoyez un message via `/contact`.

---

## 🎉 C'est terminé !

Votre application supporte maintenant :
- ✅ Connexion email/password
- ✅ Inscription email/password
- ✅ Connexion Google OAuth
- ✅ Gestion automatique des rôles
- ✅ Redirection intelligente

Les utilisateurs peuvent maintenant se connecter avec leur compte Google en un seul clic ! 🚀
