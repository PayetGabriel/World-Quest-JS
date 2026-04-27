// ============================================================
// COMBAT-SPECIALES-BASE.JS — onde, projectile, charge, séisme
// ============================================================

// Point d'entrée unique depuis combat-ia-monstre.js
function declencherSpeciale() {
  let type = (getConfigMonstre().typeSpeciale) || "onde";
  if (type === "onde")        { declencherOndeDeChoc(); }
  if (type === "projectile")  { declencherProjectile(); }
  if (type === "charge")      { declencherCharge(); }
  if (type === "seisme")      { declencherSeisme(); }
  if (type === "laser")       { declencherLaser(); }
  if (type === "flamme_sol")  { declencherFlammeSol(); }
  if (type === "disparition") { declencherDisparition(); }
  if (type === "tp_residu")   { declencherTeleportResidu(); }
}

// Appelée chaque frame depuis mettreAJourCombat
function mettreAJourSpeciales(deltaTime) {
  mettreAJourOnde(deltaTime);
  mettreAJourProjectile(deltaTime);
  mettreAJourCharge(deltaTime);
  mettreAJourSeisme(deltaTime);
  mettreAJourLaser(deltaTime);
  mettreAJourFlammeSol(deltaTime);
  mettreAJourBouletFeu(deltaTime);
  mettreAJourTornade(deltaTime);
  mettreAJourResidus(deltaTime);
  mettreAJourTP(deltaTime);
  mettreAJourAttaqueFinale(deltaTime);
  mettreAJourDisparuInvisible(deltaTime);
}

// Appelée chaque frame depuis dessinerCombat
function dessinerSpeciales() {
  dessinerOnde();
  dessinerProjectile();
  dessinerSeisme();
  dessinerLaser();
  dessinerFlammeSol();
  dessinerBouletFeu();
  dessinerTornade();
  dessinerResidus();
}

// ---- Helper dégâts spéciaux ----

function appliquerDegatsSpeciaux(mult) {
  if (!combatEnCours || combattant.invincible) { return; }
  let g      = monumentEnCombat.gardien;
  let degats = Math.floor(Math.max(1, g.attaque + Math.floor(Math.random() * 6)) * mult);
  joueur.hp -= degats;
  combattant.invincible      = true;
  combattant.timerInvincible = combattant.DUREE_INVINCIBLE * 1.5;

  let pct = degats / joueur.hpMax;
  if      (pct < 0.10) { jouerAnimationHit(1); }
  else if (pct < 0.20) { jouerAnimationHit(2); }
  else if (pct < 0.35) { jouerAnimationHit(3); }
  else                 { jouerAnimationHit(4); }
  setTimeout(function() { if (combatEnCours) { setAnimation("idle"); } }, 400);

  if (joueur.hp <= 0) {
    joueur.hp = 0;
    jouerAnimationMort();
    mettreAJourHUDJoueur(); mettreAJourHUDNavbar();
    setTimeout(function() { terminerCombat(false); }, 1500);
    return;
  }
  mettreAJourHUDJoueur(); mettreAJourHUDNavbar();
}

// ============================================================
// 1. ONDE DE CHOC — Tour Eiffel, Acropole
// ============================================================

function declencherOndeDeChoc() {
  monstre.ondeActuelle = {
    x:          monstre.x + (monstre.regardeADroite ? monstre.largeur : 0),
    y:          monstre.y + monstre.hauteur - 20,
    vx:         monstre.regardeADroite ? 7 : -7,
    rayon:      30,
    actif:      true,
    aDejaTouch: false
  };
}

function mettreAJourOnde(deltaTime) {
  let o = monstre.ondeActuelle;
  if (!o || !o.actif) { return; }
  o.x += o.vx;
  if (!o.aDejaTouch && !combattant.invincible) {
    let dx = (combattant.x + combattant.largeur / 2) - o.x;
    let dy = (combattant.y + combattant.hauteur / 2) - o.y;
    if (Math.sqrt(dx * dx + dy * dy) < o.rayon + combattant.largeur / 2) {
      o.aDejaTouch = true;
      appliquerDegatsSpeciaux(1.8);
    }
  }
  if (o.x < -60 || o.x > canvasCombat.width + 60) { monstre.ondeActuelle = null; }
}

function dessinerOnde() {
  let o = monstre.ondeActuelle;
  if (!o || !o.actif) { return; }
  let r = o.rayon + Math.sin(Date.now() / 80) * 5;
  let g = ctxCombat.createRadialGradient(o.x, o.y, 0, o.x, o.y, r * 2.5);
  g.addColorStop(0,   "rgba(255,200,50,0.55)");
  g.addColorStop(0.5, "rgba(255,120,20,0.25)");
  g.addColorStop(1,   "rgba(255,80,0,0)");
  ctxCombat.beginPath();
  ctxCombat.arc(o.x, o.y, r * 2.5, 0, Math.PI * 2);
  ctxCombat.fillStyle = g; ctxCombat.fill();
  ctxCombat.beginPath();
  ctxCombat.arc(o.x, o.y, r, 0, Math.PI * 2);
  ctxCombat.strokeStyle = "rgba(255,220,80,0.95)";
  ctxCombat.lineWidth   = 3; ctxCombat.stroke();
  ctxCombat.fillStyle    = "rgba(255,240,120,0.9)";
  ctxCombat.font         = Math.floor(r * 0.9) + "px serif";
  ctxCombat.textAlign    = "center";
  ctxCombat.textBaseline = "middle";
  ctxCombat.fillText("⚡", o.x, o.y);
  ctxCombat.textBaseline = "alphabetic";
  ctxCombat.textAlign    = "left";
}

// ============================================================
// 2. PROJECTILE DORÉ — Kinkaku-Ji
// Taille correcte, orienté selon la direction du tir
// ============================================================

function declencherProjectile() {
  let cfg  = getConfigMonstre();
  let dirX = (combattant.x + combattant.largeur / 2) - (monstre.x + monstre.largeur / 2);
  let dirY = (combattant.y + combattant.hauteur / 2) - (monstre.y + monstre.hauteur / 2);
  let dist = Math.sqrt(dirX * dirX + dirY * dirY);
  if (dist < 1) { dist = 1; }
  let vit = cfg.VITESSE_PROJECTILE || 6;

  monstre.projectileActuel = {
    x:            monstre.x + (monstre.regardeADroite ? monstre.largeur : 0),
    y:            monstre.y + monstre.hauteur * 0.4,
    vx:           (dirX / dist) * vit,
    vy:           (dirY / dist) * vit,
    versGauche:   dirX < 0,
    distMax:      400,
    distParcouru: 0,
    actif:        true,
    aDejaTouch:   false
  };
}

function mettreAJourProjectile(deltaTime) {
  let p = monstre.projectileActuel;
  if (!p || !p.actif) { return; }
  p.x += p.vx;
  p.y += p.vy;
  p.distParcouru += Math.sqrt(p.vx * p.vx + p.vy * p.vy);

  if (!p.aDejaTouch && !combattant.invincible) {
    let dx = (combattant.x + combattant.largeur / 2) - p.x;
    let dy = (combattant.y + combattant.hauteur / 2) - p.y;
    if (Math.sqrt(dx * dx + dy * dy) < 32) {
      p.aDejaTouch = true;
      appliquerDegatsSpeciaux(1.8);
      monstre.projectileActuel = null;
      return;
    }
  }
  if (p.distParcouru > p.distMax || p.x < -70 || p.x > canvasCombat.width + 70 ||
      p.y < -70 || p.y > canvasCombat.height + 70) {
    monstre.projectileActuel = null;
  }
}

function dessinerProjectile() {
  let p = monstre.projectileActuel;
  if (!p || !p.actif) { return; }

  let cfg = getConfigMonstre();
  let img = monstreImages[cfg.dossier + "Special Projectile"];

  // Taille : 40% de la hauteur du monstre (était 25%, trop petit)
  let h = Math.round(monstre.hauteur * 0.4);
  let w = h;

  // Angle de rotation basé sur la vélocité réelle du projectile
  let angle = Math.atan2(p.vy, p.vx);

  ctxCombat.save();
  ctxCombat.translate(p.x, p.y);
  ctxCombat.rotate(angle);

  if (img && img.complete && img.naturalWidth > 0) {
    w = Math.round(img.naturalWidth * (h / img.naturalHeight));
    ctxCombat.drawImage(img, -w / 2, -h / 2, w, h);
  } else {
    ctxCombat.beginPath();
    ctxCombat.arc(0, 0, 12, 0, Math.PI * 2);
    ctxCombat.fillStyle = "rgba(255,200,50,0.9)";
    ctxCombat.fill();
  }

  ctxCombat.restore();
}

// ============================================================
// 3. CHARGE EN LIGNE — Taj Mahal
// Pas de détection de collision (source de crash).
// À la place : onde de dégâts pendant la course.
// ============================================================

let chargeEtat  = "inactif";
let chargeTimer = 0;

function declencherCharge() {
  let cfg        = getConfigMonstre();
  chargeEtat     = "demarrage";
  chargeTimer    = 0;
  monstre.enCharge = true;
  monstre.velociteX = 0;
  setAnimMonstre("special");
  monstre.frameAnim = 0;

  // Après les 2 premières frames → lancer la course
  setTimeout(function() {
    if (!combatEnCours || !monstre.enCharge) { return; }
    chargeEtat        = "course";
    let vit           = (cfg.VITESSE_CHARGE || 10) * 1.5;
    monstre.velociteX = monstre.regardeADroite ? vit : -vit;
  }, getAnimData("special").duree * 2);

  // Fin de la charge après 2 secondes
  setTimeout(function() {
    if (!combatEnCours) { return; }
    chargeEtat        = "inactif";
    monstre.enCharge  = false;
    monstre.velociteX = 0;
    monstre.etat      = "idle";
    setAnimMonstre("idle");
  }, 2000);
}

function mettreAJourCharge(deltaTime) {
  if (!monstre.enCharge || chargeEtat !== "course") { return; }

  chargeTimer += deltaTime;

  // Alterner frames Special 3 et 4 pendant la course
  let dureeFrame = getAnimData("special").duree;
  if (chargeTimer >= dureeFrame) {
    chargeTimer       = 0;
    monstre.frameAnim = (monstre.frameAnim === 2) ? 3 : 2;
  }

  // Zone verte : forcer saut
  let cx = monstre.x + monstre.largeur / 2;
  let by = monstre.y + monstre.hauteur - 4;
  if (estVide(cx, by) && monstre.auSol) {
    monstre.velociteY = FORCE_SAUT * 0.8;
    monstre.auSol     = false;
  }

  // Onde de dégâts autour du monstre pendant la course (pas de contact direct)
  if (!combattant.invincible) {
    let mcx = monstre.x + monstre.largeur / 2;
    let mcy = monstre.y + monstre.hauteur / 2;
    let jcx = combattant.x + combattant.largeur / 2;
    let jcy = combattant.y + combattant.hauteur / 2;
    let dx  = jcx - mcx;
    let dy  = jcy - mcy;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 120) {
      appliquerDegatsSpeciaux(1.8);
    }
  }
}

// ============================================================
// 4. SÉISME — Christ Rédempteur
// ============================================================

let seismeActuel = null;

function declencherSeisme() {
  let cfg = getConfigMonstre();
  seismeActuel = {
    x: monstre.x + monstre.largeur / 2,
    y: monstre.y + monstre.hauteur,
    rayon: cfg.RAYON_SEISME || 250,
    timer: 0, duree: 1000,
    actif: true, aDejaTouch: false
  };
}

function mettreAJourSeisme(deltaTime) {
  if (!seismeActuel || !seismeActuel.actif) { return; }
  seismeActuel.timer += deltaTime;
  if (!seismeActuel.aDejaTouch && !combattant.invincible) {
    let dx   = (combattant.x + combattant.largeur / 2) - seismeActuel.x;
    let dy   = (combattant.y + combattant.hauteur)     - seismeActuel.y;
    if (Math.sqrt(dx * dx + dy * dy) < seismeActuel.rayon) {
      seismeActuel.aDejaTouch = true;
      appliquerDegatsSpeciaux(1.8);
    }
  }
  if (seismeActuel.timer >= seismeActuel.duree) { seismeActuel = null; }
}

function dessinerSeisme() {
  if (!seismeActuel || !seismeActuel.actif) { return; }
  let prog = seismeActuel.timer / seismeActuel.duree;
  let r    = seismeActuel.rayon * prog;
  ctxCombat.save();
  ctxCombat.globalAlpha = (1 - prog) * 0.6;
  ctxCombat.strokeStyle = "#c8a040";
  ctxCombat.lineWidth   = 8;
  ctxCombat.beginPath();
  ctxCombat.ellipse(seismeActuel.x, seismeActuel.y, r, r * 0.25, 0, 0, Math.PI * 2);
  ctxCombat.stroke();
  ctxCombat.restore();
}
