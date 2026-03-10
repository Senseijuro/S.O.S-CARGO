document.addEventListener('DOMContentLoaded', function() {
  function updateDisplay() {
    var state = getGameState();
    var cardEnigme1 = document.getElementById('card-enigme1');
    var statusEnigme1 = document.getElementById('status-enigme1');
    var btnEnigme1 = document.getElementById('btn-enigme1');
    if (cardEnigme1 && statusEnigme1 && btnEnigme1) {
      if (state.enigme1 && state.enigme1.completed === true) {
        statusEnigme1.innerHTML = '<span class="status-dot success"></span><span>Réussi</span>';
        btnEnigme1.textContent = 'TERMINÉ'; btnEnigme1.classList.add('success');
      } else if (state.enigme1 && state.enigme1.completed === false) {
        statusEnigme1.innerHTML = '<span class="status-dot fail"></span><span>Échoué</span>';
        btnEnigme1.textContent = 'ÉCHOUÉ'; btnEnigme1.classList.add('fail');
      }
    }
    var cardQuiz = document.getElementById('card-quiz');
    var statusQuiz = document.getElementById('status-quiz');
    var btnQuiz = document.getElementById('btn-quiz');
    if (cardQuiz && statusQuiz && btnQuiz) {
      if (state.enigme1 && state.enigme1.completed !== null) {
        cardQuiz.classList.remove('locked'); btnQuiz.classList.remove('disabled');
        btnQuiz.textContent = 'COMMENCER';
        statusQuiz.innerHTML = '<span class="status-dot"></span><span>À faire</span>';
        if (state.quiz && state.quiz.completed === true) {
          statusQuiz.innerHTML = '<span class="status-dot success"></span><span>Réussi</span>';
          btnQuiz.textContent = 'TERMINÉ'; btnQuiz.classList.add('success');
        } else if (state.quiz && state.quiz.completed === false) {
          statusQuiz.innerHTML = '<span class="status-dot fail"></span><span>Échoué</span>';
          btnQuiz.textContent = 'ÉCHOUÉ'; btnQuiz.classList.add('fail');
        }
      }
    }
    var cardEnigma = document.getElementById('card-enigma');
    var statusEnigma = document.getElementById('status-enigma');
    var btnEnigma = document.getElementById('btn-enigma');
    if (cardEnigma && statusEnigma && btnEnigma) {
      if (state.quiz && state.quiz.completed !== null) {
        cardEnigma.classList.remove('locked'); btnEnigma.classList.remove('disabled');
        btnEnigma.textContent = 'COMMENCER';
        statusEnigma.innerHTML = '<span class="status-dot"></span><span>À faire</span>';
        if (state.enigma && state.enigma.completed === true) {
          statusEnigma.innerHTML = '<span class="status-dot success"></span><span>Réussi</span>';
          btnEnigma.textContent = 'TERMINÉ'; btnEnigma.classList.add('success');
        } else if (state.enigma && state.enigma.completed === false) {
          statusEnigma.innerHTML = '<span class="status-dot fail"></span><span>Échoué</span>';
          btnEnigma.textContent = 'ÉCHOUÉ'; btnEnigma.classList.add('fail');
        }
      }
    }
    var statusCoffre = document.getElementById('status-coffre');
    if (statusCoffre) {
      var count = 0;
      if (state.enigme1 && state.enigme1.completed === true) count++;
      if (state.quiz && state.quiz.completed === true) count++;
      if (state.enigma && state.enigma.completed === true) count++;
      var dotClass = count > 0 ? 'success' : '';
      statusCoffre.innerHTML = '<span class="status-dot ' + dotClass + '"></span><span>' + count + '/3 débloqué</span>';
    }
  }
  document.querySelectorAll('.epreuve-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) { if (btn.classList.contains('disabled')) e.preventDefault(); });
  });
  updateDisplay();
});
