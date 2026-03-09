'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Lock, Smartphone, CheckCircle, AlertCircle, Mail, MessageSquare, Phone, ArrowRight, XCircle, Heart, Send } from 'lucide-react';
import Image from 'next/image';
import emailjs from '@emailjs/browser';

interface Creator {
  id: string;
  name: string;
  email: string;
  bio: string;
  category: string | null;
  price_fcfa: number;
  subscribers: number;
  is_subscribed: boolean;
  profile_image_url: string | null;
  cover_image_url: string | null;
}

interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  is_locked?: boolean;
}

// Fonction de validation du numéro de téléphone pour le Bénin
const validateBeninPhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
  const cleanedPhone = phone.replace(/\s+/g, '').replace(/[^\d]/g, '');
  
  if (!cleanedPhone) {
    return { isValid: false, error: 'Le numéro de téléphone est requis' };
  }
  
  if (!/^\d+$/.test(cleanedPhone)) {
    return { isValid: false, error: 'Le numéro ne doit contenir que des chiffres' };
  }
  
  if (cleanedPhone.length !== 10 && cleanedPhone.length !== 8) {
    return { 
      isValid: false, 
      error: 'Le numéro doit avoir 10 chiffres (avec 01) ou 8 chiffres (sans 01)' 
    };
  }
  
  if (cleanedPhone.length === 10 && !cleanedPhone.startsWith('01')) {
    return { 
      isValid: false, 
      error: 'Les numéros à 10 chiffres doivent commencer par 01' 
    };
  }
  
  if (cleanedPhone.length === 8) {
    const firstDigit = cleanedPhone.charAt(0);
    if (!['6', '7', '9'].includes(firstDigit)) {
      return { 
        isValid: false, 
        error: 'Les numéros à 8 chiffres doivent commencer par 6, 7 ou 9' 
      };
    }
  }
  
  let finalPhone = cleanedPhone;
  if (cleanedPhone.length === 8) {
    finalPhone = '01' + cleanedPhone;
  }
  
  if (!/^01[67]\d{7}$/.test(finalPhone) && !/^019\d{7}$/.test(finalPhone)) {
    return { 
      isValid: false, 
      error: 'Format de numéro invalide. Format attendu: 01X XXXXXXX' 
    };
  }
  
  return { isValid: true };
};

// Fonction pour formater le numéro de téléphone pendant la saisie
const formatPhoneInput = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  const limited = numbers.slice(0, 10);
  
  if (limited.length > 2) {
    return limited.slice(0, 2) + ' ' + limited.slice(2);
  }
  
  return limited;
};

export default function CreatorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [likesByPost, setLikesByPost] = useState<Record<string, number>>({});
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Array<{ id: string; content: string; created_at: string; author_name: string }>>>({});
  const [commentDraftByPost, setCommentDraftByPost] = useState<Record<string, string>>({});
  const [submittingByPost, setSubmittingByPost] = useState<Record<string, boolean>>({});
  const [interactionsError, setInteractionsError] = useState<string | null>(null);
  const trackedPostViewsRef = useRef<Set<string>>(new Set());
  
  // État pour le paiement
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [userName, setUserName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameTouched, setNameTouched] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'mtn' | 'moov' | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [pendingSubscription, setPendingSubscription] = useState(false);
  const [showInstructionsPopup, setShowInstructionsPopup] = useState(false);

  useEffect(() => {
    loadCreatorData();
    // Initialiser EmailJS avec votre clé publique
    emailjs.init("nLaOwaOmOa1oqgZ1q");
  }, [id]);

  const loadCreatorData = async () => {
    try {
      setLoading(true);
      setApiError(null);
      
      const response = await fetch(`/api/creator/${id}`, {
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setCreator(data.creator);
          setIsSubscribed(data.creator.is_subscribed);
          setPosts(data.posts || []);
          await loadPostInteractions();
        } else {
          throw new Error('Réponse non JSON');
        }
      } else {
        throw new Error(`Erreur ${response.status}`);
      }
      
    } catch (error: any) {
      console.error('Erreur chargement créateur:', error);
      setApiError(error.message || 'Erreur de chargement');
      // Charger des données mock en cas d'erreur
      await loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = async () => {
    const mockCreator = {
      id: id,
      name: 'Maurel K',
      email: 'maurel@example.com',
      bio: "Humoriste et créateur de contenu exclusif sur Fan's Corner. Je partage du contenu humoristique chaque semaine!",
      category: 'humor',
      price_fcfa: 1000,
      subscribers: 1520,
      is_subscribed: false,
      profile_image_url: null,
      cover_image_url: null,
    };

    const mockPosts = [
      {
        id: '1',
        title: 'Contenu exclusif',
        content: 'Ceci est un contenu exclusif réservé aux abonnés.',
        image_url: null,
        video_url: null,
        created_at: new Date().toISOString(),
        is_locked: true,
      },
    ];

    await new Promise(resolve => setTimeout(resolve, 300));
    
    setCreator(mockCreator);
    setIsSubscribed(false);
    setPosts(mockPosts);
    setLikesByPost({});
    setLikedPostIds(new Set());
    setCommentsByPost({});
  };

  const loadPostInteractions = async () => {
    try {
      const response = await fetch(`/api/post-interactions?creatorId=${id}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        setInteractionsError('Impossible de charger les interactions pour le moment.');
        return;
      }

      const data = await response.json();
      setLikesByPost(data.likesByPost || {});
      setLikedPostIds(new Set(data.likedPostIds || []));
      setCommentsByPost(data.commentsByPost || {});
      setInteractionsError(null);
    } catch {
      setInteractionsError('Impossible de charger les interactions pour le moment.');
    }
  };

  const trackPostViews = async (postIds: string[]) => {
    if (postIds.length === 0) return;

    try {
      const response = await fetch('/api/post-views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postIds }),
      });

      if (!response.ok) {
        return;
      }

      postIds.forEach((postId) => trackedPostViewsRef.current.add(postId));
    } catch {
      // Silent fail: analytics tracking should never block UX
    }
  };

  useEffect(() => {
    const viewablePostIds = posts
      .filter((post) => !post.is_locked || isSubscribed)
      .map((post) => post.id)
      .filter((postId) => !trackedPostViewsRef.current.has(postId));

    if (viewablePostIds.length > 0) {
      trackPostViews(viewablePostIds);
    }
  }, [posts, isSubscribed]);

  const handleToggleLike = async (postId: string) => {
    setInteractionsError(null);
    const wasLiked = likedPostIds.has(postId);

    setLikedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });

    setLikesByPost((prev) => ({
      ...prev,
      [postId]: Math.max(0, (prev[postId] || 0) + (wasLiked ? -1 : 1)),
    }));

    try {
      const response = await fetch('/api/post-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_like', postId }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error('auth_required');
        }
        if (payload?.code === 'post_interactions_tables_missing' || response.status === 503) {
          throw new Error('interactions_tables_missing');
        }
        throw new Error('like_update_failed');
      }

      await loadPostInteractions();
    } catch (error: any) {
      setLikedPostIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });

      setLikesByPost((prev) => ({
        ...prev,
        [postId]: Math.max(0, (prev[postId] || 0) + (wasLiked ? 1 : -1)),
      }));

      if (error?.message === 'auth_required') {
        setInteractionsError('Connecte-toi pour liker ce post.');
      } else if (error?.message === 'interactions_tables_missing') {
        setInteractionsError("Likes/commentaires pas encore activés en base. Exécute le script SQL d'interactions.");
      } else {
        setInteractionsError('Action impossible pour le moment. Réessaie dans quelques secondes.');
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    const draft = (commentDraftByPost[postId] || '').trim();
    if (!draft) return;

    setInteractionsError(null);
    setSubmittingByPost((prev) => ({ ...prev, [postId]: true }));

    try {
      const response = await fetch('/api/post-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_comment', postId, content: draft }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error('auth_required');
        }
        if (payload?.code === 'post_interactions_tables_missing' || response.status === 503) {
          throw new Error('interactions_tables_missing');
        }
        throw new Error('comment_creation_failed');
      }

      setCommentDraftByPost((prev) => ({ ...prev, [postId]: '' }));
      await loadPostInteractions();
    } catch (error: any) {
      if (error?.message === 'auth_required') {
        setInteractionsError('Connecte-toi pour commenter ce post.');
      } else if (error?.message === 'interactions_tables_missing') {
        setInteractionsError("Likes/commentaires pas encore activés en base. Exécute le script SQL d'interactions.");
      } else {
        setInteractionsError('Commentaire non envoyé. Réessaie dans quelques secondes.');
      }
    } finally {
      setSubmittingByPost((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleSubscribeClick = () => {
    setPaymentSuccess(false);
    setPaymentMessage(null);
    setPaymentPhone('');
    setUserEmail('');
    setUserName('');
    setSelectedProvider(null);
    setPhoneError(null);
    setEmailError(null);
    setNameError(null);
    setPhoneTouched(false);
    setEmailTouched(false);
    setNameTouched(false);
    setShowInstructions(false);
    setShowInstructionsPopup(false);
    setPendingSubscription(false);
    setShowPaymentModal(true);
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneInput(value);
    setPaymentPhone(formatted);
    
    if (phoneTouched) {
      const validation = validateBeninPhoneNumber(formatted);
      setPhoneError(validation.error || null);
    }
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    const validation = validateBeninPhoneNumber(paymentPhone);
    setPhoneError(validation.error || null);
  };

  const validateEmail = (email: string): { isValid: boolean; error?: string } => {
    if (!email) {
      return { isValid: false, error: 'L\'email est requis' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Format d\'email invalide' };
    }
    
    return { isValid: true };
  };

  const handleEmailChange = (value: string) => {
    setUserEmail(value);
    
    if (emailTouched) {
      const validation = validateEmail(value);
      setEmailError(validation.error || null);
    }
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    const validation = validateEmail(userEmail);
    setEmailError(validation.error || null);
  };

  const validateName = (name: string): { isValid: boolean; error?: string } => {
    if (!name.trim()) {
      return { isValid: false, error: 'Le nom est requis' };
    }
    
    if (name.trim().length < 2) {
      return { isValid: false, error: 'Le nom doit avoir au moins 2 caractères' };
    }
    
    if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(name.trim())) {
      return { isValid: false, error: 'Le nom ne doit contenir que des lettres' };
    }
    
    return { isValid: true };
  };

  const handleNameChange = (value: string) => {
    setUserName(value);
    
    if (nameTouched) {
      const validation = validateName(value);
      setNameError(validation.error || null);
    }
  };

  const handleNameBlur = () => {
    setNameTouched(true);
    const validation = validateName(userName);
    setNameError(validation.error || null);
  };

  const validateForm = (): boolean => {
    const phoneValidation = validateBeninPhoneNumber(paymentPhone);
    const nameValidation = validateName(userName);
    const emailValidation = validateEmail(userEmail);
    
    let isValid = true;
    
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || 'Numéro invalide');
      setPhoneTouched(true);
      isValid = false;
    }
    
    if (!nameValidation.isValid) {
      setNameError(nameValidation.error || 'Nom invalide');
      setNameTouched(true);
      isValid = false;
    }
    
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || 'Email invalide');
      setEmailTouched(true);
      isValid = false;
    }
    
    if (!selectedProvider) {
      setPaymentMessage({
        type: 'error',
        text: 'Veuillez sélectionner un opérateur Mobile Money'
      });
      isValid = false;
    }
    
    return isValid;
  };

  const sendPaymentRequestEmail = async () => {
    // Valider le formulaire
    if (!validateForm()) {
      setPaymentMessage({
        type: 'error',
        text: 'Veuillez corriger les erreurs dans le formulaire'
      });
      return;
    }

    if (!creator || !selectedProvider) return;

    setProcessingPayment(true);
    setPaymentMessage(null);

    try {
      const finalPhone = paymentPhone.replace(/\s+/g, '');
      const formattedPhone = finalPhone.length === 8 ? '01' + finalPhone : finalPhone;
      
      console.log('🚀 Lancement du processus...');

      // 1. Essayer l'API
      console.log('📡 Appel API...');
      
      let apiSuccess = false;
      let apiResult = null;
      
      try {
        const response = await fetch('/api/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creator_id: creator.id,
            user_name: userName.trim(),
            user_email: userEmail.trim(),
            user_phone: formattedPhone,
            payment_provider: getProviderName(selectedProvider),
            amount: creator.price_fcfa
          })
        });

        apiResult = await response.json();
        console.log('📊 Réponse API:', apiResult);

        if (response.ok && apiResult.success) {
          apiSuccess = true;
          console.log('✅ API réussie');
        } else {
          console.warn('⚠️ API échouée:', apiResult?.error);
          // On continue quand même
        }
      } catch (apiError) {
        console.warn('⚠️ Erreur API:', apiError);
        // On continue quand même
      }

      if (!apiSuccess) {
        setProcessingPayment(false);
        setPaymentMessage({
          type: 'error',
          text: `Échec de la demande: ${apiResult?.error || 'merci de réessayer dans quelques instants'}`,
        });
        return;
      }

      // 2. Essayer l'email (optionnel)
      if (apiSuccess) {
        try {
          console.log('📧 Envoi email...');
          
          const templateParams = {
            creator_name: creator.name,
            creator_email: creator.email,
            creator_id: creator.id,
            user_name: userName.trim(),
            user_email: userEmail.trim(),
            user_phone: formattedPhone,
            payment_provider: getProviderName(selectedProvider),
            amount: formatMoney(creator.price_fcfa),
            reference: apiResult?.data?.reference || `REF-${Date.now()}`,
            date: new Date().toLocaleDateString('fr-FR'),
            time: new Date().toLocaleTimeString('fr-FR')
          };

          await emailjs.send(
            'service_oqkfj28', 
            'template_hrfo2el',
            templateParams
          );
          
          console.log('✅ Email envoyé');
        } catch (emailError) {
          console.warn('⚠️ Email échoué:', emailError);
          // Continuer quand même
        }
      }

      // 3. TOUJOURS afficher les instructions (SUCCÈS GARANTI)
      console.log('🎯 Affichage instructions...');
      
      // IMPORTANT: Mettre à jour les états dans le bon ordre
      setProcessingPayment(false);
      setPaymentSuccess(true);
      
      // Afficher IMMÉDIATEMENT le popup d'instructions
      setShowInstructionsPopup(true);
      
      // Message de succès
      setPaymentMessage({
        type: 'success',
        text: 'Demande envoyée avec succès ! Suivez les instructions de paiement.'
      });
      
      console.log('🎉 PROCESSUS TERMINÉ AVEC SUCCÈS');

    } catch (error: any) {
      console.error('❌ Erreur inattendue:', error);

      setProcessingPayment(false);

      setPaymentMessage({
        type: 'error',
        text: 'Erreur inattendue lors de la demande. Veuillez réessayer.'
      });
    }
  };

  const getProviderName = (provider: string) => {
    const providers: Record<string, string> = {
      mtn: 'MTN Mobile Money',
      moov: 'Moov Money'
    };
    return providers[provider] || provider;
  };

  const getProviderInstructions = (provider: string) => {
    const instructions: Record<string, { steps: string[], numbers: string[], note?: string }> = {
      mtn: {
        steps: [
          'Composez *880# sur votre téléphone et suivez la procédure d\'envoi',
          `Entrez le montant : ${formatMoney(creator?.price_fcfa || 0)} FCFA`,
          'Entrez le numéro : 01 66 49 34 07',
          'Ajoutez comme motif de transfert : "Abonnement ' + creator?.name + '"',
          'Confirmez avec votre code secret',
          'Transmettez nous l\'id de la transaction notre équipe via whatsapp (+229 66 49 34 07)',
        ],
        numbers: ['01 66 49 34 07'],
      },
      moov: {
        steps: [
          'Composez *855*8*1*1# sur votre téléphone et suivez la procédure d\'envoi',
          `Entrez le montant : ${formatMoney(creator?.price_fcfa || 0)} FCFA`,
          'Entrez le numéro : 01 58 70 22 92',
          'Ajoutez comme motif de transfert : "Abonnement ' + creator?.name + '"',
          'Confirmez avec votre code secret',
          'Transmettez nous l\'id de la transaction notre équipe via whatsapp (+229 66 49 34 07)',
        ],
        numbers: ['01 58 70 22 92'],
      }
    };
    return instructions[provider] || { steps: ['Instructions non disponibles'], numbers: [] };
  };

  const getCoverColor = (category: string | null) => {
    const colorMap: Record<string, string> = {
      'humor': 'bg-gradient-to-br from-red-400 to-pink-500',
      'tech': 'bg-gradient-to-br from-blue-400 to-purple-500',
      'music': 'bg-gradient-to-br from-purple-400 to-indigo-500',
      'education': 'bg-gradient-to-br from-green-400 to-teal-500',
    };
    return colorMap[category?.toLowerCase() || ''] || 'bg-gradient-to-br from-red-400 to-pink-500';
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const renderPaymentMessage = () => {
    if (!paymentMessage) return null;
    
    const bgColor = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    }[paymentMessage.type];

    const icon = {
      success: <CheckCircle className="text-green-500" size={20} />,
      error: <AlertCircle className="text-red-500" size={20} />,
      info: <AlertCircle className="text-blue-500" size={20} />
    }[paymentMessage.type];

    return (
      <div className={`${bgColor} border rounded-lg p-4 mb-4 flex items-start gap-3`}>
        {icon}
        <div>
          <p className="font-medium">{paymentMessage.text}</p>
          {paymentMessage.type === 'success' && (
            <p className="text-sm mt-1">
              Notre équipe va traiter votre demande sous 5 minutes.
            </p>
          )}
        </div>
      </div>
    );
  };

  // Fonction pour vérifier périodiquement le statut de l'abonnement
  const checkSubscriptionStatus = async () => {
    if (!userEmail) return;
    
    try {
      const response = await fetch(`/api/check-subscription/${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      
      if (data.is_subscribed && creator) {
        // Mettre à jour l'état local seulement si le paiement est confirmé
        setIsSubscribed(true);
        setPendingSubscription(false);
        setCreator(prev => prev ? {
          ...prev,
          subscribers: prev.subscribers + 1,
          is_subscribed: true
        } : null);
        
        // Rafraîchir les données
        await loadCreatorData();
      }
    } catch (error) {
      console.error('Erreur vérification statut:', error);
    }
  };

  // Vérifier le statut périodiquement si une demande est en attente
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (pendingSubscription && userEmail) {
      // Vérifier toutes les 30 secondes
      interval = setInterval(checkSubscriptionStatus, 30000);
      
      // Vérifier immédiatement
      checkSubscriptionStatus();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pendingSubscription, userEmail]);

  if (loading && !creator) {
    return (
      <div className="bg-[#fffafa] min-h-screen py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ef4444] mx-auto mb-4"></div>
          <p className="text-[#2d1b4e]">Chargement du créateur...</p>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="bg-[#fffafa] min-h-screen py-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#2d1b4e] text-lg mb-4">Créateur non trouvé</p>
          <button
            onClick={() => router.push('/explore')}
            className="text-[#ef4444] hover:text-[#dc2626]"
          >
            Retour à l'exploration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fffafa] min-h-screen">
      {/* Header avec photo de profil */}
      <div className={`${!creator.cover_image_url ? getCoverColor(creator.category) : ''} h-64 relative bg-gray-200`}>
        {creator.cover_image_url ? (
          <Image
            src={creator.cover_image_url}
            alt="Cover"
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className={`absolute inset-0 ${getCoverColor(creator.category)}`} />
        )}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center text-4xl font-bold text-[#2d1b4e] shadow-2xl border-4 border-white overflow-hidden relative">
            {creator.profile_image_url ? (
              <Image
                src={creator.profile_image_url}
                alt={creator.name}
                fill
                className="object-cover"
              />
            ) : (
              getInitials(creator.name)
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        {/* Message d'erreur API */}
        {apiError && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-yellow-600" size={20} />
              <div>
                <p className="font-medium text-yellow-800">Mode développement</p>
                <p className="text-sm text-yellow-700">Données mock utilisées</p>
              </div>
            </div>
          </div>
        )}

        {/* Informations du créateur */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-red-100 mb-8 text-center">
          <h1 className="text-4xl font-bold text-[#2d1b4e] mb-4">{creator.name}</h1>
          <p className="text-lg text-[#2d1b4e]/80 mb-6">{creator.bio}</p>

          <div className="flex flex-wrap items-center justify-center gap-6 mb-6">
            <div className="flex items-center gap-2 text-[#ef4444]">
              <Users size={24} />
              <span className="text-xl font-semibold">{creator.subscribers.toLocaleString()}</span>
              <span className="text-[#2d1b4e]/60">abonnés</span>
            </div>
            
            {creator.category && (
              <>
                <div className="w-px h-8 bg-red-200"></div>
                <div className="text-[#2d1b4e]/60">
                  <span className="font-semibold">Catégorie:</span> {creator.category}
                </div>
              </>
            )}
          </div>

          {/* Bouton S'abonner */}
          {!isSubscribed ? (
            <button
              onClick={handleSubscribeClick}
              className="bg-[#ef4444] text-white px-8 py-4 rounded-full hover:bg-[#dc2626] transition-colors font-semibold text-lg flex items-center gap-3 mx-auto shadow-lg"
            >
              <Smartphone size={24} />
              S'abonner ({formatMoney(creator.price_fcfa)} FCFA/mois)
            </button>
          ) : (
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-700 px-6 py-4 rounded-full font-semibold">
              <CheckCircle size={20} />
              <span>Vous êtes abonné !</span>
              <span className="text-xs bg-green-100 px-2 py-1 rounded-full">
                {creator.subscribers.toLocaleString()} abonnés
              </span>
            </div>
          )}

          {/* Message d'attente si demande en cours */}
          {pendingSubscription && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <div>
                  <p className="font-medium text-blue-800">Demande d'abonnement en attente</p>
                  <p className="text-sm text-blue-600">
                    Suivez les instructions de paiement. Votre accès sera activé dans les 5 minutes après paiement.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Liste des posts */}
        <div>
          <h2 className="text-3xl font-bold text-[#2d1b4e] mb-6">Contenu exclusif</h2>

          {interactionsError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {interactionsError}
            </div>
          )}

          {posts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-red-100">
              <p className="text-[#2d1b4e]/60 text-lg">Aucun post pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {posts.map((post) => (
              <article key={post.id} className={`bg-white rounded-2xl overflow-hidden shadow-lg border border-red-100 relative ${
                post.is_locked && !isSubscribed ? 'opacity-60' : ''
              }`}>
                {post.is_locked && !isSubscribed && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                    <div className="text-center text-white p-6">
                      <div className="bg-white/90 rounded-full p-4 shadow-xl inline-block mb-4">
                        <Lock className="text-[#ef4444]" size={32} />
                      </div>
                      <p className="font-semibold text-lg mb-2">Contenu verrouillé</p>
                      <p className="text-sm mb-4">Abonnez-vous pour débloquer ce contenu</p>
                      <button
                        onClick={handleSubscribeClick}
                        className="bg-[#ef4444] text-white px-4 py-2 rounded-lg hover:bg-[#dc2626] transition-colors"
                      >
                        S'abonner pour débloquer
                      </button>
                    </div>
                  </div>
                )}
                
                {post.video_url ? (
                  <div className="relative w-full aspect-video bg-black">
                    <video
                      src={post.video_url}
                      controls={!post.is_locked || isSubscribed}
                      className="w-full h-full"
                    />
                  </div>
                ) : post.image_url && (
                  <div className="relative w-full h-64 bg-gray-100">
                    <Image
                      src={post.image_url}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-[#2d1b4e] line-clamp-1">{post.title}</h3>
                    <span className="text-sm text-[#2d1b4e]/60">
                      {new Date(post.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-[#2d1b4e]/80 leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>

                  <div className="flex items-center gap-4 border-t border-red-100 pt-3 mb-3">
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      disabled={post.is_locked && !isSubscribed}
                      className={`inline-flex items-center gap-2 text-sm transition-colors ${
                        likedPostIds.has(post.id) ? 'text-[#ef4444]' : 'text-[#2d1b4e]/70 hover:text-[#ef4444]'
                      } disabled:opacity-50`}
                    >
                      <Heart size={16} fill={likedPostIds.has(post.id) ? 'currentColor' : 'none'} />
                      {likesByPost[post.id] || 0}
                    </button>
                    <span className="text-sm text-[#2d1b4e]/60">
                      {commentsByPost[post.id]?.length || 0} commentaires
                    </span>
                  </div>

                  {(!post.is_locked || isSubscribed) && (
                    <div className="space-y-3">
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {(commentsByPost[post.id] || []).slice(0, 5).map((comment) => (
                          <div key={comment.id} className="bg-[#fffafa] rounded-lg px-3 py-2">
                            <p className="text-xs text-[#2d1b4e]/60 mb-1">
                              {comment.author_name} · {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                            </p>
                            <p className="text-sm text-[#2d1b4e]">{comment.content}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={commentDraftByPost[post.id] || ''}
                          onChange={(e) => setCommentDraftByPost((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          placeholder="Ajouter un commentaire..."
                          className="flex-1 px-3 py-2 border border-red-200 rounded-lg text-sm text-[#2d1b4e] focus:outline-none focus:ring-2 focus:ring-[#ef4444]"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          disabled={submittingByPost[post.id] || !(commentDraftByPost[post.id] || '').trim()}
                          className="bg-[#ef4444] text-white p-2 rounded-lg hover:bg-[#dc2626] transition-colors disabled:opacity-50"
                        >
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))
            }</div>
          )}
        </div>
      </div>

      {/* Modal de paiement PRINCIPAL - LOGIQUE CORRIGÉE */}
      {showPaymentModal && creator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 my-8">
            {/* LOGIQUE CORRIGÉE */}
            {!paymentSuccess ? (
              !showInstructions ? (
                // Formulaire de paiement
                <>
                  <h2 className="text-2xl font-bold text-[#2d1b4e] mb-4">
                    Abonnement à {creator.name}
                  </h2>
                  
                  {renderPaymentMessage()}
                  
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 mb-6 border border-red-200">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-[#2d1b4e] mb-2">
                        Montant de l'abonnement
                      </p>
                      <p className="text-3xl font-bold text-[#ef4444]">
                        {formatMoney(creator.price_fcfa)} FCFA
                      </p>
                      <div className="flex items-center justify-center gap-4 mt-3 text-sm">
                        <div className="bg-white px-3 py-1 rounded-full border">
                          <span className="text-gray-600">Prochain abonné n°</span>
                          <span className="font-bold text-[#ef4444] ml-1">
                            {creator.subscribers + 1}
                          </span>
                        </div>
                        <div className="bg-white px-3 py-1 rounded-full border">
                          <span className="text-gray-600">Durée :</span>
                          <span className="font-bold text-green-600 ml-1">30 jours</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Sélection de l'opérateur */}
                    <div>
                      <label className="block text-sm font-medium text-[#2d1b4e] mb-3">
                        Sélectionnez votre opérateur Mobile Money
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {/* MTN */}
                        <button
                          type="button"
                          onClick={() => setSelectedProvider('mtn')}
                          className={`py-4 px-3 rounded-xl border-2 font-medium transition-all flex flex-col items-center gap-2 ${
                            selectedProvider === 'mtn'
                              ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="relative w-16 h-16">
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-xl">MTN</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold">MTN Money</div>
                            <div className="text-xs text-gray-500 mt-1">Bénin</div>
                          </div>
                        </button>

                        {/* Moov */}
                        <button
                          type="button"
                          onClick={() => setSelectedProvider('moov')}
                          className={`py-4 px-3 rounded-xl border-2 font-medium transition-all flex flex-col items-center gap-2 ${
                            selectedProvider === 'moov'
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="relative w-16 h-16">
                            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-xl">Moov</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold">Moov Money</div>
                            <div className="text-xs text-gray-500 mt-1">Bénin</div>
                          </div>
                        </button>
                      </div>
                      {!selectedProvider && phoneTouched && (
                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                          <XCircle size={14} />
                          Veuillez sélectionner un opérateur
                        </p>
                      )}
                    </div>

                    {/* Informations utilisateur */}
                    <div className="space-y-3">
                      {/* Nom */}
                      <div>
                        <label className="block text-sm font-medium text-[#2d1b4e] mb-2">
                          Votre nom *
                        </label>
                        <input
                          type="text"
                          value={userName}
                          onChange={(e) => handleNameChange(e.target.value)}
                          onBlur={handleNameBlur}
                          placeholder="Ex: Jean Dupont"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#ef4444] text-[#2d1b4e] ${
                            nameError && nameTouched 
                              ? 'border-red-300 bg-red-50' 
                              : 'border-red-200'
                          }`}
                        />
                        {nameError && nameTouched && (
                          <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                            <XCircle size={14} />
                            {nameError}
                          </p>
                        )}
                        {!nameError && userName && nameTouched && (
                          <p className="text-green-500 text-sm mt-2 flex items-center gap-1">
                            <CheckCircle size={14} />
                            Nom valide
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-[#2d1b4e] mb-2">
                          Votre email Fan's Corner *
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                            <Mail size={18} className={`${
                              emailError && emailTouched ? 'text-red-400' : 'text-gray-400'
                            }`} />
                          </div>
                          <input
                            type="email"
                            value={userEmail}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            onBlur={handleEmailBlur}
                            placeholder="exemple@email.com"
                            className={`w-full pl-10 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#ef4444] text-[#2d1b4e] ${
                              emailError && emailTouched 
                                ? 'border-red-300 bg-red-50' 
                                : 'border-red-200'
                            }`}
                          />
                        </div>
                        {emailError && emailTouched && (
                          <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                            <XCircle size={14} />
                            {emailError}
                          </p>
                        )}
                        {!emailError && userEmail && emailTouched && (
                          <p className="text-green-500 text-sm mt-2 flex items-center gap-1">
                            <CheckCircle size={14} />
                            Email valide
                          </p>
                        )}
                      </div>

                      {/* Numéro de téléphone */}
                      <div>
                        <label className="block text-sm font-medium text-[#2d1b4e] mb-2">
                          Votre numéro de téléphone *
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                            <Phone size={18} className={`${
                              phoneError && phoneTouched ? 'text-red-400' : 'text-gray-400'
                            }`} />
                          </div>
                          <input
                            type="tel"
                            value={paymentPhone}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            onBlur={handlePhoneBlur}
                            placeholder={`Ex: ${selectedProvider === 'mtn' ? '01 67 89 01 23' : '01 96 78 90 12'}`}
                            className={`w-full pl-10 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#ef4444] text-[#2d1b4e] ${
                              phoneError && phoneTouched 
                                ? 'border-red-300 bg-red-50' 
                                : 'border-red-200'
                            }`}
                            maxLength={12}
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <span className={`text-xs font-medium px-2 py-1 rounded ${
                              phoneError && phoneTouched 
                                ? 'bg-red-100 text-red-800' 
                                : paymentPhone.length > 0
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {paymentPhone.replace(/\D/g, '').length}/10
                            </span>
                          </div>
                        </div>
                        {phoneError && phoneTouched && (
                          <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                            <XCircle size={14} />
                            {phoneError}
                          </p>
                        )}
                        {!phoneError && paymentPhone && phoneTouched && (
                          <p className="text-green-500 text-sm mt-2 flex items-center gap-1">
                            <CheckCircle size={14} />
                            Numéro valide
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Format attendu : <strong>01 XX XX XX XX</strong> (10 chiffres)
                        </p>
                      </div>
                    </div>

                    {/* Note importante */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-blue-700 font-medium mb-1">
                            Paiement manuel et sécurisé
                          </p>
                          <p className="text-sm text-blue-600">
                            Votre accès sera activé seulement après confirmation du paiement par notre équipe.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Boutons */}
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setShowPaymentModal(false)}
                        className="flex-1 px-4 py-3 border border-red-200 text-[#2d1b4e] rounded-lg hover:bg-red-50 transition-colors text-sm"
                        disabled={processingPayment}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={sendPaymentRequestEmail}
                        disabled={processingPayment || !userName || !userEmail || !paymentPhone || !selectedProvider || !!phoneError || !!emailError || !!nameError}
                        className="flex-1 bg-gradient-to-r from-[#ef4444] to-red-500 text-white px-4 py-3 rounded-lg hover:from-[#dc2626] hover:to-red-400 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                      >
                        {processingPayment ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            <MessageSquare size={16} />
                            Envoyer la demande
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Instructions de paiement - Version simplifiée dans le modal */
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="text-green-600" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-[#2d1b4e] mb-2">
                    Demande envoyée !
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Votre demande a été enregistrée. Vérifiez votre email pour les instructions de paiement.
                  </p>
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setShowInstructions(false);
                      setPendingSubscription(true);
                    }}
                    className="w-full bg-[#ef4444] text-white px-6 py-3 rounded-lg hover:bg-[#dc2626] transition-colors"
                  >
                    Retour au profil
                  </button>
                </div>
              )
            ) : (
              // Message de confirmation d'envoi (code existant)
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <MessageSquare className="text-white" size={40} />
                </div>
                
                <h2 className="text-2xl font-bold text-[#2d1b4e] mb-3">
                  Demande envoyée avec succès !
                </h2>
                
                <p className="text-gray-600 mb-6">
                  Votre demande d'abonnement à <strong>{creator.name}</strong> a été envoyée à notre équipe.
                </p>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 border border-blue-300">
                  <div className="text-center">
                    <p className="text-[#2d1b4e] mb-1">Prochaines étapes :</p>
                    <div className="space-y-3 mt-3">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-xs">1</span>
                        </div>
                        <span className="text-sm text-gray-700">Effectuez le paiement suivant les instructions</span>
                      </div>
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-xs">2</span>
                        </div>
                        <span className="text-sm text-gray-700">Notre équipe vérifiera le paiement</span>
                      </div>
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-xs">3</span>
                        </div>
                        <span className="text-sm text-gray-700">Vous serez automatiquement abonné</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={18} className="text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      <strong>Temps d'activation :</strong> Maximum 5 minutes après réception du paiement.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPaymentSuccess(false);
                      setPendingSubscription(true);
                    }}
                    className="w-full bg-gradient-to-r from-[#ef4444] to-red-500 text-white px-6 py-3 rounded-lg hover:from-[#dc2626] hover:to-red-400 transition-colors font-medium shadow-lg"
                  >
                    Retour au profil
                  </button>
                  
                  <button
                    onClick={() => setShowInstructionsPopup(true)}
                    className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Voir à nouveau les instructions
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Popup d'instructions SEPARÉ (plus visible) */}
      {showInstructionsPopup && creator && selectedProvider && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#2d1b4e]">
                Instructions de paiement détaillées
              </h2>
              <button
                onClick={() => setShowInstructionsPopup(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-300 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <MessageSquare className="text-blue-600 mt-1" size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg text-blue-900">
                      {getProviderName(selectedProvider)}
                    </h3>
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                      En attente de paiement
                    </span>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 mb-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Créateur :</p>
                        <p className="font-semibold text-[#2d1b4e]">{creator.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Votre nom :</p>
                        <p className="font-semibold text-blue-700">{userName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Montant :</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatMoney(creator.price_fcfa)} FCFA
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Votre téléphone :</p>
                        <p className="font-semibold text-blue-700">{paymentPhone}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <h4 className="font-semibold text-blue-800 mb-1"> Étapes à suivre :</h4>
                    <ol className="space-y-2">
                      {getProviderInstructions(selectedProvider).steps.map((step, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="text-sm text-blue-900 leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  
                  <div className="border-t pt-3">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      Numéro à créditer :
                    </h4>
                    <div className="space-y-2">
                      {getProviderInstructions(selectedProvider).numbers.map((num, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
                              <Phone size={14} className="text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Numéro du destinataire</p>
                              <p className="font-mono font-bold text-lg">{num}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Opérateur</p>
                            <p className="font-semibold text-blue-700">
                              {getProviderName(selectedProvider)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-red-50 border border-red-300 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 mt-1" size={24} />
                <div>
                  <h3 className="font-bold text-lg text-red-900 mb-2">Informations importantes</h3>
                  <ul className="space-y-2 text-sm text-red-800">
                    <li className="flex items-start gap-2">
                      <ArrowRight size={16} className="flex-shrink-0 mt-0.5" />
                      <span>Utilisez <strong>{formatMoney(creator.price_fcfa)} FCFA</strong> comme montant exact</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight size={16} className="flex-shrink-0 mt-0.5" />
                      <span>Ajoutez dans le message : <strong>"Abonnement {creator.name}"</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight size={16} className="flex-shrink-0 mt-0.5" />
                      <span><strong>Conservez l'ID de transaction</strong> reçu par SMS</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight size={16} className="flex-shrink-0 mt-0.5" />
                      <span>Votre abonnement sera activé <strong>dans les 5 minutes</strong> après réception du paiement</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-300 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-600 mt-1" size={24} />
                <div>
                  <h3 className="font-bold text-lg text-green-900 mb-2">Demande enregistrée</h3>
                  <p className="text-sm text-green-800 mb-2">
                    Votre demande a été enregistrée. Notre équipe surveillera les transactions.
                  </p>
                  <p className="text-sm text-green-800">
                    Vous recevrez un email de confirmation dès que votre paiement sera vérifié.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowInstructionsPopup(false);
                  setShowPaymentModal(true);
                  setPaymentSuccess(false);
                  setShowInstructions(false);
                }}
                className="flex-1 px-4 py-3 border border-red-300 text-[#2d1b4e] rounded-lg hover:bg-red-50 transition-colors text-sm"
              >
                Modifier les informations
              </button>
              <button
                onClick={() => {
                  setShowInstructionsPopup(false);
                  setShowPaymentModal(false);
                  setPendingSubscription(true);
                }}
                className="flex-1 bg-gradient-to-r from-[#ef4444] to-red-500 text-white px-4 py-3 rounded-lg hover:from-[#dc2626] hover:to-red-400 transition-all text-sm"
              >
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}