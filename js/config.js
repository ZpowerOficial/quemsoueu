/**
 * Configuration constants for the game
 * @module config
 */

export const CONFIG = {
  // Game settings
  INITIAL_LIVES: 10,
  LIVES_BONUS: 3,
  INITIAL_TIMER: 20,
  MIN_TIMER_QUICK: 5,
  QUICK_MODE_DEDUCTION: 2,
  AGE_TOLERANCE: 2,
  
  // Search settings
  MIN_SEARCH_LENGTH: 3,
  MAX_SUGGESTIONS: 5,
  DEBOUNCE_DELAY: 300,
  
  // Storage keys
  STORAGE_KEYS: {
    RECORD: 'recorde_futebol',
    RANKING: 'ranking_futebol',
    GAME_MODE: 'qs_game_mode',
    DARK_MODE: 'qs_dark_mode',
    LEGEND_MODE: 'qs_legend_mode',
    QUICK_MODE: 'qs_quick_mode',
    ACHIEVEMENTS: 'qs_achievements',
    STATISTICS: 'qs_statistics',
    AUDIO_ENABLED: 'qs_audio_enabled',
    VIBRATION_ENABLED: 'qs_vibration_enabled'
  },
  
  // Achievements definitions
  ACHIEVEMENTS: {
    FIRST_WIN: {
      id: 'first_win',
      title: 'Primeira Vitória',
      description: 'Acerte seu primeiro jogador',
      icon: '🎯',
      condition: (stats) => stats.totalWins >= 1
    },
    STREAK_5: {
      id: 'streak_5',
      title: 'Sequência de 5',
      description: 'Acerte 5 jogadores seguidos',
      icon: '🔥',
      condition: (stats) => stats.currentStreak >= 5
    },
    STREAK_10: {
      id: 'streak_10',
      title: 'Sequência de 10',
      description: 'Acerte 10 jogadores seguidos',
      icon: '⚡',
      condition: (stats) => stats.currentStreak >= 10
    },
    LEGEND_MASTER: {
      id: 'legend_master',
      title: 'Mestre das Lendas',
      description: 'Vença 5 jogos no modo Lendas',
      icon: '👑',
      condition: (stats) => stats.legendWins >= 5
    },
    SPEED_DEMON: {
      id: 'speed_demon',
      title: 'Demônio da Velocidade',
      description: 'Vença no modo Rápido com 10+ acertos',
      icon: '💨',
      condition: (stats) => stats.quickModeRecord >= 10
    },
    PERFECT_GAME: {
      id: 'perfect_game',
      title: 'Jogo Perfeito',
      description: 'Acerte um jogador na primeira tentativa',
      icon: '⭐',
      condition: (stats) => stats.perfectGuesses >= 1
    },
    PERSISTENT: {
      id: 'persistent',
      title: 'Persistente',
      description: 'Jogue 50 partidas',
      icon: '💪',
      condition: (stats) => stats.gamesPlayed >= 50
    },
    SCHOLAR: {
      id: 'scholar',
      title: 'Estudioso',
      description: 'Use o botão de dica 20 vezes',
      icon: '📚',
      condition: (stats) => stats.hintsUsed >= 20
    }
  },
  
  // Audio frequencies for different sounds
  AUDIO: {
    CORRECT: { frequency: 523.25, duration: 200, type: 'sine' }, // C5
    WRONG: { frequency: 220, duration: 150, type: 'square' }, // A3
    GAME_OVER: { frequency: 196, duration: 500, type: 'triangle' }, // G3
    ACHIEVEMENT: { frequency: 659.25, duration: 300, type: 'sine' }, // E5
    CLICK: { frequency: 440, duration: 50, type: 'sine' }, // A4
    RECORD: { frequency: 880, duration: 400, type: 'sine' } // A5
  },
  
  // Vibration patterns (ms)
  VIBRATION: {
    CORRECT: [50, 50, 100],
    WRONG: [100],
    ACHIEVEMENT: [50, 100, 50, 100, 200],
    RECORD: [100, 50, 100, 50, 100, 50, 200]
  },
  
  // Player status filters
  PLAYER_STATUS: {
    RETIRED: ['Aposentado', 'Falecido', 'Retired', 'Deceased'],
    EXCLUDED: ['Sem clube', 'Free Agent', 'Sem liga']
  },
  
  // UI Animation durations (ms)
  ANIMATIONS: {
    FEEDBACK_DELAY: 600,
    MESSAGE_DURATION: 1800,
    CONFETTI_DURATION: 3000,
    TOAST_DURATION: 3000
  }
};

export default CONFIG;
