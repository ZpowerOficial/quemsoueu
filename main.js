// main.js

// Seleção de modo ao carregar o script (antes do DOM estar pronto)
let mode = 'normal';
const escolha = prompt("Escolha o modo de jogo: 'normal' ou 'dificil'");
if (escolha && escolha.trim().toLowerCase() === 'dificil') {
  mode = 'dificil';
  alert('Modo difícil ativado: temporizador de 20s e inclusão de aposentados.');
} else {
  mode = 'normal';
  alert('Modo normal ativado: apenas jogadores ativos.');
}

let players = [];
let selectedSuggestion = null;
let correctPlayer = null;
let rodada = 1;
let acertos = 0;
let vidas = 10;
let fimDeJogo = false;
let recorde = Number(localStorage.getItem('recorde_futebol')) || 0;
let tentativas = [];
let timerInterval = null;
let timeLeft = 20;

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('player-input');
  const suggestions = document.getElementById('suggestions');
  const chooseBtn = document.getElementById('choose-btn');
  const feedback = document.getElementById('feedback');
  const playerDetails = document.getElementById('player-details');
  const tutorialBtn = document.getElementById('tutorial-btn');
  const tutorialModal = document.getElementById('tutorial-modal');
  const closeBtn = tutorialModal.querySelector('.close');

  // Modal tutorial
  tutorialBtn.addEventListener('click', () => tutorialModal.style.display = 'block');
  closeBtn.addEventListener('click', () => tutorialModal.style.display = 'none');
  window.addEventListener('click', e => { if (e.target === tutorialModal) tutorialModal.style.display = 'none'; });

  // Timer display (modo difícil)
  const timerSpan = document.createElement('span');
  timerSpan.id = 'timer';
  timerSpan.style.marginLeft = '20px';
  document.getElementById('game-status').appendChild(timerSpan);

  // Histórico inverso
  const historicoEl = document.createElement('div');
  historicoEl.id = 'historico-tentativas';
  historicoEl.style.display = 'none';
  document.querySelector('.container').insertBefore(historicoEl, feedback);

  // Iniciar
  carregarJogadoresEIniciar();

  // Normalização de texto
  function normalizeText(t) {
    return t.normalize('NFD').replace(/[̀-\u036f]/g, '').toLowerCase();
  }

  // Sugestões
  input.addEventListener('input', () => {
    const q = normalizeText(input.value.trim());
    suggestions.innerHTML = '';
    selectedSuggestion = null;
    chooseBtn.disabled = true;
    if (q.length < 3) return;
    const found = players.filter(p =>
      normalizeText(p.name).includes(q) ||
      normalizeText(p.club).includes(q) ||
      normalizeText(p.nationality).includes(q)
    ).slice(0, 5);
    found.forEach(p => {
      const li = document.createElement('li');
      li.textContent = `${p.name} (${p.nationality})`;
      li.onclick = () => {
        suggestions.querySelectorAll('li').forEach(n => n.classList.remove('selected'));
        li.classList.add('selected');
        selectedSuggestion = p;
        chooseBtn.disabled = false;
      };
      suggestions.appendChild(li);
    });
  });

  // Ação do botão Escolher
  chooseBtn.addEventListener('click', async () => {
    if (fimDeJogo && chooseBtn.innerText === 'Reiniciar') return reiniciarJogo();
    if (fimDeJogo || !selectedSuggestion || !correctPlayer) return;

    clearTimer();
    feedback.innerHTML = '';
    playerDetails.style.display = 'none';
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));

    const results = [];
    // Idade
    let selAge = '-', corrAge = '-', ageColor = 'red';
    if (selectedSuggestion.birthdate) selAge = calcAge(selectedSuggestion.birthdate);
    if (correctPlayer.birthdate) corrAge = calcAge(correctPlayer.birthdate);
    if (selAge === corrAge) ageColor = 'green';
    else if (Math.abs(selAge - corrAge) <= 2) ageColor = 'orange';
    results.push({ label: 'Idade', value: `${selAge} anos`, correct: `${corrAge} anos`, color: ageColor });

    // Clube
    let clubColor = 'red';
    if (normalizeText(selectedSuggestion.club) === normalizeText(correctPlayer.club)) clubColor = 'green';
    else if ((correctPlayer.past_clubs||[]).some(c => normalizeText(c) === normalizeText(selectedSuggestion.club))) clubColor = 'orange';
    results.push({ label: 'Clube', value: selectedSuggestion.club, correct: correctPlayer.club, color: clubColor });

    // Liga
    let leagueColor = 'red';
    if (normalizeText(selectedSuggestion.league) === normalizeText(correctPlayer.league)) leagueColor = 'green';
    else if ((correctPlayer.past_clubs||[]).some(c => {
      const o = players.find(x => x.name === c);
      return o && normalizeText(o.league) === normalizeText(selectedSuggestion.league);
    })) leagueColor = 'orange';
    results.push({ label: 'Liga', value: selectedSuggestion.league, correct: correctPlayer.league, color: leagueColor });

    // Posição
    const posColor = normalizeText(selectedSuggestion.position) === normalizeText(correctPlayer.position) ? 'green' : 'red';
    results.push({ label: 'Posição', value: selectedSuggestion.position, correct: correctPlayer.position, color: posColor });

    // Nacionalidade
    const natColor = normalizeText(selectedSuggestion.nationality) === normalizeText(correctPlayer.nationality) ? 'green' : 'red';
    results.push({ label: 'Nacionalidade', value: selectedSuggestion.nationality, correct: correctPlayer.nationality, color: natColor });

    // Exibir feedback
    feedback.innerHTML = results.map(r =>
      `<div class="feedback ${r.color}"><b>${r.label}:</b> ${r.value}</div>`
    ).join('');

    // Atualizar histórico invertido
    tentativas.unshift({ jogador: selectedSuggestion.name, resultados: results });
    atualizarHistoricoTentativas();

    // Verifica vitória ou vida
    if (results.every(r => r.color === 'green')) {
      acertos++;
      vidas += 3;
      displayCorrect();
      await delay(1800);
      feedback.innerHTML = '<div class="feedback green"><b>Parabéns! Você acertou tudo! Próximo jogador...</b></div>';
      tentativas = [];
      document.getElementById('historico-tentativas').style.display = 'none';
      rodada++;
      setLoading(false);
      sortearJogador();
    } else {
      rodada++;
      vidas--;
      atualizarStatus();
      if (vidas <= 0) return endGame();
      setLoading(false);
    }
    selectedSuggestion = null;
    chooseBtn.disabled = true;
    suggestions.innerHTML = '';
    input.value = '';
    if (mode === 'dificil' && !fimDeJogo) startTimer();
  });

  // Funções auxiliares
  function calcAge(birth) {
    const h = new Date(), n = new Date(birth);
    let age = h.getFullYear() - n.getFullYear();
    const m = h.getMonth() - n.getMonth(); if (m < 0 || (m === 0 && h.getDate() < n.getDate())) age--;
    return age;
  }

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  function startTimer() {
    clearTimer();
    timeLeft = 20;
    document.getElementById('timer').textContent = `Tempo: ${timeLeft}s`;
    timerInterval = setInterval(() => {
      timeLeft--;
      document.getElementById('timer').textContent = `Tempo: ${timeLeft}s`;
      if (timeLeft <= 0) {
        clearTimer();
        feedback.innerHTML = '<div class="feedback red"><b>Tempo esgotado!</b></div>';
        vidas--;
        atualizarStatus();
        if (vidas <= 0) endGame(); else sortearJogador();
      }
    }, 1000);
  }

  function clearTimer() { if (timerInterval) clearInterval(timerInterval); }

  async function carregarJogadoresEIniciar() {
    setLoading(true);
    try {
      const resp = await fetch('players.json');
      players = await resp.json();
      if (mode === 'normal') {
        players = players.filter(p => !['Retired','Deceased','Free Agent','Sem liga'].includes(p.club));
      }
    } catch (e) {
      alert('Erro ao carregar jogadores.');
      setLoading(false);
      return;
    }
    setLoading(false);
    sortearJogador();
    tentativas = [];
  }

  function sortearJogador() {
    setLoading(true);
    if (!players.length) { setLoading(false); alert('Lista vazia'); return; }
    correctPlayer = players[Math.floor(Math.random() * players.length)];
    setLoading(false);
    atualizarStatus();
    if (mode === 'dificil') startTimer();
  }

  function setLoading(state) {
    document.getElementById('loading').style.display = state ? 'inline' : 'none';
    chooseBtn.disabled = state;
    input.disabled = state;
    if (!state && chooseBtn.innerText === 'Reiniciar') chooseBtn.innerText = 'Escolher';
  }

  function atualizarStatus() {
    document.getElementById('round-info').textContent =
      `Rodada: ${rodada} | Acertos: ${acertos} | Vidas: ${vidas} | Recorde: ${recorde}`;
  }

  function atualizarHistoricoTentativas() {
    const el = document.getElementById('historico-tentativas');
    if (tentativas.length) {
      el.style.display = 'block';
      el.innerHTML = '<h3>Histórico de Tentativas</h3>' +
        tentativas.map((t,i) =>
          `<div class="tentativa"><h4>Tentativa ${i+1}: ${t.jogador}</h4><div class="tentativa-resultados">` +
          t.resultados.map(r=>`<div class="feedback-small ${r.color}"><b>${r.label}:</b> ${r.value}</div>`).join('') +
          '</div></div>'
        ).join('');
    } else el.style.display = 'none';
  }

  function displayCorrect() {
    playerDetails.style.display = 'block';
    const age = correctPlayer.birthdate ? calcAge(correctPlayer.birthdate) : '-';
    playerDetails.innerHTML = `<h3>Jogador correto: ${correctPlayer.name}</h3>
      <p>Idade: ${age} anos</p>
      <p>Clube: ${correctPlayer.club}</p>
      <p>Liga: ${correctPlayer.league}</p>
      <p>Posição: ${correctPlayer.position}</p>
      <p>Nacionalidade: ${correctPlayer.nationality}</p>`;
  }

  function endGame() {
    fimDeJogo = true;
    clearTimer();
    displayCorrect();
    chooseBtn.innerText = 'Reiniciar';
    chooseBtn.disabled = false;
    input.disabled = true;
    if (acertos > recorde) {
      recorde = acertos;
      localStorage.setItem('recorde_futebol', recorde);
      feedback.innerHTML = `<div class='feedback green'><b>Fim de jogo! Novo recorde: ${recorde} acertos!</b></div>`;
    } else {
      feedback.innerHTML = `<div class='feedback red'><b>Fim de jogo! Sua pontuação: ${acertos}. Recorde: ${recorde}</b></div>`;
    }
  }

  function reiniciarJogo() {
    rodada = 1; acertos = 0; vidas = 10; fimDeJogo = false; tentativas = [];
    input.disabled = false;
    chooseBtn.innerText = 'Escolher';
    feedback.innerHTML = '';
    playerDetails.style.display = 'none';
    document.getElementById('historico-tentativas').style.display = 'none';
    atualizarStatus();
    carregarJogadoresEIniciar();
  }
});