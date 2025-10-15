'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigationItems = [
  {
    title: 'Overview',
    href: '/admin',
    icon: '📊',
    description: 'Main dashboard'
  },
  {
    title: 'Analytics',
    icon: '📈',
    children: [
      {
        title: 'Shares',
        href: '/admin/share-analytics',
        icon: '🔄',
        description: 'Share metrics & viral tracking'
      },
      {
        title: 'Rituals',
        href: '/admin/analytics/rituals',
        icon: '🎯',
        description: 'Ritual performance & sponsorships'
      },
      {
        title: 'Users',
        href: '/admin/analytics/users',
        icon: '👥',
        description: 'User activity & profiles'
      },
      {
        title: 'Financial',
        href: '/admin/analytics/financial',
        icon: '💰',
        description: 'Token economics & ROI'
      },
      {
        title: 'Check-Ins',
        href: '/admin/checkin-analytics',
        icon: '☀️',
        description: 'Check-in rewards & metrics'
      },
      {
        title: 'Attestations',
        href: '/admin/attestations',
        icon: '✅',
        description: 'Ritual 10: Prove It analytics'
      }
    ]
  },
  {
    title: 'Management',
    icon: '⚙️',
    children: [
      {
        title: 'Contests',
        href: '/admin/contests',
        icon: '🏆',
        description: 'Contest management'
      },
      {
        title: 'Contest Analytics',
        href: '/admin/contests/analytics',
        icon: '📊',
        description: 'Contest performance'
      },
      {
        title: 'Daily Flip',
        href: '/admin/flip',
        icon: '🪙',
        description: 'Monthly prize configuration'
      },
      {
        title: 'Leaderboards',
        href: '/admin/leaderboards',
        icon: '🏅',
        description: 'Cross-category rankings'
      }
    ]
  },
  {
    title: 'Tools',
    icon: '🛠️',
    children: [
      {
        title: 'Contact Submissions',
        href: '/admin/contact-submissions',
        icon: '📬',
        description: 'View contact form messages'
      },
      {
        title: 'Creative Assets',
        href: '/admin/creative-assets',
        icon: '🎨',
        description: 'Gradient text generator'
      },
      {
        title: 'Export Data',
        href: '/admin/export',
        icon: '💾',
        description: 'CSV/JSON exports'
      },
      {
        title: 'Reports',
        href: '/admin/reports',
        icon: '📝',
        description: 'Automated reports'
      }
    ]
  }
];

export default function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-dark-card border-b border-gem-purple/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo/Title */}
          <div className="flex items-center">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="text-2xl">🎮</span>
              <span className="text-xl font-bold text-gem-gold">BizarreBeasts Admin</span>
            </Link>
          </div>

          {/* Main Navigation */}
          <div className="flex items-center gap-6">
            {navigationItems.map((item) => {
              if (item.children) {
                return (
                  <div key={item.title} className="relative group">
                    <button className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-gem-gold transition-colors">
                      <span>{item.icon}</span>
                      <span>{item.title}</span>
                      <span className="text-xs">▼</span>
                    </button>

                    {/* Dropdown */}
                    <div className="absolute top-full left-0 mt-2 w-64 bg-dark-card border border-gem-purple/30 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`block px-4 py-3 hover:bg-gem-purple/10 transition-colors ${
                            pathname === child.href ? 'bg-gem-purple/20 text-gem-gold' : 'text-gray-400'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{child.icon}</span>
                            <div>
                              <div className="font-medium">{child.title}</div>
                              <div className="text-xs text-gray-500">{child.description}</div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={`flex items-center gap-2 px-3 py-2 transition-colors ${
                    pathname === item.href
                      ? 'text-gem-gold border-b-2 border-gem-gold'
                      : 'text-gray-400 hover:text-gem-gold'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-gem-gold transition-colors">
              <span title="Refresh Data">🔄</span>
            </button>
            <button className="text-gray-400 hover:text-gem-gold transition-colors">
              <span title="Settings">⚙️</span>
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-gem-purple/20 text-gem-crystal rounded-lg hover:bg-gem-purple/30 transition-colors"
            >
              Exit Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}