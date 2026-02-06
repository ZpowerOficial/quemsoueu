/**
 * Utility functions
 * @module utils
 */

/**
 * Normalize text by removing accents and converting to lowercase
 * @param {string} text - Text to normalize
 * @returns {string}
 */
export function normalizeText(text) {
  if (!text) return '';
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Calculate age from birthdate
 * @param {string} birthdate - Birthdate in YYYY-MM-DD format
 * @returns {number|null}
 */
export function calcAge(birthdate) {
  if (!birthdate) return null;
  
  try {
    const today = new Date();
    const birthDate = new Date(birthdate);
    
    if (isNaN(birthDate.getTime())) return null;
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();
    
    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 0 ? age : null;
  } catch (e) {
    console.warn('Error calculating age:', e);
    return null;
  }
}

/**
 * Delay execution
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function}
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Milliseconds between calls
 * @returns {Function}
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Format date to locale string
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale string (default: pt-BR)
 * @returns {string}
 */
export function formatDate(date, locale = 'pt-BR') {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(locale);
  } catch (e) {
    return '';
  }
}

/**
 * Clamp number between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number}
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array}
 */
export function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deep clone object using JSON
 * @param {*} obj - Object to clone
 * @returns {*}
 */
export function deepClone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    console.warn('Error cloning object:', e);
    return obj;
  }
}

/**
 * Create DocumentFragment from HTML string
 * @param {string} html - HTML string
 * @returns {DocumentFragment}
 */
export function createFragment(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content;
}

/**
 * Check if device supports vibration
 * @returns {boolean}
 */
export function supportsVibration() {
  return 'vibrate' in navigator;
}

/**
 * Check if device supports service workers
 * @returns {boolean}
 */
export function supportsServiceWorker() {
  return 'serviceWorker' in navigator;
}

/**
 * Check if running on mobile device
 * @returns {boolean}
 */
export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get current timestamp
 * @returns {number}
 */
export function timestamp() {
  return Date.now();
}

/**
 * Simple LRU Cache implementation
 */
export class LRUCache {
  constructor(capacity = 50) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    const value = this.cache.get(key);
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }
}

export default {
  normalizeText,
  calcAge,
  delay,
  debounce,
  throttle,
  formatDate,
  clamp,
  randomInt,
  shuffle,
  deepClone,
  createFragment,
  supportsVibration,
  supportsServiceWorker,
  isMobile,
  timestamp,
  LRUCache
};
