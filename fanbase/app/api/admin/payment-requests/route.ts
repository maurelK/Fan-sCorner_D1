import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Vérifier l'utilisateur et son rôle (même logique que debug)
    const { data: { user } } = await supabase.auth.getUser()
    console.log('📍 Auth user:', user?.email, user?.id)
    
    if (!user) {
      console.log('❌ Pas d\'utilisateur authentifié')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', user.id)
      .single()

    console.log('👤 DB Profile:', userProfile, 'Error:', profileError?.message)

    if (profileError || !userProfile) {
      console.error('❌ Erreur profil DB:', profileError?.message)
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 403 })
    }

    if (userProfile.role !== 'admin') {
      console.log('❌ Utilisateur pas admin:', userProfile.role)
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    console.log('✅ Admin vérifié:', userProfile.email)

    // Récupérer demandes pending
    const { data, error } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('❌ Erreur récupération demandes:', error)
      return NextResponse.json({ error: 'Erreur base de données', details: error.message }, { status: 500 })
    }

    console.log('✅ Demandes trouvées:', data?.length || 0)
    return NextResponse.json({ requests: data || [] })
  } catch (err: any) {
    console.error('❌ Erreur API admin payment-requests:', err)
    return NextResponse.json({ error: 'Erreur serveur', details: err.message }, { status: 500 })
  }
}
