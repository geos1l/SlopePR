'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';

export default function HomePage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <main className="lg:ml-64 px-4 sm:px-6 lg:px-8 py-16 transition-all duration-300">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <div className="mb-8">
              <h1 className="text-7xl md:text-8xl font-black mb-2 logo-3d leading-none">
                <div className="logo-slope mb-1">SLOPE</div>
                <div className="logo-royale">ROYALE</div>
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-[#8b8b8b] mb-3 max-w-3xl mx-auto font-medium">
              Track your strength progress over time
            </p>
            <p className="text-base md:text-lg text-[#8b8b8b] max-w-2xl mx-auto">
              Measure your rate of improvement—the SLOPE. The steeper your slope, the more you're improving.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 hover:border-[#4a90e2]/30 transition-all">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-white mb-3">Track Progress</h3>
              <p className="text-[#8b8b8b] text-sm leading-relaxed">
                Visualize your strength gains with detailed charts and analytics.
              </p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 hover:border-[#d4af37]/30 transition-all">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-white mb-3">Compete</h3>
              <p className="text-[#8b8b8b] text-sm leading-relaxed">
                Join clans and check your rank on global leaderboards based on your slope.
              </p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 hover:border-[#4a90e2]/30 transition-all">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-bold text-white mb-3">Stay Consistent</h3>
              <p className="text-[#8b8b8b] text-sm leading-relaxed">
                Log workouts, track streaks, and build lasting healthy habits.
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/charts"
                className="bg-[#d4af37] text-[#0f0f0f] px-8 py-4 rounded-xl font-bold hover:bg-[#b8941f] transition-all shadow-lg shadow-[#d4af37]/20 hover:shadow-xl hover:shadow-[#d4af37]/30 text-center"
              >
                View Charts
              </Link>
              <Link
                href="/calendar"
                className="bg-[#4a90e2] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#357abd] transition-all shadow-lg shadow-[#4a90e2]/20 hover:shadow-xl hover:shadow-[#4a90e2]/30 text-center"
              >
                Calendar
              </Link>
              <Link
                href="/leaderboards"
                className="bg-[#d4af37] text-[#0f0f0f] px-8 py-4 rounded-xl font-bold hover:bg-[#b8941f] transition-all shadow-lg shadow-[#d4af37]/20 hover:shadow-xl hover:shadow-[#d4af37]/30 text-center"
              >
                Leaderboards
              </Link>
            </div>

            {isLoggedIn && (
              <div className="text-center">
                <Link
                  href="/calendar"
                  className="inline-block bg-[#d4af37] text-[#0f0f0f] px-10 py-4 rounded-xl font-bold hover:bg-[#b8941f] transition-all shadow-lg shadow-[#d4af37]/20 hover:shadow-xl hover:shadow-[#d4af37]/30 text-lg"
                >
                  Log Today's Workout
                </Link>
              </div>
            )}

            {!isLoggedIn && (
              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-block bg-[#d4af37] text-[#0f0f0f] px-10 py-4 rounded-xl font-bold hover:bg-[#b8941f] transition-all shadow-lg shadow-[#d4af37]/20 hover:shadow-xl hover:shadow-[#d4af37]/30 text-lg"
                >
                  Log In to Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
