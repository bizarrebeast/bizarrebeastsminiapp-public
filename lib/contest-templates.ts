export interface ContestTemplate {
  id: string;
  name: string;
  category: 'gaming' | 'creative' | 'engagement' | 'custom';
  description: string;
  formData: {
    type: 'game_score' | 'creative' | 'onboarding' | 'tiered';
    description: string;
    game_name?: string;
    min_bb_required: string;
    max_bb_required?: string;
    prize_amount: string;
    prize_type: 'tokens' | 'nft' | 'both';
    max_entries_per_wallet: string;
    rules: string;
    is_recurring: boolean;
    recurrence_interval?: 'daily' | 'weekly' | 'monthly';
    voting_enabled: boolean;
    voting_type?: 'single' | 'multiple' | 'ranked';
    min_votes_required?: string;
    cta_button_text?: string;
    cta_type?: 'internal' | 'external' | 'game' | 'tool';
    track_cta_clicks?: boolean;
  };
}

// Pre-defined templates
export const defaultTemplates: ContestTemplate[] = [
  {
    id: 'high-score-weekly',
    name: 'Weekly High Score Challenge',
    category: 'gaming',
    description: 'Standard weekly high score competition',
    formData: {
      type: 'game_score',
      description: 'Compete for the highest score this week! Top 10 players win $BB tokens.',
      game_name: 'Treasure Quest',
      min_bb_required: '0',
      prize_amount: '100000000000000000000',
      prize_type: 'tokens',
      max_entries_per_wallet: '999',
      rules: '• Play as many times as you want\n• Your best score counts\n• Competition ends Sunday at midnight\n• Top 10 players share the prize pool',
      is_recurring: true,
      recurrence_interval: 'weekly',
      voting_enabled: false,
      track_cta_clicks: true
    }
  },
  {
    id: 'meme-contest',
    name: 'Meme Creation Contest',
    category: 'creative',
    description: 'Community-voted meme competition',
    formData: {
      type: 'creative',
      description: 'Create the funniest BizarreBeasts meme! Community votes decide the winner.',
      min_bb_required: '0',
      prize_amount: '50000000000000000000',
      prize_type: 'tokens',
      max_entries_per_wallet: '3',
      rules: '• Use BizarreBeasts stickers\n• Keep it fun and appropriate\n• One submission per day\n• Community votes determine winners',
      is_recurring: false,
      voting_enabled: true,
      voting_type: 'single',
      min_votes_required: '5',
      cta_button_text: 'Create Your Meme',
      cta_type: 'tool',
      track_cta_clicks: true
    }
  },
  {
    id: 'daily-check-in',
    name: 'Daily Check-in Rewards',
    category: 'engagement',
    description: 'Daily engagement incentive program',
    formData: {
      type: 'onboarding',
      description: 'Check in daily to earn $BB tokens! Streak bonuses for consecutive days.',
      min_bb_required: '0',
      prize_amount: '10000000000000000000',
      prize_type: 'tokens',
      max_entries_per_wallet: '1',
      rules: '• Check in once per day\n• Build your streak for bonus rewards\n• Share on Farcaster for extra points',
      is_recurring: true,
      recurrence_interval: 'daily',
      voting_enabled: false,
      cta_button_text: 'Check In',
      cta_type: 'internal',
      track_cta_clicks: true
    }
  },
  {
    id: 'empire-climb',
    name: 'Empire Rank Climb',
    category: 'engagement',
    description: 'Tiered rewards based on Empire rank',
    formData: {
      type: 'tiered',
      description: 'Climb the Empire ranks to unlock exclusive rewards!',
      min_bb_required: '1000000000000000000',
      max_bb_required: '100000000000000000000',
      prize_amount: '200000000000000000000',
      prize_type: 'both',
      max_entries_per_wallet: '1',
      rules: '• Hold $BB tokens to participate\n• Higher ranks unlock better rewards\n• Exclusive NFTs for top tier',
      is_recurring: false,
      voting_enabled: false,
      cta_button_text: 'View Empire',
      cta_type: 'internal',
      track_cta_clicks: true
    }
  }
];

// Get templates by category
export function getTemplatesByCategory(category?: string): ContestTemplate[] {
  if (!category || category === 'all') return defaultTemplates;
  return defaultTemplates.filter(t => t.category === category);
}

// Local storage functions for custom templates
const CUSTOM_TEMPLATES_KEY = 'bizarrebeasts_contest_templates';

export function getCustomTemplates(): ContestTemplate[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load custom templates:', error);
    return [];
  }
}

export function saveCustomTemplate(template: Omit<ContestTemplate, 'id'>): ContestTemplate {
  const customTemplates = getCustomTemplates();
  const newTemplate: ContestTemplate = {
    ...template,
    id: `custom-${Date.now()}`,
    category: 'custom'
  };

  customTemplates.push(newTemplate);

  try {
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(customTemplates));
  } catch (error) {
    console.error('Failed to save custom template:', error);
    throw error;
  }

  return newTemplate;
}

export function deleteCustomTemplate(id: string): void {
  const customTemplates = getCustomTemplates();
  const filtered = customTemplates.filter(t => t.id !== id);

  try {
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete custom template:', error);
    throw error;
  }
}

export function getAllTemplates(): ContestTemplate[] {
  return [...defaultTemplates, ...getCustomTemplates()];
}