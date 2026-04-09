'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabaseClient';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/charts`,
        },
      });

      if (error) {
        console.error('Signup error:', error);
        // Provide more helpful error messages
        let errorMessage = error.message || 'Failed to create account. Please try again.';
        
        // Handle specific database errors
        if (error.message?.includes('Database error') || error.message?.includes('saving new user')) {
          errorMessage = 'Database setup issue. Please ensure the profiles table exists in your Supabase database. Check the console for details.';
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Try to create profile manually if trigger failed
        if (data.user) {
          try {
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({ id: data.user.id, first_name: '', last_name: '' })
              .select()
              .single();
            
            // Ignore error if profile already exists or if table doesn't exist
            if (profileError && !profileError.message?.includes('duplicate') && !profileError.message?.includes('relation "profiles" does not exist')) {
              console.warn('Profile creation warning:', profileError);
            }
          } catch (profileErr) {
            // Ignore profile creation errors - not critical for signup
            console.warn('Profile creation skipped:', profileErr);
          }
        }
        
        setError('Please check your email to confirm your account before signing in.');
        setLoading(false);
        return;
      }

      if (data.user && data.session) {
        // Try to create profile manually if trigger failed
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({ id: data.user.id, first_name: '', last_name: '' })
            .select()
            .single();
          
          // Ignore error if profile already exists or if table doesn't exist
          if (profileError && !profileError.message?.includes('duplicate') && !profileError.message?.includes('relation "profiles" does not exist')) {
            console.warn('Profile creation warning:', profileError);
          }
        } catch (profileErr) {
          // Ignore profile creation errors - not critical for signup
          console.warn('Profile creation skipped:', profileErr);
        }
        
        router.push('/charts');
        router.refresh();
      }
    } catch (err: any) {
      console.error('Signup exception:', err);
      setError(err?.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <main className="lg:ml-64 px-4 sm:px-6 lg:px-8 py-16 transition-all duration-300">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 tracking-tight">
              <span className="text-[#c0c0c0]">SLOPE</span>
              <span className="text-[#d4af37]">ROYALE</span>
            </h1>
            <p className="text-[#8b8b8b] mt-4">Create an account to get started</p>
          </div>

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] px-4 py-3 rounded-xl text-sm">
                  <div className="font-semibold mb-1">Error:</div>
                  <div>{error}</div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#8b8b8b] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#2a2a2a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4af37]"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8b8b8b] mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#2a2a2a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4af37]"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8b8b8b] mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#2a2a2a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4af37]"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`
                  w-full py-3 rounded-xl font-semibold transition-colors
                  ${loading
                    ? 'bg-[#2a2a2a] text-[#8b8b8b] cursor-not-allowed'
                    : 'bg-[#d4af37] text-[#0f0f0f] hover:bg-[#b8941f]'
                  }
                `}
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-[#8b8b8b]">
                Already have an account?{' '}
                <Link href="/login" className="text-[#d4af37] hover:text-[#b8941f] font-medium">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

