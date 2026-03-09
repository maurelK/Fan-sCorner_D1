// app/api/subscribe/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    console.log('========== NOUVELLE DEMANDE ==========')
    console.log('📥 Données:', body)
    
    const {
      creator_id,
      user_name,
      user_email,
      user_phone,
      payment_provider,
      amount
    } = body

    // Validation simple
    if (!creator_id || !user_name || !user_email || !user_phone || !payment_provider || !amount) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Tous les champs sont requis'
        },
        { status: 400 }
      )
    }

    // Vérifier l'utilisateur
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Vous devez être connecté'
        },
        { status: 401 }
      )
    }

    console.log('👤 Utilisateur connecté:', user.email)
    
    // Récupérer le créateur
    let creatorName = 'Créateur'
    let creatorPrice = 500
    
    try {
      // Récupérer le créateur et son profil
      const { data: creatorData } = await supabase
        .from('users')
        .select(`
          full_name,
          email,
          creators_profile (
            price_fcfa
          )
        `)
        .eq('id', creator_id)
        .eq('role', 'creator')
        .single()

      if (creatorData) {
        creatorName = creatorData.full_name || creatorData.email.split('@')[0]

        // Extraire le prix de manière robuste (array ou object)
        const rawProfile: any = creatorData.creators_profile
        const rawPrice = Array.isArray(rawProfile)
          ? rawProfile[0]?.price_fcfa
          : rawProfile?.price_fcfa

        const parsedPrice = Number.parseInt(String(rawPrice), 10)
        creatorPrice = Number.isFinite(parsedPrice) ? parsedPrice : 500
      }
    } catch (error) {
      console.log('⚠️ Erreur récupération créateur:', error)
      // Utiliser les valeurs par défaut
    }

    // Vérifier le montant
    const receivedAmount = parseInt(amount.toString())
    
    if (receivedAmount !== creatorPrice) {
      return NextResponse.json(
        { 
          success: false,
          error: `Montant incorrect: ${receivedAmount} FCFA au lieu de ${creatorPrice} FCFA`,
          expected_amount: creatorPrice
        },
        { status: 400 }
      )
    }

    console.log('✅ Montant correct:', creatorPrice, 'FCFA')
    
    // Créer la demande (succès uniquement si persistance DB)
    const reference = `SUB-${Date.now().toString().slice(-8)}`
    let persistedRequestId: string | null = null
    let persistedTarget: 'payment_requests' | 'payments' | null = null
    
    console.log('📝 Création référence:', reference)
    
    // Essayer d'enregistrer dans payment_requests
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .insert({
          creator_id,
          fan_id: user.id,
          user_name,
          user_email,
          user_phone,
          amount: creatorPrice,
          payment_provider,
          status: 'pending',
          notes: `Abonnement à ${creatorName}`
        })
        .select('id')
        .single()

      if (error) {
        console.log('⚠️ Erreur payment_requests, tentative payments:', error.message)
        
        // Essayer dans payments
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .insert({
            user_id: user.id,
            amount: creatorPrice,
            provider: payment_provider,
            status: 'pending',
            metadata: {
              type: 'subscription_request',
              creator_id,
              creator_name: creatorName,
              user_name,
              user_email,
              user_phone
            }
          })
          .select('id')
          .single()

        if (paymentError) {
          console.log('❌ Les deux tables échouent:', paymentError.message)
        } else {
          console.log('✅ Enregistré dans payments:', paymentData.id)
          persistedRequestId = paymentData.id
          persistedTarget = 'payments'
        }
      } else {
        console.log('✅ Enregistré dans payment_requests:', data.id)
        persistedRequestId = data.id
        persistedTarget = 'payment_requests'
      }
    } catch (dbError) {
      console.log('❌ Erreur DB:', dbError)
    }

    if (!persistedRequestId || !persistedTarget) {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible d'enregistrer la demande d'abonnement",
          details: 'Aucune persistance en base (payment_requests/payments)'
        },
        { status: 500 }
      )
    }

    console.log('🎉 DEMANDE RÉUSSIE!')
    console.log('========================================')
    
    // TOUJOURS retourner une réponse positive
    return NextResponse.json({
      success: true,
      message: 'Demande reçue avec succès',
      data: {
        request_id: persistedRequestId,
        storage_target: persistedTarget,
        reference,
        status: 'pending',
        amount: creatorPrice,
        creator_name: creatorName,
        payment_provider,
        instructions: `Effectuez un transfert de ${creatorPrice} FCFA via ${payment_provider}`,
        note: 'Suivez les instructions ci-dessous'
      }
    })

  } catch (error: any) {
    console.error('❌ ERREUR:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur interne lors de la création de la demande',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

// Pour les tests GET
export async function GET() {
  return NextResponse.json({
    status: 'API subscribe active',
    mode: 'test',
    tables: ['payment_requests', 'payments', 'creators_profile']
  })
}