document.addEventListener('DOMContentLoaded', function() {
  var state = getGameState();
  var locked = document.getElementById('locked');
  var gameArea = document.getElementById('game-area');
  var resultDiv = document.getElementById('result');
  var scene = document.getElementById('ct-scene');
  var roundEl = document.getElementById('ct-round');
  var foundEl = document.getElementById('ct-found');
  var missedEl = document.getElementById('ct-missed');
  var targetNameEl = document.getElementById('ct-target-name');
  var targetEmojiEl = document.getElementById('ct-target-emoji');
  var targetLabelEl = document.getElementById('ct-target-label');
  var timerFill = document.getElementById('ct-round-timer-fill');
  var shuffleWarn = document.getElementById('ct-shuffle-warn');

  var MAX_ERRORS = 6;

  // 1. BYPASS
  if (!state.enigme1 || state.enigme1.completed === null) {
    if (locked) locked.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    return;
  }
  if (state.quiz && state.quiz.completed !== null) {
    if (gameArea) gameArea.classList.add('hidden');
    if (locked) locked.classList.add('hidden');
    showResult(state.quiz.completed, state.quiz.score || 0, state.quiz.errors || 0, state.quiz.roundsWon || 0);
    return;
  }
  if (locked) locked.classList.add('hidden');

  // 2. CACHER LE JEU AU DÉMARRAGE
  if (gameArea) gameArea.classList.add('hidden');

  // 3. TUTORIEL
  Tutorial.show({
    icon: '🔍',
    title: 'INVENTAIRE EXPRESS',
    subtitle: 'ÉPREUVE 2',
    description: 'Le stock bouge ! Repère le matériel avant qu\'il ne se mélange.',
    steps: [
      { icon: '🎯', text: 'Vérifie l\'objet ciblé dans la barre supérieure.' },
      { icon: '👆', text: 'Clique sur tous les objets identiques dans la grille.' },
      { icon: '🔀', text: 'Dépêche-toi, la grille va <strong>se mélanger</strong> régulièrement !' }
    ],
    warning: 'Concentre-toi : 6 erreurs et l\'inventaire est faussé !',
    buttonText: 'C\'EST PARTI !',
    theme: 'pink'
  }).then(function() {
    if (window.globalTimer) globalTimer.start();
    if (gameArea) gameArea.classList.remove('hidden');
    initGame();
  });

  // 4. LOGIQUE DU JEU
  function initGame() {
    var GRID_SIZE = 30; // 6x5

    var rounds = [
      {
        name: 'gilets de sécurité', target: '🦺', targetCount: 5, timer: 10000, shuffleInterval: 3500,
        distractors: ['🧥', '👔', '👕', '🧣', '🧤', '👗', '🥼', '👚', '👛', '👜', '🎒', '🧳', '👒', '🎩', '🧢', '💼', '👞', '👟', '🥾', '🥿', '👠', '👡', '👢', '🩴', '🩱']
      },
      {
        name: 'talkies-walkies', target: '📻', targetCount: 5, timer: 9000, shuffleInterval: 3000,
        distractors: ['📱', '📲', '☎️', '📞', '📟', '📠', '🔋', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '💽', '💾', '📷', '📸', '📹', '🎙️', '🎚️', '📺', '📡', '🔦', '🕯️', '🔌', '💿']
      },
      {
        name: 'extincteurs', target: '🧯', targetCount: 6, timer: 10000, shuffleInterval: 2500,
        distractors: ['🧲', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪓', '🪚', '🔩', '⚙️', '🗜️', '🪝', '🧪', '🔬', '💊', '🩹', '🩺', '🪠', '🪤', '🧹', '🧻', '🧴', '🧽', '🪒']
      }
    ];

    var currentRound = 0;
    var totalFound = 0;
    var totalErrors = 0; 
    var roundsWon = 0;
    var roundFound = 0;
    var gameOver = false;
    var roundTimerInterval = null;
    var shuffleTimerInterval = null;

    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    function updateStats() {
      if (roundEl) roundEl.textContent = '🔍 Manche ' + (currentRound + 1) + ' / ' + rounds.length;
      if (foundEl) foundEl.textContent = '✅ ' + totalFound + ' trouvé';
      if (missedEl) missedEl.textContent = '❌ ' + totalErrors + ' / ' + MAX_ERRORS;
      if (missedEl && totalErrors >= MAX_ERRORS - 1) missedEl.style.animation = 'blink 0.5s infinite';
    }

    function updateTargetBar() {
      var round = rounds[currentRound];
      var remaining = round.targetCount - roundFound;
      if (targetEmojiEl) targetEmojiEl.textContent = round.target;
      if (targetLabelEl) targetLabelEl.textContent = '— ' + remaining + ' restant(s)';
      if (targetNameEl) targetNameEl.textContent = round.name;
    }

    function clearTimers() {
      if (roundTimerInterval) { clearInterval(roundTimerInterval); roundTimerInterval = null; }
      if (shuffleTimerInterval) { clearInterval(shuffleTimerInterval); shuffleTimerInterval = null; }
    }

    function shuffleGrid() {
      if (gameOver) return;
      var cells = scene.querySelectorAll('.ct-cell');
      var freeIndices = [];
      var freeContents = [];
      cells.forEach(function(c, i) {
        if (!c.classList.contains('found')) {
          freeIndices.push(i);
          freeContents.push({ emoji: c.textContent, target: c.dataset.target });
        }
      });
      if (shuffleWarn) shuffleWarn.textContent = '🔀 MÉLANGE !';
      cells.forEach(function(c) { if (!c.classList.contains('found')) c.classList.add('shuffling'); });
      freeContents = shuffle(freeContents);
      setTimeout(function() {
        freeIndices.forEach(function(idx, i) {
          var cell = cells[idx];
          cell.textContent = freeContents[i].emoji;
          cell.dataset.target = freeContents[i].target;
          cell.classList.remove('shuffling');
        });
        if (shuffleWarn) setTimeout(function() { shuffleWarn.textContent = ''; }, 500);
      }, 250);
    }

    function buildScene() {
      if (currentRound >= rounds.length || gameOver) {
        if (!gameOver) endGame();
        return;
      }
      clearTimers();
      var round = rounds[currentRound];
      roundFound = 0;
      updateStats(); updateTargetBar();

      var cells = [];
      for (var i = 0; i < round.targetCount; i++) cells.push({ emoji: round.target, isTarget: true });
      var distractors = shuffle(round.distractors);
      var needed = GRID_SIZE - round.targetCount;
      for (var i = 0; i < needed; i++) cells.push({ emoji: distractors[i % distractors.length], isTarget: false });
      cells = shuffle(cells);

      scene.innerHTML = '';
      cells.forEach(function(cell) {
        var el = document.createElement('div');
        el.className = 'ct-cell'; el.textContent = cell.emoji;
        el.dataset.target = cell.isTarget ? 'true' : 'false';
        el.addEventListener('click', function() { handleCellClick(el); });
        scene.appendChild(el);
      });

      var roundStart = Date.now();
      if (timerFill) { timerFill.style.width = '100%'; timerFill.classList.remove('danger'); }
      roundTimerInterval = setInterval(function() {
        if (gameOver) { clearTimers(); return; }
        var elapsed = Date.now() - roundStart;
        var pct = Math.max(0, 100 - (elapsed / round.timer * 100));
        if (timerFill) {
          timerFill.style.width = pct + '%';
          if (pct < 25) timerFill.classList.add('danger'); else timerFill.classList.remove('danger');
        }
        if (elapsed >= round.timer) {
          clearTimers();
          scene.querySelectorAll('.ct-cell').forEach(function(c) {
            c.classList.add('disabled');
            if (c.dataset.target === 'true' && !c.classList.contains('found')) c.classList.add('reveal');
          });
          setTimeout(function() { currentRound++; buildScene(); }, 1000);
        }
      }, 50);

      shuffleTimerInterval = setInterval(function() { shuffleGrid(); }, round.shuffleInterval);
    }

    function handleCellClick(el) {
      if (el.classList.contains('found') || el.classList.contains('wrong') || el.classList.contains('disabled') || el.classList.contains('shuffling') || gameOver) return;

      if (el.dataset.target === 'true') {
        el.classList.add('found'); roundFound++; totalFound++;
        updateStats(); updateTargetBar();
        if (roundFound >= rounds[currentRound].targetCount) {
          roundsWon++; clearTimers();
          scene.querySelectorAll('.ct-cell').forEach(function(c) { c.classList.add('disabled'); });
          setTimeout(function() { currentRound++; buildScene(); }, 700);
        }
      } else {
        el.classList.add('wrong'); totalErrors++; updateStats();
        setTimeout(function() { el.classList.remove('wrong'); el.classList.add('disabled'); }, 400);

        if (totalErrors >= MAX_ERRORS) {
          gameOver = true; clearTimers();
          forceEnd(false);
        }
      }
    }

    function forceEnd(success) {
      clearTimers();
      if (!state.quiz) state.quiz = { completed: null, score: 0 };
      state.quiz.completed = success;
      state.quiz.score = totalFound;
      state.quiz.errors = totalErrors;
      state.quiz.roundsWon = roundsWon;
      saveGameState(state);
      setTimeout(function() {
        if (gameArea) gameArea.classList.add('hidden');
        showResult(success, totalFound, totalErrors, roundsWon);
      }, 400);
    }

    function endGame() {
      clearTimers();
      var success = roundsWon >= 2 && totalErrors < MAX_ERRORS;
      if (!state.quiz) state.quiz = { completed: null, score: 0 };
      state.quiz.completed = success;
      state.quiz.score = totalFound;
      state.quiz.errors = totalErrors;
      state.quiz.roundsWon = roundsWon;
      saveGameState(state);
      setTimeout(function() {
        if (gameArea) gameArea.classList.add('hidden');
        showResult(success, totalFound, totalErrors, roundsWon);
      }, 400);
    }

    updateStats();
    setTimeout(function() { buildScene(); }, 800);
  }

  // 5. FONCTION SHOWRESULT HORS DE INITGAME
  function showResult(success, score, errorsCount, roundsWonCount) {
    if (resultDiv) resultDiv.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    if (locked) locked.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    var resultBox = document.getElementById('result-box');
    var resultIcon = document.getElementById('result-icon');
    var resultTitle = document.getElementById('result-title');
    var resultText = document.getElementById('result-text');
    var resultScore = document.getElementById('result-score');
    
    if (resultScore) resultScore.textContent = roundsWonCount + '/3 manches — ' + errorsCount + ' erreurs';
    
    if (errorsCount >= 6) {
      if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50]); 
      if (resultBox) { resultBox.classList.remove('fail-effect'); void resultBox.offsetWidth; resultBox.classList.add('fail-effect'); }
      if (resultBox) resultBox.classList.add('fail');
      if (resultIcon) resultIcon.textContent = '✗';
      if (resultTitle) resultTitle.textContent = 'TROP D\'ERREURS D\'INVENTAIRE !';
      if (resultText) resultText.textContent = '6 mauvais articles scannés — l\'inventaire est faussé. Colis verrouillé.';
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
      if (resultTitle) resultTitle.textContent = 'INVENTAIRE BOUCLÉ !';
      if (resultText) resultText.textContent = 'Tu repères le matériel même dans le chaos. Colis débloqué !';
    } else {
      if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50]); 
      if (resultBox) { resultBox.classList.remove('fail-effect'); void resultBox.offsetWidth; resultBox.classList.add('fail-effect'); }
      if (resultBox) resultBox.classList.add('fail');
      if (resultIcon) resultIcon.textContent = '✗';
      if (resultTitle) resultTitle.textContent = 'INVENTAIRE INCOMPLET';
      if (resultText) resultText.textContent = 'Il fallait réussir au moins 2 manches sur 3. Colis verrouillé.';
    }
  }
});