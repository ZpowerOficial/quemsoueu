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
    // Sorteia um jogador aleatório da lista local
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
    
    // Resetar o botão para "Escolher" se estiver como "Reiniciar"
    if (!state && document.getElementById('choose-btn').innerText === 'Reiniciar') {
        document.getElementById('choose-btn').innerText = 'Escolher';
    }
}

function atualizarStatus() {
    document.getElementById('round-info').textContent = `Rodada: ${rodada} | Acertos: ${acertos} | Vidas: ${vidas} | Recorde: ${recorde}`;
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
    
    // Funcionalidade do modal tutorial
    tutorialBtn.addEventListener('click', () => {
        tutorialModal.style.display = 'block';
    });
    
    closeBtn.addEventListener('click', () => {
        tutorialModal.style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
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
        // Limpar tentativas ao iniciar
        tentativas = [];
    }

    carregarJogadoresEIniciar();

    // Função para normalizar texto (remover acentos e caracteres especiais)
    function normalizeText(text) {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }
    
    input.addEventListener('input', () => {
        const query = normalizeText(input.value.trim());
        suggestions.innerHTML = '';
        chooseBtn.disabled = true;
        selectedSuggestion = null;
        if (query.length < 3) return;
        // Busca sugestões locais
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

        // Função para atualizar o histórico de tentativas
    function atualizarHistoricoTentativas() {
        const historicoElement = document.getElementById('historico-tentativas');
        if (tentativas.length > 0) {
            historicoElement.style.display = 'block';
            historicoElement.innerHTML = `<h3>Histórico de Tentativas</h3>`;
            
            const historicoHTML = tentativas.map((tentativa, index) => {
                return `
                <div class="tentativa">
                    <h4>Tentativa ${index + 1}: ${tentativa.jogador}</h4>
                    <div class="tentativa-resultados">
                        ${tentativa.resultados.map(r => `<div class="feedback-small ${r.color}"><b>${r.label}:</b> ${r.value}</div>`).join('')}
                    </div>
                </div>
                `;
            }).join('');
            
            historicoElement.innerHTML += historicoHTML;
        } else {
            historicoElement.style.display = 'none';
        }
    }

    chooseBtn.addEventListener('click', async () => {
        // Se o jogo acabou e o botão está como "Reiniciar", reiniciar o jogo
        if (fimDeJogo && chooseBtn.innerText === 'Reiniciar') {
            reiniciarJogo();
            return;
        }
        
        if (fimDeJogo) return;
        feedback.innerHTML = '';
        playerDetails.style.display = 'none';
        if (!selectedSuggestion || !correctPlayer) return;
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 600));
        // Comparação dos campos
        const results = [];
        // Idade - Calculando a idade atual em vez de mostrar data de nascimento
        let idadeCor = 'red';
        let idadeJogadorSelecionado = '-';
        let idadeJogadorCorreto = '-';
        
        if (selectedSuggestion.birthdate) {
            const hoje = new Date();
            const nascimento = new Date(selectedSuggestion.birthdate);
            idadeJogadorSelecionado = hoje.getFullYear() - nascimento.getFullYear();
            const m = hoje.getMonth() - nascimento.getMonth();
            if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
                idadeJogadorSelecionado--;
            }
        }
        
        if (correctPlayer.birthdate) {
            const hoje = new Date();
            const nascimento = new Date(correctPlayer.birthdate);
            idadeJogadorCorreto = hoje.getFullYear() - nascimento.getFullYear();
            const m = hoje.getMonth() - nascimento.getMonth();
            if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
                idadeJogadorCorreto--;
            }
        }
        
        if (idadeJogadorSelecionado === idadeJogadorCorreto) {
            idadeCor = 'green';
        } else if (Math.abs(idadeJogadorSelecionado - idadeJogadorCorreto) <= 2) {
            idadeCor = 'orange';
        }
        
        results.push({label: 'Idade', value: idadeJogadorSelecionado + ' anos', correct: idadeJogadorCorreto + ' anos', color: idadeCor});
        // Clube
        let clubeCor = 'red';
        if (normalizeText(selectedSuggestion.club) === normalizeText(correctPlayer.club)) {
            clubeCor = 'green';
        }
        results.push({label: 'Clube', value: selectedSuggestion.club, correct: correctPlayer.club, color: clubeCor});
        
        // Liga
        let ligaCor = 'red';
        if (normalizeText(selectedSuggestion.league) === normalizeText(correctPlayer.league)) {
            ligaCor = 'green';
        }
        results.push({label: 'Liga', value: selectedSuggestion.league, correct: correctPlayer.league, color: ligaCor});
        // Posição
        let posCor = 'red';
        if (normalizeText(selectedSuggestion.position) === normalizeText(correctPlayer.position)) {
            posCor = 'green';
        }
        results.push({label: 'Posição', value: selectedSuggestion.position, correct: correctPlayer.position, color: posCor});
        // Nacionalidade
        let nacCor = 'red';
        if (normalizeText(selectedSuggestion.nationality) === normalizeText(correctPlayer.nationality)) {
            nacCor = 'green';
        }
        results.push({label: 'Nacionalidade', value: selectedSuggestion.nationality, correct: correctPlayer.nationality, color: nacCor});
        // Adicionar esta tentativa ao histórico
        tentativas.push({
            jogador: selectedSuggestion.name,
            resultados: results
        });
        
        // Renderização do feedback atual
        feedback.innerHTML = results.map(r => `<div class="feedback ${r.color}"><b>${r.label}:</b> ${r.value}</div>`).join('');
        
        // Atualizar o histórico de tentativas
        atualizarHistoricoTentativas();
        playerDetails.style.display = 'none'; // Só mostra o nome ao acertar tudo ou perder

        // Se acertou tudo, conta ponto e sorteia novo jogador
        if (results.every(r => r.color === 'green')) {
            acertos++;
            rodada++;
            vidas += 3; // Adiciona 3 vidas ao acertar o jogador
            playerDetails.style.display = 'block';
            // Calcular idade do jogador correto
            let idadeJogadorCorreto = '-';
            if (correctPlayer.birthdate) {
                const hoje = new Date();
                const nascimento = new Date(correctPlayer.birthdate);
                idadeJogadorCorreto = hoje.getFullYear() - nascimento.getFullYear();
                const m = hoje.getMonth() - nascimento.getMonth();
                if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
                    idadeJogadorCorreto--;
                }
            }
            
            playerDetails.innerHTML = `<h3>Jogador correto: ${correctPlayer.name}</h3>
                <p>Idade: ${idadeJogadorCorreto} anos</p>
                <p>Clube: ${correctPlayer.club}</p>
                <p>Liga: ${correctPlayer.league}</p>
                <p>Posição: ${correctPlayer.position}</p>
                <p>Nacionalidade: ${correctPlayer.nationality}</p>`;
            setTimeout(() => {
                feedback.innerHTML = '<div class="feedback green"><b>Parabéns! Você acertou tudo! Próximo jogador sorteado...</b></div>';
                playerDetails.style.display = 'none';
                atualizarStatus();
                sortearJogador();
                // Limpar histórico de tentativas para o novo jogador
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
                // Calcular idade do jogador correto
                let idadeJogadorCorreto = '-';
                if (correctPlayer.birthdate) {
                    const hoje = new Date();
                    const nascimento = new Date(correctPlayer.birthdate);
                    idadeJogadorCorreto = hoje.getFullYear() - nascimento.getFullYear();
                    const m = hoje.getMonth() - nascimento.getMonth();
                    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
                        idadeJogadorCorreto--;
                    }
                }
                
                playerDetails.innerHTML = `<h3>Jogador correto: ${correctPlayer.name}</h3>
                    <p>Idade: ${idadeJogadorCorreto} anos</p>
                    <p>Clube: ${correctPlayer.club}</p>
                    <p>Liga: ${correctPlayer.league}</p>
                    <p>Posição: ${correctPlayer.position}</p>
                    <p>Nacionalidade: ${correctPlayer.nationality}</p>`;
                if (acertos > recorde) {
                    recorde = acertos;
                    localStorage.setItem('recorde_futebol', recorde);
                    feedback.innerHTML = `<div class='feedback green'><b>Fim de jogo! Novo recorde: ${recorde} acertos!</b></div>`;
                } else {
                    feedback.innerHTML = `<div class='feedback red'><b>Fim de jogo! Sua pontuação: ${acertos}. Recorde: ${recorde}</b></div>`;
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
