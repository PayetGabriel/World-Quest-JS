// Lance les particules flottantes dès le chargement de la page
let particulesActives = true;
let animationParticulesId = null;

window.addEventListener("load", function() {
  lancerParticulesEcranTitre();
});

// demarrerJeu() est définie dans main.js
// Elle gère le chargement de la map et le démarrage de la boucle de jeu

// Dessine des petites étoiles / particules qui flottent sur l'écran titre
function lancerParticulesEcranTitre() {
  const canvas = document.getElementById("titre-particules");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // On crée 60 particules avec des positions et vitesses aléatoires
  const particules = [];
  for (let i = 0; i < 60; i++) {
    particules.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      taille: Math.random() * 2 + 0.5,
      vitesseX: (Math.random() - 0.5) * 0.3,
      vitesseY: -Math.random() * 0.4 - 0.1,
      opacite: Math.random() * 0.6 + 0.2
    });
  }

  function animer() {
    if (!particulesActives) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particules.length; i++) {
      const p = particules[i];

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.taille, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(160, 220, 180, " + p.opacite + ")";
      ctx.fill();

      p.x = p.x + p.vitesseX;
      p.y = p.y + p.vitesseY;

      // Si la particule sort par le haut, elle revient par le bas
      if (p.y < -5) {
        p.y = canvas.height + 5;
        p.x = Math.random() * canvas.width;
      }
    }

    animationParticulesId = requestAnimationFrame(animer);
  }

  animer();
}
