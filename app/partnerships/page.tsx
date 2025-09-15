'use client';

import { Mail, Twitter, MessageCircle, Megaphone, Users, Sparkles } from 'lucide-react';

export default function PartnershipsPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
            🤝 Partnerships & Collaborations
          </h1>
          <p className="text-xl text-gray-300">
            Reach the most BIZARRE community in Web3!
          </p>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 mb-12">
          {/* Featured Ritual Sponsorship */}
          <div className="bg-gradient-to-br from-gem-gold/10 via-dark-card to-gem-crystal/10 border border-gem-gold/30 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <Megaphone className="w-8 h-8 text-gem-gold flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold mb-3 text-gem-gold">Featured Ritual Sponsorship</h2>
                <p className="text-gray-300 mb-4">
                  Get prime placement at the top of our Daily Rituals page! Your project will be seen by every user who visits to complete their daily tasks.
                </p>
                <ul className="space-y-2 text-sm text-gray-400 mb-4">
                  <li className="flex items-start gap-2">
                    <span className="text-gem-crystal">✓</span>
                    <span>Premium placement above all daily rituals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gem-crystal">✓</span>
                    <span>Custom banner and call-to-action</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gem-crystal">✓</span>
                    <span>Clear sponsor branding with AD/COLLAB/PARTNER badge</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gem-crystal">✓</span>
                    <span>Thousands of daily impressions from engaged users</span>
                  </li>
                </ul>
                <div className="bg-black/30 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-2">AVAILABLE FORMATS:</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gem-gold/20 text-gem-gold rounded-full text-xs">Sponsored Ad</span>
                    <span className="px-3 py-1 bg-gem-crystal/20 text-gem-crystal rounded-full text-xs">Collaboration</span>
                    <span className="px-3 py-1 bg-gem-pink/20 text-gem-pink rounded-full text-xs">Partner Feature</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Other Partnership Opportunities */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-dark-card border border-gem-crystal/20 rounded-xl p-6">
              <Users className="w-6 h-6 text-gem-crystal mb-3" />
              <h3 className="text-lg font-semibold mb-2">Community Collaborations</h3>
              <p className="text-sm text-gray-400">
                Co-create events, tournaments, and special rituals with the BizarreBeasts community.
              </p>
            </div>

            <div className="bg-dark-card border border-gem-crystal/20 rounded-xl p-6">
              <Sparkles className="w-6 h-6 text-gem-pink mb-3" />
              <h3 className="text-lg font-semibold mb-2">Custom Integrations</h3>
              <p className="text-sm text-gray-400">
                Build unique experiences and tools that integrate with the BB ecosystem.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-dark-card border border-gem-crystal/20 rounded-xl p-8 mb-12">
          <h2 className="text-xl font-bold mb-6 text-center">Why Partner with BizarreBeasts?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-gem-gold">10K+</div>
              <div className="text-xs text-gray-400">Community Members</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gem-crystal">Daily</div>
              <div className="text-xs text-gray-400">Active Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gem-pink">Web3</div>
              <div className="text-xs text-gray-400">Native Audience</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gem-gold">High</div>
              <div className="text-xs text-gray-400">Engagement Rate</div>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-gold/10 border border-gem-gold/20 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Go BIZARRE?</h2>
          <p className="text-gray-300 mb-6">
            Let's discuss how we can create something amazing together for the BizarreBeasts community!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:partnerships@bizarrebeasts.io"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black font-bold rounded-lg hover:opacity-90 transition-all"
            >
              <Mail className="w-4 h-4" />
              Email Us
            </a>

            <a
              href="https://warpcast.com/bizarrebeasts"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-dark-card border border-gem-crystal/50 text-gem-crystal font-bold rounded-lg hover:bg-gem-crystal/10 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Message on Farcaster
            </a>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            For fastest response, reach out on Farcaster with your partnership idea!
          </p>
        </div>
      </div>
    </div>
  );
}