// ============================================================
// COMBAT-HUD.JS
// Dessin du combat : fond, sprites, effets, HUD, inventaire
// ============================================================

// ============================================================
// DESSIN PRINCIPAL
// ============================================================

function dessinerCombat() {
  if (!combatEnCours || ctxCombat === null) { return; }

  let larg = canvasCombat.width;
  let haut = canvasCombat.height;

  ctxCombat.clearRect(0, 0, larg, haut);

  if (fondCombatCharge) {
    // Le fond est toujours dessiné à la taille exacte du canvas
    // La carte de collision est mise à l'échelle au même ratio dans ecranVersCollision
    ctxCombat.drawImage(fondCombat, 0, 0, larg, haut);
  } else {
    ctxCombat.fillStyle = "#1a2a1a";
    ctxCombat.fillRect(0, 0, larg, haut);
  }

  // Monstre normal (sauf si en disparition)
  if (!monstre.enDisparition) {
    dessinerMonstre();
  } else {
    // Affiche l'image de disparition/tp à la place
    dessinerMonstreInvisible();
  }

  // Tous les effets spéciaux (projectile, onde, laser, flamme, résidus, tornade…)
  dessinerSpeciales();

  dessinerJoueurCombat();
  dessinerHUDCombat();
}

// ============================================================
// JOUEUR — utilise frameTimer de sprites.js, pas Date.now()
// ============================================================

function dessinerJoueurCombat() {
  if (combattant.invincible && Math.floor(Date.now() / 80) % 2 === 0) { return; }

  if (!spritesheetChargee) {
    ctxCombat.fillStyle = "#2980b9";
    ctxCombat.fillRect(combattant.x, combattant.y, combattant.largeur, combattant.hauteur);
    return;
  }

  let piedX = combattant.x + combattant.largeur / 2;
  let piedY = combattant.y + combattant.hauteur;

  // On ne change l'animation que si on n'est pas en hit ou mort
  let estHitOuMort = (
    animationCourante === "hit_leger"      ||
    animationCourante === "hit_moyen"      ||
    animationCourante === "hit_fort"       ||
    animationCourante === "hit_critique_d" ||
    animationCourante === "hit_critique_g" ||
    animationCourante === "mort"
  );

  if (!estHitOuMort) {
    if (combattant.velociteX !== 0) {
      setAnimation("marche_profil");
    } else {
      setAnimation("idle");
    }
  }

  // On utilise frameIndex de sprites.js (mis à jour par mettreAJourAnimationJoueur)
  let frames = ANIMATIONS[animationCourante];
  if (!frames || frames.length === 0) { return; }

  let nomFrame = frames[frameIndex % frames.length];
  dessinerUnSpriteCombat(nomFrame, piedX, piedY, !combattant.regardeADroite);
}

function dessinerUnSpriteCombat(nomFichier, piedX, piedY, miroir) {
  let img = spritesJoueur[nomFichier];
  if (!img || !img.complete || img.naturalWidth === 0) { return; }

  let hauteur = HAUTEUR_SPRITE_COMBAT;
  let largeur = Math.round(img.naturalWidth * (hauteur / img.naturalHeight));

  let echelle    = hauteur / img.naturalHeight;
  let offsetPied = Math.round((OFFSET_PIEDS[nomFichier] || 0) * echelle);

  let estMort    = nomFichier.startsWith("mort");
  let estHitG    = nomFichier === "hit_g3";
  let doitMiroir = miroir && !estMort && !estHitG;

  if (doitMiroir) {
    ctxCombat.save();
    ctxCombat.translate(piedX, piedY + offsetPied);
    ctxCombat.scale(-1, 1);
    ctxCombat.drawImage(img, -largeur / 2, -hauteur, largeur, hauteur);
    ctxCombat.restore();
  } else {
    ctxCombat.drawImage(img, piedX - largeur / 2, piedY - hauteur + offsetPied, largeur, hauteur);
  }
}

// ============================================================
// MONSTRE
// ============================================================

function dessinerMonstre() {
  let animData = getAnimData(monstre.animCourante);
  if (!animData) { return; }

  let idx      = Math.min(monstre.frameAnim, animData.frames.length - 1);
  let nomFrame = animData.frames[idx];
  let img      = getImageFrame(nomFrame);

  if (!img) {
    ctxCombat.fillStyle = "#8B3A3A";
    ctxCombat.fillRect(monstre.x, monstre.y, monstre.largeur, monstre.hauteur);
    return;
  }

  let ratio = img.height / img.width;
  let affH  = monstre.hauteur;
  let affW  = affH / ratio;
  let affX  = monstre.x + (monstre.largeur - affW) / 2;
  let affY  = monstre.y;

  if (!monstre.regardeADroite) {
    ctxCombat.save();
    ctxCombat.translate(affX + affW, affY);
    ctxCombat.scale(-1, 1);
    ctxCombat.drawImage(img, 0, 0, affW, affH);
    ctxCombat.restore();
  } else {
    ctxCombat.drawImage(img, affX, affY, affW, affH);
  }

  // Halo protection (Acropole)
  if (monstre.enProtection) {
    ctxCombat.save();
    ctxCombat.globalAlpha = 0.18 + 0.06 * Math.sin(Date.now() / 120);
    let halo = ctxCombat.createRadialGradient(
      affX + affW / 2, affY + affH / 2, affW * 0.1,
      affX + affW / 2, affY + affH / 2, affW * 0.9
    );
    halo.addColorStop(0, "rgba(80,160,255,0.5)");
    halo.addColorStop(1, "rgba(80,160,255,0)");
    ctxCombat.fillStyle = halo;
    ctxCombat.fillRect(affX - 20, affY - 20, affW + 40, affH + 40);
    ctxCombat.restore();
  }
}

// ============================================================
// HUD — barre monstre centrée sous la navbar
// ============================================================

function dessinerHUDCombat() {
  if (monumentEnCombat === null) { return; }

  let larg    = canvasCombat.width;
  let gardien = monumentEnCombat.gardien;

  dessinerBarreMonstreCombat(larg / 2, 108, 280, gardien.hp, gardien.hpMax, gardien.nom || "Gardien");

  ctxCombat.fillStyle = "rgba(255,255,255,0.28)";
  ctxCombat.font      = "11px Arial";
  ctxCombat.textAlign = "center";
  ctxCombat.fillText("Saute sur la tête pour attaquer   I = Inventaire   Échap = Fuir", larg / 2, canvasCombat.height - 10);
  ctxCombat.textAlign = "left";
}

function dessinerBarreMonstreCombat(cx, y, largeur, hp, hpMax, nom) {
  let pourcent = Math.max(0, Math.min(1, hp / hpMax));
  let hauteur  = 18;
  let x        = cx - largeur / 2;

  ctxCombat.fillStyle = "#000";
  ctxCombat.beginPath();
  arrondi(ctxCombat, x - 5, y - 5, largeur + 10, hauteur + 10, 8);
  ctxCombat.fill();

  let gradBord = ctxCombat.createLinearGradient(x, y - 4, x, y + hauteur + 4);
  gradBord.addColorStop(0, "#758278");
  gradBord.addColorStop(1, "#445159");
  ctxCombat.fillStyle = gradBord;
  ctxCombat.beginPath();
  arrondi(ctxCombat, x - 4, y - 4, largeur + 8, hauteur + 8, 6);
  ctxCombat.fill();

  ctxCombat.fillStyle = "#000";
  ctxCombat.beginPath();
  arrondi(ctxCombat, x - 1, y - 1, largeur + 2, hauteur + 2, 4);
  ctxCombat.fill();

  ctxCombat.fillStyle = "#9a3a3a";
  ctxCombat.beginPath();
  arrondi(ctxCombat, x, y, largeur, hauteur, 3);
  ctxCombat.fill();

  if (pourcent > 0) {
    let gradHP = ctxCombat.createLinearGradient(x, y, x, y + hauteur);
    gradHP.addColorStop(0, "#EF9A9A");
    gradHP.addColorStop(1, "#E53935");
    ctxCombat.fillStyle = gradHP;
    ctxCombat.save();
    ctxCombat.beginPath();
    arrondi(ctxCombat, x, y, largeur, hauteur, 3);
    ctxCombat.clip();
    ctxCombat.fillRect(x, y, largeur * pourcent, hauteur);
    ctxCombat.restore();

    ctxCombat.save();
    ctxCombat.beginPath();
    arrondi(ctxCombat, x, y, largeur * pourcent, hauteur, 3);
    ctxCombat.clip();
    ctxCombat.fillStyle = "rgba(255,255,255,0.22)";
    ctxCombat.fillRect(x, y, largeur * pourcent, hauteur * 0.35);
    ctxCombat.restore();
  }

  ctxCombat.fillStyle   = "rgba(255,255,255,0.92)";
  ctxCombat.font        = "bold 10px Arial";
  ctxCombat.textAlign   = "center";
  ctxCombat.shadowColor = "rgba(0,0,0,0.8)";
  ctxCombat.shadowBlur  = 4;
  ctxCombat.fillText(nom + "  " + hp + " / " + hpMax, cx, y + hauteur - 4);
  ctxCombat.shadowBlur  = 0;
  ctxCombat.fillStyle   = "rgba(255,255,255,0.60)";
  ctxCombat.font        = "10px Arial";
  ctxCombat.fillText(nom, cx, y - 7);
  ctxCombat.textAlign   = "left";
}

function arrondi(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ============================================================
// INVENTAIRE COMBAT
// ============================================================

function basculerInventaireCombat() {
  inventaireOuvert = !inventaireOuvert;
  document.getElementById("inventory-screen").style.display = inventaireOuvert ? "block" : "none";
  if (inventaireOuvert) { mettreAJourInventaireAffichage(); }
}

function mettreAJourInventaireAffichage() {
  let h = document.getElementById("count-potion-heal");
  let b = document.getElementById("count-potion-boost");
  if (h) { h.textContent = "x" + inventaire["potion-heal"];  }
  if (b) { b.textContent = "x" + inventaire["potion-boost"]; }
}

function useItem(type) {
  if (type === "potion-heal") {
    if (inventaire["potion-heal"] <= 0) { return; }
    if (joueur.hp >= joueur.hpMax)      { return; }
    inventaire["potion-heal"]--;
    joueur.hp = Math.min(joueur.hp + 30, joueur.hpMax);
    mettreAJourHUDJoueur();
    mettreAJourHUDNavbar();
  }
  if (type === "potion-boost") {
    if (inventaire["potion-boost"] <= 0) { return; }
    inventaire["potion-boost"]--;
    combattant.attackBoost      = 10;
    combattant.attackBoostTours = combattant.attackBoostTours + 5;
    mettreAJourBoostNavbar();
  }
  mettreAJourInventaireAffichage();
}

function afficherLog(texte) { /* désactivé */ }

function mettreAJourBarresCombat() {
  let fillJ = document.getElementById("player-combat-hp-fill");
  let textJ = document.getElementById("player-combat-hp-text");
  if (fillJ) { fillJ.style.width = (joueur.hp / joueur.hpMax * 100) + "%"; }
  if (textJ) { textJ.textContent = joueur.hp + "/" + joueur.hpMax; }
  if (!monumentEnCombat) { return; }
  let g     = monumentEnCombat.gardien;
  let fillG = document.getElementById("enemy-combat-hp-fill");
  let textG = document.getElementById("enemy-combat-hp-text");
  if (fillG) { fillG.style.width = (g.hp / g.hpMax * 100) + "%"; }
  if (textG) { textG.textContent = g.hp + "/" + g.hpMax; }
}
