'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/', icon: '🏠' },
  { label: 'Charts', href: '/charts', icon: '📊' },
  { label: 'Calendar', href: '/calendar', icon: '📅' },
  { label: 'Clans', href: '/clans', icon: '👥' },
  { label: 'Leaderboards', href: '/leaderboards', icon: '🏆' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false); // Closed on mobile by default
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, user, logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-[#0a0a0a] border-r border-[#1a1a1a] z-50 w-64
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-lg tracking-tight">
                <span className="text-[#c0c0c0]">SLOPE</span>
                <span className="text-[#d4af37]">ROYALE</span>
              </span>
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden text-[#8b8b8b] hover:text-white p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${
                      isActive
                        ? 'bg-[#d4af37] text-[#0f0f0f] font-semibold'
                        : 'text-[#8b8b8b] hover:bg-[#2a2a2a] hover:text-white'
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          {isLoggedIn ? (
            <div className="p-4 border-t border-[#2a2a2a]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#d4af37] flex items-center justify-center text-[#0f0f0f] font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {user?.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="text-xs text-[#8b8b8b] truncate">{user?.email || ''}</div>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full bg-[#2a2a2a] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#1a1a1a] transition-colors text-sm"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="p-4 border-t border-[#2a2a2a] text-center">
              <Link
                href="/login"
                className="block bg-[#d4af37] text-[#0f0f0f] px-4 py-2 rounded-xl font-semibold hover:bg-[#b8941f] transition-colors w-full"
              >
                Log In
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Toggle button for mobile */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-40 lg:hidden bg-[#d4af37] text-[#0f0f0f] p-2 rounded-xl shadow-lg font-semibold"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </>
  );
}

