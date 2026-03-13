document.addEventListener('DOMContentLoaded', function() {
  var state = getGameState();
  var gameArea = document.getElementById('game-area');
  var resultDiv = document.getElementById('result');
  var grid = document.getElementById('tt-grid');
  var waveEl = document.getElementById('tt-wave');
  var scoreEl = document.getElementById('tt-score');
  var errorsEl = document.getElementById('tt-errors');
  var timerFill = document.getElementById('tt-timer-fill');

  var MAX_ERRORS = 5;

  // 1. BYPASS
  if (state.enigme1 && state.enigme1.completed !== null) {
    if (gameArea) gameArea.classList.add('hidden');
    showResult(state.enigme1.completed, state.enigme1.score || 0, state.enigme1.errors || 0);
    return;
  }

  // 2. CACHER LE JEU AU DÉMARRAGE
  if (gameArea) gameArea.classList.add('hidden');

  // 3. TUTORIEL
  Tutorial.show({
    icon: '🚢',
    title: 'DÉCHARGEMENT DU CARGO',
    subtitle: 'ÉPREUVE 1',
    description: 'Des colis arrivent ! Tape uniquement sur les CONFORMES.',
    steps: [
      { icon: '📦', text: 'Observe attentivement les étiquettes des colis qui apparaissent.' },
      { icon: '🟢', text: 'Tape <strong>uniquement</strong> sur les colis affichés en VERT.' },
      { icon: '🚫', text: 'Ignore les colis bleus ou rouges (avariés, suspects...).' },
      { icon: '⏱️', text: 'Sois rapide, le tapis roulant ne t\'attendra pas !' }
    ],
    warning: 'Attention : 5 erreurs et la cargaison est perdue !',
    buttonText: 'C\'EST PARTI !',
    theme: 'cyan'
  }).then(function() {
    if (window.globalTimer) globalTimer.start();
    if (gameArea) gameArea.classList.remove('hidden');
    initGame();
  });

  // 4. LOGIQUE DU JEU
  function initGame() {
    var products = [
      'Carton alimentaire', 'Palette outillage', 'Lot vêtements',
      'Caisse électronique', 'Fût chimique', 'Sac de ciment',
      'Bobine câble', 'Colis médical', 'Bidon peinture',
      'Container textile', 'Bac réfrigéré', 'Lot papeterie',
      'Caisse jouets', 'Palette bois', 'Carton vaisselle',
      'Fût huile moteur', 'Lot cosmétiques', 'Colis fragile'
    ];

    var states = [
      { label: 'Conforme', type: 'good' },
      { label: 'Non conforme', type: 'bad' },
      { label: 'Avarié', type: 'bad' },
      { label: 'Suspect', type: 'bad' },
      { label: 'À vérifier', type: 'bad' },
      { label: 'Endommagé', type: 'bad' },
      { label: 'Certifié', type: 'good' },
      { label: 'Contrefait', type: 'bad' },
      { label: 'Contrôlé', type: 'good' },
      { label: 'Refusé', type: 'bad' }
    ];

    var WAVE_COUNT = 3;
    var WAVE_DURATION = 14000;
    var currentWave = 0;
    var score = 0;
    var errors = 0;
    var gameOver = false;
    var spawnInterval = null;
    var timerInterval = null;
    var waveStartTime = 0;
    var isPlaying = false;
    var holes = grid.querySelectorAll('.tt-hole');

    function getColorClass(type) {
      if (type === 'good') return 'etat-vert';
      return Math.random() < 0.5 ? 'etat-bleu' : 'etat-rouge';
    }

    function updateStats() {
      if (waveEl) waveEl.textContent = '🌊 Vague ' + (currentWave + 1) + ' / ' + WAVE_COUNT;
      if (scoreEl) scoreEl.textContent = '✅ ' + score + ' pts';
      if (errorsEl) errorsEl.textContent = '❌ ' + errors + ' / ' + MAX_ERRORS;
      if (errorsEl && errors >= MAX_ERRORS - 1) errorsEl.style.animation = 'blink 0.5s infinite';
    }

    function generateColis() {
      var name = products[Math.floor(Math.random() * products.length)];
      var st;
      if (Math.random() < 0.4) {
        var goodStates = states.filter(function(s) { return s.type === 'good'; });
        st = goodStates[Math.floor(Math.random() * goodStates.length)];
      } else {
        var badStates = states.filter(function(s) { return s.type === 'bad'; });
        st = badStates[Math.floor(Math.random() * badStates.length)];
      }
      var color = getColorClass(st.type);
      return { name: name, label: st.label, type: st.type, color: color };
    }

    function getSpawnDelay() {
      var base = 900 - (currentWave * 200);
      return Math.max(350, base + Math.random() * 200);
    }

    function getDisplayTime() {
      return Math.max(700, 1500 - (currentWave * 350));
    }

    function spawnColis() {
      if (!isPlaying || gameOver) return;
      var emptyHoles = [];
      holes.forEach(function(h, i) {
        if (h.classList.contains('empty') && !h.querySelector('.tt-colis')) emptyHoles.push(i);
      });
      if (emptyHoles.length === 0) return;

      var spawnCount = 1;
      if (currentWave === 0 && Math.random() < 0.4) spawnCount = 2;
      else if (currentWave === 1) spawnCount = Math.random() < 0.6 ? 2 : 1;
      else if (currentWave === 2) spawnCount = Math.random() < 0.4 ? 3 : 2;
      spawnCount = Math.min(spawnCount, emptyHoles.length);

      for (var s = 0; s < spawnCount; s++) {
        var rIdx = Math.floor(Math.random() * emptyHoles.length);
        var idx = emptyHoles.splice(rIdx, 1)[0];
        var hole = holes[idx];
        var colis = generateColis();

        var el = document.createElement('div');
        el.className = 'tt-colis';
        el.dataset.type = colis.type;
        el.innerHTML =
          '<span class="tt-colis-emoji">📦</span>' +
          '<span class="tt-colis-name">' + colis.name + '</span>' +
          '<span class="tt-colis-state ' + colis.color + '">' + colis.label + '</span>';

        (function(hole, el, colis) {
          el.addEventListener('click', function(e) {
            e.stopPropagation();
            if (!isPlaying || gameOver) return;
            if (colis.type === 'good') {
              score++;
              hole.classList.remove('empty'); hole.classList.add('hit-good');
            } else {
              errors++;
              score = Math.max(0, score - 1);
              hole.classList.remove('empty'); hole.classList.add('hit-bad');
            }
            updateStats();

            if (errors >= MAX_ERRORS) {
              gameOver = true;
              forceEndGame(false);
              return;
            }

            setTimeout(function() {
              if (el.parentNode) el.parentNode.removeChild(el);
              hole.classList.remove('hit-good', 'hit-bad'); hole.classList.add('empty');
            }, 300);
          });
        })(hole, el, colis);

        hole.appendChild(el);

        (function(hole, el) {
          var displayTime = getDisplayTime();
          setTimeout(function() {
            if (el.parentNode === hole) {
              el.style.animation = 'tt-pop-out 0.2s ease forwards';
              setTimeout(function() {
                if (el.parentNode) el.parentNode.removeChild(el);
                hole.classList.remove('hit-good', 'hit-bad'); hole.classList.add('empty');
              }, 200);
            }
          }, displayTime);
        })(hole, el);
      }
    }

    function startWave() {
      if (currentWave >= WAVE_COUNT || gameOver) { if (!gameOver) endGame(); return; }
      isPlaying = true; updateStats(); waveStartTime = Date.now();
      if (timerFill) { timerFill.style.width = '100%'; timerFill.classList.remove('danger'); }

      timerInterval = setInterval(function() {
        var elapsed = Date.now() - waveStartTime;
        var pct = Math.max(0, 100 - (elapsed / WAVE_DURATION * 100));
        if (timerFill) {
          timerFill.style.width = pct + '%';
          if (pct < 25) timerFill.classList.add('danger'); else timerFill.classList.remove('danger');
        }
        if (elapsed >= WAVE_DURATION) endWave();
      }, 50);

      function scheduleSpawn() {
        if (!isPlaying || gameOver) return;
        spawnColis();
        spawnInterval = setTimeout(scheduleSpawn, getSpawnDelay());
      }
      scheduleSpawn();
    }

    function endWave() {
      isPlaying = false;
      if (spawnInterval) { clearTimeout(spawnInterval); spawnInterval = null; }
      if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
      holes.forEach(function(h) {
        var m = h.querySelector('.tt-colis');
        if (m && m.parentNode) m.parentNode.removeChild(m);
        h.className = 'tt-hole empty';
      });
      currentWave++;
      if (currentWave >= WAVE_COUNT || gameOver) endGame();
      else setTimeout(function() { startWave(); }, 1000);
    }

    function forceEndGame(success) {
      isPlaying = false;
      if (spawnInterval) { clearTimeout(spawnInterval); spawnInterval = null; }
      if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
      holes.forEach(function(h) {
        var m = h.querySelector('.tt-colis');
        if (m && m.parentNode) m.parentNode.removeChild(m);
        h.className = 'tt-hole empty';
      });
      if (!state.enigme1) state.enigme1 = { completed: null };
      state.enigme1.completed = success;
      state.enigme1.score = score;
      state.enigme1.errors = errors;
      saveGameState(state);
      setTimeout(function() {
        if (gameArea) gameArea.classList.add('hidden');
        showResult(success, score, errors);
      }, 400);
    }

    function endGame() {
      var success = score >= 8 && errors < MAX_ERRORS;
      if (!state.enigme1) state.enigme1 = { completed: null };
      state.enigme1.completed = success;
      state.enigme1.score = score;
      state.enigme1.errors = errors;
      saveGameState(state);
      setTimeout(function() {
        if (gameArea) gameArea.classList.add('hidden');
        showResult(success, score, errors);
      }, 400);
    }

    updateStats();
    setTimeout(function() { startWave(); }, 1000);
  }

  // 5. FONCTION SHOWRESULT HORS DE INITGAME
  function showResult(success, finalScore, errorsCount) {
    if (resultDiv) resultDiv.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    var resultBox = document.getElementById('result-box');
    var resultIcon = document.getElementById('result-icon');
    var resultTitle = document.getElementById('result-title');
    var resultText = document.getElementById('result-text');
    var resultScore = document.getElementById('result-score');
    
    if (resultScore) resultScore.textContent = finalScore + ' pts — ' + errorsCount + ' erreurs';
    
    if (errorsCount >= 5) {
      if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50]); 
      if (resultBox) { resultBox.classList.remove('fail-effect'); void resultBox.offsetWidth; resultBox.classList.add('fail-effect'); }
      if (resultBox) resultBox.classList.add('fail');
      if (resultIcon) resultIcon.textContent = '✗';
      if (resultTitle) resultTitle.textContent = 'TROP D\'ERREURS !';
      if (resultText) resultText.textContent = '5 colis avariés acceptés — la cargaison est contaminée. Colis verrouillé.';
    } else if (success) {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
      if (window.confetti) {
        confetti({ 
          particleCount: 150, spread: 80, origin: { y: 0.6 },
          colors: ['#ff007f', '#00d4ff', '#ffd700', '#a855f7'], 
          disableForReducedMotion: true
        });
      }
      if (resultBox) resultBox.classList.add('success');
      if (resultIcon) resultIcon.textContent = '✓';
      if (resultTitle) resultTitle.textContent = 'CARGO DÉCHARGÉ !';
      if (resultText) resultText.textContent = 'Tu sais trier la marchandise comme un pro du quai. Colis débloqué !';
    } else {
      if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50]); 
      if (resultBox) { resultBox.classList.remove('fail-effect'); void resultBox.offsetWidth; resultBox.classList.add('fail-effect'); }
      if (resultBox) resultBox.classList.add('fail');
      if (resultIcon) resultIcon.textContent = '✗';
      if (resultTitle) resultTitle.textContent = 'CARGAISON MAL TRIÉE';
      if (resultText) resultText.textContent = 'Il fallait au moins 8 points avec moins de 5 erreurs. Colis verrouillé.';
    }
  }
});