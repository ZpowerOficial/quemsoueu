/**
 * UI Manager - Handles all DOM interactions and rendering
 * @module ui
 */

import { CONFIG } from './config.js';
import { Storage } from './storage.js';
import { createFragment, formatDate } from './utils.js';

class UIManager {
  constructor() {
    this.elements = {};
    this.toastTimeout = null;
  }

  /**
   * Initialize UI and cache DOM elements
   */
  initialize() {
    this.cacheElements();
    this.setupModalHandlers();
    this.loadSettings();
  }

  /**
   * Cache all DOM element references
   */
  cacheElements() {
    this.elements = {
      input: document.getElementById('player-input'),
      suggestions: document.getElementById('suggestions'),
      chooseBtn: document.getElementById('choose-btn'),
      feedback: document.getElementById('feedback'),
      playerDetails: document.getElementById('player-details'),
      tutorialBtn: document.getElementById('tutorial-btn'),
      tutorialModal: document.getElementById('tutorial-modal'),
      achievementsBtn: document.getElementById('achievements-btn'),
      achievementsModal: document.getElementById('achievements-modal'),
      statsBtn: document.getElementById('stats-btn'),
      statsModal: document.getElementById('stats-modal'),
      closeButtons: document.querySelectorAll('.close'),
      roundInfo: document.getElementById('round-info'),
      loading: document.getElementById('loading'),
      skeleton: document.getElementById('skeleton-loader'),
      modeToggle: document.getElementById('mode-toggle'),
      quickToggle: document.getElementById('quick-toggle'),
      legendToggle: document.getElementById('legend-toggle'),
      themeToggle: document.getElementById('theme-toggle'),
      audioToggle: document.getElementById('audio-toggle'),
      vibrationToggle: document.getElementById('vibration-toggle'),
      hintBtn: document.getElementById('hint-btn'),
      hint: document.getElementById('hint'),
      rankingContainer: document.getElementById('ranking-container'),
      rankingList: document.getElementById('ranking-list'),
      timer: document.getElementById('timer'),
      historyContainer: document.getElementById('historico-tentativas'),
      toast: document.getElementById('toast'),
      confetti: document.getElementById('confetti-canvas')
    };

    // Create timer element if it doesn't exist
    if (!this.elements.timer) {
      const timerSpan = document.createElement('span');
      timerSpan.id = 'timer';
      timerSpan.style.marginLeft = '20px';
      document.getElementById('game-status').appendChild(timerSpan);
      this.elements.timer = timerSpan;
    }

    // Create history container if it doesn't exist
    if (!this.elements.historyContainer) {
      const historyContainer = document.createElement('div');
      historyContainer.id = 'historico-tentativas';
      historyContainer.style.display = 'none';
      document.querySelector('.container').insertBefore(
        historyContainer,
        this.elements.feedback
      );
      this.elements.historyContainer = historyContainer;
    }

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
   * Setup modal event handlers
   */
  setupModalHandlers() {
    // Close buttons
    this.elements.closeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) modal.style.display = 'none';
      });
    });

    // Click outside to close
    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
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

    // Vibration
    const vibrationEnabled = Storage.get(CONFIG.STORAGE_KEYS.VIBRATION_ENABLED) !== 'false';
    if (this.elements.vibrationToggle) this.elements.vibrationToggle.checked = vibrationEnabled;
  }

  /**
   * Show loading state
   * @param {boolean} state - Loading state
   */
  setLoading(state) {
    if (this.elements.loading) {
      this.elements.loading.style.display = state ? 'inline' : 'none';
    }
    
    if (this.elements.skeleton) {
      this.elements.skeleton.style.display = state ? 'block' : 'none';
    }

    this.elements.chooseBtn.disabled = state;
    this.elements.input.disabled = state;

    if (!state && this.elements.chooseBtn.innerText === 'Reiniciar') {
      this.elements.chooseBtn.innerText = 'Escolher';
    }
  }

  /**
   * Update game status bar
   * @param {Object} gameState - Current game state
   */
  updateGameStatus(gameState) {
    const modeLabel = gameState.mode === 'dificil' ? 'Difícil' : 'Normal';
    const legendLabel = gameState.legendMode ? 'Lendas' : 'Atuais';
    const quickLabel = gameState.quickMode ? 'Rápido' : 'Padrão';
    
    this.elements.roundInfo.textContent =
      `Rodada: ${gameState.round} | Acertos: ${gameState.wins} | Vidas: ${gameState.lives} | Recorde: ${gameState.record} | ${modeLabel} | ${legendLabel} | ${quickLabel}`;
  }

  /**
   * Update timer display
   * @param {number} time - Time in seconds
   */
  updateTimer(time) {
    if (this.elements.timer) {
      this.elements.timer.textContent = `⏱️ ${time}s`;
      
      // Add urgency class when time is low
      if (time <= 5) {
        this.elements.timer.classList.add('timer-urgent');
      } else {
        this.elements.timer.classList.remove('timer-urgent');
      }
    }
  }

  /**
   * Clear suggestions list
   */
  clearSuggestions() {
    this.elements.suggestions.innerHTML = '';
  }

  /**
   * Show feedback results using DocumentFragment for performance
   * @param {Array} results - Feedback results
   */
  showFeedback(results) {
    const fragment = document.createDocumentFragment();
    
    results.forEach(r => {
      const div = document.createElement('div');
      div.className = `feedback ${r.color}`;
      div.innerHTML = `<b>${r.label}:</b> ${r.value}`;
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
    const type = isSuccess ? 'green' : 'red';
    this.elements.feedback.innerHTML = `<div class="feedback ${type}"><b>${message}</b></div>`;
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
   * Display correct player details
   * @param {Object} player - Player object
   */
  displayCorrectPlayer(player, calcAge) {
    this.elements.playerDetails.style.display = 'block';
    const age = player.birthdate ? calcAge(player.birthdate) : '-';
    
    this.elements.playerDetails.innerHTML = `
      <h3>Jogador correto: ${player.name}</h3>
      <p>Idade: ${age !== null ? age + ' anos' : 'Desconhecida'}</p>
      <p>Clube: ${player.club}</p>
      <p>Liga: ${player.league || 'Sem informação'}</p>
      <p>Posição: ${player.position}</p>
      <p>Nacionalidade: ${player.nationality}</p>
    `;
  }

  /**
   * Hide player details
   */
  hidePlayerDetails() {
    this.elements.playerDetails.style.display = 'none';
  }

  /**
   * Update attempts history using DocumentFragment
   * @param {Array} attempts - Attempts array
   */
  updateAttemptsHistory(attempts) {
    const container = this.elements.historyContainer;

    if (attempts.length) {
      container.style.display = 'block';
      
      const fragment = document.createDocumentFragment();
      const title = document.createElement('h3');
      title.textContent = 'Histórico de Tentativas';
      fragment.appendChild(title);

      attempts.forEach((t, i) => {
        const div = document.createElement('div');
        div.className = 'tentativa';
        
        const header = document.createElement('h4');
        header.textContent = `Tentativa ${attempts.length - i}: ${t.jogador}`;
        div.appendChild(header);

        const results = document.createElement('div');
        results.className = 'tentativa-resultados';
        
        t.resultados.forEach(r => {
          const feedback = document.createElement('div');
          feedback.className = `feedback-small ${r.color}`;
          feedback.innerHTML = `<b>${r.label}:</b> ${r.value}`;
          results.appendChild(feedback);
        });

        div.appendChild(results);
        fragment.appendChild(div);
      });

      container.innerHTML = '';
      container.appendChild(fragment);
    } else {
      container.style.display = 'none';
    }
  }

  /**
   * Update ranking display
   * @param {Array} ranking - Ranking array
   */
  updateRanking(ranking) {
    const list = this.elements.rankingList;
    if (!list) return;

    if (ranking.length === 0) {
      list.innerHTML = '<li>Nenhum recorde ainda</li>';
      return;
    }

    const fragment = document.createDocumentFragment();
    ranking.forEach((r, i) => {
      const li = document.createElement('li');
      li.textContent = `${i + 1}º - ${r.score} acertos [${r.mode || 'normal'}] (${r.date})`;
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
      `🎉 Conquista desbloqueada: ${achievement.icon} ${achievement.title}`,
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
          ${achievement.unlocked ? `<small>Desbloqueado em ${formatDate(achievement.unlockedAt)}</small>` : ''}
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
          <div class="stat-value">${stats.totalLosses}</div>
          <div class="stat-label">Derrotas</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${winRate}%</div>
          <div class="stat-label">Taxa de Acerto</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${avgAttempts}</div>
          <div class="stat-label">Média Tentativas</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.bestStreak}</div>
          <div class="stat-label">Melhor Sequência</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.perfectGuesses}</div>
          <div class="stat-label">Acertos Perfeitos</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.hintsUsed}</div>
          <div class="stat-label">Dicas Usadas</div>
        </div>
      </div>
      <div class="stats-section">
        <h4>Recordes por Modo</h4>
        <p>Normal: ${stats.normalModeRecord}</p>
        <p>Difícil: ${stats.difficultModeRecord}</p>
        <p>Rápido: ${stats.quickModeRecord}</p>
        <p>Lendas: ${stats.legendWins}</p>
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
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

    // Create particles
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 2,
        d: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.floor(Math.random() * 10) - 10
      });
    }

    let animationId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        ctx.beginPath();
        ctx.lineWidth = p.r / 2;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
        ctx.stroke();

        p.y += p.d;
        p.x += Math.sin(p.y / 50) * 2;

        if (p.y > canvas.height) {
          particles[i] = {
            x: Math.random() * canvas.width,
            y: -20,
            r: p.r,
            d: p.d,
            color: p.color,
            tilt: p.tilt
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
    this.elements.input.disabled = false;
    this.elements.chooseBtn.innerText = 'Escolher';
    this.elements.feedback.innerHTML = '';
    this.hidePlayerDetails();
    this.elements.historyContainer.style.display = 'none';
    this.clearSuggestions();
    this.elements.input.value = '';
    if (this.elements.hint) this.elements.hint.textContent = '';
    if (this.elements.timer) {
      this.elements.timer.textContent = '';
      this.elements.timer.classList.remove('timer-urgent');
    }
  }

  /**
   * Show modal
   * @param {string} modalId - Modal element ID
   */
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'block';
  }

  /**
   * Hide modal
   * @param {string} modalId - Modal element ID
   */
  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
  }
}

// Create singleton instance
export const uiManager = new UIManager();

export default uiManager;
