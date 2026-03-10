document.addEventListener('DOMContentLoaded', function() {
  var state = getGameState();

  var backBtn = document.getElementById('back-btn');
  var btnReset = document.getElementById('btn-reset');
  var modalSuccess = document.getElementById('modal-success');
  var modalFail = document.getElementById('modal-fail');
  var btnCloseSuccess = document.getElementById('btn-close-success');
  var btnCloseFail = document.getElementById('btn-close-fail');
  var failMessage = document.getElementById('fail-message');

  if (backBtn) {
    backBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'index.html';
    });
  }

  function updateDisplay() {
    var nextZone = document.getElementById('next-zone');
    var nextZoneTitle = document.getElementById('next-zone-title');
    var nextZoneText = document.getElementById('next-zone-text');
    var countSuccess = 0;
    var countCompleted = 0;
    
    // Epreuve 1 : Enigme 1
    var progEnigme1 = document.querySelector('#prog-enigme1 .progress-circle');
    var statusEnigme1 = document.getElementById('status-enigme1');
    var rewardEnigme1 = document.getElementById('reward-enigme1');

    if (state.enigme1 && state.enigme1.completed === true) {
      countSuccess++;
      countCompleted++;
      if (progEnigme1) {
        progEnigme1.classList.add('success');
        progEnigme1.textContent = 'OK';
      }
      if (statusEnigme1) {
        statusEnigme1.textContent = 'Debloque';
        statusEnigme1.classList.add('unlocked');
      }
      if (rewardEnigme1) rewardEnigme1.classList.add('unlocked');
    } else if (state.enigme1 && state.enigme1.completed === false) {
      countCompleted++;
      if (progEnigme1) {
        progEnigme1.classList.add('fail');
        progEnigme1.textContent = 'X';
      }
      if (statusEnigme1) {
        statusEnigme1.textContent = 'Echoue';
        statusEnigme1.classList.add('failed');
      }
    }

    // Epreuve 2 : Quiz
    var progQuiz = document.querySelector('#prog-quiz .progress-circle');
    var statusQuiz = document.getElementById('status-quiz');
    var rewardQuiz = document.getElementById('reward-quiz');

    if (state.quiz && state.quiz.completed === true) {
      countSuccess++;
      countCompleted++;
      if (progQuiz) {
        progQuiz.classList.add('success');
        progQuiz.textContent = 'OK';
      }
      if (statusQuiz) {
        statusQuiz.textContent = 'Debloque';
        statusQuiz.classList.add('unlocked');
      }
      if (rewardQuiz) rewardQuiz.classList.add('unlocked');
    } else if (state.quiz && state.quiz.completed === false) {
      countCompleted++;
      if (progQuiz) {
        progQuiz.classList.add('fail');
        progQuiz.textContent = 'X';
      }
      if (statusQuiz) {
        statusQuiz.textContent = 'Echoue';
        statusQuiz.classList.add('failed');
      }
    }

    // Epreuve 3 : Enigma finale
    var progEnigma = document.querySelector('#prog-enigma .progress-circle');
    var statusEnigma = document.getElementById('status-enigma');
    var rewardEnigma = document.getElementById('reward-enigma');

    if (state.enigma && state.enigma.completed === true) {
      countSuccess++;
      countCompleted++;
      if (progEnigma) {
        progEnigma.classList.add('success');
        progEnigma.textContent = 'OK';
      }
      if (statusEnigma) {
        statusEnigma.textContent = 'Debloque';
        statusEnigma.classList.add('unlocked');
      }
      if (rewardEnigma) rewardEnigma.classList.add('unlocked');
    } else if (state.enigma && state.enigma.completed === false) {
      countCompleted++;
      if (progEnigma) {
        progEnigma.classList.add('fail');
        progEnigma.textContent = 'X';
      }
      if (statusEnigma) {
        statusEnigma.textContent = 'Echoue';
        statusEnigma.classList.add('failed');
      }
    }

    // Afficher le message de zone suivante si toutes les épreuves sont terminées
    if (countCompleted === 3 && nextZone) {
      nextZone.classList.remove('hidden');
      
      // Adapter le message selon le nombre de réussites
      if (countSuccess === 3) {
        nextZone.classList.add('success-zone');
        if (nextZoneTitle) nextZoneTitle.textContent = 'FÉLICITATIONS !';
        if (nextZoneText) nextZoneText.textContent = 'Vous avez débloqué toutes les récompenses !';
      } else if (countSuccess >= 1) {
        nextZone.classList.add('partial-zone');
        if (nextZoneTitle) nextZoneTitle.textContent = 'ÉPREUVES TERMINÉES';
        if (nextZoneText) nextZoneText.textContent = 'Vous avez débloqué ' + countSuccess + '/3 récompenses.';
      } else {
        nextZone.classList.add('fail-zone');
        if (nextZoneTitle) nextZoneTitle.textContent = 'ÉPREUVES TERMINÉES';
        if (nextZoneText) nextZoneText.textContent = 'La mission est échoué, un des votres dois aller en prison';
      }
    }

    // Gérer la musique selon le score
    playMusicByScore(countSuccess, countCompleted);
  }

  function playMusicByScore(successCount, completedCount) {
    var music = document.getElementById('bg-music');
    if (!music || completedCount < 3) return;

    var musicSrc = '';
    
    if (successCount === 3) {
      musicSrc = 'audio/coffre_win.mp3';
    } else if (successCount >= 1) {
      musicSrc = 'audio/coffre_partial.mp3';
    } else {
      musicSrc = 'audio/coffre_fail.mp3';
    }

    // Mettre à jour la source et jouer
    var source = music.querySelector('source');
    if (source) {
      source.src = musicSrc;
      music.load();
      music.volume = 0.3;
      music.play().catch(function() {
        document.addEventListener('click', function startMusic() {
          music.play();
          document.removeEventListener('click', startMusic);
        }, { once: true });
      });
    }
  }

  // Click rewards
  document.querySelectorAll('.reward-card').forEach(function(card) {
    card.addEventListener('click', function() {
      var game = card.dataset.game;
      var gameState = state[game];

      if (gameState && gameState.completed === true) {
        if (modalSuccess) modalSuccess.classList.add('visible');
      } else if (gameState && gameState.completed === false) {
        if (failMessage) {
          failMessage.textContent = "Vous avez echoue a l'epreuve. Cette recompense reste verrouillee.";
        }
        if (modalFail) modalFail.classList.add('visible');
      } else {
        if (failMessage) {
          failMessage.textContent = "Vous devez d'abord completer l'epreuve pour debloquer cette recompense.";
        }
        if (modalFail) modalFail.classList.add('visible');
      }
    });
  });

  if (btnCloseSuccess) {
    btnCloseSuccess.addEventListener('click', function() {
      if (modalSuccess) modalSuccess.classList.remove('visible');
    });
  }

  if (btnCloseFail) {
    btnCloseFail.addEventListener('click', function() {
      if (modalFail) modalFail.classList.remove('visible');
    });
  }

  if (modalSuccess) {
    modalSuccess.addEventListener('click', function(e) {
      if (e.target === modalSuccess) modalSuccess.classList.remove('visible');
    });
  }

  if (modalFail) {
    modalFail.addEventListener('click', function(e) {
      if (e.target === modalFail) modalFail.classList.remove('visible');
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', function() {
      if (confirm('Voulez-vous vraiment recommencer le jeu ?')) {
        resetGameState();
        window.location.href = 'index.html';
      }
    });
  }

  updateDisplay();
});
