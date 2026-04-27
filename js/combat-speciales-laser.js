// ============================================================
// COMBAT-SPECIALES-LASER.JS — laser, flamme sol, boulet feu
// ============================================================

// ============================================================
// 5. LASER ÉLECTRIQUE — Burj Khalifa
// Special 3.png reste sur le monstre, c'est le monstre qui tire.
// On fait voyager une hitbox invisible + ajoute l'extension visuelle.
// ============================================================

let laserActuel = null;

function declencherLaser() {
  let cfg   = getConfigMonstre();
  let dirX  = monstre.regardeADroite ? 1 : -1;
  let startX = monstre.regardeADroite ? monstre.x + monstre.largeur : monstre.x;

  laserActuel = {
    // hitbox qui traverse l'écran
    x:           startX,
    y:           monstre.y + monstre.hauteur * 0.35,
    vx:          dirX * (cfg.VITESSE_LASER || 14),
    versGauche:  !monstre.regardeADroite,
    actif:       true,
    aDejaTouch:  false,
    // Visuel : l'image reste associée au monstre (affiché dans dessinerMonstre via anim "special")
    // On garde juste la hitbox ici
    phase:       "deplacement",
    timerStatique: 0,
    dureeStatique: 900
  };
}

function mettreAJourLaser(deltaTime) {
  if (!laserActuel || !laserActuel.actif) { return; }

  if (laserActuel.phase === "deplacement") {
    laserActuel.x += laserActuel.vx;

    if (!laserActuel.aDejaTouch && !combattant.invincible) {
      // La hitbox du laser est une bande horizontale étroite (±25px autour du centre du laser)
      let laserCentreY = laserActuel.y;
      let jx1 = combattant.x + 8;
      let jx2 = combattant.x + combattant.largeur - 8;
      let jy1 = combattant.y;
      let jy2 = combattant.y + combattant.hauteur;
      let lx  = laserActuel.x;
      // Touche uniquement si le laser passe à travers le joueur ET au bon niveau Y
      if (lx > jx1 && lx < jx2 && jy2 > laserCentreY - 25 && jy1 < laserCentreY + 25) {
        laserActuel.aDejaTouch = true;
        appliquerDegatsSpeciaux(1.8);
      }
    }

    if (laserActuel.x < -20 || laserActuel.x > canvasCombat.width + 20) {
      laserActuel.phase = "statique";
    }
  } else {
    laserActuel.timerStatique += deltaTime;
    if (laserActuel.timerStatique >= laserActuel.dureeStatique) {
      laserActuel = null;
    }
  }
}

function dessinerLaser() {
  if (!laserActuel || !laserActuel.actif) { return; }
  if (laserActuel.phase !== "deplacement") { return; }

  let cfg    = getConfigMonstre();
  let imgExt = monstreImages[cfg.dossier + "Special 3 Laser Extension"];
  if (!imgExt || !imgExt.complete || imgExt.naturalWidth === 0) { return; }

  // L'extension se colle exactement à droite (ou gauche) du monstre
  // à la même hauteur que le monstre (aligné haut)
  let h = monstre.hauteur;
  let w = Math.round(imgExt.naturalWidth * (h / imgExt.naturalHeight));

  // Y aligné sur le haut du monstre (monstre.y)
  let extY = monstre.y;

  if (monstre.regardeADroite) {
    // Extension part du bord droit du monstre
    ctxCombat.drawImage(imgExt, monstre.x + monstre.largeur, extY, w, h);
  } else {
    // Extension part du bord gauche, retournée
    ctxCombat.save();
    ctxCombat.translate(monstre.x, extY);
    ctxCombat.scale(-1, 1);
    ctxCombat.drawImage(imgExt, -w, 0, w, h);
    ctxCombat.restore();
  }
}

// ============================================================
// 6. FLAMME AU SOL — Statue de la Liberté
// Zone Special zone.png posée au sol, dégâts en boucle
// ============================================================

function declencherFlammeSol() {
  let cfg = getConfigMonstre();
  monstre.zoneAuSol = {
    x:          monstre.x + monstre.largeur / 2 - 100,
    y:          monstre.y + monstre.hauteur * 0.5,  // plus bas sur l'écran
    largeur:    200,
    hauteur:    monstre.hauteur * 0.5,
    timer:      0,
    duree:      cfg.DUREE_ZONE_FLAMME || 3000,
    actif:      true,
    aDejaTouch: false
  };
}

function mettreAJourFlammeSol(deltaTime) {
  let z = monstre.zoneAuSol;
  if (!z || !z.actif) { return; }
  z.timer += deltaTime;

  if (!z.aDejaTouch && !combattant.invincible) {
    let jx1 = combattant.x + 8;
    let jx2 = combattant.x + combattant.largeur - 8;
    let jy2 = combattant.y + combattant.hauteur;
    let jy1 = combattant.y + combattant.hauteur * 0.4;
    if (jx2 > z.x && jx1 < z.x + z.largeur && jy2 > z.y && jy1 < z.y + z.hauteur) {
      z.aDejaTouch = true;
      appliquerDegatsSpeciaux(1.8);
      setTimeout(function() { if (monstre.zoneAuSol) { monstre.zoneAuSol.aDejaTouch = false; } }, 900);
    }
  }
  if (z.timer >= z.duree) { monstre.zoneAuSol = null; }
}

function dessinerFlammeSol() {
  let z = monstre.zoneAuSol;
  if (!z || !z.actif) { return; }

  let cfg  = getConfigMonstre();
  let img  = monstreImages[cfg.dossier + "Special zone"];
  let prog = z.timer / z.duree;
  let alpha = prog > 0.66 ? (1 - (prog - 0.66) / 0.34) : 1;

  ctxCombat.save();
  ctxCombat.globalAlpha = alpha;
  if (img && img.complete && img.naturalWidth > 0) {
    let h = z.hauteur;
    let w = Math.round(img.naturalWidth * (h / img.naturalHeight));
    ctxCombat.drawImage(img, z.x + z.largeur / 2 - w / 2, z.y, w, h);
  } else {
    ctxCombat.fillStyle = "rgba(255,100,20,0.5)";
    ctxCombat.fillRect(z.x, z.y, z.largeur, z.hauteur);
  }
  ctxCombat.restore();
}

// ============================================================
// BOULET DE FEU — attaque normale Statue de la Liberté
// Lancé après Attack 2, impact = Attack choc.png
// ============================================================

let bouletFeu = null;

function declencherBouletFeu() {
  let dirX = monstre.regardeADroite ? 1 : -1;
  bouletFeu = {
    x:          monstre.x + (monstre.regardeADroite ? monstre.largeur : 0),
    y:          monstre.y + monstre.hauteur * 0.28,
    vx:         dirX * 7,
    actif:      true,
    aDejaTouch: false,
    enChoc:     false,
    chocX:      0, chocY: 0,
    chocTimer:  0
  };
}

// Déclenche l'image Attack choc sans contact — juste visuel à la position du lancement
function declencherChocVisuel() {
  bouletFeu = {
    x:         0, y: 0,
    vx:        0, actif: true,
    aDejaTouch: false,
    enChoc:    true,
    chocX:     monstre.x + (monstre.regardeADroite ? monstre.largeur * 1.2 : -monstre.largeur * 0.2),
    chocY:     monstre.y + monstre.hauteur * 0.28,
    chocTimer: 0
  };
}

function mettreAJourBouletFeu(deltaTime) {
  if (!bouletFeu || !bouletFeu.actif) { return; }

  if (bouletFeu.enChoc) {
    bouletFeu.chocTimer += deltaTime;
    if (bouletFeu.chocTimer >= 2000) { bouletFeu = null; }
    return;
  }

  bouletFeu.x += bouletFeu.vx;

  if (!bouletFeu.aDejaTouch && !combattant.invincible) {
    let dx = (combattant.x + combattant.largeur / 2) - bouletFeu.x;
    let dy = (combattant.y + combattant.hauteur / 2) - bouletFeu.y;
    if (Math.sqrt(dx * dx + dy * dy) < 28) {
      bouletFeu.aDejaTouch = true;
      bouletFeu.enChoc     = true;
      bouletFeu.chocX      = bouletFeu.x;
      bouletFeu.chocY      = bouletFeu.y;
      appliquerDegatsSpeciaux(1.4);
      return;
    }
  }
  if (bouletFeu.x < -80 || bouletFeu.x > canvasCombat.width + 80) { bouletFeu = null; }
}

function dessinerBouletFeu() {
  if (!bouletFeu || !bouletFeu.actif) { return; }
  let cfg = getConfigMonstre();

  if (bouletFeu.enChoc) {
    let img = monstreImages[cfg.dossier + "Attack choc"];
    let alph = 1 - (bouletFeu.chocTimer / 2000);
    ctxCombat.save();
    ctxCombat.globalAlpha = alph;
    if (img && img.complete && img.naturalWidth > 0) {
      let h = monstre.hauteur;
      let w = Math.round(img.naturalWidth * (h / img.naturalHeight));
      ctxCombat.drawImage(img, bouletFeu.chocX - w / 2, bouletFeu.chocY - h / 2, w, h);
    } else {
      ctxCombat.beginPath();
      ctxCombat.arc(bouletFeu.chocX, bouletFeu.chocY, 30, 0, Math.PI * 2);
      ctxCombat.fillStyle = "rgba(255,100,20,0.7)";
      ctxCombat.fill();
    }
    ctxCombat.restore();
    return;
  }

  // En vol
  ctxCombat.beginPath();
  ctxCombat.arc(bouletFeu.x, bouletFeu.y, 14, 0, Math.PI * 2);
  let g = ctxCombat.createRadialGradient(bouletFeu.x, bouletFeu.y, 0, bouletFeu.x, bouletFeu.y, 14);
  g.addColorStop(0,   "rgba(255,255,100,1)");
  g.addColorStop(0.5, "rgba(255,120,20,0.8)");
  g.addColorStop(1,   "rgba(200,50,0,0)");
  ctxCombat.fillStyle = g;
  ctxCombat.fill();
}
