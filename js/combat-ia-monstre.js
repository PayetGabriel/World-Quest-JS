// ============================================================
// COMBAT-IA-MONSTRE.JS — IA et animation du monstre
// ============================================================

function setAnimMonstre(nom) {
  if (monstre.animCourante === nom) { return; }
  monstre.animCourante = nom;
  monstre.frameAnim    = 0;
  monstre.timerAnim    = 0;
  monstre.animTerminee = false;
}

function mettreAJourAnimMonstre(deltaTime) {
  let animData = getAnimData(monstre.animCourante);
  if (!animData) { return; }

  monstre.timerAnim += deltaTime;
  if (monstre.timerAnim >= animData.duree) {
    monstre.timerAnim = 0;
    monstre.frameAnim++;
    if (monstre.frameAnim >= animData.frames.length) {
      let bouclent = ["idle", "move", "protection"];
      if (bouclent.indexOf(monstre.animCourante) !== -1) {
        monstre.frameAnim = 0;
      } else {
        monstre.frameAnim    = animData.frames.length - 1;
        monstre.animTerminee = true;
      }
    }
  }
}

// ============================================================
// IA MONSTRE
// Les délais d'attaque sont variés aléatoirement (+/- 30%)
// pour éviter le pattern robotique.
// ============================================================

function mettreAJourIAMonstre(deltaTime) {
  if (monstre.etat === "mort")       { return; }
  if (!collisionsCombatChargees)     { return; }
  if (monstre.enDisparition)         { return; }

  let cfg     = getConfigMonstre();
  let distX   = (combattant.x + combattant.largeur / 2) - (monstre.x + monstre.largeur / 2);
  let distAbs = Math.abs(distX);

  monstre.regardeADroite = distX > 0;

  monstre.timerAttaque   += deltaTime;
  monstre.timerSpecial   += deltaTime;
  monstre.timerSaut      += deltaTime;
  monstre.timerProtection += deltaTime;

  // ---- Protection (Acropole) ----
  if (cfg.DELAI_PROTECTION && !monstre.enProtection &&
      monstre.etat !== "attaque" && monstre.etat !== "special") {
    if (monstre.timerProtection >= cfg.DELAI_PROTECTION) {
      monstre.timerProtection = 0;
      monstre.enProtection    = true;
      monstre.etat            = "protection";
      monstre.velociteX       = 0;
      setAnimMonstre("protection");
      setTimeout(function() {
        if (combatEnCours && monstre.etat === "protection") {
          monstre.enProtection = false;
          monstre.etat         = "marche";
        }
      }, cfg.DUREE_PROTECTION);
      return;
    }
  }
  if (monstre.enProtection) { return; }

  // ---- Saut d'évitement ----
  // Délai aléatoire : ±30% autour du délai de base
  let delaiSautEffectif = cfg.DELAI_SAUT * (0.7 + Math.random() * 0.6);
  if (monstre.timerSaut >= delaiSautEffectif && monstre.auSol &&
      monstre.etat !== "attaque" && monstre.etat !== "special") {
    monstre.timerSaut = 0;
    monstre.velociteY = FORCE_SAUT;
    monstre.auSol     = false;
    monstre.etat      = "saut";
    setAnimMonstre("move");
  }

  // ---- Attaque spéciale ----
  let delaiSpecialEffectif = cfg.DELAI_SPECIAL * (0.8 + Math.random() * 0.4);
  if (monstre.timerSpecial >= delaiSpecialEffectif &&
      monstre.etat !== "attaque" && monstre.etat !== "special") {
    monstre.timerSpecial = 0;
    monstre.timerAttaque = 0;
    monstre.etat         = "special";
    monstre.velociteX    = 0;
    setAnimMonstre("special");

    let totalFrames = getAnimData("special").frames.length;
    let delai       = totalFrames * getAnimData("special").duree * 0.6;
    setTimeout(function() {
      if (combatEnCours && monstre.etat === "special") { declencherSpeciale(); }
    }, delai);
    return;
  }

  // ---- Attaque normale ----
  // Portée élargie pour les boss rapides, délai aléatoire
  let porteeAttaque        = cfg.DELAI_ATTAQUE < 2000 ? 200 : 170;
  let delaiAttaqueEffectif = cfg.DELAI_ATTAQUE * (0.75 + Math.random() * 0.5);

  if (monstre.timerAttaque >= delaiAttaqueEffectif && distAbs < porteeAttaque &&
      monstre.etat !== "attaque" && monstre.etat !== "special") {
    monstre.timerAttaque = 0;
    monstre.etat         = "attaque";
    monstre.velociteX    = 0;
    setAnimMonstre("attack");

    // Pyramides : tornade lancée à la dernière frame de l'attaque
    if (cfg.typeSpeciale === "disparition") {
      let totalA = getAnimData("attack").frames.length;
      let delaiT = totalA * getAnimData("attack").duree;
      setTimeout(function() {
        if (combatEnCours && monstre.etat === "attaque") { declencherTornade(); }
      }, delaiT);
    }

    // Statue de la Liberté : choc visuel après la 2e frame, puis boulet de feu
    if (cfg.typeSpeciale === "flamme_sol") {
      let dureeFrame = getAnimData("attack").duree;
      setTimeout(function() {
        if (combatEnCours && monstre.etat === "attaque") { declencherChocVisuel(); }
      }, dureeFrame * 2);
      setTimeout(function() {
        if (combatEnCours && monstre.etat === "attaque") { declencherBouletFeu(); }
      }, dureeFrame * 3);
    }
    return;
  }

  // ---- Retour marche/idle ----
  if ((monstre.etat === "attaque" || monstre.etat === "special" ||
       monstre.etat === "hit"     || monstre.etat === "saut") && monstre.animTerminee) {
    monstre.etat = "marche";
  }
  if (monstre.etat === "saut" && monstre.auSol && monstre.velociteY === 0) {
    monstre.etat = "marche";
  }

  // ---- Déplacement ----
  if (monstre.etat === "idle" || monstre.etat === "marche") {
    if (distAbs > 150) {
      monstre.etat      = "marche";
      monstre.velociteX = monstre.regardeADroite ? 2.2 : -2.2;
      setAnimMonstre("move");
    } else {
      monstre.etat      = "idle";
      monstre.velociteX = 0;
      setAnimMonstre("idle");
    }
  }
}
