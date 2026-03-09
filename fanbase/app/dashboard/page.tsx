'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Users, DollarSign, Calendar, Plus, X, Upload, Image as ImageIcon, Settings, Camera, Trash2, Heart, MessageCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';

interface Stats {
  subscribers: number;
  revenue: number;
  pricePerMonth: number;
}

interface CreatorProfile {
  bio: string;
  category: string;
  price_fcfa: number;
  profile_image_url: string | null;
  cover_image_url: string | null;
}

const CATEGORY_OPTIONS = [
  { id: 'humor', name: 'Humour' },
  { id: 'tech', name: 'Tech' },
  { id: 'music', name: 'Musique' },
  { id: 'education', name: 'Education' },
];

interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
}

interface Subscription {
  id: string;
  created_at: string;
  users: {
    full_name: string | null;
    email: string;
  };
}

interface FanFeedbackComment {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
  post_title: string;
  author_name: string;
}

type LikesByPost = Record<string, number>;

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [stats, setStats] = useState<Stats>({ subscribers: 0, revenue: 0, pricePerMonth: 500 });
  const [posts, setPosts] = useState<Post[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [uploading, setUploading] = useState(false);
  const [feedbackComments, setFeedbackComments] = useState<FanFeedbackComment[]>([]);
  const [likesByPost, setLikesByPost] = useState<LikesByPost>({});
  const [feedbackStats, setFeedbackStats] = useState({ likes: 0, comments: 0 });
  const [feedbackWarning, setFeedbackWarning] = useState<string | null>(null);

  // Edit Profile State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState<CreatorProfile>({
    bio: '',
    category: '',
    price_fcfa: 500,
    profile_image_url: null,
    cover_image_url: null
  });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadStats(), loadPosts(), loadFeedback()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedback = async () => {
    try {
      const response = await fetch('/api/creator/feedback', { cache: 'no-store' });
      if (!response.ok) {
        setFeedbackWarning('Impossible de charger les retours des fans pour le moment.');
        return;
      }

      const data = await response.json();
      setFeedbackStats({
        likes: data.totalLikes || 0,
        comments: data.totalComments || 0,
      });
      setFeedbackComments(data.comments || []);
      setLikesByPost(data.likesByPost || {});

      if (data.warning === 'interactions_tables_missing') {
        setFeedbackWarning('Les tables de retours (likes/commentaires) ne sont pas encore créées dans Supabase.');
      } else {
        setFeedbackWarning(null);
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
      setFeedbackWarning('Impossible de charger les retours des fans pour le moment.');
    }
  };

  const loadProfile = async () => {
    // We reuse existing stats/creator endpoints but they might not return everything.
    // Let's fetch the current user's profile specifically.
    // Actually, calling /api/creator/[my_id] is one way, but we don't know ID easily without auth.
    // Let's use getSession/getUser via supabase client or create a dedicated endpoint.
    // For now, let's assume we can fetch it via a new GET endpoint or expand /api/auth/me to include profile.
    // Simplified: fetch from client side supabase for now to fill "default" values if possible, 
    // OR create a dedicated loadProfile function that calls a new GET /api/creator/profile (if we made one).
    // Let's rely on what we have: /api/creator/profile is POST only.
    // Let's use supabase client directly for reading the profile data since we are authenticated.

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profileData } = await supabase
        .from('creators_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile({
          bio: profileData.bio || '',
          category: profileData.category || '',
          price_fcfa: profileData.price_fcfa || 500,
          profile_image_url: profileData.profile_image_url,
          cover_image_url: profileData.cover_image_url
        });
        setProfilePreview(profileData.profile_image_url);
        setCoverPreview(profileData.cover_image_url);
      }
    }
  };

  // Load profile when modal opens
  useEffect(() => {
    if (showProfileModal) {
      loadProfile();
    }
  }, [showProfileModal]);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/stats', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadPosts = async () => {
    try {
      const response = await fetch('/api/posts', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');

      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle || !postContent) return;

    try {
      setUploading(true);
      let imageUrl = null;
      let videoUrl = null;

      // Upload media if provided
      if (mediaFile) {
        const formData = new FormData();
        formData.append('file', mediaFile);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json();
          if (mediaType === 'video') {
            videoUrl = url;
          } else {
            imageUrl = url;
          }
        } else {
          throw new Error('Failed to upload media');
        }
      }

      // Create post
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: postTitle,
          content: postContent,
          image_url: imageUrl,
          video_url: videoUrl,
        }),
      });

      if (response.ok) {
        // Reset form
        setPostTitle('');
        setPostContent('');
        setMediaFile(null);
        setMediaPreview(null);
        setMediaType(null);
        setShowPostForm(false);
        // Reload posts
        await loadPosts();
      } else {
        const error = await response.json();
        alert('Erreur lors de la création du post: ' + error.error);
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) return;

    try {
      const response = await fetch('/api/posts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: postId }),
      });

      if (response.ok) {
        await loadPosts();
      } else {
        const error = await response.json();
        alert('Erreur lors de la suppression: ' + error.error);
      }
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'profile') {
          setProfileImageFile(file);
          setProfilePreview(reader.result as string);
        } else {
          setCoverImageFile(file);
          setCoverPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      let pUrl = profile.profile_image_url;
      let cUrl = profile.cover_image_url;

      // Upload Profile Image
      if (profileImageFile) {
        const formData = new FormData();
        formData.append('file', profileImageFile);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          pUrl = data.url;
        }
      }

      // Upload Cover Image
      if (coverImageFile) {
        const formData = new FormData();
        formData.append('file', coverImageFile);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          cUrl = data.url;
        }
      }

      const response = await fetch('/api/creator/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          profile_image_url: pUrl,
          cover_image_url: cUrl
        })
      });

      if (response.ok) {
        alert('Profil mis à jour !');
        // Reload stats to update the price display before closing modal
        await loadStats();
        setShowProfileModal(false);
      } else {
        alert('Erreur lors de la mise à jour');
      }

    } catch (error) {
      console.error(error);
      alert('Erreur de connexion');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#faf8f5] min-h-screen py-12 flex items-center justify-center">
        <div className="text-[#2d1b4e]">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#faf8f5] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[#2d1b4e]">
            Dashboard Créateur
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowProfileModal(true)}
              className="bg-white text-[#2d1b4e] border border-orange-200 px-6 py-3 rounded-full hover:bg-orange-50 transition-colors font-semibold flex items-center gap-2"
            >
              <Settings size={20} />
              Modifier le profil
            </button>
            <button
              onClick={() => setShowPostForm(true)}
              className="bg-[#ff6b35] text-white px-6 py-3 rounded-full hover:bg-[#e55a2b] transition-colors font-semibold flex items-center gap-2"
            >
              <Plus size={20} />
              Nouveau Post
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-[#ff6b35]/10 p-3 rounded-full">
                <DollarSign className="text-[#ff6b35]" size={24} />
              </div>
              <span className="text-sm text-[#2d1b4e]/60">Revenus totaux</span>
            </div>
            <h3 className="text-3xl font-bold text-[#2d1b4e] mb-2">
              {stats.revenue.toLocaleString()} FCFA
            </h3>
            <div className="text-sm text-[#2d1b4e]/60">
              {stats.subscribers} abonné{stats.subscribers > 1 ? 's' : ''} × {stats.pricePerMonth} FCFA
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-[#ff6b35]/10 p-3 rounded-full">
                <Users className="text-[#ff6b35]" size={24} />
              </div>
              <span className="text-sm text-[#2d1b4e]/60">Abonnés</span>
            </div>
            <h3 className="text-3xl font-bold text-[#2d1b4e] mb-2">
              {stats.subscribers.toLocaleString()}
            </h3>
            <div className="text-sm text-[#2d1b4e]/60">
              Abonné{stats.subscribers > 1 ? 's' : ''} actif{stats.subscribers > 1 ? 's' : ''}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-[#ff6b35]/10 p-3 rounded-full">
                <Calendar className="text-[#ff6b35]" size={24} />
              </div>
              <span className="text-sm text-[#2d1b4e]/60">Tarif mensuel</span>
            </div>
            <h3 className="text-3xl font-bold text-[#2d1b4e] mb-2">
              {stats.pricePerMonth} FCFA
            </h3>
            <div className="text-sm text-[#2d1b4e]/60">
              Par abonné
            </div>
          </div>
        </div>

        {/* Liste des derniers abonnés */}
        {subscriptions.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100 mb-8">
            <h2 className="text-2xl font-bold text-[#2d1b4e] mb-6">Derniers abonnés</h2>
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="flex items-center justify-between p-4 bg-[#faf8f5] rounded-xl hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#ff6b35]/20 flex items-center justify-center text-[#ff6b35] font-bold">
                      {(subscription.users.full_name || subscription.users.email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2d1b4e]">
                        {subscription.users.full_name || subscription.users.email}
                      </h3>
                      <p className="text-sm text-[#2d1b4e]/60">
                        Rejoint le {new Date(subscription.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#ff6b35]">{stats.pricePerMonth} FCFA/mois</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100 mb-8">
          <h2 className="text-2xl font-bold text-[#2d1b4e] mb-6">Retours des fans</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-[#faf8f5] border border-orange-100 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ff6b35]/10 flex items-center justify-center">
                <Heart className="text-[#ff6b35]" size={18} />
              </div>
              <div>
                <p className="text-sm text-[#2d1b4e]/60">Likes reçus</p>
                <p className="text-xl font-bold text-[#2d1b4e]">{feedbackStats.likes}</p>
              </div>
            </div>

            <div className="bg-[#faf8f5] border border-orange-100 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ff6b35]/10 flex items-center justify-center">
                <MessageCircle className="text-[#ff6b35]" size={18} />
              </div>
              <div>
                <p className="text-sm text-[#2d1b4e]/60">Commentaires reçus</p>
                <p className="text-xl font-bold text-[#2d1b4e]">{feedbackStats.comments}</p>
              </div>
            </div>
          </div>

          {feedbackWarning && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-3 text-sm">
              {feedbackWarning}
            </div>
          )}
        </div>

        {/* Liste des posts */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
          <h2 className="text-2xl font-bold text-[#2d1b4e] mb-6">Mes Posts</h2>
          {posts.length === 0 ? (
            <div className="text-center py-12 text-[#2d1b4e]/60">
              Aucun post pour le moment. Créez votre premier post !
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <div key={post.id} className="border border-orange-100 rounded-xl overflow-hidden">
                  {post.video_url ? (
                    <div className="relative w-full aspect-video bg-black">
                      <video
                        src={post.video_url}
                        controls
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
                    <h3 className="text-2xl font-bold text-[#2d1b4e] mb-2">{post.title}</h3>
                    <p className="text-[#2d1b4e]/80 mb-4 whitespace-pre-wrap">{post.content}</p>

                    <div className="mb-4 border border-orange-100 rounded-xl bg-[#faf8f5] p-4">
                      <div className="flex items-center gap-6 text-sm mb-3">
                        <div className="flex items-center gap-2 text-[#2d1b4e]/80">
                          <Heart size={16} className="text-[#ff6b35]" />
                          <span>{likesByPost[post.id] || 0} j'aime</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#2d1b4e]/80">
                          <MessageCircle size={16} className="text-[#ff6b35]" />
                          <span>{feedbackComments.filter((c) => c.post_id === post.id).length} commentaires</span>
                        </div>
                      </div>

                      {feedbackComments.filter((c) => c.post_id === post.id).length === 0 ? (
                        <p className="text-sm text-[#2d1b4e]/60">Aucun retour fan sur ce post pour le moment.</p>
                      ) : (
                        <div className="space-y-2">
                          {feedbackComments
                            .filter((c) => c.post_id === post.id)
                            .slice(0, 5)
                            .map((comment) => (
                              <div key={comment.id} className="bg-white border border-orange-100 rounded-lg px-3 py-2">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-semibold text-[#2d1b4e] text-sm">{comment.author_name}</p>
                                  <p className="text-xs text-[#2d1b4e]/50">
                                    {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                                <p className="text-sm text-[#2d1b4e]/90 whitespace-pre-wrap">{comment.content}</p>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="text-sm text-[#2d1b4e]/60">
                        {new Date(post.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                        title="Supprimer le post"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Formulaire Nouveau Post */}
      {showPostForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-orange-100 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[#2d1b4e]">Nouveau Post</h2>
              <button
                onClick={() => {
                  setShowPostForm(false);
                  setPostTitle('');
                  setPostContent('');
                  setMediaFile(null);
                  setMediaPreview(null);
                  setMediaType(null);
                }}
                className="text-[#2d1b4e]/60 hover:text-[#2d1b4e]"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitPost} className="p-6 space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-[#2d1b4e] mb-2">
                  Titre *
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent text-[#2d1b4e]"
                  placeholder="Titre de votre post"
                />
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-[#2d1b4e] mb-2">
                  Contenu *
                </label>
                <textarea
                  id="content"
                  required
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent text-[#2d1b4e]"
                  placeholder="Contenu de votre post"
                />
              </div>

              <div>
                <label htmlFor="media" className="block text-sm font-medium text-[#2d1b4e] mb-2">
                  Média (Photo ou Vidéo optionnel)
                </label>
                <div className="space-y-4">
                  <input
                    id="media"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="media"
                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-orange-200 rounded-lg cursor-pointer hover:border-[#ff6b35] transition-colors text-[#2d1b4e]"
                  >
                    <Upload size={20} />
                    {mediaFile ? 'Changer le fichier' : 'Choisir une photo ou vidéo'}
                  </label>
                  {mediaPreview && (
                    <div className="relative w-full rounded-lg overflow-hidden border border-orange-200">
                      {mediaType === 'video' ? (
                        <video src={mediaPreview} controls className="w-full max-h-64 object-contain bg-black" />
                      ) : (
                        <div className="relative h-64">
                          <Image
                            src={mediaPreview}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPostForm(false);
                    setPostTitle('');
                    setPostContent('');
                    setMediaFile(null);
                    setMediaPreview(null);
                    setMediaType(null);
                  }}
                  className="flex-1 px-6 py-3 border border-orange-200 text-[#2d1b4e] rounded-lg hover:bg-orange-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploading || !postTitle || !postContent}
                  className="flex-1 bg-[#ff6b35] text-white px-6 py-3 rounded-lg hover:bg-[#e55a2b] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Publication...' : 'Publier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edition Profil */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-orange-100 px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-[#2d1b4e]">Modifier mon profil</h2>
              <button onClick={() => setShowProfileModal(false)}><X size={24} /></button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-[#2d1b4e] mb-2">Photo de couverture</label>
                <div className="relative h-48 rounded-xl bg-gray-100 overflow-hidden border border-orange-200 group">
                  {coverPreview ? (
                    <Image src={coverPreview} alt="Cover" fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <ImageIcon size={48} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm">
                      <Camera size={24} />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProfileImageChange(e, 'cover')} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Profile Image - Overlapping Cover somewhat or just separate */}
              <div>
                <label className="block text-sm font-medium text-[#2d1b4e] mb-2">Photo de profil</label>
                <div className="relative w-32 h-32 rounded-full bg-gray-100 overflow-hidden border-4 border-white shadow-lg group mx-auto md:mx-0">
                  {profilePreview ? (
                    <Image src={profilePreview} alt="Profile" fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <Users size={32} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm">
                      <Camera size={20} />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProfileImageChange(e, 'profile')} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#2d1b4e] mb-2">Catégorie</label>
                  <select
                    value={profile.category}
                    onChange={(e) => setProfile({ ...profile, category: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-200 rounded-lg bg-white"
                  >
                    <option value="">Selectionner une categorie</option>
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2d1b4e] mb-2">Prix (FCFA/mois)</label>
                  <input
                    type="number"
                    value={profile.price_fcfa}
                    onChange={(e) => setProfile({ ...profile, price_fcfa: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-orange-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2d1b4e] mb-2">Bio</label>
                <textarea
                  rows={4}
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full px-4 py-3 border border-orange-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-6 py-3 border border-orange-200 rounded-lg hover:bg-orange-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="bg-[#ff6b35] text-white px-6 py-3 rounded-lg hover:bg-[#e55a2b]"
                >
                  {savingProfile ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
