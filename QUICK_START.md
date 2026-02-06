# 🚀 Quick Start Guide

## Running the Game Locally

### Option 1: Python (Recommended)
```bash
cd /home/engine/project
python3 -m http.server 8000
```
Then open: http://localhost:8000

### Option 2: Node.js
```bash
cd /home/engine/project
npx http-server -p 8000
```
Then open: http://localhost:8000

### Option 3: PHP
```bash
cd /home/engine/project
php -S localhost:8000
```
Then open: http://localhost:8000

## Testing PWA Features

PWA features (Service Worker, installation) require HTTPS or localhost:

1. Run server on localhost (see above)
2. Open browser DevTools (F12)
3. Go to Application/Storage tab
4. Check Service Workers section
5. Look for install prompt in address bar

## Testing the Game

### Basic Flow
1. Open the game
2. Type a player name (min 3 characters)
3. Select from suggestions
4. Click "Escolher"
5. See color-coded feedback
6. Try to guess the correct player!

### Testing All Features

**Game Modes:**
- Toggle between Normal/Difícil (timer appears in difficult)
- Toggle Padrão/Rápido (timer decreases each round)
- Toggle Atuais/Lendas (changes player pool)
- Toggle Claro/Escuro (theme change)

**Audio/Haptics:**
- Enable audio toggle
- Make correct/wrong guesses to hear sounds
- Enable vibration toggle (mobile only)

**Achievements:**
- Click "🏆 Conquistas" to see all achievements
- Play games to unlock them
- See toast notifications on unlock

**Statistics:**
- Click "📊 Estatísticas" to see your stats
- Stats update after each game
- Records tracked by mode

**Other Features:**
- Click "💡 Dica" for hints
- See historical attempts below feedback
- New record triggers confetti

## Debugging

Open browser console (F12) to see:
- Module loading status
- Service Worker registration
- Any errors

### Common Issues

**Module not found:**
- Ensure running via HTTP server (not file://)
- Check browser supports ES6 modules

**Audio not playing:**
- Audio requires user interaction first
- Check audio toggle is enabled
- Check browser console for errors

**Vibration not working:**
- iOS doesn't support Vibration API
- Desktop browsers don't support it
- Only works on Android/mobile Chrome/Firefox

**PWA not installing:**
- Requires HTTPS or localhost
- Check manifest.json is accessible
- Service Worker must register successfully

## Browser Compatibility

**Minimum versions:**
- Chrome 61+ (Sept 2017)
- Firefox 60+ (May 2018)
- Safari 11.1+ (March 2018)
- Edge 79+ (Jan 2020)

**Not supported:**
- Internet Explorer (any version)
- Very old mobile browsers

## File Structure

```
/home/engine/project/
├── index.html           # Main HTML
├── style.css           # Styles
├── manifest.json       # PWA manifest
├── service-worker.js   # Offline support
├── players.json        # Player database
├── js/                # JavaScript modules
│   ├── main.js        # Entry point
│   ├── config.js      # Configuration
│   ├── storage.js     # Storage wrapper
│   ├── utils.js       # Utilities
│   ├── audio.js       # Audio manager
│   ├── vibration.js   # Vibration manager
│   ├── achievements.js # Achievements
│   ├── statistics.js  # Statistics
│   ├── ui.js         # UI manager
│   └── gameManager.js # Game logic
└── icons/            # PWA icons
```

## Next Steps

1. **Play the game** to test all features
2. **Check DevTools** for any errors
3. **Test on mobile** for vibration/PWA install
4. **Review code** in js/ directory
5. **Read** README.md and IMPLEMENTATION_SUMMARY.md

## Verification

Run the verification script:
```bash
cd /home/engine/project
./verify-implementation.sh
```

Should show: ✓ All checks passed! (27/27)

## Production Deployment

For production:
1. Replace placeholder icons with proper PNGs
2. Deploy to HTTPS hosting (Netlify, Vercel, GitHub Pages)
3. Test PWA installation
4. Run Lighthouse audit (target 90+)
5. Test on real mobile devices

---

Enjoy the game! ⚽
