'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { createClient } from '@/lib/supabaseClient';

export default function SettingsPage() {
  const { isLoggedIn, user } = useAuth();
  const [name, setName] = useState('User Name');
  const [email, setEmail] = useState('user@example.com');
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch user profile data
  useEffect(() => {
    if (!isLoggedIn || !user) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, show_on_leaderboard')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setLoading(false);
          return;
        }

        if (data) {
          setName(`${data.first_name || ''} ${data.last_name || ''}`.trim() || 'User Name');
          setShowOnLeaderboard(data.show_on_leaderboard !== false); // Default to true if null
        }

        // Get email from auth user
        if (user.email) {
          setEmail(user.email);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isLoggedIn, user]);

  const handleSave = async (section: string) => {
    if (!isLoggedIn || !user || saving) return;

    setSaving(true);
    try {
      const supabase = createClient();

      if (section === 'privacy') {
        // Save leaderboard visibility
        const { error } = await supabase
          .from('profiles')
          .update({ show_on_leaderboard: showOnLeaderboard })
          .eq('id', user.id);

        if (error) {
          console.error('Error saving privacy settings:', error);
          alert('Error saving privacy settings. Please try again.');
          setSaving(false);
          return;
        }

        alert('Privacy settings saved successfully!');
      } else if (section === 'account') {
        // Save name
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const { error } = await supabase
          .from('profiles')
          .update({ 
            first_name: firstName,
            last_name: lastName 
          })
          .eq('id', user.id);

        if (error) {
          console.error('Error saving account settings:', error);
          alert('Error saving account settings. Please try again.');
          setSaving(false);
          return;
        }

        alert('Account settings saved successfully!');
      }

      setSaving(false);
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Error saving settings. Please try again.');
      setSaving(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white">
        <main className="lg:ml-64 px-4 sm:px-6 lg:px-8 py-16 transition-all duration-300">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-4xl font-bold mb-8 tracking-tight text-white">Settings</h1>
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-12">
              <Link
                href="/login"
                className="inline-block bg-[#d4af37] text-[#0f0f0f] px-8 py-4 rounded-xl font-semibold hover:bg-[#b8941f] transition-colors text-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <main className="lg:ml-64 px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-white mb-8 tracking-tight">
            Settings
          </h1>

          {/* Account Settings */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-white tracking-tight">Account</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8b8b8b] mb-2">
                  Name
                </label>
                  <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="w-full bg-[#2a2a2a] border border-[#2a2a2a] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#d4af37] disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8b8b8b] mb-2">
                  Email
                </label>
                  <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={true}
                  className="w-full bg-[#2a2a2a] border border-[#2a2a2a] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#d4af37] opacity-50 cursor-not-allowed"
                  title="Email cannot be changed here"
                />
              </div>
              <button
                onClick={() => handleSave('account')}
                disabled={loading || saving}
                className={`bg-[#d4af37] text-[#0f0f0f] px-6 py-2 rounded-xl font-semibold hover:bg-[#b8941f] transition-colors ${
                  loading || saving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-white tracking-tight">Privacy</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white mb-1">Show on Leaderboard</div>
                  <div className="text-sm text-[#8b8b8b]">
                    {showOnLeaderboard 
                      ? 'Your profile is visible on leaderboards' 
                      : 'Your profile is hidden from leaderboards'}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnLeaderboard}
                    onChange={(e) => setShowOnLeaderboard(e.target.checked)}
                    disabled={loading || saving}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#2a2a2a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d4af37] peer-disabled:opacity-50"></div>
                </label>
              </div>
              <button
                onClick={() => handleSave('privacy')}
                disabled={loading || saving}
                className={`bg-[#d4af37] text-[#0f0f0f] px-6 py-2 rounded-xl font-semibold hover:bg-[#b8941f] transition-colors ${
                  loading || saving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-[#1a1a1a] border border-[#d4af37]/30 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 text-[#d4af37] tracking-tight">Danger Zone</h2>
            <div className="space-y-4">
              <div>
                <div className="font-medium text-white mb-2">Delete Account</div>
                <div className="text-sm text-[#8b8b8b] mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </div>
                <button className="bg-[#d4af37] text-[#0f0f0f] px-6 py-2 rounded-xl font-semibold hover:bg-[#b8941f] transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

