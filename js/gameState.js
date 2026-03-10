// ==========================================
// GAME STATE MANAGER
// Fonctions partagées entre toutes les pages
// ==========================================

var STORAGE_KEY = 'destinationApprentissage';
var TIMER_KEY = 'globalTimerStart';

var defaultState = {
  enigme1: { completed: null },
  quiz: { completed: null, score: 0 },
  enigma: { completed: null }
};

function getGameState() {
  var saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      var parsed = JSON.parse(saved);
      return {
        enigme1: parsed.enigme1 || { completed: null },
        quiz: parsed.quiz || { completed: null, score: 0 },
        enigma: parsed.enigma || { completed: null }
      };
    } catch (e) {
      return JSON.parse(JSON.stringify(defaultState));
    }
  }
  return JSON.parse(JSON.stringify(defaultState));
}

function saveGameState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetGameState() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TIMER_KEY);
  localStorage.removeItem('shuffle_enigme1');
  localStorage.removeItem('shuffle_quiz');
  localStorage.removeItem('shuffle_enigma');
}

function getShuffledOrder(key, length) {
  var saved = localStorage.getItem('shuffle_' + key);
  if (saved) {
    try {
      var parsed = JSON.parse(saved);
      if (parsed.length === length) return parsed;
    } catch (e) {}
  }
  // Générer un nouvel ordre
  var order = [];
  for (var i = 0; i < length; i++) order.push(i);
  for (var i = order.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
  }
  localStorage.setItem('shuffle_' + key, JSON.stringify(order));
  return order;
}

function allGamesCompleted() {
  var state = getGameState();
  return (state.enigme1 && state.enigme1.completed !== null) &&
         (state.quiz && state.quiz.completed !== null) &&
         (state.enigma && state.enigma.completed !== null);
}

function formatTime(seconds) {
  var min = Math.floor(seconds / 60);
  var sec = seconds % 60;
  return {
    min: min.toString().padStart(2, '0'),
    sec: sec.toString().padStart(2, '0')
  };
}

function updateTimerDisplay(minEl, secEl, timeLeft) {
  var time = formatTime(timeLeft);
  if (minEl) minEl.textContent = time.min;
  if (secEl) secEl.textContent = time.sec;
}
