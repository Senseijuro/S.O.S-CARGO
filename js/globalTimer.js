// ==========================================
// GLOBAL TIMER - Partagé entre toutes les pages
// Se lance quand on entre dans un jeu
// Persiste via localStorage timestamp
// ==========================================
// MODIFIÉ : Ne démarre plus automatiquement sur les pages de jeu.
//           Attend que le tutoriel soit fermé (window._tutorialPending).
//           Chaque jeu appelle globalTimer.start() après le tutoriel.
// ==========================================

(function() {
  // 1. FALLBACK TIMER_KEY
  var SAFE_TIMER_KEY = (typeof TIMER_KEY !== 'undefined') ? TIMER_KEY : 'globalTimerStart';

  var TIMER_DURATION = 120; // 2 minutes
  var timerInterval = null;
  var hasExpired = false;
  var isPaused = false;
  var pauseStartedAt = null; // timestamp du moment où on a mis en pause

  function isTimerStarted() {
    return !!localStorage.getItem(SAFE_TIMER_KEY);
  }

  function startTimer() {
    if (!isTimerStarted()) {
      localStorage.setItem(SAFE_TIMER_KEY, Date.now().toString());
    }
    isPaused = false;
    pauseStartedAt = null;
  }

  // ==========================================
  // PAUSE / RESUME
  // Décale le startTime dans le localStorage
  // pour "effacer" le temps passé en pause.
  // ==========================================
  function pauseTimer() {
    if (!isTimerStarted() || isPaused) return;
    isPaused = true;
    pauseStartedAt = Date.now();
  }

  function resumeTimer() {
    if (!isPaused || !pauseStartedAt) return;
    // Combien de temps on est resté en pause ?
    var pausedMs = Date.now() - pauseStartedAt;
    // Décaler le startTime vers le futur de cette durée
    var start = parseInt(localStorage.getItem(SAFE_TIMER_KEY));
    if (start) {
      localStorage.setItem(SAFE_TIMER_KEY, (start + pausedMs).toString());
    }
    isPaused = false;
    pauseStartedAt = null;
  }

  function getTimeRemaining() {
    var start = localStorage.getItem(SAFE_TIMER_KEY);
    if (!start) return TIMER_DURATION;
    // Si en pause, calculer depuis le moment de la pause (pas maintenant)
    var now = isPaused && pauseStartedAt ? pauseStartedAt : Date.now();
    var elapsed = Math.floor((now - parseInt(start)) / 1000);
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
      '<div class="gt-hud">' +
        '<div class="gt-corner gt-corner-tl"></div>' +
        '<div class="gt-corner gt-corner-tr"></div>' +
        '<div class="gt-corner gt-corner-bl"></div>' +
        '<div class="gt-corner gt-corner-br"></div>' +
        '<div class="gt-scanline"></div>' +
        '<div class="gt-row">' +
          '<div class="gt-block gt-block-status">' +
            '<span class="gt-pip"></span>' +
            '<span class="global-timer-label" id="gt-label">EN ATTENTE</span>' +
          '</div>' +
          '<div class="gt-block gt-block-time">' +
            '<span class="gt-time-icon">⏱</span>' +
            '<span class="global-timer-display" id="gt-display">02:00</span>' +
          '</div>' +
          '<div class="gt-block gt-block-bar">' +
            '<div class="global-timer-progress">' +
              '<div class="global-timer-fill" id="gt-fill"></div>' +
            '</div>' +
          '</div>' +
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

    var currentPath = window.location.pathname.toLowerCase();
    if (currentPath.indexOf('coffre') === -1 && currentPath.indexOf('equipe') === -1) {
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

    // ---- ÉTAT PAUSE : figer l'affichage, ne pas expirer ----
    if (isPaused) {
      if (label) label.textContent = '⏸ EN PAUSE';
      var remaining = getTimeRemaining();
      if (display) display.textContent = fmtTime(remaining);
      if (fill) fill.style.width = ((remaining / TIMER_DURATION) * 100) + '%';
      if (bar) {
        bar.classList.remove('danger', 'warning-state');
        bar.classList.add('waiting');
      }
      return; // Ne rien faire d'autre tant qu'on est en pause
    }

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

  // ==========================================
  // DÉTECTION PAGE JEU COMPATIBLE NETLIFY
  // ==========================================
  var path = window.location.pathname.toLowerCase();
  if (path.endsWith('/')) { path = path.slice(0, -1); }
  var filename = path.split('/').pop().replace('.html', '');

  var isGamePage = filename === 'enigme1' ||
                   filename === 'quiz' ||
                   filename === 'enigme';

  document.addEventListener('DOMContentLoaded', function() {

    // ==========================================
    // CHANGEMENT CLÉ : Ne plus auto-démarrer le timer.
    // Le timer sera démarré par chaque jeu APRÈS le tutoriel.
    // On ne fait l'auto-start QUE si le timer tourne déjà
    // (le joueur revient sur une page de jeu en cours de partie).
    // ==========================================
    if (isGamePage && typeof allGamesCompleted === 'function' && !allGamesCompleted()) {
      // Le timer tourne déjà → ne pas bloquer (le joueur a déjà vu le tuto)
      // Le timer ne tourne pas encore → on ne démarre PAS (le tuto s'en charge)
      if (isTimerStarted()) {
        // Timer déjà en cours, on ne fait rien de spécial
      }
      // Si pas encore démarré, on attend que le jeu appelle globalTimer.start()
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
    pause: pauseTimer,
    resume: resumeTimer,
    getTimeRemaining: getTimeRemaining,
    isStarted: isTimerStarted,
    DURATION: TIMER_DURATION
  };
})();
