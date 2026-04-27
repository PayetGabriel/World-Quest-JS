// ============================================================
// COMBAT-PHYSIQUE.JS
// Physique joueur, physique monstre, collisions couleurs
// ============================================================

// ---- Lecture couleur dans la carte de collisions ----

function getCouleurCollision(px, py) {
  if (collisionsImageData === null) { return { r: 255, v: 255, b: 255 }; }
  if (px < 0 || py < 0 || px >= collisionsLargeur || py >= collisionsHauteur) { return { r: 255, v: 0, b: 0 }; }
  let i = (py * collisionsLargeur + px) * 4;
  return { r: collisionsImageData[i], v: collisionsImageData[i + 1], b: collisionsImageData[i + 2] };
}

function ecranVersCollision(ex, ey) {
  return {
    px: Math.floor((ex / canvasCombat.width)  * collisionsLargeur),
    py: Math.floor((ey / canvasCombat.height) * collisionsHauteur)
  };
}

function estSolide(ex, ey) {
  let c = getCouleurCollision(ecranVersCollision(ex, ey).px, ecranVersCollision(ex, ey).py);
  return c.r > 200 && c.v < 50 && c.b < 50;
}

function estPlateforme(ex, ey) {
  let coord = ecranVersCollision(ex, ey);
  let c = getCouleurCollision(coord.px, coord.py);
  return c.b > 150 && c.r < 40 && c.v < 80;
}

function estVide(ex, ey) {
  let coord = ecranVersCollision(ex, ey);
  let c = getCouleurCollision(coord.px, coord.py);
  return c.v > 200 && c.r < 100 && c.b < 50;
}

// ---- Helpers collision joueur ----

function joueurToucheSolide() {
  let margeX = 6;
  let bas    = combattant.y + combattant.hauteur - 2;
  let milieu = combattant.y + combattant.hauteur * 0.6;
  return (estSolide(combattant.x + margeX, bas) || estSolide(combattant.x + combattant.largeur - margeX, bas) ||
          estSolide(combattant.x + margeX, milieu) || estSolide(combattant.x + combattant.largeur - margeX, milieu));
}

function joueurSurVide() {
  return estVide(combattant.x + combattant.largeur / 2, combattant.y + combattant.hauteur - 4);
}

// ---- Helpers collision monstre ----

function monstreToucheSolide() {
  let margeX = 8;
  let bas    = monstre.y + monstre.hauteur - 2;
  let milieu = monstre.y + monstre.hauteur * 0.6;
  return (estSolide(monstre.x + margeX, bas) || estSolide(monstre.x + monstre.largeur - margeX, bas) ||
          estSolide(monstre.x + margeX, milieu) || estSolide(monstre.x + monstre.largeur - margeX, milieu));
}

function monstreSurPlateforme() {
  if (monstre.velociteY < 0) { return false; }
  let g = monstre.x + 8;
  let m = monstre.x + monstre.largeur / 2;
  let d = monstre.x + monstre.largeur - 8;
  let bas = monstre.y + monstre.hauteur;
  for (let dy = 0; dy <= 3; dy++) {
    if (estPlateforme(g, bas + dy) || estPlateforme(m, bas + dy) || estPlateforme(d, bas + dy)) { return true; }
  }
  return false;
}

// ---- Placement initial sur le sol ----

function placerJoueurSurSol() {
  combattant.x = canvasCombat.width * 0.15;
  combattant.y = 0;
  combattant.velociteX = 0;
  combattant.velociteY = 0;
  combattant.auSol     = false;
  for (let y = 0; y < canvasCombat.height - combattant.hauteur; y++) {
    combattant.y = y;
    if (joueurToucheSolide()) { combattant.y = y - 1; combattant.auSol = true; break; }
  }
}

function placerMonstreSurSol() {
  monstre.velociteX = 0;
  monstre.velociteY = 0;
  monstre.auSol     = false;
  for (let y = 0; y < canvasCombat.height - monstre.hauteur; y++) {
    monstre.y = y;
    if (monstreToucheSolide()) { monstre.y = y - 1; monstre.auSol = true; break; }
  }
}

// ---- Résolution plateformes one-way (commune joueur/monstre) ----

function resoudrePlateforme(entite) {
  if (entite.auSol || entite.velociteY < 0) { return; }

  let basAvant = entite._basAvant || 0;
  let basApres = entite.y + entite.hauteur;
  let g  = entite.x + 8;
  let mi = entite.x + entite.largeur / 2;
  let d  = entite.x + entite.largeur - 8;

  let pyAvant = Math.floor((basAvant / canvasCombat.height) * collisionsHauteur);
  let pyApres = Math.floor((basApres / canvasCombat.height) * collisionsHauteur);
  let pxG = Math.floor((g  / canvasCombat.width) * collisionsLargeur);
  let pxM = Math.floor((mi / canvasCombat.width) * collisionsLargeur);
  let pxD = Math.floor((d  / canvasCombat.width) * collisionsLargeur);

  for (let py = pyAvant; py <= pyApres + 1; py++) {
    let cG = getCouleurCollision(pxG, py);
    let cM = getCouleurCollision(pxM, py);
    let cD = getCouleurCollision(pxD, py);
    if ((cG.b > 150 && cG.r < 40 && cG.v < 80) ||
        (cM.b > 150 && cM.r < 40 && cM.v < 80) ||
        (cD.b > 150 && cD.r < 40 && cD.v < 80)) {
      let ecranY = Math.floor((py / collisionsHauteur) * canvasCombat.height);
      entite.y     = ecranY - entite.hauteur;
      entite.auSol = true;
      entite.velociteY = 0;
      return;
    }
  }
}

// ============================================================
// PHYSIQUE JOUEUR
// ============================================================

function mettreAJourPhysiqueJoueur(deltaTime) {
  // Déplacement horizontal
  combattant.velociteX = 0;
  if (touchesEnfoncees["ArrowLeft"]  || touchesEnfoncees["q"] || touchesEnfoncees["Q"]) {
    combattant.velociteX = -combattant.vitesse;
    combattant.regardeADroite = false;
  }
  if (touchesEnfoncees["ArrowRight"] || touchesEnfoncees["d"] || touchesEnfoncees["D"]) {
    combattant.velociteX = combattant.vitesse;
    combattant.regardeADroite = true;
  }

  // Saut
  if ((touchesEnfoncees["ArrowUp"] || touchesEnfoncees["z"] || touchesEnfoncees["Z"]) && combattant.auSol) {
    combattant.velociteY = FORCE_SAUT;
    combattant.auSol     = false;
  }

  // Zone vide → propulsé vers le haut
  if (joueurSurVide() && combattant.auSol) {
    combattant.velociteY = FORCE_SAUT * 0.7;
    combattant.auSol     = false;
  }

  combattant.velociteY += GRAVITE;
  combattant.x += combattant.velociteX;
  if (joueurToucheSolide()) {
    let glisse = false;
    for (let m = 1; m <= 4; m++) { combattant.y--; if (!joueurToucheSolide()) { glisse = true; break; } }
    if (!glisse) { combattant.x -= combattant.velociteX; combattant.y += 4; }
  }
  combattant.x = Math.max(0, Math.min(combattant.x, canvasCombat.width - combattant.largeur));

  // Vertical
  combattant._basAvant = combattant.y + combattant.hauteur;
  combattant.y += combattant.velociteY;
  combattant.auSol = false;

  // Pas de plafond code — géré par la collision rouge en haut de l'image de collision

  if (joueurToucheSolide()) {
    if (combattant.velociteY >= 0) {
      // Descente : remonter pixel par pixel jusqu'à sortir du sol
      while (joueurToucheSolide()) { combattant.y--; }
      combattant.auSol = true;
    } else {
      // Montée : repousser vers le bas jusqu'à sortir du plafond
      while (joueurToucheSolide()) { combattant.y++; }
    }
    combattant.velociteY = 0;
  }

  resoudrePlateforme(combattant);

  if (combattant.y + combattant.hauteur > canvasCombat.height) {
    combattant.y = canvasCombat.height - combattant.hauteur;
    combattant.auSol     = true;
    combattant.velociteY = 0;
  }

  // Timer invincibilité
  if (combattant.invincible) {
    combattant.timerInvincible -= deltaTime;
    if (combattant.timerInvincible <= 0) { combattant.invincible = false; }
  }
}

// ============================================================
// PHYSIQUE MONSTRE
// ============================================================

function mettreAJourPhysiqueMonstre() {
  if (!collisionsCombatChargees) { return; }

  monstre.velociteY += GRAVITE;

  // Horizontal
  monstre.x += monstre.velociteX;
  if (monstreToucheSolide()) {
    let glisse = false;
    for (let m = 1; m <= 4; m++) { monstre.y--; if (!monstreToucheSolide()) { glisse = true; break; } }
    if (!glisse) { monstre.x -= monstre.velociteX; monstre.y += 4; monstre.velociteX = 0; }
  }
  monstre.x = Math.max(0, Math.min(monstre.x, canvasCombat.width - monstre.largeur));

  // Vertical
  monstre._basAvant = monstre.y + monstre.hauteur;
  monstre.y += monstre.velociteY;
  monstre.auSol = false;

  if (monstre.y < 0) { monstre.y = 0; monstre.velociteY = 0; }

  if (monstreToucheSolide()) {
    if (monstre.velociteY >= 0) {
      while (monstreToucheSolide()) { monstre.y--; }
      monstre.auSol = true;
    }
    monstre.velociteY = 0;
  }

  resoudrePlateforme(monstre);

  if (monstre.y + monstre.hauteur > canvasCombat.height) {
    monstre.y = canvasCombat.height - monstre.hauteur;
    monstre.auSol     = true;
    monstre.velociteY = 0;
  }
}
