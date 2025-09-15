/**
 * Beta Tester Configuration
 * These addresses get special badges during beta testing phase
 */

export const BETA_TESTERS = [
  // Add beta tester addresses here (lowercase)
  '0x300a8611d53ca380da1c556ca5f8a64d8e1a9dfb', // BB's test wallet
  '0x3fdd6afed7a19990632468c7102219d051e685db', // Beta tester
  '0x2bfbbc03c3e22903206239e7fd802e6726b19b25', // Beta tester
  '0x971a34351b425043d9999e6bc4db6d8671e93fa0', // Beta tester (Rainbow wallet)
  // Add more beta tester addresses below as needed
];

export const isBetaTester = (address: string | null): boolean => {
  if (!address) return false;
  return BETA_TESTERS.includes(address.toLowerCase());
};

// Beta testing phase - set to false after beta ends
export const BETA_PHASE_ACTIVE = true;

// Beta tester benefits
export const BETA_BENEFITS = {
  badge: '🧪',
  badgeText: 'Beta Tester',
  bonusMultiplier: 1.1, // 10% bonus rewards during beta
  specialMessage: 'Thank you for being an early supporter!'
};