import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

async function sendContactNotificationEmail(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
  messageId: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, reason: 'missing_resend_api_key' as const };
  }

  const toEmail = process.env.CONTACT_TO_EMAIL || 'fanscorner2@gmail.com';
  const fromEmail = process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev';

  const text = [
    'Nouveau message de contact',
    '',
    `ID: ${params.messageId}`,
    `De: ${params.name} <${params.email}>`,
    `Sujet: ${params.subject}`,
    '',
    'Message:',
    params.message,
  ].join('\n');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: `[Fan's Corner] ${params.subject}`,
      text,
      reply_to: params.email,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('Erreur envoi email Resend:', response.status, body);
    return { sent: false, reason: 'resend_send_failed' as const };
  }

  return { sent: true as const };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    // Validation longueurs minimales
    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Le nom doit contenir au moins 2 caractères' },
        { status: 400 }
      );
    }

    if (subject.trim().length < 3) {
      return NextResponse.json(
        { error: 'Le sujet doit contenir au moins 3 caractères' },
        { status: 400 }
      );
    }

    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Le message doit contenir au moins 10 caractères' },
        { status: 400 }
      );
    }

    // Créer un client Supabase serveur avec service role pour éviter les blocages RLS sur le formulaire public
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Configuration serveur Supabase incomplète' },
        { status: 500 }
      );
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey);

    // Sauvegarder le message dans la base de données
    const { data, error } = await supabase
      .from('contact_messages')
      .insert([
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          subject: subject.trim(),
          message: message.trim(),
          status: 'new',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Erreur Supabase:', error);

      if (error.code === 'PGRST205') {
        return NextResponse.json(
          {
            error: 'Table contact_messages introuvable dans Supabase. Exécutez le SQL de fanbase/supabase/contact_messages.sql dans Supabase SQL Editor.',
            code: error.code,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement du message' },
        { status: 500 }
      );
    }

    // Log pour l'admin
    console.log('📧 NOUVEAU MESSAGE DE CONTACT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`De: ${name} <${email}>`);
    console.log(`Sujet: ${subject}`);
    console.log(`Message: ${message}`);
    console.log(`ID: ${data.id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const emailResult = await sendContactNotificationEmail({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      messageId: data.id,
    });

    return NextResponse.json({
      success: true,
      message: emailResult.sent
        ? 'Message envoyé avec succès. Notification email transmise.'
        : 'Message enregistré avec succès. Notification email non configurée.',
      emailSent: emailResult.sent,
      data: {
        id: data.id,
        created_at: data.created_at,
      },
    });

  } catch (error: any) {
    console.error('Erreur API contact:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// GET pour récupérer les messages (admin uniquement)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Vérifier que l'utilisateur est admin
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé - Admin uniquement' },
        { status: 403 }
      );
    }

    // Récupérer tous les messages
    const { data: messages, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération messages:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messages,
      count: messages?.length || 0,
    });

  } catch (error: any) {
    console.error('Erreur API contact GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
