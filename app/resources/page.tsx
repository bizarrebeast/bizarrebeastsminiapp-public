'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Clock, 
  Globe, 
  ExternalLink, 
  Check,
  ChevronRight,
  Filter,
  Search,
  Star,
  Users,
  FileText
} from 'lucide-react';
import { resources, quickGuides, checklistItems } from '@/lib/resources-data';
import type { Resource } from '@/lib/resources-data';

export default function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [completedChecklist, setCompletedChecklist] = useState<string[]>([]);

  // Load checklist progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bb-checklist-progress');
    if (saved) {
      setCompletedChecklist(JSON.parse(saved));
    }
  }, []);

  // Save checklist progress to localStorage
  const toggleChecklistItem = (id: string) => {
    const updated = completedChecklist.includes(id)
      ? completedChecklist.filter(item => item !== id)
      : [...completedChecklist, id];
    
    setCompletedChecklist(updated);
    localStorage.setItem('bb-checklist-progress', JSON.stringify(updated));
  };

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

  // Difficulty colors
  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'beginner': return 'text-green-400 bg-green-400/10';
      case 'intermediate': return 'text-yellow-400 bg-yellow-400/10';
      case 'advanced': return 'text-red-400 bg-red-400/10';
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
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
            Resources
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-3xl mx-auto">
            Explore guides, tutorials, and documentation for the BizarreBeasts universe. 
            From beginner guides to advanced strategies, find everything you need to join our creative ecosystem.
          </p>
          
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

        {/* Search and Filters */}
        <section className="mb-8">
          <div className="bg-dark-card border border-gray-700 rounded-lg p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gem-crystal"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gem-crystal"
                >
                  <option value="all">All Categories</option>
                  <option value="getting-started">Getting Started</option>
                  <option value="tokens">Tokens</option>
                  <option value="empire">Empire</option>
                  <option value="games">Games</option>
                  <option value="community">Community</option>
                  <option value="international">International</option>
                </select>

                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gem-crystal"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>

                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gem-crystal"
                >
                  <option value="all">All Languages</option>
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{getLanguageLabel(lang)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Resources */}
        {featuredResources.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Featured Resources</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredResources.map(resource => (
                <a
                  key={resource.id}
                  href={resource.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border border-gem-crystal/20 rounded-lg p-6 hover:border-gem-crystal/40 transition-all duration-300 hover:scale-[1.02] group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-gem-gold" />
                      <span className="text-xs text-gem-gold font-semibold">Featured</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gem-crystal transition-colors" />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-gem-crystal transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">{resource.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {resource.readTime} min read
                    </span>
                    <span className={`px-2 py-1 rounded-full ${getDifficultyColor(resource.difficulty)}`}>
                      {resource.difficulty}
                    </span>
                    <span className="text-gray-500">Updated {resource.updatedDate}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* All Resources */}
        {regularResources.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">All Resources</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regularResources.map(resource => (
                <a
                  key={resource.id}
                  href={resource.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-dark-card border border-gray-700 rounded-lg p-4 hover:border-gem-crystal/40 transition-all duration-300 hover:scale-[1.02] group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white group-hover:text-gem-crystal transition-colors flex-1">
                      {resource.title}
                    </h3>
                    {resource.language !== 'en' && (
                      <span className="text-xs text-gray-400 ml-2">{getLanguageLabel(resource.language).split(' ')[0]}</span>
                    )}
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{resource.description}</p>
                  
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3 h-3" />
                      {resource.readTime} min
                    </span>
                    <span className={`px-2 py-1 rounded-full ${getDifficultyColor(resource.difficulty)}`}>
                      {resource.difficulty}
                    </span>
                    <span className="text-gray-500">{resource.updatedDate}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

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

        {/* Getting Started Checklist */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-pink/5 border border-gem-pink/20 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-2">Getting Started Checklist</h2>
            <p className="text-gray-400 mb-6">Track your progress as you explore the BizarreBeasts ecosystem</p>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Progress</span>
                <span className="text-gem-pink">{completedChecklist.length}/{checklistItems.length} completed</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedChecklist.length / checklistItems.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {checklistItems.map(item => (
                <div key={item.id} className="flex items-start gap-3">
                  <button
                    onClick={() => toggleChecklistItem(item.id)}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                      completedChecklist.includes(item.id)
                        ? 'bg-gradient-to-r from-gem-crystal to-gem-gold border-gem-crystal'
                        : 'border-gray-600 hover:border-gem-crystal'
                    }`}
                  >
                    {completedChecklist.includes(item.id) && (
                      <Check className="w-4 h-4 text-dark-bg" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${completedChecklist.includes(item.id) ? 'text-gray-500 line-through' : 'text-white'}`}>
                        {item.text}
                      </span>
                      {item.link && (
                        item.link.startsWith('http') ? (
                          <a href={item.link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3 text-gray-400 hover:text-gem-crystal" />
                          </a>
                        ) : (
                          <Link href={item.link}>
                            <ChevronRight className="w-3 h-3 text-gray-400 hover:text-gem-crystal" />
                          </Link>
                        )
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
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
      </div>
    </div>
  );
}