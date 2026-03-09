'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'fan' | 'creator'>('fan');

  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Sign up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // If email confirmation is required, show message
          alert('Vérifiez votre email pour confirmer votre compte !');
        } else {
          router.push('/dashboard');
          router.refresh();
        }
      } else {
        // Sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // Check role and redirect
        const { data: { user } } = await supabase.auth.getUser();

        let redirectTo = '/dashboard'; // Default for creators

        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

          if (userData?.role === 'fan') {
            redirectTo = '/fan/dashboard';
          }
        }

        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#ff6b35] mb-2">FANBASE</h1>
          <h2 className="text-3xl font-bold text-[#2d1b4e] mb-2">
            {isSignUp ? 'Créer un compte' : 'Connexion'}
          </h2>
          <p className="text-[#2d1b4e]/80">
            {isSignUp
              ? 'Rejoignez la communauté des créateurs africains'
              : 'Connectez-vous à votre compte'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-orange-100">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            {isSignUp && (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-[#2d1b4e] mb-2">
                    Nom complet
                  </label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#2d1b4e]/40" size={20} />
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent text-[#2d1b4e]"
                      placeholder="Votre nom complet"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-[#2d1b4e] mb-2">
                    Je suis un...
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRole('fan')}
                      className={`p-4 rounded-lg border-2 transition-all ${role === 'fan'
                          ? 'border-[#ff6b35] bg-[#ff6b35]/10 text-[#ff6b35]'
                          : 'border-orange-200 text-[#2d1b4e] hover:border-[#ff6b35]/50'
                        }`}
                    >
                      <span className="font-semibold">Fan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('creator')}
                      className={`p-4 rounded-lg border-2 transition-all ${role === 'creator'
                          ? 'border-[#ff6b35] bg-[#ff6b35]/10 text-[#ff6b35]'
                          : 'border-orange-200 text-[#2d1b4e] hover:border-[#ff6b35]/50'
                        }`}
                    >
                      <span className="font-semibold">Créateur</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#2d1b4e] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#2d1b4e]/40" size={20} />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent text-[#2d1b4e]"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#2d1b4e] mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#2d1b4e]/40" size={20} />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent text-[#2d1b4e]"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff6b35] text-white py-3 rounded-lg hover:bg-[#e55a2b] transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                'Chargement...'
              ) : (
                <>
                  <LogIn size={20} />
                  {isSignUp ? 'Créer mon compte' : 'Se connecter'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-[#ff6b35] hover:text-[#e55a2b] font-medium"
            >
              {isSignUp
                ? 'Déjà un compte ? Se connecter'
                : "Pas encore de compte ? S'inscrire"}
            </button>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-[#2d1b4e]/60 hover:text-[#ff6b35] transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

