'use client';

import { useEffect, useState } from 'react';
import { Mail, User, Calendar, MessageSquare, RefreshCw } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
}

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);

    try {
      // Vérifier l'authentification
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Vérifier le rôle admin
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        router.push('/');
        return;
      }

      // Récupérer les messages
      const response = await fetch('/api/contact');
      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages || []);
      } else {
        setError(data.error || 'Erreur lors du chargement des messages');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const getStatusBadge = (status: string) => {
    const styles = {
      new: 'bg-red-100 text-red-800 border-red-200',
      read: 'bg-blue-100 text-blue-800 border-blue-200',
      replied: 'bg-green-100 text-green-800 border-green-200',
    };

    const labels = {
      new: 'Nouveau',
      read: 'Lu',
      replied: 'Répondu',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffafa] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ef4444] mx-auto mb-4"></div>
          <p className="text-[#2d1b4e]">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffafa] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-[#2d1b4e] mb-2">Messages de contact</h1>
            <p className="text-[#2d1b4e]/70">
              {messages.length} message{messages.length > 1 ? 's' : ''} au total
            </p>
          </div>
          <button
            onClick={fetchMessages}
            className="flex items-center gap-2 bg-[#ef4444] text-white px-4 py-2 rounded-lg hover:bg-[#dc2626] transition-colors"
          >
            <RefreshCw size={18} />
            Actualiser
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
            {error}
          </div>
        )}

        {/* Messages List */}
        {messages.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-red-100">
            <Mail className="mx-auto mb-4 text-[#2d1b4e]/30" size={64} />
            <h2 className="text-2xl font-semibold text-[#2d1b4e] mb-2">
              Aucun message
            </h2>
            <p className="text-[#2d1b4e]/70">
              Les messages de contact apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className="bg-white rounded-2xl p-6 shadow-lg border border-red-100 hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="text-[#ef4444]" size={20} />
                      <h3 className="text-xl font-semibold text-[#2d1b4e]">
                        {message.name}
                      </h3>
                      {getStatusBadge(message.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#2d1b4e]/70">
                      <div className="flex items-center gap-1">
                        <Mail size={16} />
                        <a
                          href={`mailto:${message.email}`}
                          className="hover:text-[#ef4444] transition-colors"
                        >
                          {message.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        {formatDate(message.created_at)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="text-[#ef4444]" size={18} />
                    <h4 className="font-semibold text-[#2d1b4e]">
                      {message.subject}
                    </h4>
                  </div>
                  <p className="text-[#2d1b4e]/80 whitespace-pre-wrap pl-7">
                    {message.message}
                  </p>
                </div>

                <div className="flex gap-2 pt-4 border-t border-red-100">
                  <a
                    href={`mailto:${message.email}?subject=Re: ${message.subject}`}
                    className="px-4 py-2 bg-[#ef4444] text-white rounded-lg hover:bg-[#dc2626] transition-colors text-sm font-medium"
                  >
                    Répondre par email
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
