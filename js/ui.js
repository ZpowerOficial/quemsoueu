/**
 * UI Manager - Handles all DOM interactions and rendering
 * @module ui
 */

import { CONFIG } from './config.js';
import { Storage } from './storage.js';
import { formatDate } from './utils.js';

class UIManager {
  constructor() {
    this.elements = {};
    this.toastTimeout = null;
    this.attempts = [];
  }

  /**
   * Initialize UI and cache DOM elements
   */
  initialize() {
    this.cacheElements();
    this.setupModalHandlers();
    this.setupMenuHandlers();
    this.loadSettings();
  }

  /**
   * Cache all DOM element references
   */
  cacheElements() {
    this.elements = {
      // Input & Game
      input: document.getElementById('player-input'),
      suggestions: document.getElementById('suggestions'),
      chooseBtn: document.getElementById('choose-btn'),
      feedback: document.getElementById('feedback'),
      playerDetails: document.getElementById('player-details'),
      hintBtn: document.getElementById('hint-btn'),
      hint: document.getElementById('hint'),
      loading: document.getElementById('loading'),
      skeleton: document.getElementById('skeleton-loader'),
      historyContainer: document.getElementById('history-container'),
      
      // Status
      roundInfo: document.getElementById('round-info'),
      winsInfo: document.getElementById('wins-info'),
      livesInfo: document.getElementById('lives-info'),
      recordInfo: document.getElementById('record-info'),
      timer: document.getElementById('timer'),
      
      // Menu & Toggles
      menuBtn: document.getElementById('menu-btn'),
      menuDropdown: document.getElementById('menu-dropdown'),
      modeToggle: document.getElementById('mode-toggle'),
      quickToggle: document.getElementById('quick-toggle'),
      legendToggle: document.getElementById('legend-toggle'),
      themeToggle: document.getElementById('theme-toggle'),
      audioToggle: document.getElementById('audio-toggle'),
      
      // Buttons
      tutorialBtn: document.getElementById('tutorial-btn'),
      achievementsBtn: document.getElementById('achievements-btn'),
      statsBtn: document.getElementById('stats-btn'),
      rankingBtn: document.getElementById('ranking-btn'),
      
      // Modals
      tutorialModal: document.getElementById('tutorial-modal'),
      achievementsModal: document.getElementById('achievements-modal'),
      statsModal: document.getElementById('stats-modal'),
      rankingModal: document.getElementById('ranking-modal'),
      closeButtons: document.querySelectorAll('.close'),
      
      // Lists
      rankingList: document.getElementById('ranking-list'),
      historyContent: document.getElementById('history-content'),
      
      // Effects
      toast: document.getElementById('toast'),
      confetti: document.getElementById('confetti-canvas')
    };

    // Create toast if it doesn't exist
    if (!this.elements.toast) {
      const toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
      this.elements.toast = toast;
    }
  }

  /**
   * Setup menu handlers
   */
  setupMenuHandlers() {
    // Menu toggle
    if (this.elements.menuBtn && this.elements.menuDropdown) {
      this.elements.menuBtn.addEventListener('click', () => {
        this.elements.menuDropdown.classList.toggle('active');
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!this.elements.menuBtn.contains(e.target) && 
            !this.elements.menuDropdown.contains(e.target)) {
          this.elements.menuDropdown.classList.remove('active');
        }
      });
    }
    

  }

  /**
   * Setup modal event handlers
   */
  setupModalHandlers() {
    // Close buttons
    this.elements.closeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) {
          modal.classList.remove('active');
          modal.style.display = 'none';
        }
      });
    });

    // Click outside to close
    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
        e.target.style.display = 'none';
      }
    });
  }

  /**
   * Load saved settings
   */
  loadSettings() {
    // Theme
    const darkMode = Storage.get(CONFIG.STORAGE_KEYS.DARK_MODE) === 'true';
    document.body.classList.toggle('dark-theme', darkMode);
    if (this.elements.themeToggle) this.elements.themeToggle.checked = darkMode;

    // Audio
    const audioEnabled = Storage.get(CONFIG.STORAGE_KEYS.AUDIO_ENABLED) !== 'false';
    if (this.elements.audioToggle) this.elements.audioToggle.checked = audioEnabled;
  }

  /**
   * Show loading state
   * @param {boolean} state - Loading state
   */
  setLoading(state) {
    if (this.elements.loading) {
      this.elements.loading.style.display = state ? 'flex' : 'none';
    }
    
    if (this.elements.skeleton) {
      this.elements.skeleton.style.display = state ? 'block' : 'none';
    }

    if (this.elements.input) {
      this.elements.input.disabled = state;
    }
  }

  /**
   * Update game status bar - new compact design
   * @param {Object} gameState - Current game state
   */
  updateGameStatus(gameState) {
    if (this.elements.roundInfo) {
      this.elements.roundInfo.textContent = gameState.round;
    }
    if (this.elements.winsInfo) {
      this.elements.winsInfo.textContent = gameState.wins;
    }
    if (this.elements.livesInfo) {
      this.elements.livesInfo.textContent = gameState.lives;
    }
    if (this.elements.recordInfo) {
      this.elements.recordInfo.textContent = gameState.record;
    }
  }

  /**
   * Update timer display
   * @param {number} time - Time in seconds
   */
  updateTimer(time) {
    if (this.elements.timer) {
      this.elements.timer.textContent = time > 0 ? `${time}s` : '--';
      
      // Add urgency class when time is low
      if (time <= 5 && time > 0) {
        this.elements.timer.classList.add('urgent');
      } else {
        this.elements.timer.classList.remove('urgent');
      }
    }
  }

  /**
   * Clear suggestions list
   */
  clearSuggestions() {
    if (this.elements.suggestions) {
      this.elements.suggestions.innerHTML = '';
    }
  }

  /**
   * Show feedback results - new clean design
   * @param {Array} results - Feedback results
   */
  showFeedback(results) {
    if (!this.elements.feedback) return;
    
    const fragment = document.createDocumentFragment();
    
    results.forEach(r => {
      const div = document.createElement('div');
      div.className = `feedback-item ${r.color}`;
      div.innerHTML = `
        <span class="feedback-label">${r.label}</span>
        <span class="feedback-value">${r.value}</span>
      `;
      fragment.appendChild(div);
    });

    this.elements.feedback.innerHTML = '';
    this.elements.feedback.appendChild(fragment);
  }

  /**
   * Show message
   * @param {string} message - Message text
   * @param {boolean} isSuccess - Success state
   */
  showMessage(message, isSuccess) {
    if (!this.elements.feedback) return;
    
    const type = isSuccess ? 'green' : 'red';
    this.elements.feedback.innerHTML = `
      <div class="feedback-item ${type}">
        <span class="feedback-value" style="grid-column: 1 / -1; text-align: center;">${message}</span>
      </div>
    `;
  }

  /**
   * Show toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type (success, error, info)
   * @param {number} duration - Duration in ms
   */
  showToast(message, type = 'info', duration = CONFIG.ANIMATIONS.TOAST_DURATION) {
    if (!this.elements.toast) return;

    clearTimeout(this.toastTimeout);

    this.elements.toast.textContent = message;
    this.elements.toast.className = `toast toast-${type} show`;

    this.toastTimeout = setTimeout(() => {
      this.elements.toast.classList.remove('show');
    }, duration);
  }

  /**
   * Show hint
   * @param {string} message - Hint message
   */
  showHint(message) {
    if (this.elements.hint) {
      this.elements.hint.textContent = message;
    }
  }

  /**
   * Display correct player details - new clean design
   * @param {Object} player - Player object
   * @param {Function} calcAge - Age calculation function
   */
  displayCorrectPlayer(player, calcAge) {
    if (!this.elements.playerDetails) return;
    
    this.elements.playerDetails.style.display = 'block';
    const age = player.birthdate ? calcAge(player.birthdate) : '-';
    
    this.elements.playerDetails.innerHTML = `
      <h3>✓ ${player.name}</h3>
      <p><strong>Idade:</strong> ${age !== null ? age + ' anos' : 'Desconhecida'}</p>
      <p><strong>Clube:</strong> ${player.club}</p>
      <p><strong>Liga:</strong> ${player.league || 'Sem informação'}</p>
      <p><strong>Posição:</strong> ${player.position}</p>
      <p><strong>Nacionalidade:</strong> ${player.nationality}</p>
    `;
  }

  /**
   * Hide player details
   */
  hidePlayerDetails() {
    if (this.elements.playerDetails) {
      this.elements.playerDetails.style.display = 'none';
    }
  }

  /**
   * Update attempts history panel
   * @param {Array} attempts - Attempts array
   */
  updateAttemptsHistory(attempts) {
    this.attempts = attempts;
    
    this.updateHistoryModal(attempts);
  }

  /**
   * Update history panel content
   * @param {Array} attempts - Attempts array
   */
  updateHistoryModal(attempts) {
    const container = this.elements.historyContent;
    if (!container) return;

    if (attempts.length === 0) {
      container.innerHTML = '<p class="empty-state">Nenhuma tentativa ainda</p>';
      return;
    }

    const fragment = document.createDocumentFragment();

    attempts.forEach((t, i) => {
      const div = document.createElement('div');
      div.className = 'history-item';
      
      const header = document.createElement('div');
      header.className = 'history-header';
      header.innerHTML = `<strong>${attempts.length - i}.</strong> ${t.jogador}`;
      div.appendChild(header);

      const results = document.createElement('div');
      results.className = 'history-results';
      
      t.resultados.forEach(r => {
        const badge = document.createElement('span');
        badge.className = `history-badge ${r.color}`;
        badge.textContent = r.label;
        badge.title = `${r.label}: ${r.value}`;
        results.appendChild(badge);
      });

      div.appendChild(results);
      fragment.appendChild(div);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
  }

  /**
   * Update ranking display - new design
   * @param {Array} ranking - Ranking array
   */
  updateRanking(ranking) {
    const list = this.elements.rankingList;
    if (!list) return;

    if (ranking.length === 0) {
      list.innerHTML = '<li class="empty-item">Nenhum recorde ainda. Jogue para registrar sua pontuação!</li>';
      return;
    }

    const fragment = document.createDocumentFragment();
    ranking.forEach((r, i) => {
      const li = document.createElement('li');
      const modeText = r.mode || 'normal';
      li.innerHTML = `
        <div class="ranking-info">
          <span class="ranking-score">${r.score} acertos</span>
          <span class="ranking-meta">${modeText} • ${r.date}</span>
        </div>
      `;
      fragment.appendChild(li);
    });

    list.innerHTML = '';
    list.appendChild(fragment);
  }

  /**
   * Show achievement notification
   * @param {Object} achievement - Achievement object
   */
  showAchievementNotification(achievement) {
    this.showToast(
      `🎉 ${achievement.icon} ${achievement.title}`,
      'success',
      4000
    );
  }

  /**
   * Update achievements modal
   * @param {Array} achievements - All achievements with unlock status
   */
  updateAchievementsModal(achievements) {
    const container = document.getElementById('achievements-list');
    if (!container) return;

    const fragment = document.createDocumentFragment();

    achievements.forEach(achievement => {
      const div = document.createElement('div');
      div.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;
      
      div.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-info">
          <h4>${achievement.title}</h4>
          <p>${achievement.description}</p>
          ${achievement.unlocked ? `<small>✓ ${formatDate(achievement.unlockedAt)}</small>` : ''}
        </div>
      `;

      fragment.appendChild(div);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
  }

  /**
   * Update statistics modal
   * @param {Object} stats - Statistics object
   */
  updateStatsModal(stats) {
    const container = document.getElementById('stats-content');
    if (!container) return;

    const winRate = stats.gamesPlayed > 0 
      ? Math.round((stats.totalWins / stats.gamesPlayed) * 100) 
      : 0;
    
    const avgAttempts = stats.gamesPlayed > 0 
      ? (stats.totalAttempts / stats.gamesPlayed).toFixed(1) 
      : 0;

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${stats.gamesPlayed}</div>
          <div class="stat-label">Jogos</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.totalWins}</div>
          <div class="stat-label">Vitórias</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${winRate}%</div>
          <div class="stat-label">Taxa</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.bestStreak}</div>
          <div class="stat-label">Sequência</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.perfectGuesses}</div>
          <div class="stat-label">Perfeitos</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.hintsUsed}</div>
          <div class="stat-label">Dicas</div>
        </div>
      </div>
      <div class="stats-section">
        <h4>Recordes por Modo</h4>
        <p>Normal: <strong>${stats.normalModeRecord}</strong></p>
        <p>Difícil: <strong>${stats.difficultModeRecord}</strong></p>
        <p>Rápido: <strong>${stats.quickModeRecord}</strong></p>
        <p>Lendas: <strong>${stats.legendWins}</strong></p>
      </div>
    `;
  }

  /**
   * Trigger confetti animation
   */
  triggerConfetti() {
    const canvas = this.elements.confetti;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';

    const particles = [];
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9'];

    // Create particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 4 + 2,
        d: Math.random() * 8 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.floor(Math.random() * 10) - 10,
        tiltAngle: 0,
        tiltAngleIncremental: Math.random() * 0.07 + 0.05
      });
    }

    let animationId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += p.d;
        p.x += Math.sin(p.tiltAngle) * 2;
        p.tilt = Math.sin(p.tiltAngle) * 15;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
        ctx.stroke();

        if (p.y > canvas.height) {
          particles[i] = {
            x: Math.random() * canvas.width,
            y: -20,
            r: p.r,
            d: p.d,
            color: p.color,
            tilt: p.tilt,
            tiltAngle: p.tiltAngle,
            tiltAngleIncremental: p.tiltAngleIncremental
          };
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Stop after duration
    setTimeout(() => {
      cancelAnimationFrame(animationId);
      canvas.style.display = 'none';
    }, CONFIG.ANIMATIONS.CONFETTI_DURATION);
  }

  /**
   * Reset UI to initial state
   */
  resetUI() {
    if (this.elements.input) {
      this.elements.input.disabled = false;
      this.elements.input.value = '';
    }
    if (this.elements.chooseBtn) {
      this.elements.chooseBtn.innerHTML = '<span>Enviar</span><small>Enter ↵</small>';
      this.elements.chooseBtn.disabled = true;
    }
    if (this.elements.feedback) {
      this.elements.feedback.innerHTML = '';
    }
    this.hidePlayerDetails();
    this.clearSuggestions();
    if (this.elements.hint) {
      this.elements.hint.textContent = '';
    }
    if (this.elements.timer) {
      this.elements.timer.textContent = '--';
      this.elements.timer.classList.remove('urgent');
    }
    this.attempts = [];
    this.updateHistoryModal(this.attempts);
  }

  /**
   * Show modal
   * @param {string} modalId - Modal element ID
   */
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'flex';
      // Small delay to allow display:flex to apply before adding active class for animation
      setTimeout(() => modal.classList.add('active'), 10);
    }
    
    // Close menu if open
    if (this.elements.menuDropdown) {
      this.elements.menuDropdown.classList.remove('active');
    }
  }

  /**
   * Hide modal
   * @param {string} modalId - Modal element ID
   */
  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 200);
    }
  }
}

// Create singleton instance
export const uiManager = new UIManager();

export default uiManager;
