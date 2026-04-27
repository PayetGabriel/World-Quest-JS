// ============================================================
// COMBAT-SPECIALES-TP.JS
// Disparition Pyramides + TP Colisée + tornade + résidus
// ============================================================

// ============================================================
// TORNADE — lancée par l'attaque normale des Pyramides
// Tête chercheuse rapide, lancée depuis combat-ia-monstre.js
// ============================================================

function declencherTornade() {
  monstre.tornadeActive = {
    x:          monstre.x + monstre.largeur / 2,
    y:          monstre.y + monstre.hauteur * 0.5,
    actif:      true,
    aDejaTouch: false,
    timer:      0,
    dureeMax:   3500,
    vitesse:    8   // plus rapide qu'avant
  };
}

function mettreAJourTornade(deltaTime) {
  let t = monstre.tornadeActive;
  if (!t || !t.actif) { return; }
  t.timer += deltaTime;

  let jcx  = combattant.x + combattant.largeur / 2;
  let jcy  = combattant.y + combattant.hauteur / 2;
  let dx   = jcx - t.x;
  let dy   = jcy - t.y;
  let dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 0) {
    t.x += (dx / dist) * t.vitesse;
    t.y += (dy / dist) * t.vitesse;
  }

  if (!t.aDejaTouch && !combattant.invincible && dist < 30) {
    t.aDejaTouch = true;
    t.actif      = false;
    monstre.tornadeActive = null;
    appliquerDegatsSpeciaux(1.8);
    return;
  }
  if (t.timer >= t.dureeMax) { t.actif = false; monstre.tornadeActive = null; }
}

function dessinerTornade() {
  let t = monstre.tornadeActive;
  if (!t || !t.actif) { return; }

  let cfg = getConfigMonstre();
  let img = monstreImages[cfg.dossier + "Special tornade"];
  if (img && img.complete && img.naturalWidth > 0) {
    let h = 80;
    let w = Math.round(img.naturalWidth * (h / img.naturalHeight));
    ctxCombat.drawImage(img, t.x - w / 2, t.y - h / 2, w, h);
  } else {
    ctxCombat.save();
    ctxCombat.strokeStyle = "rgba(220,180,80,0.8)";
    ctxCombat.lineWidth   = 3;
    for (let i = 0; i < 2; i++) {
      ctxCombat.beginPath();
      ctxCombat.arc(t.x, t.y, 12 + i * 8, (Date.now() / 200) + i * Math.PI, (Date.now() / 200) + i * Math.PI + Math.PI);
      ctxCombat.stroke();
    }
    ctxCombat.restore();
  }
}

// ============================================================
// DISPARITION — Pyramides
// Special 1 → Special 2 Disp → Special 3 Invisible (rapide)
// → Special 2 Disp → laser sable (Special 4 via laserActuel)
// Invulnérable pendant tout le processus
// ============================================================

// ============================================================
// DISPARITION — Pyramides
// Special 2 Disp → Special 3 Invisible (vol) → Special 2 Disp → Special 4 (attaque finale)
// Invulnérable pendant tout le processus
// ============================================================

let disparitionPhase = "inactif";

// State pour l'attaque finale (Special 4 affichée quelques secondes)
let attaqueFinaleActive = false;
let attaqueFinaleTimer  = 0;
const ATTAQUE_FINALE_DUREE = 1000; // ms d'affichage de Special 4

function declencherDisparition() {
  let cfg              = getConfigMonstre();
  disparitionPhase     = "disparition";
  monstre.enDisparition = true;
  monstre.velociteX    = 0;
  monstre.velociteY    = 0;
  setAnimMonstre("special");
  attaqueFinaleActive  = false;

  setTimeout(function() {
    if (!combatEnCours) { return; }
    disparitionPhase = "invisible";
  }, 500);

  setTimeout(function() {
    if (!combatEnCours) { return; }
    disparitionPhase = "reapparition";

    let coteX   = Math.random() < 0.5 ? -160 : 160;
    monstre.x   = Math.max(0, Math.min(combattant.x + coteX, canvasCombat.width - monstre.largeur));
    monstre.y   = Math.max(0, Math.min(combattant.y - 20, canvasCombat.height - monstre.hauteur));

    // Après réapparition : attaque avec Special 4
    setTimeout(function() {
      if (!combatEnCours) { return; }
      // Forcer la frame Special 4 sur le monstre
      setAnimMonstre("special");
      monstre.frameAnim    = 3; // index 3 = Special 4
      monstre.animTerminee = false;
      attaqueFinaleActive  = true;
      attaqueFinaleTimer   = 0;

      // Dégâts à la moitié de la durée d'affichage
      setTimeout(function() {
        if (!combatEnCours || combattant.invincible) { return; }
        // Zone de dégâts : toute la largeur dans la direction du tir
        let midY = monstre.y + monstre.hauteur * 0.35;
        let dirX = monstre.regardeADroite ? 1 : -1;
        let startX = monstre.regardeADroite ? monstre.x + monstre.largeur : 0;
        let endX   = monstre.regardeADroite ? canvasCombat.width : monstre.x;
        let jx1 = combattant.x + 8;
        let jx2 = combattant.x + combattant.largeur - 8;
        let jy1 = combattant.y;
        let jy2 = combattant.y + combattant.hauteur;
        if (jx2 > startX && jx1 < endX && jy2 > midY - 40 && jy1 < midY + 40) {
          appliquerDegatsSpeciaux(1.8);
        }
      }, ATTAQUE_FINALE_DUREE / 2);

      setTimeout(function() {
        if (!combatEnCours) { return; }
        attaqueFinaleActive   = false;
        disparitionPhase      = "inactif";
        monstre.enDisparition = false;
        monstre.etat          = "marche";
        setAnimMonstre("move");
      }, ATTAQUE_FINALE_DUREE);

    }, 500);

  }, cfg.DUREE_DISPARITION || 2500);
}

function mettreAJourAttaqueFinale(deltaTime) {
  if (!attaqueFinaleActive) { return; }
  attaqueFinaleTimer += deltaTime;
}

// Déplacement pendant la phase invisible des Pyramides (pas de gravité)
function mettreAJourDisparuInvisible(deltaTime) {
  if (disparitionPhase !== "invisible" || !monstre.enDisparition) { return; }

  // Annuler la gravité : on fixe velociteY à 0 chaque frame
  monstre.velociteY = 0;

  let dx   = (combattant.x + combattant.largeur / 2) - (monstre.x + monstre.largeur / 2);
  let dy   = (combattant.y + combattant.hauteur / 2) - (monstre.y + monstre.hauteur / 2);
  let dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 0) {
    monstre.x += (dx / dist) * 7;
    monstre.y += (dy / dist) * 7;
    monstre.regardeADroite = dx > 0;
  }
}

// Affichage du monstre pendant la disparition
function dessinerMonstreInvisible() {
  let cfg = getConfigMonstre();
  let phase = (cfg.typeSpeciale === "disparition") ? disparitionPhase : tpPhase;
  if (phase === "inactif" || !monstre.enDisparition) { return; }

  let nomImg = "";
  if (cfg.typeSpeciale === "disparition") {
    if (phase === "disparition")  { nomImg = "Special 2 Disp"; }
    if (phase === "invisible")    { nomImg = "Special 3 Invisible"; }
    if (phase === "reapparition") { nomImg = "Special 2 Disp"; }
  } else {
    // Colisée TP : même style que Pyramides
    if (phase === "disparition")  { nomImg = "Special TP 1"; }
    if (phase === "invisible")    { nomImg = "Special TP Invisible"; }
    if (phase === "reapparition") { nomImg = "Special TP 1"; }
  }
  if (nomImg === "") { return; }

  let img = monstreImages[cfg.dossier + nomImg];
  if (!img || !img.complete || img.naturalWidth === 0) { return; }

  let h = monstre.hauteur;
  let w = Math.round(img.naturalWidth * (h / img.naturalHeight));
  let x = monstre.x + (monstre.largeur - w) / 2;
  let y = monstre.y;

  if (!monstre.regardeADroite) {
    ctxCombat.save();
    ctxCombat.translate(x + w, y);
    ctxCombat.scale(-1, 1);
    ctxCombat.drawImage(img, 0, 0, w, h);
    ctxCombat.restore();
  } else {
    ctxCombat.drawImage(img, x, y, w, h);
  }
}

// ============================================================
// TP RÉSIDU — Colisée
// TP rapide, lâche plusieurs résidus avec physique + collision
// Invulnérable pendant le TP
// ============================================================

// ============================================================
// TP RÉSIDU — Colisée
// Phase 1 "disparition" : frame TP 1 (400ms)
// Phase 2 "invisible"   : frame TP Invisible, vol vers joueur,
//                         lâche un résidu toutes les 400ms, invulnérable
// Phase 3 "reapparition": frame TP 1 au-dessus du joueur (400ms)
// Retour état normal
// ============================================================

let tpPhase       = "inactif";
let tpTimerPhase  = 0;
let tpTimerResidu = 0;
const TP_DUREE_DISP    = 400;   // ms pour la frame de disparition
const TP_DUREE_INVIS   = 2000;  // ms de vol invisible
const TP_DUREE_REAPP   = 400;   // ms pour la frame de réapparition
const TP_INTERVALLE_RESIDU = 400; // ms entre chaque résidu lâché

function declencherTeleportResidu() {
  tpPhase              = "disparition";
  tpTimerPhase         = 0;
  tpTimerResidu        = 0;
  monstre.enDisparition = true;
  monstre.velociteX    = 0;
  monstre.velociteY    = 0;
  setAnimMonstre("special");
}

function mettreAJourTP(deltaTime) {
  if (tpPhase === "inactif") { return; }

  tpTimerPhase += deltaTime;

  if (tpPhase === "disparition") {
    if (tpTimerPhase >= TP_DUREE_DISP) {
      tpPhase      = "invisible";
      tpTimerPhase = 0;
      tpTimerResidu = 0;
    }
    return;
  }

  if (tpPhase === "invisible") {
    // Voler vers le joueur sans gravité — annuler velociteY chaque frame
    monstre.velociteY = 0;

    let dx   = (combattant.x + combattant.largeur / 2) - (monstre.x + monstre.largeur / 2);
    let dy   = (combattant.y + combattant.hauteur / 2) - (monstre.y + monstre.hauteur / 2);
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      monstre.x += (dx / dist) * 5;
      monstre.y += (dy / dist) * 5;
      monstre.regardeADroite = dx > 0;
    }

    // Lâcher un résidu à la hauteur actuelle du monstre
    tpTimerResidu += deltaTime;
    if (tpTimerResidu >= TP_INTERVALLE_RESIDU) {
      tpTimerResidu = 0;
      let residuX = monstre.x + monstre.largeur / 2 - 30;
      let residuY = monstre.y + monstre.hauteur * 0.4; // hauteur du monstre à cet instant
      _lacherResidu(residuX, residuY);
    }

    if (tpTimerPhase >= TP_DUREE_INVIS) {
      tpPhase      = "reapparition";
      tpTimerPhase = 0;
      monstre.x = Math.max(0, Math.min(combattant.x, canvasCombat.width - monstre.largeur));
      monstre.y = Math.max(0, combattant.y - monstre.hauteur - 10);
    }
    return;
  }

  if (tpPhase === "reapparition") {
    if (tpTimerPhase >= TP_DUREE_REAPP) {
      tpPhase               = "inactif";
      monstre.enDisparition = false;
      monstre.velociteY     = 0;
      monstre.etat          = "marche";
      setAnimMonstre("move");
    }
    return;
  }
}

function _lacherResidu(rx, ry) {
  let cfg = getConfigMonstre();
  monstre.residusActifs.push({
    x:          rx,
    y:          ry,
    vy:         0,      // pas de gravité, reste à la position de spawn
    auSol:      true,   // considéré comme posé dès le spawn
    timer:      0,
    duree:      cfg.DUREE_RESIDU || 5000,
    actif:      true,
    aDejaTouch: false
  });
}

function mettreAJourResidus(deltaTime) {
  for (let i = monstre.residusActifs.length - 1; i >= 0; i--) {
    let r = monstre.residusActifs[i];
    if (!r.actif) { monstre.residusActifs.splice(i, 1); continue; }

    r.timer += deltaTime;

    // Dégâts au contact joueur
    if (!combattant.invincible && !r.aDejaTouch) {
      let cfg     = getConfigMonstre();
      let imgRef  = monstreImages[cfg.dossier + "Special TP Résidu"];
      let rW      = imgRef && imgRef.naturalWidth  > 0 ? imgRef.naturalWidth  : 60;
      let rH      = imgRef && imgRef.naturalHeight > 0 ? imgRef.naturalHeight : 60;
      let jx1     = combattant.x + 8;
      let jx2     = combattant.x + combattant.largeur - 8;
      let jy1     = combattant.y + combattant.hauteur * 0.3;
      let jy2     = combattant.y + combattant.hauteur;
      if (jx2 > r.x && jx1 < r.x + rW && jy2 > r.y && jy1 < r.y + rH) {
        r.aDejaTouch = true;
        appliquerDegatsSpeciaux(1.8);
        setTimeout(function() { r.aDejaTouch = false; }, 900);
      }
    }

    if (r.timer >= r.duree) { r.actif = false; }
  }
}

function dessinerResidus() {
  if (monstre.residusActifs.length === 0) { return; }

  let cfg = getConfigMonstre();
  let img = monstreImages[cfg.dossier + "Special TP Résidu"];

  for (let i = 0; i < monstre.residusActifs.length; i++) {
    let r = monstre.residusActifs[i];
    if (!r.actif) { continue; }

    let prog  = r.timer / r.duree;
    let alpha = prog > 0.7 ? (1 - (prog - 0.7) / 0.3) : 1;

    ctxCombat.save();
    ctxCombat.globalAlpha = alpha;
    if (img && img.complete && img.naturalWidth > 0) {
      // Taille naturelle
      ctxCombat.drawImage(img, r.x, r.y, img.naturalWidth, img.naturalHeight);
    } else {
      ctxCombat.fillStyle = "rgba(100,200,80,0.6)";
      ctxCombat.fillRect(r.x, r.y, 60, 60);
    }
    ctxCombat.restore();
  }
}

// Mise à jour laser sable (appelée depuis mettreAJourSpeciales)
// On l'intègre dans mettreAJourSpeciales via combat-speciales-base.js
// mais les fonctions sont définies ici donc accessibles globalement.
// mettreAJourSpeciales appelle mettreAJourLaserSable + dessinerLaserSable.