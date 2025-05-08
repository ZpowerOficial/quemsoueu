let players = [];
let selectedSuggestion = null;
let correctPlayer = null;
let rodada = 1;
let acertos = 0;
let vidas = 10;
let fimDeJogo = false;
let recorde = Number(localStorage.getItem('recorde_futebol')) || 0;
let tentativas = []; // Armazenar histórico de tentativas

async function sortearJogador() {
    setLoading(true);
    if (!players.length) {
        setLoading(false);
        alert('Lista de jogadores não carregada.');
        return;
    }
    correctPlayer = players[Math.floor(Math.random() * players.length)];
    setLoading(false);
    atualizarStatus();
}

function setLoading(state) {
    document.getElementById('loading').style.display = state ? 'inline' : 'none';
    document.getElementById('choose-btn').disabled = state;
    document.getElementById('player-input').disabled = state;
    if (!state && document.getElementById('choose-btn').innerText === 'Reiniciar') {
        document.getElementById('choose-btn').innerText = 'Escolher';
    }
}

function atualizarStatus() {
    document.getElementById('round-info').textContent =
        `Rodada: ${rodada} | Acertos: ${acertos} | Vidas: ${vidas} | Recorde: ${recorde}`;
}

function reiniciarJogo() {
    rodada = 1;
    acertos = 0;
    vidas = 10;
    fimDeJogo = false;
    tentativas = [];
    document.getElementById('historico-tentativas').style.display = 'none';
    document.getElementById('player-input').disabled = false;
    document.getElementById('choose-btn').disabled = true;
    document.getElementById('choose-btn').innerText = 'Escolher';
    feedback.innerHTML = '';
    playerDetails.style.display = 'none';
    atualizarStatus();
    sortearJogador();
}

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('player-input');
    const suggestions = document.getElementById('suggestions');
    const chooseBtn = document.getElementById('choose-btn');
    const feedback = document.getElementById('feedback');
    const playerDetails = document.getElementById('player-details');
    const tutorialBtn = document.getElementById('tutorial-btn');
    const tutorialModal = document.getElementById('tutorial-modal');
    const closeBtn = document.querySelector('.close');
    const historicoElement = document.createElement('div');
    historicoElement.id = 'historico-tentativas';
    historicoElement.style.display = 'none';
    document.querySelector('.container').insertBefore(historicoElement, feedback);

    tutorialBtn.addEventListener('click', () => {
        tutorialModal.style.display = 'block';
    });
    closeBtn.addEventListener('click', () => {
        tutorialModal.style.display = 'none';
    });
    window.addEventListener('click', event => {
        if (event.target === tutorialModal) {
            tutorialModal.style.display = 'none';
        }
    });

    async function carregarJogadoresEIniciar() {
        setLoading(true);
        try {
            const resp = await fetch('players.json');
            players = await resp.json();
        } catch (e) {
            alert('Erro ao carregar jogadores.');
            setLoading(false);
            return;
        }
        setLoading(false);
        sortearJogador();
        tentativas = [];
    }
    carregarJogadoresEIniciar();

    function normalizeText(text) {
        return text.normalize('NFD')
                   .replace(/[\u0300-\u036f]/g, '')
                   .toLowerCase();
    }

    input.addEventListener('input', () => {
        const query = normalizeText(input.value.trim());
        suggestions.innerHTML = '';
        chooseBtn.disabled = true;
        selectedSuggestion = null;
        if (query.length < 3) return;
        const found = players.filter(p =>
            normalizeText(p.name).includes(query) ||
            normalizeText(p.club).includes(query) ||
            normalizeText(p.nationality).includes(query)
        ).slice(0, 5);
        found.forEach(player => {
            const li = document.createElement('li');
            li.textContent = `${player.name} (${player.nationality})`;
            li.dataset.id = player.id;
            li.onclick = () => {
                Array.from(suggestions.children).forEach(child => child.classList.remove('selected'));
                li.classList.add('selected');
                selectedSuggestion = player;
                chooseBtn.disabled = false;
            };
            suggestions.appendChild(li);
        });
    });

    function atualizarHistoricoTentativas() {
        const he = document.getElementById('historico-tentativas');
        if (tentativas.length > 0) {
            he.style.display = 'block';
            he.innerHTML = `<h3>Histórico de Tentativas</h3>`;
            const html = tentativas.map((t, i) => `
                <div class="tentativa">
                    <h4>Tentativa ${i + 1}: ${t.jogador}</h4>
                    <div class="tentativa-resultados">
                        ${t.resultados.map(r =>
                          `<div class="feedback-small ${r.color}"><b>${r.label}:</b> ${r.value}</div>`
                        ).join('')}
                    </div>
                </div>
            `).join('');
            he.innerHTML += html;
        } else {
            he.style.display = 'none';
        }
    }

    // Função corrigida: recebe o jogador correto e verifica contra o chute
    function verificarHistoricoJogador(jogador, clubeChutado, ligaChutada) {
        const norm = txt =>
            txt.normalize('NFD')
               .replace(/[\u0300-\u036f]/g, '')
               .toLowerCase();

        const jogouNoClube = (jogador.past_clubs || [])
            .some(c => norm(c) === norm(clubeChutado));

        const jogouNaLiga = (jogador.past_clubs || [])
            .some(c => {
                const clubeObj = players.find(p => p.name === c);
                return clubeObj && norm(clubeObj.league) === norm(ligaChutada);
            });

        return { jogouNoClube, jogouNaLiga };
    }

    chooseBtn.addEventListener('click', async () => {
        if (fimDeJogo && chooseBtn.innerText === 'Reiniciar') {
            reiniciarJogo();
            return;
        }
        if (fimDeJogo) return;

        feedback.innerHTML = '';
        playerDetails.style.display = 'none';
        if (!selectedSuggestion || !correctPlayer) return;

        setLoading(true);
        await new Promise(res => setTimeout(res, 600));

        const results = [];
        // Cálculo de idade selecionada e correta...
        let idadeCor = 'red', idadeSel = '-', idadeCorreta = '-';
        if (selectedSuggestion.birthdate) {
            const hoje = new Date(), nasc = new Date(selectedSuggestion.birthdate);
            idadeSel = hoje.getFullYear() - nasc.getFullYear();
            const m = hoje.getMonth() - nasc.getMonth();
            if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idadeSel--;
        }
        if (correctPlayer.birthdate) {
            const hoje = new Date(), nasc = new Date(correctPlayer.birthdate);
            idadeCorreta = hoje.getFullYear() - nasc.getFullYear();
            const m = hoje.getMonth() - nasc.getMonth();
            if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idadeCorreta--;
        }
        if (idadeSel === idadeCorreta) idadeCor = 'green';
        else if (Math.abs(idadeSel - idadeCorreta) <= 2) idadeCor = 'orange';

        results.push({
            label: 'Idade',
            value: `${idadeSel} anos`,
            correct: `${idadeCorreta} anos`,
            color: idadeCor
        });

        // Clube
        let corClube = 'red';
        if (normalizeText(selectedSuggestion.club) === normalizeText(correctPlayer.club)) {
            corClube = 'green';
        } else if (correctPlayer.past_clubs?.includes(selectedSuggestion.club)) {
            corClube = 'orange';
        }
        results.push({
            label: 'Clube',
            value: selectedSuggestion.club,
            correct: correctPlayer.club,
            color: corClube
        });

        // Liga
        let corLiga = 'red';
        if (normalizeText(selectedSuggestion.league) === normalizeText(correctPlayer.league)) {
            corLiga = 'green';
        } else {
            const jaNaLiga = (correctPlayer.past_clubs || []).some(c => {
                const obj = players.find(p => p.name === c);
                return obj && normalizeText(obj.league) === normalizeText(selectedSuggestion.league);
            });
            if (jaNaLiga) corLiga = 'orange';
        }
        results.push({
            label: 'Liga',
            value: selectedSuggestion.league,
            correct: correctPlayer.league,
            color: corLiga
        });

        // Posição
        const corPos = normalizeText(selectedSuggestion.position) === normalizeText(correctPlayer.position)
            ? 'green' : 'red';
        results.push({
            label: 'Posição',
            value: selectedSuggestion.position,
            correct: correctPlayer.position,
            color: corPos
        });

        // Nacionalidade
        const corNac = normalizeText(selectedSuggestion.nationality) === normalizeText(correctPlayer.nationality)
            ? 'green' : 'red';
        results.push({
            label: 'Nacionalidade',
            value: selectedSuggestion.nationality,
            correct: correctPlayer.nationality,
            color: corNac
        });

        // Histórico de clubes – agora invertido corretamente
        const historico = verificarHistoricoJogador(
            correctPlayer,
            selectedSuggestion.club,
            selectedSuggestion.league
        );
        const corHist = (historico.jogouNoClube || historico.jogouNaLiga) ? 'green' : 'red';
        results.push({
            label: 'Histórico de Clubes',
            value: historico.jogouNoClube ? 'Jogou no clube' : 'Não jogou no clube',
            correct: historico.jogouNoClube ? 'Jogou no clube' : 'Não jogou no clube',
            color: corHist
        });

        // Salva tentativa e renderiza feedback
        tentativas.push({
            jogador: selectedSuggestion.name,
            resultados: results
        });
        feedback.innerHTML = results.map(r =>
            `<div class="feedback ${r.color}"><b>${r.label}:</b> ${r.value}</div>`
        ).join('');
        atualizarHistoricoTentativas();

        // Lógica de acerto total ou perda de vida...
        if (results.every(r => r.color === 'green')) {
            acertos++;
            rodada++;
            vidas += 3;
            playerDetails.style.display = 'block';
            playerDetails.innerHTML = `
                <h3>Jogador correto: ${correctPlayer.name}</h3>
                <p>Idade: ${idadeCorreta} anos</p>
                <p>Clube: ${correctPlayer.club}</p>
                <p>Liga: ${correctPlayer.league}</p>
                <p>Posição: ${correctPlayer.position}</p>
                <p>Nacionalidade: ${correctPlayer.nationality}</p>
            `;
            setTimeout(() => {
                feedback.innerHTML = `<div class="feedback green">
                    <b>Parabéns! Você acertou tudo! Próximo jogador sorteado...</b>
                </div>`;
                playerDetails.style.display = 'none';
                atualizarStatus();
                sortearJogador();
                tentativas = [];
                document.getElementById('historico-tentativas').style.display = 'none';
            }, 1800);
        } else {
            rodada++;
            vidas--;
            atualizarStatus();
            if (vidas <= 0) {
                fimDeJogo = true;
                playerDetails.style.display = 'block';
                chooseBtn.innerText = 'Reiniciar';
                chooseBtn.disabled = false;
                playerDetails.innerHTML = `
                    <h3>Jogador correto: ${correctPlayer.name}</h3>
                    <p>Idade: ${idadeCorreta} anos</p>
                    <p>Clube: ${correctPlayer.club}</p>
                    <p>Liga: ${correctPlayer.league}</p>
                    <p>Posição: ${correctPlayer.position}</p>
                    <p>Nacionalidade: ${correctPlayer.nationality}</p>
                `;
                if (acertos > recorde) {
                    recorde = acertos;
                    localStorage.setItem('recorde_futebol', recorde);
                    feedback.innerHTML = `<div class='feedback green'>
                        <b>Fim de jogo! Novo recorde: ${recorde} acertos!</b>
                    </div>`;
                } else {
                    feedback.innerHTML = `<div class='feedback red'>
                        <b>Fim de jogo! Sua pontuação: ${acertos}. Recorde: ${recorde}</b>
                    </div>`;
                }
                chooseBtn.disabled = true;
                input.disabled = true;
            }
        }

        setLoading(false);
        selectedSuggestion = null;
        chooseBtn.disabled = true;
        suggestions.innerHTML = '';
        input.value = '';
    });
});