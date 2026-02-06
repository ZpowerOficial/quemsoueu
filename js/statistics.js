/**
 * Statistics manager
 * @module statistics
 */

import { CONFIG } from './config.js';
import { Storage } from './storage.js';

class StatisticsManager {
  constructor() {
    this.stats = this.loadStats();
  }

  /**
   * Load statistics from storage
   * @returns {Object}
   */
  loadStats() {
    return Storage.getJSON(CONFIG.STORAGE_KEYS.STATISTICS, {
      gamesPlayed: 0,
      totalWins: 0,
      totalLosses: 0,
      totalAttempts: 0,
      currentStreak: 0,
      bestStreak: 0,
      perfectGuesses: 0,
      hintsUsed: 0,
      legendWins: 0,
      quickModeRecord: 0,
      normalModeRecord: 0,
      difficultModeRecord: 0,
      totalPlayTime: 0, // in seconds
      lastPlayedAt: null,
      firstPlayedAt: null,
      playerGuesses: {}, // { playerName: count }
      favoritePosition: null,
      favoriteNationality: null,
      favoriteLeague: null
    });
  }

  /**
   * Save statistics to storage
   */
  saveStats() {
    Storage.setJSON(CONFIG.STORAGE_KEYS.STATISTICS, this.stats);
  }

  /**
   * Record a game start
   */
  recordGameStart() {
    this.stats.gamesPlayed++;
    this.stats.lastPlayedAt = Date.now();
    
    if (!this.stats.firstPlayedAt) {
      this.stats.firstPlayedAt = Date.now();
    }
    
    this.saveStats();
  }

  /**
   * Record a win
   * @param {Object} options - Win options
   */
  recordWin(options = {}) {
    const { mode, legendMode, quickMode, score, attempts, isPerfect } = options;

    this.stats.totalWins++;
    this.stats.currentStreak++;
    
    if (this.stats.currentStreak > this.stats.bestStreak) {
      this.stats.bestStreak = this.stats.currentStreak;
    }

    if (isPerfect) {
      this.stats.perfectGuesses++;
    }

    // Update mode records
    if (legendMode) {
      this.stats.legendWins++;
    }

    if (quickMode && score > this.stats.quickModeRecord) {
      this.stats.quickModeRecord = score;
    }

    if (mode === 'normal' && score > this.stats.normalModeRecord) {
      this.stats.normalModeRecord = score;
    }

    if (mode === 'dificil' && score > this.stats.difficultModeRecord) {
      this.stats.difficultModeRecord = score;
    }

    this.saveStats();
  }

  /**
   * Record a loss
   */
  recordLoss() {
    this.stats.totalLosses++;
    this.stats.currentStreak = 0;
    this.saveStats();
  }

  /**
   * Record an attempt
   * @param {Object} player - Player that was guessed
   */
  recordAttempt(player) {
    this.stats.totalAttempts++;

    // Track player guesses
    if (player && player.name) {
      this.stats.playerGuesses[player.name] = (this.stats.playerGuesses[player.name] || 0) + 1;
    }

    this.saveStats();
  }

  /**
   * Record hint usage
   */
  recordHint() {
    this.stats.hintsUsed++;
    this.saveStats();
  }

  /**
   * Record play time
   * @param {number} seconds - Play time in seconds
   */
  recordPlayTime(seconds) {
    this.stats.totalPlayTime += seconds;
    this.saveStats();
  }

  /**
   * Get current statistics
   * @returns {Object}
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get win rate
   * @returns {number}
   */
  getWinRate() {
    const total = this.stats.gamesPlayed;
    if (total === 0) return 0;
    return Math.round((this.stats.totalWins / total) * 100);
  }

  /**
   * Get average attempts per game
   * @returns {number}
   */
  getAverageAttempts() {
    const total = this.stats.gamesPlayed;
    if (total === 0) return 0;
    return (this.stats.totalAttempts / total).toFixed(1);
  }

  /**
   * Get most guessed player
   * @returns {Object|null}
   */
  getMostGuessedPlayer() {
    const guesses = this.stats.playerGuesses;
    if (Object.keys(guesses).length === 0) return null;

    const sorted = Object.entries(guesses).sort((a, b) => b[1] - a[1]);
    return {
      name: sorted[0][0],
      count: sorted[0][1]
    };
  }

  /**
   * Get formatted play time
   * @returns {string}
   */
  getFormattedPlayTime() {
    const seconds = this.stats.totalPlayTime;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Reset all statistics
   */
  reset() {
    this.stats = this.loadStats();
    Storage.remove(CONFIG.STORAGE_KEYS.STATISTICS);
  }

  /**
   * Export statistics as JSON
   * @returns {string}
   */
  export() {
    return JSON.stringify(this.stats, null, 2);
  }

  /**
   * Import statistics from JSON
   * @param {string} json - JSON string
   * @returns {boolean} Success status
   */
  import(json) {
    try {
      const imported = JSON.parse(json);
      this.stats = { ...this.loadStats(), ...imported };
      this.saveStats();
      return true;
    } catch (e) {
      console.warn('Error importing statistics:', e);
      return false;
    }
  }
}

// Create singleton instance
export const statisticsManager = new StatisticsManager();

export default statisticsManager;
