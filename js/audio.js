/**
 * Audio manager using Web Audio API
 * @module audio
 */

import { CONFIG } from './config.js';
import { Storage } from './storage.js';

class AudioManager {
  constructor() {
    this.context = null;
    this.enabled = Storage.get(CONFIG.STORAGE_KEYS.AUDIO_ENABLED) !== 'false';
    this.initialized = false;
  }

  /**
   * Initialize audio context (requires user interaction)
   */
  init() {
    if (this.initialized) return;
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn('Web Audio API not supported');
        return;
      }
      
      this.context = new AudioContext();
      this.initialized = true;
    } catch (e) {
      console.warn('Error initializing audio:', e);
    }
  }

  /**
   * Play a tone
   * @param {number} frequency - Frequency in Hz
   * @param {number} duration - Duration in ms
   * @param {string} type - Oscillator type (sine, square, triangle, sawtooth)
   */
  playTone(frequency, duration, type = 'sine') {
    if (!this.enabled || !this.initialized || !this.context) return;

    try {
      // Resume context if suspended (iOS Safari)
      if (this.context.state === 'suspended') {
        this.context.resume();
      }

      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);

      // Envelope for smoother sound
      gainNode.gain.setValueAtTime(0, this.context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, this.context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration / 1000);

      oscillator.connect(gainNode);
      gainNode.connect(this.context.destination);

      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + duration / 1000);
    } catch (e) {
      console.warn('Error playing tone:', e);
    }
  }

  /**
   * Play correct answer sound
   */
  playCorrect() {
    const { frequency, duration, type } = CONFIG.AUDIO.CORRECT;
    this.playTone(frequency, duration, type);
  }

  /**
   * Play wrong answer sound
   */
  playWrong() {
    const { frequency, duration, type } = CONFIG.AUDIO.WRONG;
    this.playTone(frequency, duration, type);
  }

  /**
   * Play game over sound
   */
  playGameOver() {
    const { frequency, duration, type } = CONFIG.AUDIO.GAME_OVER;
    this.playTone(frequency, duration, type);
  }

  /**
   * Play achievement sound
   */
  playAchievement() {
    if (!this.enabled || !this.initialized || !this.context) return;

    const { frequency, duration, type } = CONFIG.AUDIO.ACHIEVEMENT;
    // Play a sequence of notes for achievement
    this.playTone(frequency, 100, type);
    setTimeout(() => this.playTone(frequency * 1.25, 100, type), 100);
    setTimeout(() => this.playTone(frequency * 1.5, 200, type), 200);
  }

  /**
   * Play click sound
   */
  playClick() {
    const { frequency, duration, type } = CONFIG.AUDIO.CLICK;
    this.playTone(frequency, duration, type);
  }

  /**
   * Play new record sound
   */
  playRecord() {
    if (!this.enabled || !this.initialized || !this.context) return;

    const { frequency, duration, type } = CONFIG.AUDIO.RECORD;
    // Play a celebratory sequence
    this.playTone(frequency, 100, type);
    setTimeout(() => this.playTone(frequency * 1.125, 100, type), 100);
    setTimeout(() => this.playTone(frequency * 1.25, 100, type), 200);
    setTimeout(() => this.playTone(frequency * 1.5, 200, type), 300);
  }

  /**
   * Toggle audio on/off
   * @param {boolean} enabled - Enable state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    Storage.set(CONFIG.STORAGE_KEYS.AUDIO_ENABLED, enabled.toString());
  }

  /**
   * Get current enabled state
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }
}

// Create singleton instance
export const audioManager = new AudioManager();

export default audioManager;
