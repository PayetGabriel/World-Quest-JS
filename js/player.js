// ============================================================
// PLAYER.JS
// Position du joueur, déplacement, dessin, HUD
// ============================================================

const joueur = {
  x: 2318,
  y: 1003,
  vitesse: 2,
  hpMax: 100,
  hp: 100,
  attaque: 15,
  attackBoost: 0,
  attackBoostTours: 0,
  taille: 7
};

const touchesEnfoncees = {};

document.addEventListener("keydown", function(event) {
  touchesEnfoncees[event.key] = true;
});

document.addEventListener("keyup", function(event) {
  touchesEnfoncees[event.key] = false;
});

function deplacerJoueur() {
  let dx = 0;
  let dy = 0;

  if (touchesEnfoncees["ArrowLeft"] || touchesEnfoncees["q"] || touchesEnfoncees["Q"]) {
    dx = -joueur.vitesse;
  }
  if (touchesEnfoncees["ArrowRight"] || touchesEnfoncees["d"] || touchesEnfoncees["D"]) {
    dx = joueur.vitesse;
  }
  if (touchesEnfoncees["ArrowUp"] || touchesEnfoncees["z"] || touchesEnfoncees["Z"]) {
    dy = -joueur.vitesse;
  }
  if (touchesEnfoncees["ArrowDown"] || touchesEnfoncees["s"] || touchesEnfoncees["S"]) {
    dy = joueur.vitesse;
  }

  // Le point de collision est le pixel bas-centre du personnage
  // joueur.x et joueur.y représentent ce point (pieds au sol, centré)
  // Pas d'offset supplémentaire nécessaire car c'est déjà les pieds

  let nouveauX = joueur.x + dx;
  if (!estBloque(nouveauX, joueur.y)) {
    joueur.x = nouveauX;
  }

  let nouveauY = joueur.y + dy;
  if (!estBloque(joueur.x, nouveauY)) {
    joueur.y = nouveauY;
  }

  if (joueur.x < 0) { joueur.x = 0; }
  if (joueur.y < 0) { joueur.y = 0; }
  if (joueur.x > MAP_LARGEUR) { joueur.x = MAP_LARGEUR; }
  if (joueur.y > MAP_HAUTEUR) { joueur.y = MAP_HAUTEUR; }
}

function dessinerJoueur(ctx) {
  const pos = mapVersEcran(joueur.x, joueur.y);

  // dessinerSprite reçoit le pixel bas-centre (pos.x, pos.y)
  const spriteDessiné = dessinerSprite(ctx, pos.x, pos.y);

  if (!spriteDessiné) {
    ctx.fillStyle = "#2980b9";
    ctx.fillRect(pos.x - 5, pos.y - 14, 10, 14);
    ctx.fillStyle = "#c8a87a";
    ctx.beginPath();
    ctx.arc(pos.x, pos.y - 17, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function mettreAJourHUDJoueur() {
  let pourcentage = (joueur.hp / joueur.hpMax) * 100;

  let barre = document.getElementById("player-combat-hp-fill");
  let texte = document.getElementById("player-combat-hp-text");

  if (barre !== null) { barre.style.width = pourcentage + "%"; }
  if (texte !== null) { texte.textContent = joueur.hp + "/" + joueur.hpMax; }
}

function sortirDeLaCollision() {
  if (!estBloque(joueur.x, joueur.y)) { return; }

  for (let rayon = 10; rayon <= 200; rayon += 10) {
    for (let angle = 0; angle < 360; angle += 22) {
      let radians = angle * (Math.PI / 180);
      let testX = joueur.x + Math.cos(radians) * rayon;
      let testY = joueur.y + Math.sin(radians) * rayon;
      if (!estBloque(testX, testY)) {
        joueur.x = testX;
        joueur.y = testY;
        return;
      }
    }
  }
}
