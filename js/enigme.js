document.addEventListener('DOMContentLoaded', function() {
  var state = getGameState();
  var locked = document.getElementById('locked');
  var gameArea = document.getElementById('game-area');
  var resultDiv = document.getElementById('result');
  var leftCol = document.getElementById('rl-left');
  var rightCol = document.getElementById('rl-right');
  var roundEl = document.getElementById('rl-round');
  var correctEl = document.getElementById('rl-correct');
  var errorsEl = document.getElementById('rl-errors');

  // 1. BYPASS
  if (!state.quiz || state.quiz.completed === null) {
    if (locked) locked.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    return;
  }
  if (state.enigma && state.enigma.completed !== null) {
    if (gameArea) gameArea.classList.add('hidden');
    if (locked) locked.classList.add('hidden');
    showResult(state.enigma.completed, state.enigma.score || 0);
    return;
  }
  if (locked) locked.classList.add('hidden');

  // 2. CACHER LE JEU AU DÉMARRAGE
  if (gameArea) gameArea.classList.add('hidden');

  // 3. TUTORIEL
  Tutorial.show({
    icon: '🔗',
    title: 'QUI INTERVIENT ?',
    subtitle: 'ÉPREUVE 3',
    description: 'Chaque situation nécessite un professionnel précis. Relie la bonne personne au bon problème !',
    steps: [
      { icon: '📖', text: 'Lis le contexte ou la problématique dans la colonne de <strong>gauche</strong>.' },
      { icon: '👷', text: 'Trouve le métier correspondant dans la colonne de <strong>droite</strong>.' },
      { icon: '👆', text: 'Clique sur les deux cases pour les relier et valider la paire.' }
    ],
    warning: 'Une erreur de casting et la logistique s\'écroule !',
    buttonText: 'C\'EST PARTI !',
    theme: 'purple'
  }).then(function() {
    if (window.globalTimer) globalTimer.start();
    if (gameArea) gameArea.classList.remove('hidden');
    initGame();
  });

  // 4. LOGIQUE DU JEU
  function initGame() {
    var allSeries = [
      [
        { situation: '📦 Un client commande 200 articles à livrer demain', metier: 'Préparateur de commandes' },
        { situation: '🏗️ Des palettes doivent être déplacées en hauteur dans le rack', metier: 'Cariste' },
        { situation: '🚛 Les colis sont prêts, il faut les amener chez le client', metier: 'Chauffeur-livreur' },
        { situation: '📋 Il manque des produits en rayon, il faut vérifier le stock', metier: 'Magasinier' }
      ],
      [
        { situation: '📊 Les délais de livraison sont trop longs, il faut réorganiser', metier: 'Responsable logistique' },
        { situation: '🔍 Un camion arrive avec 50 cartons, il faut tout vérifier', metier: 'Agent de réception' },
        { situation: '🏷️ Les commandes sont prêtes, il faut les emballer et étiqueter', metier: 'Agent d\'expédition' },
        { situation: '🔧 Le tapis roulant de l\'entrepôt est en panne', metier: 'Technicien de maintenance' }
      ]
    ];

    var currentSeries = 0;
    var totalCorrect = 0;
    var totalErrors = 0;
    var seriesCorrect = 0;
    var selectedLeft = null;

    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    function updateStats() {
      if (roundEl) roundEl.textContent = '🔗 Série ' + (currentSeries + 1) + ' / ' + allSeries.length;
      if (correctEl) correctEl.textContent = '✅ ' + totalCorrect + ' relié';
      if (errorsEl) errorsEl.textContent = '❌ ' + totalErrors + ' erreur(s)';
    }

    function buildSeries() {
      if (currentSeries >= allSeries.length) { endGame(); return; }
      seriesCorrect = 0; selectedLeft = null; updateStats();

      var pairs = allSeries[currentSeries];
      var shuffledLeft = shuffle(pairs);
      var shuffledRight = shuffle(pairs);

      leftCol.innerHTML = '';
      rightCol.innerHTML = '';

      shuffledLeft.forEach(function(pair) {
        var el = document.createElement('div');
        el.className = 'rl-item'; el.textContent = pair.situation;
        el.dataset.id = pair.metier; el.dataset.side = 'left';
        el.addEventListener('click', function() { handleLeftClick(el, pair); });
        leftCol.appendChild(el);
      });

      shuffledRight.forEach(function(pair) {
        var el = document.createElement('div');
        el.className = 'rl-item'; el.textContent = '👷 ' + pair.metier;
        el.dataset.id = pair.metier; el.dataset.side = 'right';
        el.addEventListener('click', function() { handleRightClick(el, pair); });
        rightCol.appendChild(el);
      });
    }

    function handleLeftClick(el, pair) {
      if (el.classList.contains('matched') || el.classList.contains('disabled')) return;
      var prev = leftCol.querySelector('.selected');
      if (prev) prev.classList.remove('selected');
      el.classList.add('selected');
      selectedLeft = { el: el, pair: pair };
    }

    function handleRightClick(el, pair) {
      if (el.classList.contains('matched') || el.classList.contains('disabled') || !selectedLeft) return;
      var leftPair = selectedLeft.pair;
      var leftEl = selectedLeft.el;

      if (leftPair.metier === pair.metier) {
        leftEl.classList.remove('selected'); leftEl.classList.add('matched');
        el.classList.add('matched');
        seriesCorrect++; totalCorrect++; selectedLeft = null; updateStats();

        if (seriesCorrect >= allSeries[currentSeries].length) {
          leftCol.querySelectorAll('.rl-item').forEach(function(i) { i.classList.add('disabled'); });
          rightCol.querySelectorAll('.rl-item').forEach(function(i) { i.classList.add('disabled'); });
          setTimeout(function() { currentSeries++; buildSeries(); }, 800);
        }
      } else {
        totalErrors++;
        el.classList.add('wrong'); leftEl.classList.add('wrong'); updateStats();
        setTimeout(function() {
          el.classList.remove('wrong'); leftEl.classList.remove('wrong');
          leftEl.classList.remove('selected'); selectedLeft = null;
        }, 600);
      }
    }

    function endGame() {
      var success = totalCorrect >= 8 && totalErrors <= 4;
      if (!state.enigma) state.enigma = { completed: null };
      state.enigma.completed = success;
      state.enigma.score = totalCorrect;
      saveGameState(state);
      
      setTimeout(function() {
        if (gameArea) gameArea.classList.add('hidden');
        showResult(success, totalCorrect);
      }, 400);
    }

    updateStats();
    setTimeout(function() { buildSeries(); }, 500);
  }

  // 5. FONCTION SHOWRESULT HORS DE INITGAME
  function showResult(success, score) {
    if (resultDiv) resultDiv.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    if (locked) locked.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    var resultBox = document.getElementById('result-box');
    var resultIcon = document.getElementById('result-icon');
    var resultTitle = document.getElementById('result-title');
    var resultText = document.getElementById('result-text');
    var resultScore = document.getElementById('result-score');
    
    if (resultScore) resultScore.textContent = score + ' / 8 situations reliées';
    
    if (success) {
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
      if (resultTitle) resultTitle.textContent = 'EXPERT LOGISTIQUE !';
      if (resultText) resultText.textContent = 'Tu sais qui fait quoi dans la chaîne logistique. L\'intervenant va pouvoir approfondir avec toi ! Dernier colis débloqué !';
      
    } else {
      if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50]); 
      if (resultBox) {
        resultBox.classList.remove('fail-effect'); 
        void resultBox.offsetWidth; 
        resultBox.classList.add('fail-effect');
      }
      
      if (resultBox) resultBox.classList.add('fail');
      if (resultIcon) resultIcon.textContent = '✗';
      if (resultTitle) resultTitle.textContent = 'CONFUSION DANS LA CHAÎNE';
      if (resultText) resultText.textContent = 'Il fallait tout relier avec max 4 erreurs. Pose tes questions à l\'intervenant ! Colis verrouillé.';
    }
  }
});