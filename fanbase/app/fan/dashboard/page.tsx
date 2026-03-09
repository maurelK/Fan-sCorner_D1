'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, ExternalLink, XCircle, User } from 'lucide-react';

interface Subscription {
    id: string;
    creator: {
        id: string;
        name: string;
        email: string;
        category: string | null;
        price_fcfa: number;
    };
    status: string;
    created_at: string;
}

const CATEGORIES = ['Musique', 'Danse', 'Comédie', 'Lifestyle', 'Éducation', 'Art', 'Tech'];

export default function FanDashboard() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    // Become Creator State
    const [showCreatorModal, setShowCreatorModal] = useState(false);
    const [bio, setBio] = useState('');
    const [price, setPrice] = useState('500');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [upgrading, setUpgrading] = useState(false);

    useEffect(() => {
        loadSubscriptions();
    }, []);

    const loadSubscriptions = async () => {
        try {
            const response = await fetch('/api/fan/subscriptions');
            if (response.ok) {
                const data = await response.json();
                setSubscriptions(data.subscriptions || []);
            }
        } catch (error) {
            console.error('Error loading subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnsubscribe = async (creatorId: string, creatorName: string) => {
        if (!confirm(`Voulez-vous vraiment vous désabonner de ${creatorName} ?`)) return;

        try {
            const response = await fetch('/api/subscription', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creator_id: creatorId }),
            });

            if (response.ok) {
                alert('Abonnement annulé.');
                loadSubscriptions();
            } else {
                alert('Erreur lors de la désinscription');
            }
        } catch (error) {
            console.error('Error unsubscribing:', error);
        }
    };

    const getInitials = (name: string) => {
        return name.substring(0, 2).toUpperCase();
    };

    const handleBecomeCreator = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpgrading(true);

        try {
            const response = await fetch('/api/auth/become-creator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bio, price, category }),
            });

            if (response.ok) {
                alert('Félicitations ! Vous êtes maintenant un Créateur.');
                // Force hard reload to update session/navbar
                window.location.href = '/dashboard';
            } else {
                const data = await response.json();
                alert('Erreur: ' + (data.error || 'Une erreur est survenue'));
            }
        } catch (error) {
            console.error('Error upgrading:', error);
            alert('Erreur de connexion');
        } finally {
            setUpgrading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-[#fffafa] min-h-screen py-12 flex items-center justify-center">
                <div className="text-[#2d1b4e]">Chargement...</div>
            </div>
        );
    }

    return (
        <div className="bg-[#fffafa] min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-[#2d1b4e]">
                        Mes Abonnements
                    </h1>
                    <button
                        onClick={() => setShowCreatorModal(true)}
                        className="bg-[#2d1b4e] text-white px-6 py-3 rounded-full hover:bg-[#2d1b4e]/90 transition-colors font-semibold shadow-lg flex items-center gap-2"
                    >
                        ✨ Devenir Créateur
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8">
                    {subscriptions.length === 0 ? (
                        <div className="text-center py-12">
                            <User size={64} className="mx-auto text-[#ef4444]/40 mb-4" />
                            <p className="text-xl text-[#2d1b4e]/60 mb-8">
                                Vous n'êtes abonné à aucun créateur pour le moment.
                            </p>
                            <Link
                                href="/explore"
                                className="bg-[#ef4444] text-white px-8 py-3 rounded-full hover:bg-[#dc2626] transition-colors font-semibold"
                            >
                                Explorer les créateurs
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {subscriptions.map((sub) => (
                                <div key={sub.id} className="bg-[#fffafa] rounded-xl p-6 border border-red-200 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 rounded-full bg-[#ef4444] text-white flex items-center justify-center text-xl font-bold shadow-md">
                                            {getInitials(sub.creator.name)}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-[#2d1b4e]">{sub.creator.name}</h3>
                                            <p className="text-sm text-[#2d1b4e]/60">{sub.creator.category || 'Créateur'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mb-6 text-sm">
                                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                                            Actif
                                        </div>
                                        <div className="font-semibold text-[#2d1b4e]">
                                            {sub.creator.price_fcfa} FCFA/mois
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <Link
                                            href={`/creator/${sub.creator.id}`}
                                            className="w-full flex items-center justify-center gap-2 bg-[#2d1b4e] text-white px-4 py-2 rounded-lg hover:bg-[#2d1b4e]/90 transition-colors"
                                        >
                                            <ExternalLink size={18} />
                                            Voir le profil
                                        </Link>
                                        <button
                                            onClick={() => handleUnsubscribe(sub.creator.id, sub.creator.name)}
                                            className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                                        >
                                            <XCircle size={18} />
                                            Se désabonner
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Become Creator Modal */}
            {showCreatorModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-[#2d1b4e] mb-4">Devenir Créateur</h2>
                        <p className="text-[#2d1b4e]/80 mb-6">
                            Commencez à monétiser votre contenu dès aujourd'hui !
                        </p>

                        <form onSubmit={handleBecomeCreator} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#2d1b4e] mb-2">Catégorie</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {CATEGORIES.map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setCategory(cat)}
                                            className={`py-2 px-3 rounded-lg border text-sm transition-all ${category === cat
                                                ? 'border-[#ef4444] bg-red-50 text-[#ef4444] font-medium'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-[#2d1b4e] mb-2">
                                    Prix de l'abonnement (FCFA/mois)
                                </label>
                                <input
                                    id="price"
                                    type="number"
                                    required
                                    min="100"
                                    step="100"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full px-4 py-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-[#ef4444] focus:border-transparent text-[#2d1b4e]"
                                />
                            </div>

                            <div>
                                <label htmlFor="bio" className="block text-sm font-medium text-[#2d1b4e] mb-2">Bio</label>
                                <textarea
                                    id="bio"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Dites-en plus sur vous..."
                                    rows={3}
                                    className="w-full px-4 py-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-[#ef4444] focus:border-transparent text-[#2d1b4e]"
                                />
                            </div>

                            <div className="flex gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreatorModal(false)}
                                    className="flex-1 px-6 py-3 border border-red-200 text-[#2d1b4e] rounded-lg hover:bg-red-50 transition-colors font-medium"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={upgrading}
                                    className="flex-1 bg-[#ef4444] text-white px-6 py-3 rounded-lg hover:bg-[#dc2626] transition-colors font-medium disabled:opacity-50"
                                >
                                    {upgrading ? '...' : 'Valider'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
