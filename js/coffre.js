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
    backBtn.addEventListener('click', function(e) { e.preventDefault(); window.location.href = 'index.html'; });
  }

  function updateDisplay() {
    var nextZone = document.getElementById('next-zone');
    var nextZoneTitle = document.getElementById('next-zone-title');
    var nextZoneText = document.getElementById('next-zone-text');
    var countSuccess = 0; var countCompleted = 0;

    var progEnigme1 = document.querySelector('#prog-enigme1 .progress-circle');
    var statusEnigme1 = document.getElementById('status-enigme1');
    var rewardEnigme1 = document.getElementById('reward-enigme1');
    if (state.enigme1 && state.enigme1.completed === true) {
      countSuccess++; countCompleted++;
      if (progEnigme1) { progEnigme1.classList.add('success'); progEnigme1.textContent = 'OK'; }
      if (statusEnigme1) { statusEnigme1.textContent = 'Débloqué'; statusEnigme1.classList.add('unlocked'); }
      if (rewardEnigme1) rewardEnigme1.classList.add('unlocked');
    } else if (state.enigme1 && state.enigme1.completed === false) {
      countCompleted++;
      if (progEnigme1) { progEnigme1.classList.add('fail'); progEnigme1.textContent = 'X'; }
      if (statusEnigme1) { statusEnigme1.textContent = 'Échoué'; statusEnigme1.classList.add('failed'); }
    }

    var progQuiz = document.querySelector('#prog-quiz .progress-circle');
    var statusQuiz = document.getElementById('status-quiz');
    var rewardQuiz = document.getElementById('reward-quiz');
    if (state.quiz && state.quiz.completed === true) {
      countSuccess++; countCompleted++;
      if (progQuiz) { progQuiz.classList.add('success'); progQuiz.textContent = 'OK'; }
      if (statusQuiz) { statusQuiz.textContent = 'Débloqué'; statusQuiz.classList.add('unlocked'); }
      if (rewardQuiz) rewardQuiz.classList.add('unlocked');
    } else if (state.quiz && state.quiz.completed === false) {
      countCompleted++;
      if (progQuiz) { progQuiz.classList.add('fail'); progQuiz.textContent = 'X'; }
      if (statusQuiz) { statusQuiz.textContent = 'Échoué'; statusQuiz.classList.add('failed'); }
    }

    var progEnigma = document.querySelector('#prog-enigma .progress-circle');
    var statusEnigma = document.getElementById('status-enigma');
    var rewardEnigma = document.getElementById('reward-enigma');
    if (state.enigma && state.enigma.completed === true) {
      countSuccess++; countCompleted++;
      if (progEnigma) { progEnigma.classList.add('success'); progEnigma.textContent = 'OK'; }
      if (statusEnigma) { statusEnigma.textContent = 'Débloqué'; statusEnigma.classList.add('unlocked'); }
      if (rewardEnigma) rewardEnigma.classList.add('unlocked');
    } else if (state.enigma && state.enigma.completed === false) {
      countCompleted++;
      if (progEnigma) { progEnigma.classList.add('fail'); progEnigma.textContent = 'X'; }
      if (statusEnigma) { statusEnigma.textContent = 'Échoué'; statusEnigma.classList.add('failed'); }
    }

    if (countCompleted === 3 && nextZone) {
      nextZone.classList.remove('hidden');
      if (countSuccess === 3) {
        nextZone.classList.add('success-zone');
        if (nextZoneTitle) nextZoneTitle.textContent = 'FÉLICITATIONS !';
        if (nextZoneText) nextZoneText.textContent = 'Toute la cargaison est sauvée ! Échange maintenant avec l\'intervenant !';
      } else if (countSuccess >= 1) {
        nextZone.classList.add('partial-zone');
        if (nextZoneTitle) nextZoneTitle.textContent = 'ÉPREUVES TERMINÉES';
        if (nextZoneText) nextZoneText.textContent = 'Vous avez récupéré ' + countSuccess + '/3 colis. L\'intervenant peut vous aider à comprendre le reste !';
      } else {
        nextZone.classList.add('fail-zone');
        if (nextZoneTitle) nextZoneTitle.textContent = 'ÉPREUVES TERMINÉES';
        if (nextZoneText) nextZoneText.textContent = 'La cargaison est perdue… un des vôtres doit aller en prison.';
      }
    }
    playMusicByScore(countSuccess, countCompleted);
  }

  function playMusicByScore(successCount, completedCount) {
    var music = document.getElementById('bg-music');
    if (!music || completedCount < 3) return;
    var musicSrc = '';
    if (successCount === 3) musicSrc = 'coffre_win.mp3';
    else if (successCount >= 1) musicSrc = 'coffre_partial.mp3';
    else musicSrc = 'coffre_fail.mp3';
    var source = music.querySelector('source');
    if (source) {
      source.src = musicSrc; music.load(); music.volume = 0.3;
      music.play().catch(function() {
        document.addEventListener('click', function startMusic() {
          music.play(); document.removeEventListener('click', startMusic);
        }, { once: true });
      });
    }
  }

  document.querySelectorAll('.reward-card').forEach(function(card) {
    card.addEventListener('click', function() {
      var game = card.dataset.game;
      var gameState = state[game];
      if (gameState && gameState.completed === true) {
        if (modalSuccess) modalSuccess.classList.add('visible');
      } else if (gameState && gameState.completed === false) {
        if (failMessage) failMessage.textContent = "Vous avez échoué à l'épreuve. Ce colis reste verrouillé.";
        if (modalFail) modalFail.classList.add('visible');
      } else {
        if (failMessage) failMessage.textContent = "Vous devez d'abord compléter l'épreuve pour débloquer ce colis.";
        if (modalFail) modalFail.classList.add('visible');
      }
    });
  });

  if (btnCloseSuccess) btnCloseSuccess.addEventListener('click', function() { if (modalSuccess) modalSuccess.classList.remove('visible'); });
  if (btnCloseFail) btnCloseFail.addEventListener('click', function() { if (modalFail) modalFail.classList.remove('visible'); });
  if (modalSuccess) modalSuccess.addEventListener('click', function(e) { if (e.target === modalSuccess) modalSuccess.classList.remove('visible'); });
  if (modalFail) modalFail.addEventListener('click', function(e) { if (e.target === modalFail) modalFail.classList.remove('visible'); });

  if (btnReset) {
    btnReset.addEventListener('click', function() {
      if (confirm('Voulez-vous vraiment recommencer le jeu ?')) { resetGameState(); window.location.href = 'index.html'; }
    });
  }

  updateDisplay();
});
