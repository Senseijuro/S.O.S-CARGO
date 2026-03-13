// ==========================================
// TUTORIAL.JS — Système de tutoriel modulaire
// Appeler Tutorial.show({...}) depuis n'importe quelle page
// Le jeu reste en pause tant que le joueur n'a pas fermé
// ==========================================

window.Tutorial = (function() {

  // ---- CONFIGURATION PAR DÉFAUT ----
  var defaults = {
    icon: '📖',
    title: 'TUTORIEL',
    subtitle: '',
    description: '',
    steps: [],           // [{icon: '✅', text: 'Explication...'}, ...]
    image: '',           // URL d'image optionnelle
    buttonText: 'J\'AI COMPRIS — COMMENCER !',
    theme: 'pink',       // 'pink' | 'purple' | 'cyan' | 'gold' | 'green'
    warning: '',         // Message d'avertissement optionnel en bas
    onBeforeShow: null,  // Callback avant affichage
    onClose: null        // Callback après fermeture (en plus de la Promise)
  };

  // ---- THÈMES (couleurs) ----
  var themes = {
    pink:   { main: '#ff007f', glow: 'rgba(255,0,127,0.3)',   bg: 'rgba(255,0,127,0.1)',   border: 'rgba(255,0,127,0.4)' },
    purple: { main: '#a855f7', glow: 'rgba(168,85,247,0.3)',  bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.4)' },
    cyan:   { main: '#00d4ff', glow: 'rgba(0,212,255,0.3)',   bg: 'rgba(0,212,255,0.1)',   border: 'rgba(0,212,255,0.4)' },
    gold:   { main: '#ffd700', glow: 'rgba(255,215,0,0.3)',   bg: 'rgba(255,215,0,0.1)',   border: 'rgba(255,215,0,0.4)' },
    green:  { main: '#00ff88', glow: 'rgba(0,255,136,0.3)',   bg: 'rgba(0,255,136,0.1)',   border: 'rgba(0,255,136,0.4)' }
  };

  // ---- FLAG GLOBAL : empêche le timer de démarrer ----
  window._tutorialPending = false;

  // ---- MÉTHODE PRINCIPALE ----
  function show(options) {
    var config = {};
    for (var key in defaults) { config[key] = defaults[key]; }
    for (var key in options) { config[key] = options[key]; }

    var theme = themes[config.theme] || themes.pink;

    // Signaler que le tutoriel est affiché (bloque le timer)
    window._tutorialPending = true;

    // ---- METTRE LE TIMER EN PAUSE ----
    if (window.globalTimer && typeof window.globalTimer.pause === 'function') {
      window.globalTimer.pause();
    }

    if (typeof config.onBeforeShow === 'function') {
      config.onBeforeShow();
    }

    return new Promise(function(resolve) {

      // ---- CONSTRUCTION DU DOM ----
      var overlay = document.createElement('div');
      overlay.className = 'tutorial-overlay';
      overlay.id = 'tutorial-overlay';

      var modal = document.createElement('div');
      modal.className = 'tutorial-modal';
      modal.style.borderColor = theme.border;

      // Glow top
      var glowBar = document.createElement('div');
      glowBar.className = 'tutorial-glow-bar';
      glowBar.style.background = 'linear-gradient(90deg, transparent, ' + theme.main + ', transparent)';
      modal.appendChild(glowBar);

      // Header
      var header = document.createElement('div');
      header.className = 'tutorial-header';

      if (config.subtitle) {
        var subtitleEl = document.createElement('span');
        subtitleEl.className = 'tutorial-subtitle';
        subtitleEl.style.color = theme.main;
        subtitleEl.style.borderColor = theme.border;
        subtitleEl.style.background = theme.bg;
        subtitleEl.textContent = config.subtitle;
        header.appendChild(subtitleEl);
      }

      var iconEl = document.createElement('div');
      iconEl.className = 'tutorial-icon';
      iconEl.textContent = config.icon;
      header.appendChild(iconEl);

      var titleEl = document.createElement('h2');
      titleEl.className = 'tutorial-title';
      titleEl.style.color = theme.main;
      titleEl.textContent = config.title;
      header.appendChild(titleEl);

      if (config.description) {
        var descEl = document.createElement('p');
        descEl.className = 'tutorial-description';
        descEl.textContent = config.description;
        header.appendChild(descEl);
      }

      modal.appendChild(header);

      // Image optionnelle
      if (config.image) {
        var imgContainer = document.createElement('div');
        imgContainer.className = 'tutorial-image';
        var img = document.createElement('img');
        img.src = config.image;
        img.alt = config.title;
        imgContainer.appendChild(img);
        modal.appendChild(imgContainer);
      }

      // Étapes
      if (config.steps.length > 0) {
        var stepsContainer = document.createElement('div');
        stepsContainer.className = 'tutorial-steps';

        config.steps.forEach(function(step, index) {
          var stepEl = document.createElement('div');
          stepEl.className = 'tutorial-step';
          stepEl.style.animationDelay = (0.1 + index * 0.1) + 's';

          var stepIcon = document.createElement('span');
          stepIcon.className = 'tutorial-step-icon';
          stepIcon.textContent = step.icon || ('0' + (index + 1));

          var stepText = document.createElement('span');
          stepText.className = 'tutorial-step-text';
          stepText.innerHTML = step.text; // innerHTML pour permettre du <strong>, <em>

          stepEl.appendChild(stepIcon);
          stepEl.appendChild(stepText);
          stepsContainer.appendChild(stepEl);
        });

        modal.appendChild(stepsContainer);
      }

      // Warning optionnel
      if (config.warning) {
        var warningEl = document.createElement('div');
        warningEl.className = 'tutorial-warning';
        warningEl.innerHTML = '<span class="tutorial-warning-icon">⚠️</span><span>' + config.warning + '</span>';
        modal.appendChild(warningEl);
      }

      // Bouton
      var btnContainer = document.createElement('div');
      btnContainer.className = 'tutorial-btn-container';

      var btn = document.createElement('button');
      btn.className = 'tutorial-btn';
      btn.style.background = 'linear-gradient(135deg, ' + theme.main + ', ' + theme.main + 'cc)';
      btn.style.boxShadow = '0 0 30px ' + theme.glow;
      btn.textContent = config.buttonText;

      btnContainer.appendChild(btn);
      modal.appendChild(btnContainer);

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // Animation d'entrée
      requestAnimationFrame(function() {
        overlay.classList.add('visible');
      });

      // ---- FERMETURE ----
      function closeTutorial() {
        overlay.classList.add('closing');
        window._tutorialPending = false;

        // ---- REPRENDRE LE TIMER ----
        if (window.globalTimer && typeof window.globalTimer.resume === 'function') {
          window.globalTimer.resume();
        }

        setTimeout(function() {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
          if (typeof config.onClose === 'function') {
            config.onClose();
          }
          resolve();
        }, 400);
      }

      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeTutorial();
      });

      // Empêcher la fermeture en cliquant l'overlay (le joueur DOIT lire)
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          // Petit shake du modal pour indiquer qu'il faut cliquer le bouton
          modal.classList.remove('tutorial-shake');
          void modal.offsetWidth;
          modal.classList.add('tutorial-shake');
        }
      });
    });
  }

  // ---- API PUBLIQUE ----
  return {
    show: show
  };

})();
