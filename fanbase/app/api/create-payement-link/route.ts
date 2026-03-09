// app/api/create-payment-link/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, amount, phone, creatorName } = body;

    // VOTRE CLÉ API KKIAPAY (à mettre dans .env.local)
    const apiKey = process.env.KKIAPAY_API_KEY || 'votre_api_key_ici';
    
    // Créer le lien de paiement KkiaPay
    const paymentLink = `https://kkiapay.me/p/${apiKey}?amount=${amount}&phone=${phone}&data=${encodeURIComponent(JSON.stringify({
      creator_id: creatorId,
      creator_name: creatorName,
      item: `Abonnement à ${creatorName}`,
      subscription: 'monthly'
    }))}`;

    return NextResponse.json({
      success: true,
      paymentLink,
      message: 'Lien de paiement généré'
    });

  } catch (error: any) {
    console.error('Erreur génération lien:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}