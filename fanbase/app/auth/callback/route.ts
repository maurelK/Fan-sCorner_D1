import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Vérifier si le user existe dans la table users
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', data.user.id)
        .single();

      // Si le user n'existe pas, le créer (cas OAuth Google)
      if (!existingUser) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
              role: 'fan', // Rôle par défaut pour OAuth
              status: 'active',
            },
          ]);

        if (insertError) {
          console.error('Erreur création user OAuth:', insertError);
        }
      }

      // Redirection selon le rôle
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const redirectTo = userData?.role === 'fan' 
        ? `${origin}/fan/dashboard` 
        : `${origin}/dashboard`;

      return NextResponse.redirect(redirectTo);
    }
  }

  // Redirection par défaut en cas d'erreur
  return NextResponse.redirect(`${origin}/login`);
}

