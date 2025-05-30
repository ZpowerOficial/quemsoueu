// main.js - Jogo de Adivinhação de Jogadores de Futebol

// Estado centralizado do jogo
const gameState = {
  mode: 'normal',
  players: [],
  selectedPlayer: null,
  correctPlayer: null,
  round: 1,
  wins: 0,
  lives: 10,
  gameOver: false,
  record: Number(localStorage.getItem('recorde_futebol')) || 0,
  attempts: [],
  timerInterval: null,
  timeLeft: 20,
  
  resetGame() {
    this.round = 1;
    this.wins = 0;
    this.lives = 10;
    this.gameOver = false;
    this.attempts = [];
    this.timeLeft = 20;
  }
};

// Utilitários
const Utils = {
  normalizeText(text) {
    return text.normalize('NFD').replace(/[̀-\u036f]/g, '').toLowerCase();
  },
  
  calcAge(birthdate) {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();
    
    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  },
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Gerenciador de UI
const UI = {
  elements: {},
  
  initialize() {
    // Capturar referências DOM
    this.elements = {
      input: document.getElementById('player-input'),
      suggestions: document.getElementById('suggestions'),
      chooseBtn: document.getElementById('choose-btn'),
      feedback: document.getElementById('feedback'),
      playerDetails: document.getElementById('player-details'),
      tutorialBtn: document.getElementById('tutorial-btn'),
      tutorialModal: document.getElementById('tutorial-modal'),
      closeBtn: document.querySelector('#tutorial-modal .close'),
      roundInfo: document.getElementById('round-info'),
      loading: document.getElementById('loading'),
      modeToggle: document.getElementById('mode-toggle')
    };
    
    // Criar timer para modo difícil se não existir
    if (!document.getElementById('timer')) {
      const timerSpan = document.createElement('span');
      timerSpan.id = 'timer';
      timerSpan.style.marginLeft = '20px';
      document.getElementById('game-status').appendChild(timerSpan);
      this.elements.timer = timerSpan;
    } else {
      this.elements.timer = document.getElementById('timer');
    }
    
    // Criar contêiner de histórico se não existir
    if (!document.getElementById('historico-tentativas')) {
      const historyContainer = document.createElement('div');
      historyContainer.id = 'historico-tentativas';
      historyContainer.style.display = 'none';
      document.querySelector('.container').insertBefore(
        historyContainer, 
        this.elements.feedback
      );
      this.elements.historyContainer = historyContainer;
    } else {
      this.elements.historyContainer = document.getElementById('historico-tentativas');
    }
    
    // Iniciar com o modo normal
    document.body.classList.add('normal-mode');
  },
  
  setLoading(state) {
    this.elements.loading.style.display = state ? 'inline' : 'none';
    this.elements.chooseBtn.disabled = state;
    this.elements.input.disabled = state;
    if (!state && this.elements.chooseBtn.innerText === 'Reiniciar') {
      this.elements.chooseBtn.innerText = 'Escolher';
    }
  },
  
  updateGameStatus() {
    this.elements.roundInfo.textContent = `Rodada: ${gameState.round} | Acertos: ${gameState.wins} | Vidas: ${gameState.lives} | Recorde: ${gameState.record}`;
  },
  
  updateTimer(time) {
    if (this.elements.timer) {
      this.elements.timer.textContent = `Tempo: ${time}s`;
    }
  },
  
  clearSuggestions() {
    this.elements.suggestions.innerHTML = '';
  },
  
  showFeedback(results) {
    this.elements.feedback.innerHTML = results.map(r =>
      `<div class="feedback ${r.color}"><b>${r.label}:</b> ${r.value}</div>`
    ).join('');
  },
  
  showMessage(message, isSuccess) {
    const type = isSuccess ? 'green' : 'red';
    this.elements.feedback.innerHTML = `<div class="feedback ${type}"><b>${message}</b></div>`;
  },
  
  displayCorrectPlayer() {
    const player = gameState.correctPlayer;
    this.elements.playerDetails.style.display = 'block';
    const age = player.birthdate ? Utils.calcAge(player.birthdate) : '-';
    this.elements.playerDetails.innerHTML = `
      <h3>Jogador correto: ${player.name}</h3>
      <p>Idade: ${age} anos</p>
      <p>Clube: ${player.club}</p>
      <p>Liga: ${player.league || 'N/A'}</p>
      <p>Posição: ${player.position}</p>
      <p>Nacionalidade: ${player.nationality}</p>
    `;
  },
  
  hidePlayerDetails() {
    this.elements.playerDetails.style.display = 'none';
  },
  
  updateAttemptsHistory() {
    const attempts = gameState.attempts;
    const container = this.elements.historyContainer;
    
    if (attempts.length) {
      container.style.display = 'block';
      container.innerHTML = '<h3>Histórico de Tentativas</h3>' +
        attempts.map((t, i) =>
          `<div class="tentativa">
            <h4>Tentativa ${attempts.length - i}: ${t.jogador}</h4>
            <div class="tentativa-resultados">
              ${t.resultados.map(r=>
                `<div class="feedback-small ${r.color}"><b>${r.label}:</b> ${r.value}</div>`
              ).join('')}
            </div>
          </div>`
        ).join('');
    } else {
      container.style.display = 'none';
    }
  },
  
  resetUI() {
    this.elements.input.disabled = false;
    this.elements.chooseBtn.innerText = 'Escolher';
    this.elements.feedback.innerHTML = '';
    this.hidePlayerDetails();
    this.elements.historyContainer.style.display = 'none';
    this.clearSuggestions();
    this.elements.input.value = '';
  }
};

// Gerenciador do jogo
const GameManager = {
  initialize() {
    UI.initialize();
    this.setupEventListeners();
    this.startGame(); // Inicia o jogo diretamente
  },
  
  setupEventListeners() {
    // Toggle de modo de jogo
    if (UI.elements.modeToggle) {
      UI.elements.modeToggle.addEventListener('change', (e) => {
        gameState.mode = e.target.checked ? 'dificil' : 'normal';
        
        // Atualizar classes do body para mudar o visual
        document.body.classList.toggle('difficult-mode', e.target.checked);
        document.body.classList.toggle('normal-mode', !e.target.checked);
        
        // Resetar o temporizador se estiver ativo
        this.stopTimer();
        
        // Reiniciar o jogo com o novo modo
        this.restartGame();
      });
    }
    
    // Tutorial
    UI.elements.tutorialBtn.addEventListener('click', () => {
      UI.elements.tutorialModal.style.display = 'block';
    });
    
    UI.elements.closeBtn.addEventListener('click', () => {
      UI.elements.tutorialModal.style.display = 'none';
    });
    
    window.addEventListener('click', e => {
      if (e.target === UI.elements.tutorialModal) {
        UI.elements.tutorialModal.style.display = 'none';
      }
    });
    
    // Input e sugestões
    UI.elements.input.addEventListener('input', () => {
      const query = Utils.normalizeText(UI.elements.input.value.trim());
      UI.clearSuggestions();
      gameState.selectedPlayer = null;
      UI.elements.chooseBtn.disabled = true;
      
      if (query.length < 3) return;
      
      const filteredPlayers = gameState.players
        .filter(player => 
          Utils.normalizeText(player.name).includes(query) ||
          Utils.normalizeText(player.club).includes(query) ||
          Utils.normalizeText(player.nationality).includes(query)
        )
        .slice(0, 5);
      
      filteredPlayers.forEach(player => {
        const li = document.createElement('li');
        li.textContent = `${player.name} (${player.nationality})`;
        li.onclick = () => {
          UI.elements.suggestions.querySelectorAll('li').forEach(node => 
            node.classList.remove('selected')
          );
          li.classList.add('selected');
          gameState.selectedPlayer = player;
          UI.elements.chooseBtn.disabled = false;
        };
        UI.elements.suggestions.appendChild(li);
      });
    });
    
    // Botão de escolha
    UI.elements.chooseBtn.addEventListener('click', async () => {
      if (gameState.gameOver && UI.elements.chooseBtn.innerText === 'Reiniciar') {
        return this.restartGame();
      }
      
      if (gameState.gameOver || !gameState.selectedPlayer || !gameState.correctPlayer) {
        return;
      }
      
      this.stopTimer();
      UI.elements.feedback.innerHTML = '';
      UI.hidePlayerDetails();
      UI.setLoading(true);
      await Utils.delay(600);
      
      const results = this.comparePlayerSelection(
        gameState.selectedPlayer, 
        gameState.correctPlayer
      );
      
      UI.showFeedback(results);
      
      gameState.attempts.unshift({
        jogador: gameState.selectedPlayer.name,
        resultados: results
      });
      UI.updateAttemptsHistory();
      
      if (results.every(r => r.color === 'green')) {
        await this.handleCorrectGuess();
      } else {
        await this.handleIncorrectGuess();
      }
      
      gameState.selectedPlayer = null;
      UI.elements.chooseBtn.disabled = true;
      UI.clearSuggestions();
      UI.elements.input.value = '';
      
      if (gameState.mode === 'dificil' && !gameState.gameOver) {
        this.startTimer();
      }
    });
  },
  
  async handleCorrectGuess() {
    gameState.wins++;
    gameState.lives += 3;
    UI.displayCorrectPlayer();
    await Utils.delay(1800);
    UI.showMessage('Parabéns! Você acertou tudo! Próximo jogador...', true);
    gameState.attempts = [];
    UI.elements.historyContainer.style.display = 'none';
    gameState.round++;
    UI.setLoading(false);
    this.selectRandomPlayer();
  },
  
  async handleIncorrectGuess() {
    gameState.round++;
    gameState.lives--;
    UI.updateGameStatus();
    
    if (gameState.lives <= 0) {
      return this.endGame();
    }
    
    UI.setLoading(false);
  },
  
  comparePlayerSelection(selectedPlayer, correctPlayer) {
    const results = [];
    
    // Idade
    let selectedAge = '-', correctAge = '-', ageColor = 'red';
    if (selectedPlayer.birthdate) selectedAge = Utils.calcAge(selectedPlayer.birthdate);
    if (correctPlayer.birthdate) correctAge = Utils.calcAge(correctPlayer.birthdate);
    
    if (selectedAge === correctAge) ageColor = 'green';
    else if (Math.abs(selectedAge - correctAge) <= 2) ageColor = 'orange';
    
    results.push({
      label: 'Idade',
      value: `${selectedAge} anos`,
      correct: `${correctAge} anos`,
      color: ageColor
    });
    
    // Clube
    let clubColor = 'red';
    if (Utils.normalizeText(selectedPlayer.club) === Utils.normalizeText(correctPlayer.club)) {
      clubColor = 'green';
    } else if ((correctPlayer.past_clubs || []).some(club => 
      Utils.normalizeText(club) === Utils.normalizeText(selectedPlayer.club)
    )) {
      clubColor = 'orange';
    }
    
    results.push({
      label: 'Clube',
      value: selectedPlayer.club,
      correct: correctPlayer.club,
      color: clubColor
    });
    
    // Liga
    let leagueColor = 'red';
    const selectedLeague = selectedPlayer.league || 'Desconhecida';
    const correctLeague = correctPlayer.league || 'Desconhecida';
    
    if (Utils.normalizeText(selectedLeague) === Utils.normalizeText(correctLeague)) {
      leagueColor = 'green';
    } else if ((correctPlayer.past_clubs || []).some(club => {
      const pastClub = gameState.players.find(p => p.name === club);
      return pastClub && Utils.normalizeText(pastClub.league || '') === Utils.normalizeText(selectedLeague);
    })) {
      leagueColor = 'orange';
    }
    
    results.push({
      label: 'Liga',
      value: selectedLeague,
      correct: correctLeague,
      color: leagueColor
    });
    
    // Posição
    const positionColor = Utils.normalizeText(selectedPlayer.position) === 
                          Utils.normalizeText(correctPlayer.position) 
                          ? 'green' : 'red';
    
    results.push({
      label: 'Posição',
      value: selectedPlayer.position,
      correct: correctPlayer.position,
      color: positionColor
    });
    
    // Nacionalidade
    const nationalityColor = Utils.normalizeText(selectedPlayer.nationality) === 
                             Utils.normalizeText(correctPlayer.nationality) 
                             ? 'green' : 'red';
    
    results.push({
      label: 'Nacionalidade',
      value: selectedPlayer.nationality,
      correct: correctPlayer.nationality,
      color: nationalityColor
    });
    
    return results;
  },
  
  async startGame() {
    UI.setLoading(true);
    try {
      await this.loadPlayers();
      this.selectRandomPlayer();
      gameState.attempts = [];
      UI.updateGameStatus();
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
      UI.showMessage('Erro ao carregar jogadores.', false);
      UI.setLoading(false);
    }
  },
  
  async loadPlayers() {
    try {
      const response = await fetch('players.json');
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      let players = await response.json();
      
      if (gameState.mode === 'normal') {
        players = players.filter(player => 
          !['Retired', 'Deceased', 'Free Agent', 'Sem liga'].includes(player.club)
        );
      }
      
      gameState.players = players;
      UI.setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
      throw error;
    }
  },
  
  selectRandomPlayer() {
    UI.setLoading(true);
    
    if (!gameState.players.length) {
      UI.setLoading(false);
      UI.showMessage('Lista de jogadores vazia', false);
      return;
    }
    
    gameState.correctPlayer = gameState.players[
      Math.floor(Math.random() * gameState.players.length)
    ];
    
    UI.setLoading(false);
    UI.updateGameStatus();
    
    if (gameState.mode === 'dificil') {
      this.startTimer();
    }
  },
  
  startTimer() {
    this.stopTimer();
    gameState.timeLeft = 20;
    UI.updateTimer(gameState.timeLeft);
    
    gameState.timerInterval = setInterval(() => {
      gameState.timeLeft--;
      UI.updateTimer(gameState.timeLeft);
      
      if (gameState.timeLeft <= 0) {
        this.stopTimer();
        UI.showMessage('Tempo esgotado!', false);
        gameState.lives--;
        UI.updateGameStatus();
        
        if (gameState.lives <= 0) {
          this.endGame();
        } else {
          this.selectRandomPlayer();
        }
      }
    }, 1000);
  },
  
  stopTimer() {
    if (gameState.timerInterval) {
      clearInterval(gameState.timerInterval);
      gameState.timerInterval = null;
    }
  },
  
  endGame() {
    gameState.gameOver = true;
    this.stopTimer();
    UI.displayCorrectPlayer();
    UI.elements.chooseBtn.innerText = 'Reiniciar';
    UI.elements.chooseBtn.disabled = false;
    UI.elements.input.disabled = true;
    
    if (gameState.wins > gameState.record) {
      gameState.record = gameState.wins;
      localStorage.setItem('recorde_futebol', gameState.record);
      UI.showMessage(`Fim de jogo! Novo recorde: ${gameState.record} acertos!`, true);
    } else {
      UI.showMessage(`Fim de jogo! Sua pontuação: ${gameState.wins}. Recorde: ${gameState.record}`, false);
    }
  },
  
  restartGame() {
    gameState.resetGame();
    UI.resetUI();
    this.startGame();
  }
};

// Inicializar o jogo quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  GameManager.initialize();
});