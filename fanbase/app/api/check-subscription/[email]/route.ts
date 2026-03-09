// app/api/check-subscription/[email]/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// Définir les types
interface PaymentRequest {
  id: string;
  status: string;
  created_at: string;
  amount: number;
}

interface Subscription {
  id: string;
  status: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const supabase = await createClient()
    const { email } = await params

    console.log('🔍 Vérification abonnement pour:', email)

    // 1. Récupérer l'utilisateur par email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle()

    console.log('👤 Résultat recherche user:', { user, error: userError?.message })

    if (!user) {
      return NextResponse.json({
        is_subscribed: false,
        status: 'user_not_found',
        message: 'Utilisateur non trouvé'
      })
    }

    // 2. Vérifier les demandes en attente (optionnel)
    let pendingRequests: PaymentRequest[] = []
    try {
      const { data: requests } = await supabase
        .from('payment_requests')
        .select('id, status, created_at, amount')
        .eq('fan_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5)

      pendingRequests = requests || []
      console.log('📋 Demandes en attente:', pendingRequests.length)
    } catch (requestError) {
      console.log('⚠️ Impossible de récupérer les demandes:', requestError)
    }

    // 3. Vérifier les abonnements actifs (optionnel)
    let activeSubscriptions: Subscription[] = []
    try {
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('id, status, created_at')
        .eq('fan_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      activeSubscriptions = subscriptions || []
      console.log('📊 Abonnements actifs:', activeSubscriptions.length)
    } catch (subscriptionError) {
      console.log('⚠️ Impossible de récupérer les abonnements:', subscriptionError)
    }

    // 4. Retourner le résultat
    const isSubscribed = activeSubscriptions.length > 0

    console.log('✅ Résultat vérification:', {
      email,
      user_id: user.id,
      is_subscribed: isSubscribed,
      pending_requests: pendingRequests.length,
      active_subscriptions: activeSubscriptions.length
    })

    return NextResponse.json({
      is_subscribed: isSubscribed,
      status: isSubscribed ? 'subscribed' : 'not_subscribed',
      pending_requests: pendingRequests,
      active_subscriptions: activeSubscriptions,
      user_id: user.id,
      user_email: email
    })

  } catch (error: any) {
    console.error('❌ Erreur vérification statut:', error)
    
    // Retourner une réponse par défaut en cas d'erreur
    return NextResponse.json({
      is_subscribed: false,
      status: 'error',
      message: 'Erreur de vérification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}