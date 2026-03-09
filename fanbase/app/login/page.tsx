'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';

// SVG Google Logo
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion avec Google');
      setLoading(false);
    }
  };

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
    <div className="min-h-screen bg-[#fffafa] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#ef4444] mb-2">Fan's Corner</h1>
          <h2 className="text-3xl font-bold text-[#2d1b4e] mb-2">
            {isSignUp ? 'Créer un compte' : 'Connexion'}
          </h2>
          <p className="text-[#2d1b4e]/80">
            {isSignUp
              ? 'Rejoignez la communauté des créateurs africains'
              : 'Connectez-vous à votre compte'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-red-100">
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
                      className="w-full pl-10 pr-4 py-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-[#ef4444] focus:border-transparent text-[#2d1b4e]"
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
                          ? 'border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444]'
                          : 'border-red-200 text-[#2d1b4e] hover:border-[#ef4444]/50'
                        }`}
                    >
                      <span className="font-semibold">Fan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('creator')}
                      className={`p-4 rounded-lg border-2 transition-all ${role === 'creator'
                          ? 'border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444]'
                          : 'border-red-200 text-[#2d1b4e] hover:border-[#ef4444]/50'
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
                  className="w-full pl-10 pr-4 py-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-[#ef4444] focus:border-transparent text-[#2d1b4e]"
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
                  className="w-full pl-10 pr-4 py-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-[#ef4444] focus:border-transparent text-[#2d1b4e]"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ef4444] text-white py-3 rounded-lg hover:bg-[#dc2626] transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Séparateur OU */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-red-200"></div>
            <span className="px-4 text-sm text-[#2d1b4e]/60">OU</span>
            <div className="flex-1 border-t border-red-200"></div>
          </div>

          {/* Bouton Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <GoogleIcon />
            Continuer avec Google
          </button>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-[#ef4444] hover:text-[#dc2626] font-medium"
            >
              {isSignUp
                ? 'Déjà un compte ? Se connecter'
                : "Pas encore de compte ? S'inscrire"}
            </button>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-[#2d1b4e]/60 hover:text-[#ef4444] transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

