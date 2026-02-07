/**
 * Game Manager - Main game logic orchestration
 * @module gameManager
 */

import { CONFIG } from './config.js';
import { Storage } from './storage.js';
import { normalizeText, calcAge, delay, debounce, LRUCache } from './utils.js';
import { uiManager } from './ui.js';
import { audioManager } from './audio.js';
import { vibrationManager } from './vibration.js';
import { achievementsManager } from './achievements.js';
import { statisticsManager } from './statistics.js';

class GameManager {
  constructor() {
    this.state = {
      mode: 'normal',
      legendMode: false,
      darkMode: false,
      quickMode: false,
      players: [],
      selectedPlayer: null,
      correctPlayer: null,
      round: 1,
      wins: 0,
      lives: CONFIG.INITIAL_LIVES,
      gameOver: false,
      record: Number(Storage.get(CONFIG.STORAGE_KEYS.RECORD)) || 0,
      ranking: Storage.getJSON(CONFIG.STORAGE_KEYS.RANKING, []),
      attempts: [],
      timerInterval: null,
      timeLeft: CONFIG.INITIAL_TIMER,
      gameStartTime: null,
      roundStartTime: null,
      isPerfectRound: true,
      known: {
        club: false,
        nationality: false,
        position: false,
        league: false
      }
    };

    // Search cache for performance
    this.searchCache = new LRUCache(50);

    // Debounced search function
    this.debouncedSearch = debounce(
      this.performSearch.bind(this),
      CONFIG.DEBOUNCE_DELAY
    );
  }

  /**
   * Initialize game manager
   */
  async initialize() {
    try {
      uiManager.initialize();
      this.setupEventListeners();
      await this.startGame();
      
      // Initialize audio on first user interaction
      document.addEventListener('click', () => {
        if (!audioManager.initialized) {
          audioManager.init();
        }
      }, { once: true });
    } catch (error) {
      console.error('Error initializing game:', error);
      uiManager.showMessage('Erro ao inicializar o jogo.', false);
    }
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // Mode toggles
    if (uiManager.elements.modeToggle) {
      uiManager.elements.modeToggle.addEventListener('change', (e) => {
        audioManager.playClick();
        this.state.mode = e.target.checked ? 'dificil' : 'normal';
        Storage.set(CONFIG.STORAGE_KEYS.GAME_MODE, this.state.mode);

        document.body.classList.toggle('difficult-mode', e.target.checked);
        document.body.classList.toggle('normal-mode', !e.target.checked);

        this.stopTimer();
        this.restartGame();
      });
    }

    if (uiManager.elements.legendToggle) {
      uiManager.elements.legendToggle.addEventListener('change', (e) => {
        audioManager.playClick();
        this.state.legendMode = e.target.checked;
        Storage.set(CONFIG.STORAGE_KEYS.LEGEND_MODE, this.state.legendMode);
        document.body.classList.toggle('legend-mode', this.state.legendMode);
        this.restartGame();
      });
    }

    if (uiManager.elements.quickToggle) {
      uiManager.elements.quickToggle.addEventListener('change', (e) => {
        audioManager.playClick();
        this.state.quickMode = e.target.checked;
        Storage.set(CONFIG.STORAGE_KEYS.QUICK_MODE, this.state.quickMode);
        this.restartGame();
      });
    }

    if (uiManager.elements.themeToggle) {
      uiManager.elements.themeToggle.addEventListener('change', (e) => {
        audioManager.playClick();
        this.state.darkMode = e.target.checked;
        Storage.set(CONFIG.STORAGE_KEYS.DARK_MODE, this.state.darkMode);
        document.body.classList.toggle('dark-theme', this.state.darkMode);
      });
    }

    if (uiManager.elements.audioToggle) {
      uiManager.elements.audioToggle.addEventListener('change', (e) => {
        audioManager.setEnabled(e.target.checked);
        if (e.target.checked) audioManager.playClick();
      });
    }

    if (uiManager.elements.vibrationToggle) {
      uiManager.elements.vibrationToggle.addEventListener('change', (e) => {
        vibrationManager.setEnabled(e.target.checked);
        if (e.target.checked) vibrationManager.vibrate(50);
      });
    }

    // Hint button
    if (uiManager.elements.hintBtn) {
      uiManager.elements.hintBtn.addEventListener('click', () => {
        audioManager.playClick();
        statisticsManager.recordHint();
        uiManager.showHint(this.generateHint());
      });
    }

    // Tutorial button
    if (uiManager.elements.tutorialBtn) {
      uiManager.elements.tutorialBtn.addEventListener('click', () => {
        audioManager.playClick();
        uiManager.showModal('tutorial-modal');
      });
    }

    // Achievements button
    if (uiManager.elements.achievementsBtn) {
      uiManager.elements.achievementsBtn.addEventListener('click', () => {
        audioManager.playClick();
        this.showAchievements();
      });
    }

    // Statistics button
    if (uiManager.elements.statsBtn) {
      uiManager.elements.statsBtn.addEventListener('click', () => {
        audioManager.playClick();
        this.showStatistics();
      });
    }
    
    // Ranking button
    if (uiManager.elements.rankingBtn) {
      uiManager.elements.rankingBtn.addEventListener('click', () => {
        audioManager.playClick();
        uiManager.updateRanking(this.state.ranking);
        uiManager.showModal('ranking-modal');
      });
    }

    // Search input with debounce and keyboard navigation
    uiManager.elements.input.addEventListener('input', () => {
      const query = uiManager.elements.input.value.trim();
      this.currentSuggestions = [];
      this.state.selectedPlayer = null;
      uiManager.elements.chooseBtn.disabled = true;

      if (query.length < CONFIG.MIN_SEARCH_LENGTH) {
        uiManager.clearSuggestions();
        this.searchCache.clear();
        return;
      }

      this.debouncedSearch(query);
    });

    // Enter key support for auto-selection
    uiManager.elements.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        
        if (this.state.gameOver && uiManager.elements.chooseBtn.innerText === 'Reiniciar') {
          this.restartGame();
          return;
        }
        
        // If no player selected, try auto-select first suggestion
        if (!this.state.selectedPlayer) {
          if (this.autoSelectFirstSuggestion()) {
            // Small delay to show selection before processing
            setTimeout(() => this.handleGuess(), 100);
          } else {
            uiManager.showToast('Digite um nome de jogador válido', 'error');
          }
        } else {
          this.handleGuess();
        }
      }
    });

    // Choose button with auto-select support
    uiManager.elements.chooseBtn.addEventListener('click', async () => {
      audioManager.playClick();
      
      if (this.state.gameOver && uiManager.elements.chooseBtn.innerText === 'Reiniciar') {
        return this.restartGame();
      }

      if (this.state.gameOver || !this.state.correctPlayer) {
        return;
      }

      // If no player selected, try auto-select first suggestion
      if (!this.state.selectedPlayer) {
        if (this.autoSelectFirstSuggestion()) {
          // Small delay to show selection before processing
          setTimeout(async () => {
            await this.handleGuess();
          }, 100);
        } else {
          uiManager.showToast('Digite um nome de jogador válido', 'error');
        }
        return;
      }

      await this.handleGuess();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close all modals
        document.querySelectorAll('.modal').forEach(modal => {
          modal.style.display = 'none';
        });
      }
    });
  }

  /**
   * Calculate fuzzy match score
   * @param {string} query - Search query
   * @param {string} target - Target string
   * @returns {number} Score (higher is better)
   */
    calculateFuzzyScore(query, target) {
      const normalizedQuery = normalizeText(query);
      const normalizedTarget = normalizeText(target);

      // Exact match gets highest score
      if (normalizedTarget === normalizedQuery) return 1000;

      // Starts with query gets high score
      if (normalizedTarget.startsWith(normalizedQuery)) return 900;

      // Contains query gets good score
      if (normalizedTarget.includes(normalizedQuery)) return 800;

      // Fuzzy match - check if all characters appear in order
      let queryIndex = 0;
      let targetIndex = 0;
      let gaps = 0;

      while (queryIndex < normalizedQuery.length && targetIndex < normalizedTarget.length) {
        if (normalizedQuery[queryIndex] === normalizedTarget[targetIndex]) {
          queryIndex++;
        } else {
          gaps++;
        }
        targetIndex++;
      }

      if (queryIndex === normalizedQuery.length) {
        // All characters found in order
        return Math.max(100, 500 - gaps * 10);
      }

      return 0;
    }

    /**
     * Perform search with caching and fuzzy matching
     * @param {string} query - Search query
     */
    performSearch(query) {
      const normalizedQuery = normalizeText(query);

      // Check cache first
      const cached = this.searchCache.get(normalizedQuery);
      if (cached) {
        this.displaySuggestions(cached);
        return;
      }

      // Perform search with scoring
      const scoredPlayers = this.state.players
        .map(player => {
          const nameScore = this.calculateFuzzyScore(query, player.name);
          const clubScore = this.calculateFuzzyScore(query, player.club) * 0.5;
          const nationalityScore = this.calculateFuzzyScore(query, player.nationality) * 0.3;

          return {
            player,
            score: Math.max(nameScore, clubScore, nationalityScore)
          };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, CONFIG.MAX_SUGGESTIONS)
        .map(item => item.player);

      // Cache results
      this.searchCache.set(normalizedQuery, scoredPlayers);

      this.displaySuggestions(scoredPlayers);
    }

  /**
   * Display search suggestions with auto-selection highlight
   * @param {Array} players - Filtered players
   */
  displaySuggestions(players) {
    uiManager.clearSuggestions();
    this.currentSuggestions = players;

    players.forEach((player, index) => {
      const li = document.createElement('li');
      li.textContent = `${player.name} (${player.nationality})`;
      li.dataset.index = index;
      
      // Highlight first suggestion as default
      if (index === 0) {
        li.classList.add('highlighted');
      }
      
      li.onclick = () => {
        audioManager.playClick();
        uiManager.elements.suggestions.querySelectorAll('li').forEach(node =>
          node.classList.remove('selected', 'highlighted')
        );
        li.classList.add('selected');
        this.state.selectedPlayer = player;
        uiManager.elements.chooseBtn.disabled = false;
      };
      uiManager.elements.suggestions.appendChild(li);
    });
  }

  /**
   * Auto-select the first suggestion
   */
  autoSelectFirstSuggestion() {
    if (this.currentSuggestions && this.currentSuggestions.length > 0) {
      const firstPlayer = this.currentSuggestions[0];
      this.state.selectedPlayer = firstPlayer;
      uiManager.elements.chooseBtn.disabled = false;
      
      // Update UI to show selection
      uiManager.elements.suggestions.querySelectorAll('li').forEach((node, index) => {
        node.classList.remove('highlighted');
        if (index === 0) {
          node.classList.add('selected');
        }
      });
      
      return true;
    }
    return false;
  }

  /**
   * Handle player guess
   */
  async handleGuess() {
    this.stopTimer();
    
    // Track if this is first attempt of round
    const isFirstAttempt = this.state.attempts.length === 0;
    
    uiManager.elements.feedback.innerHTML = '';
    uiManager.hidePlayerDetails();
    uiManager.setLoading(true);
    
    await delay(CONFIG.ANIMATIONS.FEEDBACK_DELAY);

    // Record attempt in statistics
    statisticsManager.recordAttempt(this.state.selectedPlayer);

    const results = this.comparePlayerSelection(
      this.state.selectedPlayer,
      this.state.correctPlayer
    );

    uiManager.showFeedback(results);
    this.updateKnownAttributes(results);

    this.state.attempts.unshift({
      jogador: this.state.selectedPlayer.name,
      resultados: results
    });
    
    // Track if not perfect guess
    if (!results.every(r => r.color === 'green')) {
      this.state.isPerfectRound = false;
    }

    uiManager.updateAttemptsHistory(this.state.attempts);

    if (results.every(r => r.color === 'green')) {
      await this.handleCorrectGuess(isFirstAttempt);
    } else {
      await this.handleIncorrectGuess();
    }

    this.state.selectedPlayer = null;
    uiManager.elements.chooseBtn.disabled = true;
    uiManager.clearSuggestions();
    uiManager.elements.input.value = '';

    if (this.state.mode === 'dificil' && !this.state.gameOver) {
      this.startTimer();
    }
  }

  /**
   * Handle correct guess
   * @param {boolean} isFirstAttempt - Whether this was first attempt
   */
  async handleCorrectGuess(isFirstAttempt) {
    this.state.wins++;
    this.state.lives += CONFIG.LIVES_BONUS;
    
    // Play success sounds/haptics
    audioManager.playCorrect();
    vibrationManager.vibrateCorrect();

    uiManager.displayCorrectPlayer(this.state.correctPlayer, calcAge);
    await delay(CONFIG.ANIMATIONS.MESSAGE_DURATION);
    uiManager.showMessage('Parabéns! Você acertou! Próximo jogador...', true);

    // Record win in statistics
    statisticsManager.recordWin({
      mode: this.state.mode,
      legendMode: this.state.legendMode,
      quickMode: this.state.quickMode,
      score: this.state.wins,
      attempts: this.state.attempts.length,
      isPerfect: this.state.isPerfectRound
    });

    // Check achievements
    this.checkAndNotifyAchievements();

    // Reset for next round
    this.state.attempts = [];
    this.state.isPerfectRound = true;
    uiManager.updateAttemptsHistory(this.state.attempts);
    this.state.round++;
    
    uiManager.setLoading(false);
    this.selectRandomPlayer();
  }

  /**
   * Handle incorrect guess
   */
  async handleIncorrectGuess() {
    this.state.round++;
    this.state.lives--;
    
    // Play wrong sound/haptic
    audioManager.playWrong();
    vibrationManager.vibrateWrong();

    uiManager.updateGameStatus(this.state);

    if (this.state.lives <= 0) {
      return this.endGame();
    }

    uiManager.setLoading(false);
  }

  /**
   * Compare selected player with correct player
   * @param {Object} selectedPlayer - Selected player
   * @param {Object} correctPlayer - Correct player
   * @returns {Array} Results array
   */
  comparePlayerSelection(selectedPlayer, correctPlayer) {
    const results = [];

    // Age comparison
    const selectedAge = calcAge(selectedPlayer.birthdate);
    const correctAge = calcAge(correctPlayer.birthdate);

    let ageColor = 'red';
    if (selectedAge !== null && correctAge !== null) {
      if (selectedAge === correctAge) {
        ageColor = 'green';
      } else if (Math.abs(selectedAge - correctAge) <= CONFIG.AGE_TOLERANCE) {
        ageColor = 'orange';
      }
    }

    results.push({
      label: 'Idade',
      value: selectedAge !== null ? `${selectedAge} anos` : 'Desconhecida',
      color: ageColor
    });

    // Club comparison
    let clubColor = 'red';
    if (normalizeText(selectedPlayer.club) === normalizeText(correctPlayer.club)) {
      clubColor = 'green';
    } else if (
      correctPlayer.past_clubs &&
      correctPlayer.past_clubs.some(club =>
        normalizeText(club) === normalizeText(selectedPlayer.club)
      )
    ) {
      clubColor = 'orange';
    }

    results.push({
      label: 'Clube',
      value: selectedPlayer.club,
      color: clubColor
    });

    // League comparison
    let leagueColor = 'red';
    const selectedLeague = selectedPlayer.league || 'Desconhecida';
    const correctLeague = correctPlayer.league || 'Desconhecida';

    if (normalizeText(selectedLeague) === normalizeText(correctLeague)) {
      leagueColor = 'green';
    } else if (correctPlayer.past_clubs) {
      // Check if selected league matches any past club's league
      const hasMatchingLeague = correctPlayer.past_clubs.some(clubName => {
        const pastClubPlayer = this.state.players.find(p =>
          normalizeText(p.name) === normalizeText(clubName)
        );
        return (
          pastClubPlayer &&
          normalizeText(pastClubPlayer.league || '') === normalizeText(selectedLeague)
        );
      });
      if (hasMatchingLeague) leagueColor = 'orange';
    }

    results.push({
      label: 'Liga',
      value: selectedLeague,
      color: leagueColor
    });

    // Position comparison
    const positionColor =
      normalizeText(selectedPlayer.position) === normalizeText(correctPlayer.position)
        ? 'green'
        : 'red';

    results.push({
      label: 'Posição',
      value: selectedPlayer.position,
      color: positionColor
    });

    // Nationality comparison
    const nationalityColor =
      normalizeText(selectedPlayer.nationality) === normalizeText(correctPlayer.nationality)
        ? 'green'
        : 'red';

    results.push({
      label: 'Nacionalidade',
      value: selectedPlayer.nationality,
      color: nationalityColor
    });

    return results;
  }

  /**
   * Update known attributes based on results
   * @param {Array} results - Comparison results
   */
  updateKnownAttributes(results) {
    results.forEach(r => {
      if (r.color === 'green') {
        switch (r.label) {
          case 'Clube':
            this.state.known.club = true;
            break;
          case 'Liga':
            this.state.known.league = true;
            break;
          case 'Posição':
            this.state.known.position = true;
            break;
          case 'Nacionalidade':
            this.state.known.nationality = true;
            break;
        }
      }
    });
  }

  /**
   * Generate hint based on unknown attributes
   * @returns {string}
   */
  generateHint() {
    const p = this.state.correctPlayer;
    if (!p) return '';

    const hints = [];
    if (p.club && !this.state.known.club) {
      hints.push(`O clube começa com "${p.club.charAt(0)}"`);
    }
    if (p.nationality && !this.state.known.nationality) {
      hints.push(`Nacionalidade começa com "${p.nationality.charAt(0)}"`);
    }
    if (p.position && !this.state.known.position) {
      hints.push(`Posição principal: ${p.position}`);
    }
    if (p.league && !this.state.known.league) {
      hints.push(`Liga: ${p.league}`);
    }

    if (hints.length === 0) return 'Sem mais dicas!';

    return hints[Math.floor(Math.random() * hints.length)];
  }

  /**
   * Start new game
   */
  async startGame() {
    uiManager.setLoading(true);
    
    try {
      await this.loadPlayers();
      
      this.state.gameStartTime = Date.now();
      statisticsManager.recordGameStart();
      
      this.selectRandomPlayer();
      this.state.attempts = [];
      uiManager.updateGameStatus(this.state);
      uiManager.updateRanking(this.state.ranking);
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
      uiManager.showMessage('Erro ao carregar jogadores.', false);
      uiManager.setLoading(false);
    }
  }

  /**
   * Load players from JSON
   */
  async loadPlayers() {
    try {
      const response = await fetch('players.json');

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      let players = await response.json();

      // Validate players data
      if (!Array.isArray(players) || players.length === 0) {
        throw new Error('Dados de jogadores inválidos');
      }

      // Filter based on mode
      if (this.state.legendMode) {
        players = players.filter(player =>
          CONFIG.PLAYER_STATUS.RETIRED.includes(player.club)
        );
      } else {
        players = players.filter(player =>
          !CONFIG.PLAYER_STATUS.RETIRED.includes(player.club) &&
          !CONFIG.PLAYER_STATUS.EXCLUDED.includes(player.club)
        );
      }

      if (players.length === 0) {
        throw new Error('Nenhum jogador disponível para o modo selecionado');
      }

      this.state.players = players;
      uiManager.setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
      throw error;
    }
  }

  /**
   * Select random player
   */
  selectRandomPlayer() {
    uiManager.setLoading(true);

    if (!this.state.players.length) {
      uiManager.setLoading(false);
      uiManager.showMessage('Lista de jogadores vazia', false);
      return;
    }

    this.state.correctPlayer =
      this.state.players[Math.floor(Math.random() * this.state.players.length)];

    this.state.known = {
      club: false,
      nationality: false,
      position: false,
      league: false
    };
    
    this.state.roundStartTime = Date.now();
    
    uiManager.showHint('');
    uiManager.setLoading(false);
    uiManager.updateGameStatus(this.state);

    if (this.state.mode === 'dificil') {
      this.startTimer();
    }
  }

  /**
   * Start countdown timer
   */
  startTimer() {
    this.stopTimer();
    
    this.state.timeLeft = CONFIG.INITIAL_TIMER;
    
    if (this.state.quickMode) {
      const deduction = (this.state.round - 1) * CONFIG.QUICK_MODE_DEDUCTION;
      this.state.timeLeft = Math.max(
        CONFIG.MIN_TIMER_QUICK,
        CONFIG.INITIAL_TIMER - deduction
      );
    }
    
    uiManager.updateTimer(this.state.timeLeft);

    this.state.timerInterval = setInterval(() => {
      this.state.timeLeft--;
      uiManager.updateTimer(this.state.timeLeft);

      if (this.state.timeLeft <= 0) {
        this.handleTimerExpired();
      }
    }, 1000);
  }

  /**
   * Stop countdown timer
   */
  stopTimer() {
    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
      this.state.timerInterval = null;
    }
  }

  /**
   * Handle timer expiration
   */
  handleTimerExpired() {
    this.stopTimer();
    
    audioManager.playWrong();
    vibrationManager.vibrateWrong();
    
    uiManager.showMessage('Tempo esgotado!', false);
    
    this.state.lives--;
    this.state.round++;
    this.state.isPerfectRound = false;
    
    uiManager.updateGameStatus(this.state);

    if (this.state.lives <= 0) {
      this.endGame();
    } else {
      this.selectRandomPlayer();
    }
  }

  /**
   * End current game
   */
  endGame() {
    this.state.gameOver = true;
    this.stopTimer();

    // Record play time
    if (this.state.gameStartTime) {
      const playTime = Math.floor((Date.now() - this.state.gameStartTime) / 1000);
      statisticsManager.recordPlayTime(playTime);
    }

    // Record loss
    statisticsManager.recordLoss();

    audioManager.playGameOver();
    
    uiManager.displayCorrectPlayer(this.state.correctPlayer, calcAge);
    uiManager.elements.chooseBtn.innerHTML = '<span>Reiniciar</span><small>Enter ↵</small>';
    uiManager.elements.chooseBtn.disabled = false;
    uiManager.elements.input.disabled = true;

    // Check for new record
    if (this.state.wins > this.state.record) {
      this.state.record = this.state.wins;
      Storage.set(CONFIG.STORAGE_KEYS.RECORD, this.state.record);
      
      audioManager.playRecord();
      vibrationManager.vibrateRecord();
      uiManager.triggerConfetti();
      
      uiManager.showMessage(
        `🎉 Fim de jogo! NOVO RECORDE: ${this.state.record} acertos! 🎉`,
        true
      );
    } else {
      uiManager.showMessage(
        `Fim de jogo! Sua pontuação: ${this.state.wins}. Recorde: ${this.state.record}`,
        false
      );
    }

    // Update ranking
    this.updateRanking();

    // Check achievements
    this.checkAndNotifyAchievements();
  }

  /**
   * Update personal ranking
   */
  updateRanking() {
    this.state.ranking.push({
      score: this.state.wins,
      date: new Date().toLocaleDateString('pt-BR'),
      mode: `${this.state.mode}${this.state.legendMode ? '/lendas' : ''}${
        this.state.quickMode ? '/desafio' : ''
      }`
    });

    this.state.ranking.sort((a, b) => b.score - a.score);
    this.state.ranking = this.state.ranking.slice(0, 5);
    
    Storage.setJSON(CONFIG.STORAGE_KEYS.RANKING, this.state.ranking);
    uiManager.updateRanking(this.state.ranking);
  }

  /**
   * Check and notify new achievements
   */
  checkAndNotifyAchievements() {
    const stats = statisticsManager.getStats();
    const newAchievements = achievementsManager.checkAchievements(stats);

    newAchievements.forEach(achievement => {
      audioManager.playAchievement();
      vibrationManager.vibrateAchievement();
      uiManager.showAchievementNotification(achievement);
    });
  }

  /**
   * Show achievements modal
   */
  showAchievements() {
    const achievements = achievementsManager.getAll();
    uiManager.updateAchievementsModal(achievements);
    uiManager.showModal('achievements-modal');
  }

  /**
   * Show statistics modal
   */
  showStatistics() {
    const stats = statisticsManager.getStats();
    uiManager.updateStatsModal(stats);
    uiManager.showModal('stats-modal');
  }

  /**
   * Restart game
   */
  restartGame() {
    this.stopTimer();
    this.resetGameState();
    uiManager.resetUI();
    this.startGame();
  }

  /**
   * Reset game state
   */
  resetGameState() {
    this.state.round = 1;
    this.state.wins = 0;
    this.state.lives = CONFIG.INITIAL_LIVES;
    this.state.gameOver = false;
    this.state.attempts = [];
    this.state.timeLeft = CONFIG.INITIAL_TIMER;
    this.state.isPerfectRound = true;
    this.state.known = {
      club: false,
      nationality: false,
      position: false,
      league: false
    };
    this.searchCache.clear();
  }
}

// Create and export singleton instance
export const gameManager = new GameManager();

export default gameManager;
