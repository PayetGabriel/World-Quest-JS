let CANVAS_LARGEUR = window.innerWidth;
let CANVAS_HAUTEUR = window.innerHeight;

const canvas = document.getElementById("game-canvas");
canvas.width = CANVAS_LARGEUR;
canvas.height = CANVAS_HAUTEUR;
const ctx = canvas.getContext("2d");

initialiserCamera();

window.addEventListener("resize", function() {
  CANVAS_LARGEUR = window.innerWidth;
  CANVAS_HAUTEUR = window.innerHeight;
  canvas.width = CANVAS_LARGEUR;
  canvas.height = CANVAS_HAUTEUR;

  if (canvasDev !== null) {
    canvasDev.width = CANVAS_LARGEUR;
    canvasDev.height = CANVAS_HAUTEUR;
  }
  if (canvasBrouillard !== null) {
    canvasBrouillard.width = CANVAS_LARGEUR;
    canvasBrouillard.height = CANVAS_HAUTEUR;
    ctxBrouillard = canvasBrouillard.getContext("2d");
  }
  if (combatEnCours && canvasCombat !== null) {
    canvasCombat.width = CANVAS_LARGEUR;
    canvasCombat.height = CANVAS_HAUTEUR;
  }
  camera.largeur = CANVAS_LARGEUR / ZOOM;
  camera.hauteur = CANVAS_HAUTEUR / ZOOM;
});

let dernierTemps = 0;

function demarrerJeu() {
  particulesActives = false;
  const ecranTitre = document.getElementById("titre-screen");
  ecranTitre.style.transition = "opacity 0.6s";
  ecranTitre.style.opacity = "0";

  setTimeout(function() {
    ecranTitre.style.display = "none";
    chargerCollisions(function() {
      chargerZones(function() {
        chargerMap(function() {
          chargerSpritesheet(function() {
            initialiserDev();
            initialiserHUD();
            mettreAJourHUDJoueur();
            afficherMessage("Explore l'île et découvre les 9 monuments !");
            requestAnimationFrame(boucleDeJeu);
          });
        });
      });
    });
  }, 700);
}

function boucleDeJeu(tempsActuel) {
  const deltaTime = tempsActuel - dernierTemps;
  dernierTemps = tempsActuel;
  mettreAJourJeu(deltaTime);
  dessinerJeu();
  requestAnimationFrame(boucleDeJeu);
}

function mettreAJourJeu(deltaTime) {
  if (combatEnCours) {
    mettreAJourCombat(deltaTime);
    return;
  }

  let dx = 0;
  let dy = 0;
  if (touchesEnfoncees["ArrowLeft"] || touchesEnfoncees["q"] || touchesEnfoncees["Q"]) { dx = -1; }
  if (touchesEnfoncees["ArrowRight"] || touchesEnfoncees["d"] || touchesEnfoncees["D"]) { dx = 1; }
  if (touchesEnfoncees["ArrowUp"] || touchesEnfoncees["z"] || touchesEnfoncees["Z"]) { dy = -1; }
  if (touchesEnfoncees["ArrowDown"] || touchesEnfoncees["s"] || touchesEnfoncees["S"]) { dy = 1; }

  mettreAJourAnimationJoueur(deltaTime, dx, dy);
  deplacerJoueur();
  mettreAJourCamera(joueur);
  verifierDebloquageDepart();

  const monumentProche = verifierProximiteMonuments(joueur);
  if (monumentProche !== null) {
    demarrerCombat(monumentProche);
  }
}

function dessinerJeu() {
  ctx.clearRect(0, 0, CANVAS_LARGEUR, CANVAS_HAUTEUR);

  if (combatEnCours) {
    dessinerCombat();
  } else {
    dessinerMap(ctx, camera);
    dessinerMonuments(ctx, camera);
    dessinerJoueur(ctx);
    dessinerBrouillard();
    mettreAJourDev();
  }

  mettreAJourMinimap(mapImage);
  mettreAJourHUDNavbar();
}

let timerMessage = 0;

function afficherMessage(texte) {
  const boite = document.getElementById("message-box");
  boite.textContent = texte;
  boite.style.display = "block";
  timerMessage = 3000;
  setTimeout(function() {
    boite.style.display = "none";
  }, timerMessage);
}
