'use client';

import { useState } from 'react';
import { ExternalLink, Award, GraduationCap, Rocket, TrendingUp, Users, Coins, Palette, ChevronDown, Gamepad2, Music, BookOpen, Mail, Briefcase, Newspaper, Trophy, Image as ImageIcon, Zap } from 'lucide-react';
import Link from 'next/link';

export default function AboutClient() {
  const [showEducation, setShowEducation] = useState(false);
  const [showJourney, setShowJourney] = useState(false);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-dark-bg overflow-x-hidden max-w-full">
      {/* Hero Section with Bio Photo */}
      <section className="px-4 pt-8 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Bio Photo - Mobile Optimized - Portrait */}
          <div className="flex justify-center mb-8">
            <div className="relative w-64 h-80 sm:w-80 sm:h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-gem-crystal/10 to-gem-gold/10">
              <img
                src="/assets/page-assets/creator/dylan-bio.jpg"
                alt="Dylan - BizarreBeasts Creator"
                className="w-full h-full object-cover object-top"
                style={{ objectPosition: '50% 10%' }}
                onError={(e) => {
                  // Fallback to icon if image not found
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><img src="/icon-192.png" alt="BizarreBeasts" class="w-32 h-32 rounded-lg" /></div>';
                  }
                }}
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-center bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent leading-tight pb-2">
            About the Creator
          </h1>

          {/* Artist Bio */}
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border border-gem-crystal/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-gem-crystal">Meet Dylan - @bizarrebeast</h2>
            <div className="space-y-4 text-gray-300 text-base leading-relaxed">
              <p>
                I'm the artist and builder behind BizarreBeasts ($BB), creating a universe where art and web3 technology converge. This is where everything I am intersects: an artist captivated by darkly humorous outsider art, a builder who creates games and miniapps, a musician performing original soundtracks, and a true BIZARRE believer in decentralized creativity.
              </p>
              <p>
                This project was born from a vision of what's possible when an artist fully owns their creative universe: exploring the opportunities and economies that web3 enables to build a legacy of creativity and freedom for myself and the BizarreBeasts community.
              </p>

              {/* What I've Built */}
              <div className="bg-dark-bg/30 rounded-lg p-4 my-4">
                <h3 className="text-lg font-bold mb-3 text-gem-gold">What I've Built:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-gem-crystal mt-1">▸</span>
                    <span><span className="font-semibold">9 Games, 140K+ Plays:</span> Including Treasure Quest, a 50+ level platformer—every pixel, animation, and line of code hand-crafted over 300+ hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gem-crystal mt-1">▸</span>
                    <span><span className="font-semibold">Full Web3 Miniapp (400+ hours):</span> Smart wallet integration, tier rewards system, sticker packs and meme creator, contests, daily BIZARRE rituals, and Farcaster-native features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gem-crystal mt-1">▸</span>
                    <span><span className="font-semibold">Complete Artistic Vision:</span> Original character designs, animations, canvas paintings, NFT collections, game soundtracks, and physical products</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gem-crystal mt-1">▸</span>
                    <span><span className="font-semibold">Thriving Community:</span> 5,600+ token holders, 1,800+ NFT collectors, and #1 trending games on Remix and TheBaseApp</span>
                  </li>
                </ul>
              </div>

              {/* The BizarreBeasts Ecosystem */}
              <div className="bg-dark-bg/30 rounded-lg p-4 my-4">
                <h3 className="text-lg font-bold mb-3 text-gem-crystal">The BizarreBeasts Ecosystem:</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="bg-dark-bg/50 rounded-lg p-3 border border-gem-crystal/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Gamepad2 className="w-5 h-5 text-gem-crystal" />
                      <h4 className="font-semibold text-white">Games & Entertainment</h4>
                    </div>
                    <p className="text-sm text-gray-400">9 original games with 140K+ plays, including Treasure Quest with 50+ hand-crafted levels</p>
                  </div>

                  <div className="bg-dark-bg/50 rounded-lg p-3 border border-gem-gold/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-gem-gold" />
                      <h4 className="font-semibold text-white">Community & Tokens</h4>
                    </div>
                    <p className="text-sm text-gray-400">5,600+ $BB token holders, Empire tier rewards, and daily BIZARRE rituals</p>
                  </div>

                  <div className="bg-dark-bg/50 rounded-lg p-3 border border-gem-pink/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Palette className="w-5 h-5 text-gem-pink" />
                      <h4 className="font-semibold text-white">Art & Music</h4>
                    </div>
                    <p className="text-sm text-gray-400">1,800+ NFT collectors, canvas paintings, original soundtracks, and character designs</p>
                  </div>

                  <div className="bg-dark-bg/50 rounded-lg p-3 border border-gem-purple/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-gem-purple" />
                      <h4 className="font-semibold text-white">Web3 Infrastructure</h4>
                    </div>
                    <p className="text-sm text-gray-400">Full Farcaster miniapp, smart wallet integration, contests, and meme creator</p>
                  </div>
                </div>
              </div>

              <p>
                Every element of this ecosystem bears my fingerprints—thousands of hours spent building art, code, music, and community. This is deeply personal: a singular expression of a world where the comical and unsettling coexist, powered by blockchain technology.
              </p>
              <p>
                BizarreBeasts proves my core philosophy: <span className="font-bold text-gem-gold">community, coins, culture</span>. Art that engages, tokens that create shared ownership, and culture that lives onchain. I'm building a globally recognized brand while showing other artists what's possible with conviction and decentralized tools.
              </p>
            </div>

            {/* Social Links */}
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="https://farcaster.xyz/bizarrebeast"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/40 rounded-lg hover:bg-purple-500/30 transition-all text-sm font-semibold"
              >
                Farcaster
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="https://x.com/bizarrebeasts_"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded-lg hover:bg-blue-500/30 transition-all text-sm font-semibold"
              >
                X (Twitter)
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="https://www.tiktok.com/@bizarrebeasts.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/20 text-pink-400 border border-pink-500/40 rounded-lg hover:bg-pink-500/30 transition-all text-sm font-semibold"
              >
                TikTok
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="https://paragraph.com/@bizarrebeasts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/40 rounded-lg hover:bg-orange-500/30 transition-all text-sm font-semibold"
              >
                Blog
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Gallery CTAs */}
            <div className="mt-6 pt-6 border-t border-gem-crystal/20 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-gem-gold" />
                  <span className="text-gray-300">Canvas Paintings</span>
                </div>
                <Link
                  href="/gallery"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gem-gold to-gem-pink text-dark-bg border border-gem-gold rounded-lg hover:scale-105 transition-all font-semibold"
                >
                  <ImageIcon className="w-4 h-4" />
                  View Gallery
                </Link>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gem-crystal" />
                  <span className="text-gray-300">Paper Illustrations</span>
                </div>
                <Link
                  href="/illustrations"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gem-crystal to-gem-purple text-dark-bg border border-gem-crystal rounded-lg hover:scale-105 transition-all font-semibold"
                >
                  <ImageIcon className="w-4 h-4" />
                  View Illustrations
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Education & Credentials - Collapsible */}
      <section className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-gold/5 border border-gem-gold/20 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowEducation(!showEducation)}
              className="w-full p-6 flex items-center justify-between hover:bg-gem-gold/5 transition-colors"
            >
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-gem-gold" />
                Education & Credentials
              </h2>
              <ChevronDown className={`w-6 h-6 text-gem-crystal transition-transform ${showEducation ? 'rotate-180' : ''}`} />
            </button>

            {showEducation && (
              <div className="px-6 pb-6 space-y-4">
                {/* Duke DeFi */}
                <div className="bg-dark-bg/50 rounded-lg p-4 border border-gem-crystal/10">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-gem-purple to-gem-blue rounded-lg flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">Duke University - Fuqua School of Business</h3>
                      <p className="text-gem-crystal font-semibold mb-2">Decentralized Finance (DeFi): The Future of Finance</p>
                      <p className="text-sm text-gray-400 mb-2">Issued: August 2024 • Credential ID: ALKPN9PZNJWI</p>
                      <div className="flex flex-wrap gap-2 text-xs mb-3">
                        <span className="px-2 py-1 bg-gem-crystal/20 text-gem-crystal rounded">DeFi</span>
                        <span className="px-2 py-1 bg-gem-crystal/20 text-gem-crystal rounded">DApps</span>
                        <span className="px-2 py-1 bg-gem-crystal/20 text-gem-crystal rounded">DAOs</span>
                        <span className="px-2 py-1 bg-gem-crystal/20 text-gem-crystal rounded">Ethereum</span>
                        <span className="px-2 py-1 bg-gem-crystal/20 text-gem-crystal rounded">Blockchain</span>
                      </div>
                      <a
                        href="https://www.coursera.org/account/accomplishments/specialization/certificate/ALKPN9PZNJWI"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-gem-crystal hover:text-gem-gold transition-colors"
                      >
                        View Certificate
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Blockchain Council - Degree */}
                <div className="bg-dark-bg/50 rounded-lg p-4 border border-gem-crystal/10">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-gem-gold to-gem-pink rounded-lg flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">Blockchain Council</h3>
                      <p className="text-gem-gold font-semibold mb-2">Online Degree™ in Blockchain</p>
                      <p className="text-sm text-gray-400 mb-2">Issued: July 2024 • Credential ID: 109221717</p>
                      <div className="flex flex-wrap gap-2 text-xs mb-3">
                        <span className="px-2 py-1 bg-gem-gold/20 text-gem-gold rounded">Blockchain</span>
                        <span className="px-2 py-1 bg-gem-gold/20 text-gem-gold rounded">Ethereum</span>
                        <span className="px-2 py-1 bg-gem-gold/20 text-gem-gold rounded">Smart Contracts</span>
                        <span className="px-2 py-1 bg-gem-gold/20 text-gem-gold rounded">NFTs</span>
                        <span className="px-2 py-1 bg-gem-gold/20 text-gem-gold rounded">Cryptocurrency</span>
                      </div>
                      <a
                        href="https://certificates.blockchain-council.org/1731b55a-7751-4f33-b7b6-96a23b37ad8c#acc.4altyZnr"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-gem-gold hover:text-gem-crystal transition-colors"
                      >
                        View Certificate
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Blockchain Council - NFT Expert */}
                <div className="bg-dark-bg/50 rounded-lg p-4 border border-gem-crystal/10">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-gem-pink to-gem-purple rounded-lg flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">Blockchain Council</h3>
                      <p className="text-gem-pink font-semibold mb-2">Certified NFT Expert</p>
                      <p className="text-sm text-gray-400 mb-2">Issued: April 2022 • Credential ID: 49566987</p>
                      <div className="flex flex-wrap gap-2 text-xs mb-3">
                        <span className="px-2 py-1 bg-gem-pink/20 text-gem-pink rounded">NFT Standards</span>
                        <span className="px-2 py-1 bg-gem-pink/20 text-gem-pink rounded">Smart Contracts</span>
                        <span className="px-2 py-1 bg-gem-pink/20 text-gem-pink rounded">Digital Art</span>
                      </div>
                      <a
                        href="https://certificates.blockchain-council.org/77cf83b6-4df2-45e5-8676-e16c5cc4a0bd#acc.aDg5qjEe"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-gem-pink hover:text-gem-gold transition-colors"
                      >
                        View Certificate
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Baylor University */}
                <div className="bg-dark-bg/50 rounded-lg p-4 border border-gem-crystal/10">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-gem-gold to-gem-crystal rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-dark-bg" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">Baylor University</h3>
                      <p className="text-gem-gold font-semibold mb-2">BBA - Double Major: Finance & Economics</p>
                      <p className="text-sm text-gray-400 mb-2">Graduated: May 2004</p>
                      <p className="text-sm text-gray-400">
                        Participated in $5M university endowment fund management
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Entrepreneurial Journey - Collapsible */}
      <section className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-pink/5 border border-gem-pink/20 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowJourney(!showJourney)}
              className="w-full p-6 flex items-center justify-between hover:bg-gem-pink/5 transition-colors"
            >
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent flex items-center gap-3">
                <Rocket className="w-8 h-8 text-gem-pink" />
                Professional Journey
              </h2>
              <ChevronDown className={`w-6 h-6 text-gem-crystal transition-transform ${showJourney ? 'rotate-180' : ''}`} />
            </button>

            {showJourney && (
              <div className="px-6 pb-6">
                <p className="text-gray-300 mb-6 text-lg">
                  A resourceful and creative entrepreneur and business professional with diverse experiences across finance, technology, and creative industries.
                </p>

                <div className="space-y-4">
                  {/* Current Role */}
                  <div className="bg-gradient-to-br from-gem-crystal/10 to-gem-blue/10 rounded-lg p-4 border-l-4 border-gem-crystal">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gem-crystal rounded-lg flex items-center justify-center">
                        <Rocket className="w-5 h-5 text-dark-bg" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-gem-crystal">Director, Business Development</h3>
                          <span className="px-2 py-0.5 bg-gem-crystal/20 text-gem-crystal text-xs font-bold rounded-full">CURRENT</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">Consumer Insights Platform | 2019 - Present</p>
                        <p className="text-gray-300 mb-2">
                          Driving technical B2B partnership development as majority revenue contributor, delivering <span className="font-bold text-gem-crystal">$3.4M in 2024 (54% of total revenue)</span> and <span className="font-bold text-gem-crystal">$5M in 2025 (59%)</span>. Building and scaling integrations with consumer panel platforms through API, SDK, and iframe solutions, managing deployments for Fortune 500 survey inventory across over 85 active accounts.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* The Bazaar Studio */}
                  <div className="bg-gradient-to-br from-gem-pink/10 to-gem-purple/10 rounded-lg p-4 border-l-4 border-gem-pink">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gem-pink rounded-lg flex items-center justify-center">
                        <Palette className="w-5 h-5 text-dark-bg" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-gem-pink">Founding Artist</h3>
                          <span className="px-2 py-0.5 bg-gem-pink/20 text-gem-pink text-xs font-bold rounded-full">CURRENT</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">TheBazaarStudio.com | 2018 - Present</p>
                        <p className="text-gray-300 mb-2">
                          Created a portfolio of <span className="font-bold text-gem-pink">50+ original canvas paintings</span> and hundreds of original ink illustrations and digital works. Exhibited at RTown Gallery and featured in Plano Magazine and ShoutoutDFW.com.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stock Trading Newsletter */}
                  <div className="bg-gradient-to-br from-gem-gold/10 to-gem-crystal/10 rounded-lg p-4 border-l-4 border-gem-gold">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gem-gold rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-dark-bg" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gem-gold mb-1">Founder & Publisher</h3>
                        <p className="text-sm text-gray-400 mb-2">StockOrange.com | 2008 - 2012</p>
                        <p className="text-gray-300 mb-2">
                          Founded and operated a successful penny stock trading newsletter that grew to <span className="font-bold text-gem-gold">35,000 subscribers</span>. Turned a $700 initial investment (website + logo design) into <span className="font-bold text-gem-gold">$1M in revenue</span> over 4 years through strategic marketing and innovative social media integration on Twitter when the platform first launched.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Other Ventures */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-dark-bg/50 rounded-lg p-4 border border-gem-crystal/10">
                      <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gem-crystal" />
                        Stock Broker
                      </h3>
                      <p className="text-sm text-gray-400">Licensed financial professional with hands-on trading experience</p>
                    </div>

                    <div className="bg-dark-bg/50 rounded-lg p-4 border border-gem-crystal/10">
                      <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-gem-crystal" />
                        Ad Sales & Media Buyer
                      </h3>
                      <p className="text-sm text-gray-400">Strategic marketing and media placement expertise</p>
                    </div>

                    <div className="bg-dark-bg/50 rounded-lg p-4 border border-gem-crystal/10">
                      <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                        <Palette className="w-4 h-4 text-gem-crystal" />
                        Screenprinting Shop Owner
                      </h3>
                      <p className="text-sm text-gray-400">Operated creative production business, blending art and commerce</p>
                    </div>

                    <div className="bg-dark-bg/50 rounded-lg p-4 border border-gem-crystal/10">
                      <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                        <Rocket className="w-4 h-4 text-gem-crystal" />
                        Web3 Artist & Creator
                      </h3>
                      <p className="text-sm text-gray-400">2021 - Present: Building BizarreBeasts ecosystem full-time</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>


      {/* Philosophy Section */}
      <section className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-gem-gold/20 via-dark-card to-gem-crystal/20 border-2 border-gem-gold rounded-2xl p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
              The Philosophy: Community, Coins, & Culture
            </h2>

            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gem-crystal to-gem-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gem-crystal mb-2">Community</h3>
                <p className="text-sm text-gray-400">
                  Building genuine connections through daily rituals, shared experiences, and collaborative creativity
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gem-gold to-gem-crystal rounded-full flex items-center justify-center mx-auto mb-4">
                  <Coins className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gem-gold mb-2">Coins</h3>
                <p className="text-sm text-gray-400">
                  The $BB token empowers holders, rewards participation, and fuels a sustainable creative economy
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gem-pink to-gem-purple rounded-full flex items-center justify-center mx-auto mb-4">
                  <Palette className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gem-pink mb-2">Culture</h3>
                <p className="text-sm text-gray-400">
                  Original art, music, games, and narratives that celebrate the BIZARRE and inspire creativity
                </p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-300 text-lg italic">
                "This ethos runs through every aspect of BizarreBeasts, from the daily rituals that strengthen our community bonds, to the $BB token economy that rewards active participation, to the original artwork and games that define our BIZARRE culture."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Press & Media */}
      <section className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-purple/5 border border-gem-purple/20 rounded-2xl p-6">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-3">
              <Newspaper className="w-8 h-8 text-gem-purple" />
              <span className="bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">Press & Media</span>
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <a
                href="https://planomagazine.com/made-in-plano-nevele-society/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-dark-bg/50 rounded-lg p-4 border border-gem-crystal/10 hover:border-gem-crystal/30 transition-all group"
              >
                <h3 className="font-bold text-white mb-2 group-hover:text-gem-crystal transition-colors">Plano Magazine</h3>
                <p className="text-sm text-gray-400 mb-3">Featured: Made in Plano - Nevele Society</p>
                <div className="inline-flex items-center gap-1 text-sm text-gem-crystal">
                  Read Article
                  <ExternalLink className="w-3 h-3" />
                </div>
              </a>

              <a
                href="https://shoutoutdfw.com/meet-dylan-yarter-and-kate-yarter-n-a-artists-and-founders-of-the-bazaar-studio/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-dark-bg/50 rounded-lg p-4 border border-gem-crystal/10 hover:border-gem-crystal/30 transition-all group"
              >
                <h3 className="font-bold text-white mb-2 group-hover:text-gem-crystal transition-colors">ShoutoutDFW</h3>
                <p className="text-sm text-gray-400 mb-3">Featured: Artists & Founders of The Bazaar Studio</p>
                <div className="inline-flex items-center gap-1 text-sm text-gem-crystal">
                  Read Article
                  <ExternalLink className="w-3 h-3" />
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Awards & Recognition */}
      <section className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-gold/5 border border-gem-gold/20 rounded-2xl p-6">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-gem-gold" />
              <span className="bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">Awards & Recognition</span>
            </h2>

            <div className="space-y-4">
              <div className="bg-dark-bg/50 rounded-lg p-4 border border-gem-gold/10">
                <h3 className="font-bold text-gem-gold mb-2">Coinbase Onchain Summer Buildathon 2024</h3>
                <p className="text-sm text-gray-400 mb-2">
                  BizarreBeasts received <span className="font-bold text-gem-gold">19 quadratic votes</span> and <span className="font-bold text-gem-gold">7 attestations</span>, positioning for a proportional prize in the matching ETH pool.
                </p>
              </div>

              <div className="bg-dark-bg/50 rounded-lg p-4 border border-gem-purple/10">
                <h3 className="font-bold text-gem-purple mb-2">Remix Snap App Summer - 2024</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Won weekly awards across all four weeks of the competition with BizarreBeasts games:
                </p>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-gem-gold" />
                    <span><span className="font-semibold text-gem-gold">Week 1:</span> 3rd Place - $200</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-gem-gold" />
                    <span><span className="font-semibold text-gem-gold">Week 2:</span> 1st Place - $500</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-gem-gold" />
                    <span><span className="font-semibold text-gem-gold">Week 3:</span> 2nd Place - $300</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-gem-gold" />
                    <span><span className="font-semibold text-gem-gold">Week 4:</span> 1st Place - $350</span>
                  </li>
                </ul>
                <p className="text-xs text-gem-purple mt-3 font-semibold">Total Winnings: $1,350</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact/Opportunities Section */}
      <section className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-gem-gold/20 via-dark-card to-gem-pink/20 border-2 border-gem-gold rounded-2xl p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
              Open to Opportunities
            </h2>
            <p className="text-gray-300 text-center mb-6 max-w-2xl mx-auto">
              Open to partnerships, collaborations, and creative projects in the Web3 space. Let's connect and explore how we can build something innovative together.
            </p>

            <div className="flex justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-pink text-dark-bg rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                <Mail className="w-5 h-5" />
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-dark-card border border-gem-crystal/20 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Join the BIZARRE Journey</h2>
            <p className="text-gray-300 mb-6">
              Explore the ecosystem, create art, play games, and be part of a community that's pushing the boundaries of web3 creativity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/meme-generator"
                className="inline-block bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Create Memes
              </Link>
              <Link
                href="/games"
                className="inline-block bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Play Games
              </Link>
              <Link
                href="/rituals"
                className="inline-block bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Daily Rituals
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
