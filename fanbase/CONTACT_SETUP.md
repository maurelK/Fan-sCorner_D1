# Configuration du système de contact

Le système de contact est entièrement fonctionnel et **ne nécessite AUCUNE configuration externe**.

## 🎯 Comment ça fonctionne

1. **Les utilisateurs** remplissent le formulaire sur `/contact`
2. **Les messages** sont automatiquement **sauvegardés dans Supabase**
3. **Les admins** peuvent consulter tous les messages sur `/admin/contact-messages`
4. **Les admins** peuvent répondre directement par email en un clic

## 🚀 Installation (une seule fois)

### Étape 1 : Créer la table dans Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Connectez-vous à votre projet
3. Allez dans **SQL Editor**
4. Copiez et exécutez le contenu du fichier `supabase/contact_messages.sql`

**C'est tout !** Le système fonctionne immédiatement.

## 📊 Utilisation

### Pour les utilisateurs

1. Allez sur **http://localhost:3000/contact**
2. Remplissez le formulaire (nom, email, sujet, message)
3. Cliquez sur "Envoyer"
4. Un message de confirmation s'affiche

### Pour les administrateurs

1. Connectez-vous avec un compte admin
2. Allez sur **http://localhost:3000/admin/contact-messages**
3. Consultez tous les messages reçus
4. Cliquez sur "Répondre par email" pour ouvrir votre client mail
5. Les statuts des messages peuvent être : **Nouveau** / **Lu** / **Répondu**

## 🔧 Architecture technique

- **Frontend** : Formulaire React avec validation complète
- **API** : `/api/contact` (POST pour créer, GET pour lire - admin uniquement)
- **Base de données** : Table `contact_messages` dans Supabase
- **Sécurité** : Row Level Security (RLS) activé
  - Tout le monde peut envoyer des messages
  - Seuls les admins peuvent les lire

## 📧 Avantages de cette solution

✅ **Aucune configuration** requise (pas de service tiers)  
✅ **Gratuit** (inclus dans Supabase)  
✅ **Sécurisé** (données dans votre base)  
✅ **Interface admin** intégrée  
✅ **Historique complet** des messages  
✅ **Réponse facile** en un clic

## 🔒 Sécurité

- Les messages sont stockés dans Supabase avec RLS activé
- Seuls les admins peuvent voir les messages
- Les données ne quittent jamais votre infrastructure
- Validation complète côté serveur ET client

## 📝 Structure de la table

```sql
contact_messages (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT ('new' | 'read' | 'replied'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## 🆘 Support

Si vous rencontrez des problèmes :

1. **Erreur "Table not found"** → Exécutez le SQL dans Supabase
2. **Messages non visibles** → Vérifiez que vous êtes connecté comme admin
3. **Erreur d'envoi** → Vérifiez la console pour plus de détails

## 📱 Notifications (optionnel)

Pour recevoir une notification par email quand un nouveau message arrive, vous pouvez :

1. Configurer un **Webhook Supabase** sur les insertions de `contact_messages`
2. Utiliser **Supabase Edge Functions** pour envoyer des emails
3. Intégrer un service comme **Resend** ou **SendGrid**

Mais ce n'est **pas nécessaire** - vous pouvez simplement consulter `/admin/contact-messages` régulièrement.

