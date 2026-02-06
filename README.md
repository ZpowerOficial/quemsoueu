# ⚽ Quem Sou Eu? - Futebol

Jogo de adivinhação de jogadores de futebol inspirado no Wordle/Termo. Teste seus conhecimentos sobre jogadores, clubes, ligas e nacionalidades!

## 🎮 Características

### Modos de Jogo
- **Normal**: Sem limite de tempo, jogadores em atividade
- **Difícil**: 20 segundos por rodada
- **Lendas**: Apenas jogadores históricos/aposentados
- **Rápido**: Tempo diminui a cada rodada

### Funcionalidades
- 🎯 Sistema de feedback colorido (verde/laranja/vermelho)
- 💡 Sistema de dicas inteligentes
- 📊 Estatísticas detalhadas
- 🏆 Sistema de conquistas
- 🔊 Efeitos sonoros (Web Audio API)
- 📳 Feedback tátil (Vibration API)
- 🌓 Tema claro/escuro
- 📱 PWA - Instalável como aplicativo
- 🔄 Funciona offline
- 📈 Ranking pessoal top-5
- 📜 Histórico de tentativas

## 🏗️ Arquitetura

### Estrutura de Arquivos
```
/
├── index.html              # Página principal
├── style.css              # Estilos globais
├── manifest.json          # Manifesto PWA
├── service-worker.js      # Service Worker para offline
├── players.json           # Base de dados de jogadores
├── icons/                 # Ícones do PWA
└── js/                    # Módulos JavaScript
    ├── main.js           # Entry point
    ├── config.js         # Configurações e constantes
    ├── storage.js        # Wrapper seguro do localStorage
    ├── utils.js          # Funções utilitárias
    ├── audio.js          # Gerenciador de áudio
    ├── vibration.js      # Gerenciador de vibração
    ├── achievements.js   # Sistema de conquistas
    ├── statistics.js     # Estatísticas do jogador
    ├── ui.js             # Gerenciador de UI
    └── gameManager.js    # Lógica principal do jogo
```

### Tecnologias
- **Frontend**: HTML5, CSS3, JavaScript ES6+ (módulos)
- **Storage**: localStorage
- **PWA**: Service Worker, Web App Manifest
- **Audio**: Web Audio API
- **Vibração**: Vibration API

## 🎨 Temas e Personalização

O jogo oferece múltiplas opções de personalização:
- Tema claro/escuro
- Áudio ativado/desativado
- Vibração ativada/desativada
- Múltiplos modos de jogo

## 🏆 Conquistas

- 🎯 **Primeira Vitória**: Acerte seu primeiro jogador
- 🔥 **Sequência de 5**: Acerte 5 jogadores seguidos
- ⚡ **Sequência de 10**: Acerte 10 jogadores seguidos
- 👑 **Mestre das Lendas**: Vença 5 jogos no modo Lendas
- 💨 **Demônio da Velocidade**: Vença no modo Rápido com 10+ acertos
- ⭐ **Jogo Perfeito**: Acerte um jogador na primeira tentativa
- 💪 **Persistente**: Jogue 50 partidas
- 📚 **Estudioso**: Use o botão de dica 20 vezes

## 📊 Estatísticas Rastreadas

- Total de jogos
- Vitórias/Derrotas
- Taxa de acerto
- Média de tentativas
- Melhor sequência
- Acertos perfeitos
- Dicas usadas
- Recordes por modo
- Tempo total de jogo

## 🚀 Como Executar

### Desenvolvimento Local
```bash
# Servidor HTTP simples com Python
python3 -m http.server 8000

# Ou com Node.js
npx http-server -p 8000

# Ou com PHP
php -S localhost:8000
```

Acesse: `http://localhost:8000`

### PWA/Produção
Para funcionar como PWA, o site precisa:
1. Ser servido via HTTPS (ou localhost)
2. Ter um Service Worker registrado
3. Ter um manifesto válido

## 🔧 Melhorias Implementadas

### Performance
- ✅ Debounce na busca (300ms)
- ✅ Cache LRU para resultados de busca
- ✅ DocumentFragment para renderização eficiente
- ✅ Normalização de texto otimizada

### Bug Fixes
- ✅ Race condition no timer corrigida
- ✅ Tratamento adequado de birthdate null/undefined
- ✅ Normalização consistente de texto em todas comparações
- ✅ Event listeners não duplicam

### UX/UI
- ✅ Animações CSS suaves
- ✅ Skeleton loaders
- ✅ Toast notifications
- ✅ Confetti para novos recordes
- ✅ Timer com urgência visual
- ✅ Loading states
- ✅ Melhor responsividade mobile

### Acessibilidade
- ✅ Labels ARIA apropriados
- ✅ Navegação por teclado
- ✅ Suporte a prefers-reduced-motion
- ✅ Modo alto contraste
- ✅ Focus visible

### PWA
- ✅ Manifest.json completo
- ✅ Service Worker para cache offline
- ✅ Meta tags SEO
- ✅ Open Graph tags
- ✅ Ícones para todas plataformas

## 📝 Notas de Desenvolvimento

### Configuração
Todas as constantes estão centralizadas em `js/config.js`:
- Vidas iniciais
- Tempo do timer
- Delays de debounce
- Chaves do localStorage
- Definições de conquistas
- Frequências de áudio

### Storage
O módulo `storage.js` fornece wrappers seguros para localStorage com:
- Tratamento de erros
- Suporte a JSON
- Verificação de disponibilidade

### Módulos
Cada módulo é independente e exporta um singleton:
- `audioManager` - Gerencia sons
- `vibrationManager` - Gerencia vibração
- `achievementsManager` - Gerencia conquistas
- `statisticsManager` - Gerencia estatísticas
- `uiManager` - Gerencia UI
- `gameManager` - Orquestra tudo

## 🐛 Debugging

Para debug, abra o console do navegador:
```javascript
// Ver estado do jogo
console.log(gameManager.state);

// Ver estatísticas
console.log(statisticsManager.getStats());

// Ver conquistas
console.log(achievementsManager.getAll());

// Limpar dados
localStorage.clear();
```

## 📱 PWA Installation

O jogo pode ser instalado como aplicativo:
1. Abra no Chrome/Edge/Safari
2. Clique no ícone de instalação na barra de endereço
3. Ou menu → "Instalar aplicativo"

## 🔮 Futuras Melhorias Possíveis

- [ ] Multiplayer online
- [ ] Compartilhamento de resultados
- [ ] Desafio diário
- [ ] Mais categorias (clubes, ligas, etc.)
- [ ] Leaderboard global
- [ ] Mais conquistas
- [ ] Customização de avatares
- [ ] Sistema de níveis
- [ ] Power-ups

## 📄 Licença

Este é um projeto educacional. Os dados dos jogadores são de domínio público.

## 🤝 Contribuindo

Sugestões e melhorias são bem-vindas! Abra uma issue ou pull request.

---

Desenvolvido com ⚽ e ❤️
