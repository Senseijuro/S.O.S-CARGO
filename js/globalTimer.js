// ==========================================
// GLOBAL TIMER - Partagé entre toutes les pages
// Se lance quand on entre dans un jeu
// Persiste via localStorage timestamp
// ==========================================

(function() {
  var TIMER_DURATION = 120; // 2 minutes
  var timerInterval = null;
  var hasExpired = false;

  function isTimerStarted() {
    return !!localStorage.getItem(TIMER_KEY);
  }

  function startTimer() {
    if (!isTimerStarted()) {
      localStorage.setItem(TIMER_KEY, Date.now().toString());
    }
  }

  function getTimeRemaining() {
    var start = localStorage.getItem(TIMER_KEY);
    if (!start) return TIMER_DURATION;
    var elapsed = Math.floor((Date.now() - parseInt(start)) / 1000);
    return Math.max(0, TIMER_DURATION - elapsed);
  }

  function fmtTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0');
  }

  // Injecte la barre timer dans le DOM
  function createTimerBar() {
    var bar = document.createElement('div');
    bar.id = 'global-timer-bar';
    bar.className = 'global-timer-bar';
    bar.innerHTML =
      '<div class="global-timer-inner">' +
        '<div class="global-timer-left">' +
          '<span class="global-timer-icon">⏱️</span>' +
          '<span class="global-timer-label" id="gt-label">EN ATTENTE</span>' +
        '</div>' +
        '<span class="global-timer-display" id="gt-display">02:00</span>' +
        '<div class="global-timer-progress">' +
          '<div class="global-timer-fill" id="gt-fill"></div>' +
        '</div>' +
      '</div>';

    var header = document.querySelector('.header');
    if (header && header.nextSibling) {
      header.parentNode.insertBefore(bar, header.nextSibling);
    } else {
      document.body.prepend(bar);
    }
  }

  // Quand le timer expire : échouer tous les jeux non terminés
  function onTimerExpired() {
    if (hasExpired) return;
    hasExpired = true;

    if (typeof getGameState === 'function') {
      var state = getGameState();
      var changed = false;

      if (!state.enigme1 || state.enigme1.completed === null) {
        state.enigme1 = { completed: false };
        changed = true;
      }
      if (!state.quiz || state.quiz.completed === null) {
        state.quiz = { completed: false, score: 0 };
        changed = true;
      }
      if (!state.enigma || state.enigma.completed === null) {
        state.enigma = { completed: false };
        changed = true;
      }
      if (changed) saveGameState(state);
    }

    var display = document.getElementById('gt-display');
    var label = document.getElementById('gt-label');
    var bar = document.getElementById('global-timer-bar');
    var fill = document.getElementById('gt-fill');

    if (display) display.textContent = '00:00';
    if (label) label.textContent = 'TEMPS ÉCOULÉ';
    if (fill) fill.style.width = '0%';
    if (bar) {
      bar.classList.add('expired');
      bar.classList.remove('danger', 'warning-state', 'waiting');
    }

    // Rediriger vers le coffre (sauf si déjà sur coffre ou équipe)
    var filename = window.location.pathname.split('/').pop() || '';
    if (filename.indexOf('coffre') === -1 && filename.indexOf('equipe') === -1) {
      setTimeout(function() {
        window.location.href = 'coffre.html';
      }, 2000);
    }
  }

  function updateDisplay() {
    var display = document.getElementById('gt-display');
    var fill = document.getElementById('gt-fill');
    var bar = document.getElementById('global-timer-bar');
    var label = document.getElementById('gt-label');

    // Si toutes les épreuves sont terminées, figer le timer
    if (typeof allGamesCompleted === 'function' && allGamesCompleted()) {
      if (bar) {
        bar.classList.add('completed');
        bar.classList.remove('danger', 'warning-state', 'waiting');
      }
      if (label) label.textContent = 'TERMINÉ';
      var rem = getTimeRemaining();
      if (display) display.textContent = fmtTime(rem);
      if (fill) fill.style.width = ((rem / TIMER_DURATION) * 100) + '%';
      if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
      return;
    }

    // Timer pas encore lancé
    if (!isTimerStarted()) {
      if (display) display.textContent = fmtTime(TIMER_DURATION);
      if (fill) fill.style.width = '100%';
      if (label) label.textContent = 'EN ATTENTE';
      if (bar) bar.classList.add('waiting');
      return;
    }

    if (bar) bar.classList.remove('waiting');
    if (label) label.textContent = 'TEMPS RESTANT';

    var remaining = getTimeRemaining();
    if (display) display.textContent = fmtTime(remaining);
    if (fill) fill.style.width = ((remaining / TIMER_DURATION) * 100) + '%';

    // Changement de couleur
    if (remaining <= 30 && bar) {
      bar.classList.add('danger');
      bar.classList.remove('warning-state');
    } else if (remaining <= 60 && bar) {
      bar.classList.add('warning-state');
      bar.classList.remove('danger');
    }

    if (remaining <= 0) {
      onTimerExpired();
    }
  }

  // Détection page jeu
  var filename = (window.location.pathname.split('/').pop() || '').toLowerCase();
  var isGamePage = filename === 'enigme1.html' ||
                   filename === 'quiz.html' ||
                   filename === 'enigme.html';

  document.addEventListener('DOMContentLoaded', function() {
    // Lancer le timer automatiquement sur les pages de jeu
    if (isGamePage && typeof allGamesCompleted === 'function' && !allGamesCompleted()) {
      startTimer();
    }

    // Si le timer a déjà expiré au chargement
    if (isTimerStarted() && getTimeRemaining() <= 0) {
      if (typeof allGamesCompleted === 'function' && !allGamesCompleted()) {
        createTimerBar();
        onTimerExpired();
        return;
      }
    }

    createTimerBar();
    updateDisplay();
    timerInterval = setInterval(updateDisplay, 500);
  });

  // API globale
  window.globalTimer = {
    start: startTimer,
    getTimeRemaining: getTimeRemaining,
    isStarted: isTimerStarted,
    DURATION: TIMER_DURATION
  };
})();
