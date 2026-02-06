/**
 * Achievements manager
 * @module achievements
 */

import { CONFIG } from './config.js';
import { Storage } from './storage.js';

class AchievementsManager {
  constructor() {
    this.unlocked = Storage.getJSON(CONFIG.STORAGE_KEYS.ACHIEVEMENTS, []);
  }

  /**
   * Check and unlock achievements based on statistics
   * @param {Object} stats - Current game statistics
   * @returns {Array} Newly unlocked achievements
   */
  checkAchievements(stats) {
    const newlyUnlocked = [];

    Object.values(CONFIG.ACHIEVEMENTS).forEach(achievement => {
      // Skip if already unlocked
      if (this.isUnlocked(achievement.id)) return;

      // Check condition
      if (achievement.condition(stats)) {
        this.unlock(achievement.id);
        newlyUnlocked.push(achievement);
      }
    });

    return newlyUnlocked;
  }

  /**
   * Unlock an achievement
   * @param {string} achievementId - Achievement ID
   */
  unlock(achievementId) {
    if (this.isUnlocked(achievementId)) return;

    this.unlocked.push({
      id: achievementId,
      unlockedAt: Date.now()
    });

    Storage.setJSON(CONFIG.STORAGE_KEYS.ACHIEVEMENTS, this.unlocked);
  }

  /**
   * Check if achievement is unlocked
   * @param {string} achievementId - Achievement ID
   * @returns {boolean}
   */
  isUnlocked(achievementId) {
    return this.unlocked.some(a => a.id === achievementId);
  }

  /**
   * Get all unlocked achievements
   * @returns {Array}
   */
  getUnlocked() {
    return this.unlocked.map(u => {
      const achievement = Object.values(CONFIG.ACHIEVEMENTS).find(a => a.id === u.id);
      return {
        ...achievement,
        unlockedAt: u.unlockedAt
      };
    });
  }

  /**
   * Get all achievements with unlock status
   * @returns {Array}
   */
  getAll() {
    return Object.values(CONFIG.ACHIEVEMENTS).map(achievement => ({
      ...achievement,
      unlocked: this.isUnlocked(achievement.id),
      unlockedAt: this.unlocked.find(u => u.id === achievement.id)?.unlockedAt
    }));
  }

  /**
   * Get achievement progress percentage
   * @returns {number}
   */
  getProgress() {
    const total = Object.keys(CONFIG.ACHIEVEMENTS).length;
    const unlocked = this.unlocked.length;
    return Math.round((unlocked / total) * 100);
  }

  /**
   * Reset all achievements
   */
  reset() {
    this.unlocked = [];
    Storage.remove(CONFIG.STORAGE_KEYS.ACHIEVEMENTS);
  }
}

// Create singleton instance
export const achievementsManager = new AchievementsManager();

export default achievementsManager;
