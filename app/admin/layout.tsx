'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Trophy,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  Menu,
  X,
  Home,
  Calendar,
  DollarSign,
  FileText
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { validateAdminAccess } from '@/lib/admin';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { address, isConnected } = useWallet();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (address) {
      const hasAccess = validateAdminAccess(address);
      setIsAuthorized(hasAccess);
      if (!hasAccess) {
        router.push('/');
      }
    }
  }, [address, router]);

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: <Home className="w-5 h-5" />
    },
    {
      label: 'Contest Management',
      href: '/admin/contests',
      icon: <Trophy className="w-5 h-5" />
    },
    {
      label: 'Contest Analytics',
      href: '/admin/contests/analytics',
      icon: <BarChart3 className="w-5 h-5" />
    },
    {
      label: 'Check-ins',
      href: '/admin/checkins',
      icon: <Calendar className="w-5 h-5" />,
      badge: 'Coming Soon'
    },
    {
      label: 'Token Distribution',
      href: '/admin/tokens',
      icon: <DollarSign className="w-5 h-5" />,
      badge: 'Coming Soon'
    },
    {
      label: 'User Management',
      href: '/admin/users',
      icon: <Users className="w-5 h-5" />,
      badge: 'Coming Soon'
    },
    {
      label: 'Reports',
      href: '/admin/reports',
      icon: <FileText className="w-5 h-5" />,
      badge: 'Coming Soon'
    },
    {
      label: 'Settings',
      href: '/admin/settings',
      icon: <Settings className="w-5 h-5" />,
      badge: 'Coming Soon'
    }
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
          <p className="text-gray-400">Please connect your admin wallet</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400">You don't have admin privileges</p>
          <Link href="/" className="mt-4 inline-block text-gem-crystal hover:underline">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-dark-card border border-gem-crystal/20 rounded-lg"
      >
        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-dark-card border-r border-gem-crystal/20 transform transition-transform duration-300 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-gem-crystal" />
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                  Admin Panel
                </h2>
                <p className="text-xs text-gray-400">BizarreBeasts</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const isDisabled = item.badge === 'Coming Soon';

                return (
                  <li key={item.href}>
                    {isDisabled ? (
                      <div className="flex items-center justify-between px-3 py-2 rounded-lg text-gray-500 cursor-not-allowed opacity-50">
                        <div className="flex items-center gap-3">
                          {item.icon}
                          <span className="text-sm">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-xs px-2 py-0.5 bg-gray-700 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                          isActive
                            ? 'bg-gem-crystal/20 text-gem-crystal border-l-2 border-gem-crystal'
                            : 'text-gray-300 hover:bg-dark-bg hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.icon}
                          <span className="text-sm">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-xs px-2 py-0.5 bg-gem-crystal/20 text-gem-crystal rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to App
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        <div className="min-h-screen">
          {children}
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}