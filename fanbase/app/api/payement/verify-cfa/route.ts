// app/api/payment/verify-fcfa/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transactionId, amount, phone, creatorId, paymentMethod } = body;

    console.log('🔍 Vérification paiement FCFA:', {
      transactionId,
      amount,
      phone,
      currency: 'FCFA'
    });

    // 1. Vérifier la clé privée
    const privateKey = process.env.NEXT_PUBLIC_KKIAPAY_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        { success: false, error: 'Configuration KkiaPay manquante' },
        { status: 500 }
      );
    }

    // 2. Vérifier avec l'API KkiaPay
    const verifyResponse = await fetch(
      `https://api.kkiapay.me/api/v1/transactions/${transactionId}/status`,
      {
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': privateKey,
        },
      }
    );

    if (!verifyResponse.ok) {
      throw new Error(`API KkiaPay: ${verifyResponse.status}`);
    }

    const kkiapayData = await verifyResponse.json();
    console.log('📊 Réponse KkiaPay:', kkiapayData);

    // 3. Valider le statut
    if (kkiapayData.status !== 'SUCCESS') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Transaction non réussie',
          status: kkiapayData.status 
        },
        { status: 400 }
      );
    }

    // 4. Valider le montant (en FCFA)
    if (kkiapayData.amount !== amount) {
      console.warn(`Montant mismatch: API=${kkiapayData.amount}, Attendu=${amount}`);
      // Pour certains cas, tolérer une petite différence
      if (Math.abs(kkiapayData.amount - amount) > 10) {
        return NextResponse.json(
          { success: false, error: 'Montant incorrect' },
          { status: 400 }
        );
      }
    }

    // 5. Récupérer l'utilisateur
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non authentifié' },
        { status: 401 }
      );
    }

    // 6. Enregistrer la transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        creator_id: creatorId,
        transaction_id: transactionId,
        amount: amount,
        currency: 'FCFA',
        status: 'completed',
        payment_method: paymentMethod,
        phone: phone,
        metadata: kkiapayData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Erreur transaction:', transactionError);
      return NextResponse.json(
        { success: false, error: 'Erreur enregistrement transaction' },
        { status: 500 }
      );
    }

    // 7. Créer ou mettre à jour l'abonnement
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        creator_id: creatorId,
        transaction_id: transactionId,
        amount: amount,
        currency: 'FCFA',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
        auto_renew: true,
      }, {
        onConflict: 'user_id,creator_id'
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Erreur abonnement:', subscriptionError);
    }

    // 8. Mettre à jour les statistiques
    await supabase.rpc('increment_subscriber_count', { creator_id: creatorId });

    return NextResponse.json({
      success: true,
      data: {
        transaction,
        subscription,
        kkiapayData,
        message: `Paiement de ${amount} FCFA confirmé`,
      },
    });

  } catch (error: any) {
    console.error('❌ Erreur vérification FCFA:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erreur de vérification',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}