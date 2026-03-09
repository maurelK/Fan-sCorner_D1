import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return null
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const privilegedClient = createServiceRoleClient() || supabase
    
    // Vérifier si l'utilisateur est admin
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { request_id, transaction_id, notes } = body

    if (!request_id || !transaction_id) {
      return NextResponse.json(
        { error: 'ID de demande et ID de transaction requis' },
        { status: 400 }
      )
    }

    // Récupérer la demande de paiement
    const { data: paymentRequest, error: requestError } = await privilegedClient
      .from('payment_requests')
      .select(`
        *,
        fan:fan_id (id, email, full_name),
        creator:creator_id (id, full_name)
      `)
      .eq('id', request_id)
      .single()

    if (requestError || !paymentRequest) {
      return NextResponse.json(
        { error: 'Demande de paiement non trouvée' },
        { status: 404 }
      )
    }

    if (paymentRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `Cette demande a déjà été traitée (statut: ${paymentRequest.status})` },
        { status: 400 }
      )
    }

    // Mettre à jour la demande de paiement
    const { error: updateError } = await privilegedClient
      .from('payment_requests')
      .update({
        status: 'completed',
        transaction_id,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', request_id)

    if (updateError) {
      throw updateError
    }

    // Créer l'abonnement
    const { error: subscriptionError } = await privilegedClient
      .from('subscriptions')
      .insert({
        fan_id: paymentRequest.fan_id,
        creator_id: paymentRequest.creator_id,
        status: 'active'
      })

    if (subscriptionError && subscriptionError.code !== '23505') {
      console.error('❌ Erreur création abonnement:', subscriptionError)

      const { error: activateExistingError } = await privilegedClient
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('fan_id', paymentRequest.fan_id)
        .eq('creator_id', paymentRequest.creator_id)

      if (activateExistingError) {
        console.error('❌ Erreur activation abonnement existant:', activateExistingError)
        return NextResponse.json(
          {
            error: 'Paiement confirmé mais abonnement non activé',
            details: activateExistingError.message,
          },
          { status: 500 }
        )
      }
    }

    const { data: activeSubscription, error: verificationError } = await privilegedClient
      .from('subscriptions')
      .select('id')
      .eq('fan_id', paymentRequest.fan_id)
      .eq('creator_id', paymentRequest.creator_id)
      .eq('status', 'active')
      .maybeSingle()

    if (verificationError || !activeSubscription) {
      console.error('❌ Vérification abonnement actif échouée:', verificationError)
      return NextResponse.json(
        {
          error: 'Paiement confirmé mais abonnement non activé',
          details: verificationError?.message || 'Abonnement actif introuvable',
        },
        { status: 500 }
      )
    }

    // Mettre à jour le paiement
    const { error: paymentUpdateError } = await privilegedClient
      .from('payments')
      .update({
        status: 'completed',
        reference: transaction_id
      })
      .eq('user_id', paymentRequest.fan_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)

    if (paymentUpdateError) {
      console.error('❌ Erreur mise à jour paiement:', paymentUpdateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Paiement confirmé et abonnement activé',
      data: {
        request_id,
        transaction_id,
        fan_id: paymentRequest.fan_id,
        creator_id: paymentRequest.creator_id,
        fan_name: (paymentRequest as any).fan?.full_name,
        creator_name: (paymentRequest as any).creator?.full_name
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur confirmation paiement:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}