# Configuration Supabase Storage

Pour permettre l'upload d'images dans les posts, vous devez configurer un bucket Supabase Storage.

## Étapes de configuration

1. **Créer le bucket**
   - Allez dans votre projet Supabase
   - Cliquez sur **Storage** dans le menu latéral
   - Cliquez sur **New bucket**
   - Nommez-le `posts`
   - Cochez **Public bucket** (pour que les images soient accessibles publiquement)
   - Cliquez sur **Create bucket**

2. **Configurer les politiques de sécurité (RLS)**
   - Allez dans **Storage** > **Policies** pour le bucket `posts`
   - Ajoutez les politiques suivantes :

   **Politique d'upload (Insert) :**
   ```sql
   CREATE POLICY "Users can upload their own posts images"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'posts' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

   **Politique de lecture (Select) :**
   ```sql
   CREATE POLICY "Anyone can view posts images"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'posts');
   ```

   **Politique de suppression (Delete) :**
   ```sql
   CREATE POLICY "Users can delete their own posts images"
   ON storage.objects FOR DELETE
   USING (
     bucket_id = 'posts' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

3. **Vérification**
   - Les images seront stockées dans le chemin : `posts/{user_id}/{timestamp}.{ext}`
   - Les URLs publiques seront automatiquement générées par Supabase

## Note importante

Assurez-vous d'avoir exécuté le script SQL de mise à jour du schéma (`supabase/schema.sql`) qui inclut maintenant la table `posts`.

