// ==========================================
// LOADER.JS - Gestion du loader de page
// ==========================================

(function() {
  // Attendre que la page soit complètement chargée
  window.addEventListener('load', function() {
    var loader = document.getElementById('page-loader');
    
    if (loader) {
      // Attendre que l'animation de la barre soit terminée (1.5s) + petit délai
      setTimeout(function() {
        loader.classList.add('hidden');
        
        // Supprimer le loader du DOM après la transition
        setTimeout(function() {
          if (loader.parentNode) {
            loader.parentNode.removeChild(loader);
          }
        }, 500);
      }, 1500);
    }
  });
  
  // Fallback si la page prend trop de temps à charger
  setTimeout(function() {
    var loader = document.getElementById('page-loader');
    if (loader && !loader.classList.contains('hidden')) {
      loader.classList.add('hidden');
    }
  }, 5000);
})();
