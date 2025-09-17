/**
 * Utility functions
 */

/**
 * Format wallet address for display
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Get time remaining text
 */
export function getTimeRemaining(endDate: string): string {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
}

/**
 * Check if date is in the past
 */
export function isPastDate(date: string): boolean {
  return new Date(date) < new Date();
}

/**
 * Check if date is in the future
 */
export function isFutureDate(date: string): boolean {
  return new Date(date) > new Date();
}

/**
 * Check if current time is between two dates
 */
export function isBetweenDates(startDate?: string, endDate?: string): boolean {
  const now = new Date();

  if (startDate && new Date(startDate) > now) return false;
  if (endDate && new Date(endDate) < now) return false;

  return true;
}