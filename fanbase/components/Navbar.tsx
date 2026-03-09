'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        setUser({ ...user, role: userData?.role });
      } else {
        setUser(null);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Fetch role
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        setUser({ ...session.user, role: userData?.role });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const fetchUnread = async () => {
      try {
        const response = await fetch('/api/messages/unread');
        if (!response.ok) return;
        const data = await response.json();
        setUnreadCount(Number(data.unread) || 0);
      } catch {
        // Ignore transient errors
      }
    };

    if (user) {
      fetchUnread();
      intervalId = setInterval(fetchUnread, 5000);
    } else {
      setUnreadCount(0);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-[#ff6b35]">FANBASE</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/explore" className="text-[#2d1b4e] hover:text-[#ff6b35] transition-colors">
              Explorer
            </Link>
            {user ? (
              <>
                <Link href={user.role === 'fan' ? '/fan/dashboard' : '/dashboard'} className="text-[#2d1b4e] hover:text-[#ff6b35] transition-colors">
                  {user.role === 'fan' ? 'Mon Espace' : 'Dashboard'}
                </Link>
                <Link href="/messages" className="text-[#2d1b4e] hover:text-[#ff6b35] transition-colors relative">
                  Messagerie
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-[#ff6b35] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-[#2d1b4e]">
                    <User size={18} />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-[#2d1b4e] hover:text-[#ff6b35] transition-colors flex items-center gap-2"
                  >
                    <LogOut size={18} />
                    Déconnexion
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-[#2d1b4e] hover:text-[#ff6b35] transition-colors">
                  Connexion
                </Link>
                <Link
                  href="/login"
                  className="bg-[#ff6b35] text-white px-6 py-2 rounded-full hover:bg-[#e55a2b] transition-colors font-medium"
                >
                  Commencer
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-[#2d1b4e]"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4">
            <Link href="/explore" className="block text-[#2d1b4e] hover:text-[#ff6b35] transition-colors">
              Explorer
            </Link>
            {user ? (
              <>
                <Link href={user.role === 'fan' ? '/fan/dashboard' : '/dashboard'} className="block text-[#2d1b4e] hover:text-[#ff6b35] transition-colors">
                  {user.role === 'fan' ? 'Mon Espace' : 'Dashboard'}
                </Link>
                <Link href="/messages" className="block text-[#2d1b4e] hover:text-[#ff6b35] transition-colors relative">
                  Messagerie
                  {unreadCount > 0 && (
                    <span className="ml-2 inline-flex bg-[#ff6b35] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <div className="flex items-center gap-2 text-[#2d1b4e] py-2">
                  <User size={18} />
                  <span className="text-sm">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left text-[#2d1b4e] hover:text-[#ff6b35] transition-colors flex items-center gap-2"
                >
                  <LogOut size={18} />
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block text-[#2d1b4e] hover:text-[#ff6b35] transition-colors">
                  Connexion
                </Link>
                <Link
                  href="/login"
                  className="block w-full bg-[#ff6b35] text-white px-6 py-2 rounded-full hover:bg-[#e55a2b] transition-colors font-medium text-center"
                >
                  Commencer
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

