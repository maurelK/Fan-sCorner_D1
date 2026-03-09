import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Récupérer l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({
        status: 'not_logged_in',
        message: 'Vous n\'êtes pas connecté'
      })
    }

    // Récupérer le profil utilisateur
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json({
        status: 'error',
        auth_user: user.email,
        auth_id: user.id,
        db_error: error.message,
        message: 'Erreur lecture profil DB'
      })
    }

    return NextResponse.json({
      status: 'ok',
      auth_user: user.email,
      auth_id: user.id,
      db_profile: userProfile,
      is_admin: userProfile?.role === 'admin',
      message: userProfile?.role === 'admin' ? 'Vous êtes admin ✓' : `Vous n'êtes pas admin (rôle: ${userProfile?.role})`
    })
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      error: err.message
    })
  }
}
