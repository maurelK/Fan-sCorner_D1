# Configuration des variables d'environnement

## Créer le fichier .env.local

À la racine du projet, créez un fichier `.env.local` avec le contenu suivant :

```env
NEXT_PUBLIC_SUPABASE_URL=votre_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
```

## Où trouver ces valeurs ?

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet (ou créez-en un nouveau)
3. Allez dans **Settings** > **API**
4. Copiez :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Exemple

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Important

- Ne commitez **JAMAIS** le fichier `.env.local` dans Git
- Ce fichier est déjà dans `.gitignore`
- Chaque développeur doit créer son propre `.env.local`

