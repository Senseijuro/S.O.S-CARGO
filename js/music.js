// ==========================================
// MUSIC.JS - Gestion de la musique de fond
// Autoplay + fallback au moindre contact
// ==========================================

(function() {
  var music = document.getElementById('bg-music');
  if (!music) return;

  music.volume = 0.2;
  var started = false;

  function tryPlay() {
    if (started) return;
    var p = music.play();
    if (p !== undefined) {
      p.then(function() {
        started = true;
        removeListeners();
      }).catch(function() {});
    } else {
      started = true;
      removeListeners();
    }
  }

  // Tous les événements possibles pour déclencher l'audio
  var events = ['click', 'touchstart', 'touchend', 'mousemove', 'mousedown', 'scroll', 'keydown', 'pointerdown', 'pointerup'];

  function onInteraction() {
    tryPlay();
  }

  function addListeners() {
    events.forEach(function(evt) {
      document.addEventListener(evt, onInteraction, { once: true, passive: true });
    });
  }

  function removeListeners() {
    events.forEach(function(evt) {
      document.removeEventListener(evt, onInteraction);
    });
  }

  // 1) Essayer immédiatement
  tryPlay();

  // 2) Si ça n'a pas marché, écouter le moindre contact
  if (!started) {
    addListeners();
  }

  // Bouton toggle musique
  var musicBtn = document.createElement('button');
  musicBtn.id = 'music-toggle';
  musicBtn.innerHTML = '🔊';
  musicBtn.title = 'Couper/Activer la musique';
  musicBtn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; width: 50px; height: 50px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); background: rgba(17,17,20,0.9); color: white; font-size: 1.5rem; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center;';
  document.body.appendChild(musicBtn);

  musicBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    if (music.muted) {
      music.muted = false;
      musicBtn.innerHTML = '🔊';
      musicBtn.style.opacity = '1';
    } else {
      music.muted = true;
      musicBtn.innerHTML = '🔇';
      musicBtn.style.opacity = '0.5';
    }
  });

  musicBtn.addEventListener('mouseenter', function() {
    musicBtn.style.transform = 'scale(1.1)';
    musicBtn.style.borderColor = '#ff007f';
  });
  musicBtn.addEventListener('mouseleave', function() {
    musicBtn.style.transform = 'scale(1)';
    musicBtn.style.borderColor = 'rgba(255,255,255,0.3)';
  });
})();
