'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  Globe,
  ExternalLink,
  Filter,
  Search,
  Star,
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Gamepad2,
  Crown,
  Coins,
  Heart,
  Globe2
} from 'lucide-react';
import { resources, quickGuides } from '@/lib/resources-data';
import type { Resource } from '@/lib/resources-data';

export default function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // Removed difficulty filter - now using topic instead
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['getting-started']));

  // Filter resources
  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    // Difficulty filter removed - using topic tags instead
    const matchesLanguage = selectedLanguage === 'all' || resource.language === selectedLanguage;

    return matchesSearch && matchesCategory && matchesLanguage;
  });

  const featuredResources = filteredResources.filter(r => r.featured);

  // Group resources by category
  const resourcesByCategory = filteredResources.reduce((acc, resource) => {
    if (!resource.featured) {
      if (!acc[resource.category]) {
        acc[resource.category] = [];
      }
      acc[resource.category].push(resource);
    }
    return acc;
  }, {} as Record<string, Resource[]>);

  // Get unique languages
  const languages = Array.from(new Set(resources.map(r => r.language)));
  const resourceCount = resources.length;

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Get category info
  const getCategoryInfo = (category: string) => {
    switch(category) {
      case 'how-to':
        return { icon: BookOpen, color: 'from-teal-400 to-yellow-400', name: 'BizarreBeasts Miniapp How-To Series' };
      case 'getting-started':
        return { icon: Sparkles, color: 'from-teal-400 to-yellow-400', name: 'Getting Started' };
      case 'tokens':
        return { icon: Coins, color: 'from-teal-400 to-yellow-400', name: 'Tokens & Economy' };
      case 'empire':
        return { icon: Crown, color: 'from-teal-400 to-yellow-400', name: 'Empire System' };
      case 'games':
        return { icon: Gamepad2, color: 'from-teal-400 to-yellow-400', name: 'Games & Entertainment' };
      case 'community':
        return { icon: Heart, color: 'from-teal-400 to-yellow-400', name: 'Community & Culture' };
      case 'international':
        return { icon: Globe2, color: 'from-teal-400 to-yellow-400', name: 'International' };
      case 'monthly-updates':
        return { icon: FileText, color: 'from-teal-400 to-yellow-400', name: 'Monthly Updates' };
      case 'art':
        return { icon: Sparkles, color: 'from-teal-400 to-yellow-400', name: 'Art & Creativity' };
      case 'technical':
        return { icon: BookOpen, color: 'from-teal-400 to-yellow-400', name: 'Technical Deep Dives' };
      default:
        return { icon: FileText, color: 'from-teal-400 to-yellow-400', name: category };
    }
  };

  // Topic colors
  const getTopicColor = (topic: string) => {
    switch(topic) {
      case 'Guide': return 'text-gem-crystal bg-gem-crystal/10';
      case 'Tutorial': return 'text-green-400 bg-green-400/10';
      case 'Announcement': return 'text-gem-gold bg-gem-gold/10';
      case 'Development': return 'text-purple-400 bg-purple-400/10';
      case 'Monthly Recap': return 'text-blue-400 bg-blue-400/10';
      case 'Art Showcase': return 'text-gem-pink bg-gem-pink/10';
      case 'New Release': return 'text-yellow-400 bg-yellow-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  // Language flags/labels
  const getLanguageLabel = (lang: string) => {
    switch(lang) {
      case 'en': return '🇬🇧 English';
      case 'es': return '🇪🇸 Español';
      case 'ko': return '🇰🇷 한국어';
      case 'ja': return '🇯🇵 日本語';
      case 'zh': return '🇨🇳 中文';
      default: return lang;
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Title and Description */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent leading-tight pb-2">
            Community Resources
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Explore guides, tutorials, and documentation for the BizarreBeasts universe.
            From beginner guides to advanced strategies, find everything you need to join our creative ecosystem.
          </p>
        </div>

        {/* Hero Section */}
        <section className="text-center mb-12">
          
          {/* Quick Stats */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-gem-crystal">{resourceCount}</div>
              <div className="text-sm text-gray-400">Resources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gem-gold">{languages.length}</div>
              <div className="text-sm text-gray-400">Languages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gem-pink">Free</div>
              <div className="text-sm text-gray-400">Access</div>
            </div>
          </div>
        </section>


        {/* How-To Series Guide - New Special Prominent Section */}
        <section className="mb-12">
          <div className="relative overflow-hidden rounded-xl">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-yellow-500/10 to-teal-400/20" />

            {/* Content */}
            <div className="relative bg-dark-card/90 backdrop-blur border border-yellow-500/30 rounded-xl">
              {/* Banner Image - Top */}
              <div className="relative h-64 md:h-80 overflow-hidden">
                <img
                  src="/assets/page-assets/banners/bizarrebeasts-how-to-series-banner-1.png"
                  alt="How-To Series"
                  className="w-full h-full object-cover rounded-t-xl"
                />
              </div>

              {/* Content - Below */}
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gradient-to-r from-teal-400 to-yellow-400 rounded-lg">
                    <BookOpen className="w-6 h-6 text-dark-bg" />
                  </div>
                  <span className="text-sm font-bold bg-gradient-to-r from-teal-400 to-yellow-400 bg-clip-text text-transparent uppercase tracking-wider">How-To Series</span>
                </div>

                <h3 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-teal-400 to-yellow-400 bg-clip-text text-transparent">
                  BizarreBeasts Miniapp How-To: Stickers & Meme Creator
                </h3>

                <p className="text-gray-300 mb-6">
                  Learn how to use the BizarreBeasts Stickers & Meme Creator tool. Step-by-step guide to creating custom memes, PFPs, and artwork with BizarreBeasts stickers.
                </p>

                {/* Read Article Button */}
                <a
                  href="https://paragraph.com/@bizarrebeasts/bizarrebeasts-miniapp-how-to-series-stickers-and-meme-creator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-400 to-yellow-400 text-dark-bg font-bold rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  Read Tutorial
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Empire Guide - Special Prominent Section */}
        <section className="mb-12">
          <div className="relative overflow-hidden rounded-xl">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-gem-purple/20 via-gem-gold/10 to-gem-crystal/20" />

            {/* Content */}
            <div className="relative bg-dark-card/90 backdrop-blur border border-gem-gold/30 rounded-xl">
              {/* Banner Image - Top */}
              <div className="relative h-64 md:h-80 overflow-hidden">
                <img
                  src="/assets/page-assets/banners/page-banners/bizarrebeasts-page-banner-8.svg"
                  alt="Empire Guide"
                  className="w-full h-full object-cover rounded-t-xl"
                />
              </div>

              {/* Content - Below */}
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gradient-to-r from-gem-gold to-gem-crystal rounded-lg">
                    <Crown className="w-6 h-6 text-dark-bg" />
                  </div>
                  <span className="text-sm font-bold bg-gradient-to-r from-gem-gold to-gem-crystal bg-clip-text text-transparent uppercase tracking-wider">Essential Guide</span>
                </div>

                <h3 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                  BizarreBeasts ($BB) Empire Guide
                </h3>

                <p className="text-gray-300 mb-6">
                  Everything you need to know to get started with the BizarreBeasts Empire. Complete walkthrough of tokens, boosters, rewards, and gameplay mechanics.
                </p>

                {/* Language Buttons - Same gradient, stacked on mobile */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="https://paragraph.com/@bizarrebeasts/discover-the-bizarrebeasts-empire-everything-you-need-to-know-to-get-started"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-pink text-dark-bg font-bold rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    🇬🇧 English
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <a
                    href="https://paragraph.com/@bizarrebeasts/discover-the-bizarrebeasts-empire-everything-you-need-to-know-to-get-started-spanish"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-pink text-dark-bg font-bold rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    🇪🇸 Español
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <a
                    href="https://paragraph.com/@bizarrebeasts/discover-the-bizarrebeasts-empire-everything-you-need-to-know-to-get-started-korean"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-pink text-dark-bg font-bold rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    🇰🇷 한국어
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Other Featured Resources - Grid Layout */}
        {featuredResources.length > 1 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Star className="w-6 h-6 text-gem-gold" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gem-gold to-gem-crystal bg-clip-text text-transparent">
                Featured Guides
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredResources.slice(2, 5).map(resource => (
                <a
                  key={resource.id}
                  href={resource.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div className="bg-dark-card border border-gem-crystal/20 rounded-lg overflow-hidden hover:border-gem-crystal/40 transition-all duration-300 h-full flex flex-col">
                    {/* Banner Image */}
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gem-purple/20 to-gem-crystal/20">
                      <img
                        src={
                          resource.id === 'beginners-guide' ? '/assets/page-assets/banners/page-banners/bizarrebeasts-page-banner-5.svg' :
                          resource.id === 'treasure-quest-guide' ? '/assets/page-assets/banners/page-banners/bizarrebeasts-page-banner-14.svg' :
                          resource.id === 'building-web3-masterpiece' ? '/assets/page-assets/banners/page-banners/bizarrebeasts-page-banner-11.svg' :
                          '/assets/page-assets/featured-boxes/empire-quest-featured-box.svg'
                        }
                        alt={resource.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getTopicColor((resource as any).topic || 'Guide')}`}>
                          {(resource as any).topic || 'Guide'}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-gem-crystal transition-colors">
                        {resource.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4 flex-1">{resource.description}</p>

                      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-700">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {resource.readTime} min read
                        </span>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gem-crystal transition-colors" />
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Search Bar - Moved above Browse Categories */}
        <section className="mb-8">
          <div className="max-w-3xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink rounded-lg opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative bg-dark-card border border-gem-crystal/20 rounded-lg p-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gem-crystal w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search articles, guides, and resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-dark-bg border-0 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gem-crystal/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex justify-center gap-2 mt-4 flex-wrap">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-dark-card border border-gray-700 rounded-full text-sm text-white focus:outline-none focus:border-gem-crystal"
            >
              <option value="all">All Categories</option>
              <option value="getting-started">Getting Started</option>
              <option value="tokens">Tokens</option>
              <option value="empire">Empire</option>
              <option value="games">Games</option>
              <option value="community">Community</option>
              <option value="monthly-updates">Monthly Updates</option>
              <option value="art">Art</option>
              <option value="technical">Technical</option>
              <option value="international">International</option>
            </select>

            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-1.5 bg-dark-card border border-gray-700 rounded-full text-sm text-white focus:outline-none focus:border-gem-crystal"
            >
              <option value="all">All Languages</option>
              {languages.map(lang => (
                <option key={lang} value={lang}>{getLanguageLabel(lang)}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Resources by Category - Accordion Style */}
        <section className="mb-12 space-y-4">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
            Browse by Category
          </h2>

          {Object.entries(resourcesByCategory).map(([category, categoryResources]) => {
            const categoryInfo = getCategoryInfo(category);
            const Icon = categoryInfo.icon;
            const isExpanded = expandedCategories.has(category);

            return (
              <div key={category} className="group">
                {/* Category Header - Clickable */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full relative overflow-hidden rounded-lg transition-all duration-300"
                >
                  {/* Gradient border effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${categoryInfo.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                  <div className="relative bg-dark-card border border-gem-crystal/20 group-hover:border-gem-crystal/40 rounded-lg p-4 flex items-center justify-between transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-gradient-to-r ${categoryInfo.color} rounded-lg`}>
                        <Icon className="w-5 h-5 text-dark-bg" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-white">{categoryInfo.name}</h3>
                        <p className="text-sm text-gray-400">{categoryResources.length} resources</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-gray-800 rounded-full text-gray-400">
                        {categoryResources.length}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gem-crystal transition-transform" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gem-crystal transition-all" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expandable Content - List of Resources */}
                {isExpanded && (
                  <div className="mt-2 space-y-2 pl-4 animate-in slide-in-from-top-2 duration-300">
                    {categoryResources.map(resource => (
                      <a
                        key={resource.id}
                        href={resource.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group/item"
                      >
                        <div className="bg-dark-card/50 border border-gray-700 hover:border-gem-crystal/30 rounded-lg p-4 transition-all duration-200 hover:translate-x-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-white group-hover/item:text-gem-crystal transition-colors mb-1">
                                {resource.title}
                              </h4>
                              <p className="text-xs text-gray-400 line-clamp-1 mb-2">
                                {resource.description}
                              </p>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-gray-500">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {resource.readTime} min
                                </span>
                                <span className={`px-2 py-0.5 rounded-full ${getTopicColor((resource as any).topic || 'Guide')}`}>
                                  {(resource as any).topic || 'Guide'}
                                </span>
                                {resource.language !== 'en' && (
                                  <span className="text-gray-500">
                                    {getLanguageLabel(resource.language).split(' ')[0]}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ExternalLink className="w-3 h-3 text-gray-500 group-hover/item:text-gem-crystal mt-1 ml-3 flex-shrink-0" />
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty State */}
          {Object.keys(resourcesByCategory).length === 0 && !featuredResources.length && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No resources found matching your criteria.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedLanguage('all');
                }}
                className="mt-4 text-gem-crystal hover:text-gem-gold transition-colors text-sm"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        {/* Quick Start Guides */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Quick Start Guides</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {quickGuides.map(guide => (
              <div key={guide.id} className="bg-dark-card border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">{guide.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{guide.description}</p>
                
                <div className="space-y-2">
                  {guide.steps.map(step => (
                    <div key={step.number} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-gem-crystal to-gem-gold rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-dark-bg">{step.number}</span>
                      </div>
                      <span className="text-sm text-gray-300">{step.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* Complete Documentation CTA */}
        <section className="text-center">
          <div className="bg-dark-card border border-gem-gold/20 rounded-lg p-8">
            <FileText className="w-12 h-12 text-gem-gold mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Complete Documentation</h3>
            <p className="text-gray-400 mb-6">Access all articles, guides, and updates on our Paragraph blog</p>
            <a
              href="https://paragraph.com/@bizarrebeasts"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Visit Paragraph
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </section>
        {/* Contract Information Section */}
        <section className="mt-12 mb-8">
          <div className="bg-dark-card border border-gem-crystal/20 rounded-xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-teal-400 to-yellow-400 rounded-lg">
                <FileText className="w-6 h-6 text-dark-bg" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-yellow-400 bg-clip-text text-transparent">
                Contract Information & Resources
              </h2>
            </div>

            {/* Main $BB Token */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-gem-gold" />
                BizarreBeasts ($BB) Token
              </h3>
              <div className="bg-dark-bg/50 rounded-lg p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className="text-gray-400 text-sm">Contract Address:</span>
                  <code className="text-gem-crystal text-xs sm:text-sm font-mono break-all">
                    0x0520bf1d3cEE163407aDA79109333aB1599b4004
                  </code>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="https://basescan.org/token/0x0520bf1d3cEE163407aDA79109333aB1599b4004"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gem-purple to-gem-blue text-white text-sm rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                    BaseScan
                  </a>
                  <a
                    href="https://dexscreener.com/base/0x49e35c372ee285d22a774f8a415f8bf3ad6456c2"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gem-gold to-gem-crystal text-dark-bg text-sm rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                    DexScreener
                  </a>
                  <a
                    href="https://app.uniswap.org/swap?outputCurrency=0x0520bf1d3cEE163407aDA79109333aB1599b4004&chain=base"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Uniswap
                  </a>
                </div>
              </div>
            </div>

            {/* Smart Contracts */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gem-purple" />
                Smart Contracts
              </h3>
              <div className="bg-dark-bg/50 rounded-lg p-4 space-y-4">
                <div>
                  <div className="font-semibold text-white mb-2">BizarreCheckIn Contract</div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <span className="text-gray-400 text-sm">Address:</span>
                    <code className="text-gem-crystal text-xs sm:text-sm font-mono break-all">
                      0x12125F025ea390B975aEa210B40c7B81dC2F00E0
                    </code>
                  </div>
                  <a
                    href="https://basescan.org/address/0x12125F025ea390B975aEa210B40c7B81dC2F00E0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-2 text-gem-crystal hover:text-gem-gold text-sm transition-colors"
                  >
                    View on BaseScan <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Ecosystem Tokens */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gem-crystal" />
                Ecosystem Tokens
              </h3>
              <div className="bg-dark-bg/50 rounded-lg p-4 space-y-4">
                {/* Zora Creator Coin */}
                <div className="border-b border-gem-crystal/10 pb-4">
                  <div className="font-semibold text-white mb-2">BizarreBeasts Zora Creator Coin</div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                    <span className="text-gray-400 text-sm">Contract:</span>
                    <code className="text-gem-crystal text-xs sm:text-sm font-mono break-all">
                      0x409a3041a005b0e1b4a9e8bb397a988228e05c2d
                    </code>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="https://zora.co/@bizarrebeasts"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white text-xs rounded-lg hover:bg-gray-900 transition-colors"
                    >
                      Zora Profile <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href="https://basescan.org/address/0x409a3041a005b0e1b4a9e8bb397a988228e05c2d"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 text-blue-400 text-xs rounded-lg hover:bg-blue-600/30 transition-colors"
                    >
                      BaseScan <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href="https://dexscreener.com/base/0xffb35712fae7648592ca57293bc910a21a55a9780d7b40c46087137d0b9039af"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-600/20 text-yellow-400 text-xs rounded-lg hover:bg-yellow-600/30 transition-colors"
                    >
                      DexScreener <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Placeholder for future tokens */}
                <div className="text-gray-500 text-sm italic pt-2">
                  More ecosystem tokens coming soon (App Tokens, Retake Token, etc.)
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}