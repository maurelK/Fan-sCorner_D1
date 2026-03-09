'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Users, Music, Code, GraduationCap, Smile } from 'lucide-react';

const categories = [
  { id: 'all', name: 'Tous', icon: Users },
  { id: 'humor', name: 'Humour', icon: Smile },
  { id: 'tech', name: 'Tech', icon: Code },
  { id: 'music', name: 'Musique', icon: Music },
  { id: 'education', name: 'Éducation', icon: GraduationCap },
];

interface Creator {
  id: string;
  name: string;
  email: string;
  bio: string;
  category: string | null;
  price_fcfa: number;
  subscribers: number;
  profile_image_url: string | null;
  cover_image_url: string | null;
}

export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [creators, setCreators] = useState<Creator[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadCreators();
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setCurrentUserId(data.user?.id || null))
      .catch(() => setCurrentUserId(null));
  }, []);

  const loadCreators = async () => {
    try {
      const response = await fetch('/api/creators', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setCreators(data.creators || []);
      }
    } catch (error) {
      console.error('Error loading creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCoverColor = (index: number) => {
    const colors = [
      'bg-gradient-to-br from-red-400 to-pink-500',
      'bg-gradient-to-br from-blue-400 to-purple-500',
      'bg-gradient-to-br from-purple-400 to-indigo-500',
      'bg-gradient-to-br from-green-400 to-teal-500',
      'bg-gradient-to-br from-yellow-400 to-red-500',
      'bg-gradient-to-br from-cyan-400 to-blue-500',
      'bg-gradient-to-br from-pink-400 to-red-500',
      'bg-gradient-to-br from-indigo-400 to-purple-500',
    ];
    return colors[index % colors.length];
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const filteredCreators = creators
    .filter((creator) => (currentUserId ? creator.id !== currentUserId : true))
    .filter((creator) =>
      selectedCategory === 'all'
        ? true
        : creator.category?.toLowerCase() === selectedCategory.toLowerCase()
    )
    .filter((creator) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return creator.name.toLowerCase().includes(q);
    });

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
        <h1 className="text-4xl md:text-5xl font-bold text-[#2d1b4e] mb-4">
          Explorer les Créateurs
        </h1>
        <p className="text-xl text-[#2d1b4e]/80 mb-8">
          Découvrez et soutenez les créateurs africains qui vous inspirent
        </p>

        {/* Recherche */}
        <div className="mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un createur..."
            className="w-full md:max-w-md px-4 py-3 border border-red-200 rounded-full focus:ring-2 focus:ring-[#ef4444] focus:border-transparent bg-white text-[#2d1b4e]"
          />
        </div>

        {/* Filtres par catégorie */}
        <div className="flex flex-wrap gap-4 mb-12">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                  isActive
                    ? 'bg-[#ef4444] text-white shadow-lg'
                    : 'bg-white text-[#2d1b4e] hover:bg-[#ef4444]/10 border border-red-200'
                }`}
              >
                <Icon size={20} />
                {category.name}
              </button>
            );
          })}
        </div>

        {/* Grille de créateurs */}
        {filteredCreators.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#2d1b4e]/60 text-lg">
              {selectedCategory === 'all'
                ? 'Aucun créateur pour le moment.'
                : 'Aucun créateur trouvé dans cette catégorie.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCreators.map((creator, index) => (
              <Link
                key={creator.id}
                href={`/creator/${creator.id}`}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow border border-red-100"
              >
                <div className={`${creator.cover_image_url ? '' : getCoverColor(index)} h-32 relative`}>
                  {creator.cover_image_url && (
                    <Image
                      src={creator.cover_image_url}
                      alt={creator.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 25vw"
                    />
                  )}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-2xl font-bold text-[#2d1b4e] shadow-lg overflow-hidden">
                      {creator.profile_image_url ? (
                        <Image
                          src={creator.profile_image_url}
                          alt={creator.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(creator.name)
                      )}
                    </div>
                  </div>
                </div>
                <div className="pt-12 pb-6 px-6 text-center">
                  <h3 className="text-xl font-bold text-[#2d1b4e] mb-2">{creator.name}</h3>
                  <p className="text-sm text-[#2d1b4e]/60 mb-4 line-clamp-2">
                    {creator.bio || "Créateur sur Fan's Corner"}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-[#ef4444]">
                    <Users size={18} />
                    <span className="font-semibold">{creator.subscribers.toLocaleString()}</span>
                    <span className="text-[#2d1b4e]/60 text-sm">abonnés</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
