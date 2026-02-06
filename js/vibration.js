/**
 * Vibration manager
 * @module vibration
 */

import { CONFIG } from './config.js';
import { Storage } from './storage.js';
import { supportsVibration } from './utils.js';

class VibrationManager {
  constructor() {
    this.enabled = Storage.get(CONFIG.STORAGE_KEYS.VIBRATION_ENABLED) !== 'false';
    this.supported = supportsVibration();
  }

  /**
   * Vibrate with pattern
   * @param {number|number[]} pattern - Vibration pattern in ms
   */
  vibrate(pattern) {
    if (!this.enabled || !this.supported) return;

    try {
      navigator.vibrate(pattern);
    } catch (e) {
      console.warn('Error triggering vibration:', e);
    }
  }

  /**
   * Vibrate for correct answer
   */
  vibrateCorrect() {
    this.vibrate(CONFIG.VIBRATION.CORRECT);
  }

  /**
   * Vibrate for wrong answer
   */
  vibrateWrong() {
    this.vibrate(CONFIG.VIBRATION.WRONG);
  }

  /**
   * Vibrate for achievement
   */
  vibrateAchievement() {
    this.vibrate(CONFIG.VIBRATION.ACHIEVEMENT);
  }

  /**
   * Vibrate for new record
   */
  vibrateRecord() {
    this.vibrate(CONFIG.VIBRATION.RECORD);
  }

  /**
   * Cancel vibration
   */
  cancel() {
    if (this.supported) {
      try {
        navigator.vibrate(0);
      } catch (e) {
        // Ignore
      }
    }
  }

  /**
   * Toggle vibration on/off
   * @param {boolean} enabled - Enable state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    Storage.set(CONFIG.STORAGE_KEYS.VIBRATION_ENABLED, enabled.toString());
  }

  /**
   * Get current enabled state
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Check if vibration is supported
   * @returns {boolean}
   */
  isSupported() {
    return this.supported;
  }
}

// Create singleton instance
export const vibrationManager = new VibrationManager();

export default vibrationManager;
