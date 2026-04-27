// ============================================================
// DEV.JS
// Mode développeur : collisions, PV, tuer boss, valider niveau
// ============================================================

let devModeActif       = false;
let afficherCollisions = false;
let canvasDev          = null;
let ctxDev             = null;
let panneauDev         = null;

// Ordre strict de validation des niveaux
const ORDRE_MONUMENTS = [
  "tour-eiffel",
  "acropole",
  "kinkakuji",
  "taj-mahal",
  "christ-redeempteur",
  "burj-khalifa",
  "statue-liberte",
  "pyramides",
  "colisee",
];

function initialiserDev() {
  canvasDev                     = document.createElement("canvas");
  canvasDev.width               = CANVAS_LARGEUR;
  canvasDev.height              = CANVAS_HAUTEUR;
  canvasDev.style.position      = "absolute";
  canvasDev.style.top           = "0";
  canvasDev.style.left          = "0";
  canvasDev.style.pointerEvents = "none";
  canvasDev.style.display       = "none";
  document.getElementById("game-wrapper").appendChild(canvasDev);
  ctxDev = canvasDev.getContext("2d");

  panneauDev                    = document.createElement("div");
  panneauDev.style.position     = "absolute";
  panneauDev.style.top          = "10px";
  panneauDev.style.right        = "10px";
  panneauDev.style.background   = "rgba(0,0,0,0.85)";
  panneauDev.style.border       = "1px solid #f0c040";
  panneauDev.style.borderRadius = "8px";
  panneauDev.style.padding      = "10px 14px";
  panneauDev.style.color        = "white";
  panneauDev.style.fontSize     = "12px";
  panneauDev.style.display      = "none";
  panneauDev.style.lineHeight   = "1.8";
  panneauDev.style.zIndex       = "999";
  panneauDev.innerHTML = `
    <div style="color:#f0c040;font-size:13px;margin-bottom:6px;">MODE DEV</div>
    <div><b>O</b> — Afficher/cacher collisions</div>
    <div><b>K</b> — Remettre PV à fond</div>
    <div><b>L</b> — Tuer le boss en cours</div>
    <div><b>V</b> — Valider le prochain niveau non complété</div>
    <div style="margin-top:8px;color:#888;font-size:11px;">P pour fermer</div>
  `;
  document.getElementById("game-wrapper").appendChild(panneauDev);

  document.addEventListener("keydown", function(event) {

    // P — ouvrir/fermer
    if (event.key === "p" || event.key === "P") {
      devModeActif = !devModeActif;
      if (devModeActif) {
        panneauDev.style.display = "block";
        canvasDev.style.display  = "block";
      } else {
        panneauDev.style.display = "none";
        canvasDev.style.display  = "none";
        afficherCollisions       = false;
        ctxDev.clearRect(0, 0, CANVAS_LARGEUR, CANVAS_HAUTEUR);
      }
    }

    // O — overlay collisions
    if ((event.key === "o" || event.key === "O") && devModeActif) {
      afficherCollisions = !afficherCollisions;
      if (!afficherCollisions) { ctxDev.clearRect(0, 0, CANVAS_LARGEUR, CANVAS_HAUTEUR); }
    }

    // K — PV max
    if ((event.key === "k" || event.key === "K") && devModeActif) {
      joueur.hp = joueur.hpMax;
      mettreAJourHUDJoueur();
      mettreAJourHUDNavbar();
      if (combatEnCours) { mettreAJourBarresCombat(); }
    }

    // L — tuer le boss
    if ((event.key === "l" || event.key === "L") && devModeActif) {
      if (combatEnCours && monumentEnCombat !== null) {
        monumentEnCombat.gardien.hp = 0;
        mettreAJourBarresCombat();
        setTimeout(function() { terminerCombat(true); }, 400);
      }
    }

    // V — valider le prochain niveau dans l'ordre strict
    if ((event.key === "v" || event.key === "V") && devModeActif) {
      if (combatEnCours && monumentEnCombat !== null) {
        // En combat : victoire immédiate
        monumentEnCombat.gardien.hp = 0;
        setTimeout(function() { terminerCombat(true); }, 200);
        return;
      }

      // Hors combat : trouver le premier monument non validé dans l'ordre strict
      let aValider = null;
      for (let i = 0; i < ORDRE_MONUMENTS.length; i++) {
        let id = ORDRE_MONUMENTS[i];
        // Chercher ce monument dans le tableau MONUMENTS
        for (let j = 0; j < MONUMENTS.length; j++) {
          if (MONUMENTS[j].id === id && !MONUMENTS[j].decouvert) {
            aValider = MONUMENTS[j];
            break;
          }
        }
        if (aValider !== null) { break; }
      }

      if (aValider !== null) {
        aValider.decouvert = true;
        donnerPointCompetence();
        mettreAJourSucces();
        debloquerZoneSuivante(aValider.nom);
        afficherMessage("[DEV] Validé : " + aValider.nom);
      } else {
        afficherMessage("[DEV] Tous les niveaux sont déjà validés.");
      }
    }

  });
}

function dessinerOverlayCollisions() {
  ctxDev.clearRect(0, 0, CANVAS_LARGEUR, CANVAS_HAUTEUR);
  let pas = 8;
  for (let ex = 0; ex < CANVAS_LARGEUR; ex += pas) {
    for (let ey = 0; ey < CANVAS_HAUTEUR; ey += pas) {
      let mx = camera.x + (ex / CANVAS_LARGEUR) * camera.largeur;
      let my = camera.y + (ey / CANVAS_HAUTEUR) * camera.hauteur;
      if (estBloque(mx, my)) {
        ctxDev.fillStyle = "rgba(255,0,0,0.4)";
        ctxDev.fillRect(ex, ey, pas, pas);
      }
    }
  }
}

function mettreAJourDev() {
  ctxDev.clearRect(0, 0, CANVAS_LARGEUR, CANVAS_HAUTEUR);
  if (afficherCollisions) { dessinerOverlayCollisions(); }
  if (!devModeActif) { return; }

  let pos = mapVersEcran(joueur.x, joueur.y);
  if (!pos) { return; }

  ctxDev.fillStyle = "rgba(0,0,0,0.6)";
  ctxDev.fillRect(10, CANVAS_HAUTEUR - 40, 260, 28);
  ctxDev.fillStyle = "#f0c040";
  ctxDev.font      = "13px Arial";
  ctxDev.fillText("x: " + Math.round(joueur.x) + "   y: " + Math.round(joueur.y), 18, CANVAS_HAUTEUR - 21);
}
