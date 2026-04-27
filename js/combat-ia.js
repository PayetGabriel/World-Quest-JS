// ============================================================
// COMBAT-IA.JS — démarrage/fin, stomp, contact, boucle
// L'IA du monstre est dans combat-ia-monstre.js
// Les spéciales sont dans combat-speciales-*.js
// ============================================================

function demarrerCombat(monument) {
  combatEnCours    = true;
  monumentEnCombat = monument;
  inventaireOuvert = false;

  monument.gardien.hp = monument.gardien.hpMax;

  canvasCombat        = document.getElementById("combat-canvas");
  canvasCombat.width  = window.innerWidth;
  canvasCombat.height = window.innerHeight;
  ctxCombat           = canvasCombat.getContext("2d");

  document.getElementById("combat-screen").style.display = "block";

  let minimap = document.getElementById("minimap-wrapper");
  if (minimap) { minimap.style.display = "none"; }
  masquerBoutonsCombat(true);

  // Reset monstre
  monstre.x                        = canvasCombat.width * 0.72;
  monstre.y                        = 0;
  monstre.velociteX                = 0;
  monstre.velociteY                = 0;
  monstre.auSol                    = false;
  monstre.regardeADroite           = false;
  monstre.etat                     = "idle";
  monstre.animCourante             = "idle";
  monstre.frameAnim                = 0;
  monstre.timerAnim                = 0;
  monstre.animTerminee             = false;
  monstre.timerAttaque             = 0;
  monstre.timerSpecial             = 0;
  monstre.timerSaut                = 0;
  monstre.timerProtection          = 0;
  monstre.enProtection             = false;
  monstre.compteurStompsProtection = 0;
  monstre.ondeActuelle             = null;
  monstre.projectileActuel         = null;
  monstre.zoneAuSol                = null;
  monstre.tornadeActive            = null;
  monstre.residusActifs            = [];
  monstre.enCharge                 = false;
  monstre.enDisparition            = false;

  // Reset variables de phase des spéciales
  disparitionPhase = "inactif";
  tpPhase          = "inactif";
  tpTimerPhase     = 0;
  tpTimerResidu    = 0;

  // Reset combattant — on garde intentionnellement le boost d'attaque
  // car le joueur peut avoir acheté des potions avant le combat
  combattant.invincible         = false;
  combattant.timerInvincible    = 0;
  combattant.timerCooldownStomp = 0;

  // Fond + collisions
  let nomFichier           = FONDS_COMBAT[monument.id] || "Fond Tour Effeil";
  fondCombatCharge         = false;
  collisionsCombatChargees = false;
  collisionsImageData      = null;

  fondCombat     = new Image();
  fondCombat.src = "assets/battle/" + nomFichier + " HD.jpg";
  fondCombat.onload = function() { fondCombatCharge = true; };

  let imgCol    = new Image();
  imgCol.src    = "assets/battle/" + nomFichier + " Collisions.jpg";
  imgCol.onload = function() {
    let tmp   = document.createElement("canvas");
    tmp.width  = imgCol.width;
    tmp.height = imgCol.height;
    let tCtx  = tmp.getContext("2d");
    tCtx.drawImage(imgCol, 0, 0);
    collisionsImageData      = tCtx.getImageData(0, 0, imgCol.width, imgCol.height).data;
    collisionsLargeur        = imgCol.width;
    collisionsHauteur        = imgCol.height;
    collisionsCombatChargees = true;
    placerJoueurSurSol();
    placerMonstreSurSol();
  };

  chargerSpritesMonstre(function() {});
  mettreAJourInventaireAffichage();
}

// ---- Boutons ----

function masquerBoutonsCombat(enCombat) {
  let labelsAMasquer = ["Shop", "Map", "Succès"];
  document.querySelectorAll(".nav-btn-wrap").forEach(function(wrap) {
    let lbl = wrap.querySelector(".nav-label");
    if (lbl && labelsAMasquer.indexOf(lbl.textContent.trim()) !== -1) {
      wrap.style.display = enCombat ? "none" : "";
    }
  });

  let exitWrap = document.getElementById("nav-exit");
  if (!exitWrap) { return; }
  let btn = exitWrap.querySelector(".nav-btn");
  let lbl = exitWrap.querySelector(".nav-label");
  let nouveauBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(nouveauBtn, btn);

  if (enCombat) {
    nouveauBtn.addEventListener("click", function(e) { e.stopPropagation(); terminerCombat("fuite"); });
    if (lbl) { lbl.textContent = "Fuir"; }
  } else {
    nouveauBtn.addEventListener("click", function(e) { e.stopPropagation(); if (confirm("Quitter ?")) { location.reload(); } });
    if (lbl) { lbl.textContent = "Quitter"; }
  }
}

function spawnerJoueurApresMonument(monument) {
  joueur.x = monument.x - 80;
  joueur.y = monument.y + 80;
  let n = 0;
  while (estBloque(joueur.x, joueur.y) && n < 150) { joueur.y++; n++; }
  if (!estBloque(joueur.x, joueur.y)) { return; }
  for (let r = 10; r <= 300; r += 10) {
    for (let a = 0; a < 360; a += 20) {
      let rad = a * (Math.PI / 180);
      let tx  = monument.x + Math.cos(rad) * r;
      let ty  = monument.y + Math.sin(rad) * r;
      if (!estBloque(tx, ty)) { joueur.x = tx; joueur.y = ty; return; }
    }
  }
}

// ---- Fin de combat ----

function terminerCombat(resultat) {
  combatEnCours = false;
  document.getElementById("combat-screen").style.display = "none";
  inventaireOuvert = false;
  document.getElementById("inventory-screen").style.display = "none";

  let minimap = document.getElementById("minimap-wrapper");
  if (minimap) { minimap.style.display = ""; }
  masquerBoutonsCombat(false);

  Object.keys(touchesEnfoncees).forEach(function(k) { touchesEnfoncees[k] = false; });

  if (resultat === true) {
    monumentEnCombat.decouvert = true;
    donnerPointCompetence();
    mettreAJourSucces();
    debloquerZoneSuivante(monumentEnCombat.nom);

    let pvManquants = joueur.hpMax - joueur.hp;
    joueur.hp       = Math.min(joueur.hpMax, joueur.hp + Math.floor(pvManquants * 0.7));
    mettreAJourHUDJoueur();
    mettreAJourHUDNavbar();

    let cfg     = getConfigMonstre();
    let orGagne = Math.floor((cfg.or || 50) * (cfg.coeff || 1.0));
    orJoueur   += orGagne;
    let shopOr  = document.getElementById("shop-or");
    if (shopOr) { shopOr.textContent = "Or : " + orJoueur; }
    afficherMessage("Monument découvert : " + monumentEnCombat.nom + " ! +" + orGagne + " or");

  } else if (resultat === false) {
    joueur.hp = Math.floor(joueur.hpMax * 0.3);
    spawnerJoueurApresMonument(monumentEnCombat);
    mettreAJourHUDJoueur();
    mettreAJourHUDNavbar();
    afficherMessage("Tu as été vaincu... Tu repars avec 30% de vies.");

  } else if (resultat === "fuite") {
    spawnerJoueurApresMonument(monumentEnCombat);
    afficherMessage("Tu as fui le combat.");
  }

  fondCombatCharge         = false;
  collisionsCombatChargees = false;
  collisionsImageData      = null;
  monumentEnCombat         = null;
}

document.addEventListener("keydown", function(e) {
  if (e.key === "Escape" && combatEnCours) { e.preventDefault(); terminerCombat("fuite"); }
});

// ---- Stomp joueur sur la tête du monstre ----
// Seule façon de blesser le monstre : tomber en descente sur sa tête

function verifierStompJoueur() {
  if (monstre.etat === "mort")          { return; }
  if (combattant.timerCooldownStomp > 0) { return; }
  // Le joueur doit descendre (velociteY > 0)
  if (combattant.velociteY <= 0)        { return; }

  // Zone tête du monstre : 25% du haut, 60% central en largeur
  let headX1 = monstre.x + monstre.largeur * 0.2;
  let headX2 = monstre.x + monstre.largeur * 0.8;
  let headY1 = monstre.y;
  let headY2 = monstre.y + monstre.hauteur * 0.25;

  let jBas = combattant.y + combattant.hauteur;
  let jG   = combattant.x + 8;
  let jD   = combattant.x + combattant.largeur - 8;

  if (jD <= headX1 || jG >= headX2) { return; }
  // Le bas du joueur doit croiser la zone tête
  if (jBas < headY1 || combattant.y > headY2) { return; }

  combattant.velociteY          = FORCE_SAUT * 0.65;
  combattant.auSol              = false;
  combattant.timerCooldownStomp = combattant.COOLDOWN_STOMP;

  // Protection Acropole : stomp comptabilisé, pas de dégâts
  if (monstre.enProtection) {
    let cfg = getConfigMonstre();
    monstre.compteurStompsProtection++;
    if (monstre.compteurStompsProtection >= (cfg.STOMPS_POUR_CASSER || 2)) {
      monstre.enProtection             = false;
      monstre.etat                     = "hit";
      monstre.compteurStompsProtection = 0;
      setAnimMonstre("hit");
      setTimeout(function() {
        if (combatEnCours && monstre.etat === "hit") { monstre.etat = "marche"; }
      }, getAnimData("hit").frames.length * getAnimData("hit").duree);
    }
    return;
  }

  // Monstre invulnérable pendant une disparition/tp
  if (monstre.enDisparition) { return; }

  let gardien = monumentEnCombat.gardien;
  let degats  = Math.max(1, joueur.attaque + combattant.attackBoost + Math.floor(Math.random() * 6));

  if (combattant.attackBoostTours > 0) {
    combattant.attackBoostTours--;
    if (combattant.attackBoostTours === 0) { combattant.attackBoost = 0; }
  }
  mettreAJourBoostNavbar();
  gardien.hp -= degats;

  if (gardien.hp <= 0) {
    gardien.hp        = 0;
    monstre.etat      = "mort";
    monstre.velociteX = 0;
    setAnimMonstre("death");
    setTimeout(function() { terminerCombat(true); }, 1600);
    return;
  }

  // Frame hit aléatoire
  let animHit  = getAnimData("hit");
  let nbFrames = animHit.frames.length;
  setAnimMonstre("hit");
  monstre.frameAnim = Math.floor(Math.random() * nbFrames);
  monstre.etat      = "hit";
  setTimeout(function() {
    if (combatEnCours && monstre.etat === "hit") { monstre.etat = "marche"; }
  }, nbFrames * animHit.duree);
}

// ---- Contact corps monstre → joueur ----
// Le joueur NE prend PAS de dégâts en marchant de côté dans le monstre.
// Dégâts uniquement si le monstre est en état "attaque" (zone devant lui)
// ou si le joueur se retrouve dans le corps du monstre (overlap fort).

function verifierContactCorps() {
  if (monstre.etat === "mort")    { return; }
  if (combattant.invincible)      { return; }
  if (monstre.enDisparition)      { return; }

  let gardien    = monumentEnCombat.gardien;
  let degatsBase = Math.max(1, gardien.attaque - 2 + Math.floor(Math.random() * 5));
  let mult       = 1.0;
  let touche     = false;

  if (monstre.etat === "attaque") {
    // Zone devant le monstre dans sa direction
    let portee = 160;
    let zx1, zx2;
    if (monstre.regardeADroite) {
      zx1 = monstre.x + monstre.largeur * 0.5;
      zx2 = zx1 + portee;
    } else {
      zx2 = monstre.x + monstre.largeur * 0.5;
      zx1 = zx2 - portee;
    }
    let zy1 = monstre.y + monstre.hauteur * 0.3;
    let zy2 = monstre.y + monstre.hauteur;
    let jx1 = combattant.x + 8;
    let jx2 = combattant.x + combattant.largeur - 8;
    let jy1 = combattant.y + combattant.hauteur * 0.3;
    let jy2 = combattant.y + combattant.hauteur;
    if (jx2 > zx1 && jx1 < zx2 && jy2 > zy1 && jy1 < zy2) { touche = true; mult = 1.4; }
  }
  // Pas de dégâts de contact en dehors des attaques (on saute dessus pour faire mal)

  if (!touche) { return; }

  let degats = Math.floor(degatsBase * mult);
  joueur.hp -= degats;
  combattant.invincible      = true;
  combattant.timerInvincible = combattant.DUREE_INVINCIBLE;

  let pct = degats / joueur.hpMax;
  if      (pct < 0.10) { jouerAnimationHit(1); }
  else if (pct < 0.20) { jouerAnimationHit(2); }
  else if (pct < 0.35) { jouerAnimationHit(3); }
  else                 { jouerAnimationHit(4); }
  setTimeout(function() { if (combatEnCours) { setAnimation("idle"); } }, 400);

  if (joueur.hp <= 0) {
    joueur.hp = 0;
    jouerAnimationMort();
    mettreAJourHUDJoueur();
    mettreAJourHUDNavbar();
    setTimeout(function() { terminerCombat(false); }, 1500);
    return;
  }
  mettreAJourHUDJoueur();
  mettreAJourHUDNavbar();
}

// ---- Boucle principale ----

function mettreAJourCombat(deltaTime) {
  if (!combatEnCours) { return; }

  if (combattant.timerCooldownStomp > 0) { combattant.timerCooldownStomp -= deltaTime; }

  mettreAJourPhysiqueJoueur(deltaTime);
  // mettreAJourAnimationJoueur est appelé dans main.js via boucleDeJeu
  // mais en combat deltaTime arrive ici, donc on le rappelle
  mettreAJourAnimationJoueurCombat(deltaTime);

  if (monstre.etat !== "mort") {
    mettreAJourIAMonstre(deltaTime);
    mettreAJourPhysiqueMonstre();
    verifierStompJoueur();
    verifierContactCorps();
  }

  mettreAJourSpeciales(deltaTime);

  mettreAJourAnimMonstre(deltaTime);

  // Inventaire
  if (touchesEnfoncees["i"] || touchesEnfoncees["I"]) {
    if (!combattant._iEnfoncee) { combattant._iEnfoncee = true; basculerInventaireCombat(); }
  } else { combattant._iEnfoncee = false; }

  if (inventaireOuvert) {
    if (touchesEnfoncees["f"] || touchesEnfoncees["F"]) {
      if (!combattant._fEnfoncee) { combattant._fEnfoncee = true; useItem("potion-heal"); }
    } else { combattant._fEnfoncee = false; }
    if (touchesEnfoncees["g"] || touchesEnfoncees["G"]) {
      if (!combattant._gEnfoncee) { combattant._gEnfoncee = true; useItem("potion-boost"); }
    } else { combattant._gEnfoncee = false; }
  }
}

// Met à jour l'animation du joueur en combat selon son mouvement
function mettreAJourAnimationJoueurCombat(deltaTime) {
  // On calcule dx et dy depuis les touches
  let dx = 0;
  let dy = 0;
  if (touchesEnfoncees["ArrowLeft"]  || touchesEnfoncees["q"] || touchesEnfoncees["Q"]) { dx = -1; }
  if (touchesEnfoncees["ArrowRight"] || touchesEnfoncees["d"] || touchesEnfoncees["D"]) { dx = 1; }
  // En combat c'est du 2D donc pas de haut/bas au sens map
  // Si le joueur monte (saut) → marche_profil, si descend pareil
  // On utilise la velociteY pour le "vertical"
  if (combattant.velociteY < -1)  { dy = -1; }  // monte
  if (combattant.velociteY >  1)  { dy = 1; }   // descend

  mettreAJourAnimationJoueur(deltaTime, dx, dy);
}
