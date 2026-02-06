/**
 * Safe localStorage wrapper with error handling
 * @module storage
 */

/**
 * Check if localStorage is available
 * @returns {boolean}
 */
function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

const storageAvailable = isStorageAvailable();

/**
 * Storage utility object
 */
export const Storage = {
  /**
   * Get item from localStorage
   * @param {string} key - Storage key
   * @returns {string|null}
   */
  get(key) {
    if (!storageAvailable) return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
      return null;
    }
  },

  /**
   * Set item in localStorage
   * @param {string} key - Storage key
   * @param {string} value - Value to store
   * @returns {boolean} Success status
   */
  set(key, value) {
    if (!storageAvailable) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('Error writing to localStorage:', e);
      return false;
    }
  },

  /**
   * Get JSON object from localStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist or parse fails
   * @returns {*}
   */
  getJSON(key, defaultValue = null) {
    const value = this.get(key);
    if (value === null) return defaultValue;
    try {
      return JSON.parse(value);
    } catch (e) {
      console.warn('Error parsing JSON from localStorage:', e);
      return defaultValue;
    }
  },

  /**
   * Set JSON object in localStorage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  setJSON(key, value) {
    try {
      return this.set(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Error stringifying JSON for localStorage:', e);
      return false;
    }
  },

  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  remove(key) {
    if (!storageAvailable) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('Error removing from localStorage:', e);
      return false;
    }
  },

  /**
   * Clear all items from localStorage
   * @returns {boolean} Success status
   */
  clear() {
    if (!storageAvailable) return false;
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.warn('Error clearing localStorage:', e);
      return false;
    }
  },

  /**
   * Check if key exists
   * @param {string} key - Storage key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }
};

export default Storage;
