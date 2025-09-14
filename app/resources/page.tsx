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
  Sparkles,
  Trophy,
  Zap
} from 'lucide-react';
import { resources, quickGuides } from '@/lib/resources-data';
import type { Resource } from '@/lib/resources-data';

export default function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');

  // Filter resources
  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || resource.difficulty === selectedDifficulty;
    const matchesLanguage = selectedLanguage === 'all' || resource.language === selectedLanguage;

    return matchesSearch && matchesCategory && matchesDifficulty && matchesLanguage;
  });

  const featuredResources = filteredResources.filter(r => r.featured);
  const regularResources = filteredResources.filter(r => !r.featured);

  // Get unique languages
  const languages = Array.from(new Set(resources.map(r => r.language)));
  const resourceCount = resources.length;

  // Difficulty colors with gem-inspired styling
  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'beginner': return 'text-gem-crystal bg-gem-crystal/10 border-gem-crystal/40';
      case 'intermediate': return 'text-gem-gold bg-gem-gold/10 border-gem-gold/40';
      case 'advanced': return 'text-gem-pink bg-gem-pink/10 border-gem-pink/40';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/40';
    }
  };

  // Difficulty icons
  const getDifficultyIcon = (difficulty: string) => {
    switch(difficulty) {
      case 'beginner': return <Sparkles className="w-3 h-3" />;
      case 'intermediate': return <Zap className="w-3 h-3" />;
      case 'advanced': return <Trophy className="w-3 h-3" />;
      default: return null;
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
        {/* Banner with gradient border */}
        <div className="mb-8 flex justify-center">
          <div className="relative rounded-2xl p-[2px] bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink">
            <img
              src="/assets/page-assets/banners/community-resources-banner.png"
              alt="Community Resources - Guides, tutorials, and documentation for the BizarreBeasts universe"
              className="w-full max-w-4xl object-contain rounded-2xl bg-dark-bg"
            />
          </div>
        </div>

        {/* Hero Section with enhanced styling */}
        <section className="text-center mb-12">
          <p className="text-gray-300 text-lg mb-8 max-w-3xl mx-auto">
            Explore guides, tutorials, and documentation for the{' '}
            <span className="bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent font-bold">
              BizarreBeasts
            </span>{' '}
            universe. From beginner guides to advanced strategies, find everything you need to join our creative ecosystem.
          </p>

          {/* Quick Stats with gradient backgrounds */}
          <div className="flex justify-center gap-6 mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-gem-crystal/20 to-transparent rounded-lg blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative bg-dark-card border border-gem-crystal/20 rounded-lg p-4 hover:border-gem-crystal/40 transition-all duration-300">
                <div className="text-3xl font-bold bg-gradient-to-r from-gem-crystal to-gem-crystal/60 bg-clip-text text-transparent">
                  {resourceCount}
                </div>
                <div className="text-sm text-gray-400">Resources</div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-gem-gold/20 to-transparent rounded-lg blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative bg-dark-card border border-gem-gold/20 rounded-lg p-4 hover:border-gem-gold/40 transition-all duration-300">
                <div className="text-3xl font-bold bg-gradient-to-r from-gem-gold to-gem-gold/60 bg-clip-text text-transparent">
                  {languages.length}
                </div>
                <div className="text-sm text-gray-400">Languages</div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-gem-pink/20 to-transparent rounded-lg blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative bg-dark-card border border-gem-pink/20 rounded-lg p-4 hover:border-gem-pink/40 transition-all duration-300">
                <div className="text-3xl font-bold bg-gradient-to-r from-gem-pink to-gem-pink/60 bg-clip-text text-transparent">
                  Free
                </div>
                <div className="text-sm text-gray-400">Access</div>
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filters with enhanced styling */}
        <section className="mb-8">
          <div className="relative">
            {/* Animated gradient border */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink p-[1px]">
              <div className="h-full w-full rounded-lg bg-dark-bg" />
            </div>

            <div className="relative bg-gradient-to-br from-dark-card/90 via-dark-card/80 to-gem-crystal/5 backdrop-blur-sm rounded-lg p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search with gem styling */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gem-crystal w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search resources..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-dark-bg/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gem-crystal focus:shadow-lg focus:shadow-gem-crystal/20 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Filters with gem styling */}
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-3 bg-dark-bg/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gem-crystal hover:border-gem-crystal/50 transition-all duration-300 cursor-pointer"
                  >
                    <option value="all">📚 All Categories</option>
                    <option value="getting-started">🚀 Getting Started</option>
                    <option value="tokens">💰 Tokens</option>
                    <option value="empire">👑 Empire</option>
                    <option value="games">🎮 Games</option>
                    <option value="community">👥 Community</option>
                    <option value="international">🌍 International</option>
                  </select>

                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="px-4 py-3 bg-dark-bg/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gem-gold hover:border-gem-gold/50 transition-all duration-300 cursor-pointer"
                  >
                    <option value="all">🎯 All Levels</option>
                    <option value="beginner">✨ Beginner</option>
                    <option value="intermediate">⚡ Intermediate</option>
                    <option value="advanced">🏆 Advanced</option>
                  </select>

                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="px-4 py-3 bg-dark-bg/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gem-pink hover:border-gem-pink/50 transition-all duration-300 cursor-pointer"
                  >
                    <option value="all">🌐 All Languages</option>
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{getLanguageLabel(lang)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Resources with premium styling */}
        {featuredResources.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-gem-gold to-gem-crystal bg-clip-text text-transparent">
              ⭐ Featured Resources
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredResources.map(resource => (
                <a
                  key={resource.id}
                  href={resource.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group"
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gem-gold/20 via-gem-crystal/10 to-gem-pink/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Card content */}
                  <div className="relative bg-gradient-to-br from-dark-card via-dark-card/90 to-gem-crystal/10 border border-gem-gold/30 rounded-xl p-6 hover:border-gem-gold/60 transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-gem-gold/20">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-gradient-to-br from-gem-gold to-gem-crystal rounded-lg">
                          <Star className="w-4 h-4 text-dark-bg" />
                        </div>
                        <span className="text-xs font-bold bg-gradient-to-r from-gem-gold to-gem-crystal bg-clip-text text-transparent uppercase tracking-wider">
                          Featured
                        </span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gem-crystal transition-all duration-300 group-hover:transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </div>

                    <h3 className="text-xl font-bold mb-3 text-white group-hover:bg-gradient-to-r group-hover:from-gem-crystal group-hover:to-gem-gold group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                      {resource.title}
                    </h3>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">{resource.description}</p>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-gem-crystal">
                        <Clock className="w-3 h-3" />
                        {resource.readTime} min
                      </span>
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full border ${getDifficultyColor(resource.difficulty)}`}>
                        {getDifficultyIcon(resource.difficulty)}
                        {resource.difficulty}
                      </span>
                      <span className="text-gray-400">Updated {resource.updatedDate}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* All Resources with enhanced cards */}
        {regularResources.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-gem-crystal" />
              All Resources
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regularResources.map(resource => (
                <a
                  key={resource.id}
                  href={resource.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gem-crystal/5 via-transparent to-gem-pink/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative bg-dark-card border border-gray-700 rounded-lg p-5 hover:border-gem-crystal/40 transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-xl hover:shadow-gem-crystal/10">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white group-hover:text-gem-crystal transition-colors flex-1">
                        {resource.title}
                      </h3>
                      {resource.language !== 'en' && (
                        <span className="text-xs bg-gem-pink/10 text-gem-pink px-2 py-1 rounded-full ml-2">
                          {getLanguageLabel(resource.language).split(' ')[0]}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{resource.description}</p>

                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-3 h-3" />
                        {resource.readTime} min
                      </span>
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full border ${getDifficultyColor(resource.difficulty)}`}>
                        {getDifficultyIcon(resource.difficulty)}
                        {resource.difficulty}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Quick Start Guides with gradient styling */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-gem-gold" />
            Quick Start Guides
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {quickGuides.map((guide, index) => {
              const colors = [
                'from-gem-crystal/10 to-gem-crystal/5 border-gem-crystal/20 hover:border-gem-crystal/40',
                'from-gem-gold/10 to-gem-gold/5 border-gem-gold/20 hover:border-gem-gold/40',
                'from-gem-pink/10 to-gem-pink/5 border-gem-pink/20 hover:border-gem-pink/40'
              ];
              const stepColors = [
                'from-gem-crystal to-gem-crystal/60',
                'from-gem-gold to-gem-gold/60',
                'from-gem-pink to-gem-pink/60'
              ];

              return (
                <div
                  key={guide.id}
                  className={`bg-gradient-to-br ${colors[index % 3]} border rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:transform hover:scale-[1.02]`}
                >
                  <h3 className="text-lg font-bold mb-3 text-white">{guide.title}</h3>
                  <p className="text-gray-300 text-sm mb-4">{guide.description}</p>

                  <div className="space-y-3">
                    {guide.steps.map(step => (
                      <div key={step.number} className="flex items-start gap-3 group">
                        <div className={`w-7 h-7 bg-gradient-to-br ${stepColors[index % 3]} rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                          <span className="text-xs font-bold text-dark-bg">{step.number}</span>
                        </div>
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                          {step.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Complete Documentation CTA with enhanced styling */}
        <section className="text-center">
          <div className="relative group">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-pink rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />

            {/* Content */}
            <div className="relative bg-gradient-to-br from-dark-card via-dark-card/95 to-gem-gold/10 border border-gem-gold/30 rounded-2xl p-10 hover:border-gem-gold/50 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gem-gold to-gem-crystal rounded-full mb-6">
                <FileText className="w-8 h-8 text-dark-bg" />
              </div>

              <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-pink bg-clip-text text-transparent">
                Complete Documentation
              </h3>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                Access all articles, guides, and updates on our Paragraph blog.
                Dive deep into the BizarreBeasts ecosystem with comprehensive documentation.
              </p>

              <a
                href="https://paragraph.com/@bizarrebeasts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg px-8 py-4 rounded-xl font-bold hover:shadow-2xl hover:shadow-gem-gold/30 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
              >
                <span>Visit Paragraph</span>
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}