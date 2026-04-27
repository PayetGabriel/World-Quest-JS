// ============================================================
// SPRITES.JS
// Gère les images découpées du joueur (dossier assets/sprites/)
// ============================================================

// On stocke toutes les images chargées dans cet objet
// La clé est le nom du fichier sans extension
const spritesJoueur = {};
let spritesheetChargee = false;

// Pour que les anciens appels à spritesheetJoueur ne cassent pas combat.js
let spritesheetJoueur = null;

// Liste de tous les fichiers à charger
const FICHIERS_SPRITES = [
  "bas_d1", "bas_d2", "bas_d3", "bas_d4",
  "haut_d1", "haut_d2", "haut_d3", "haut_d4",
  "hit_d1", "hit_d2", "hit_d3", "hit_d4",
  "hit_g3",
  "idle_d4", "idle_d5",
  "mort1", "mort2", "mort3", "mort4",
  "vertical_d1", "vertical_d2", "vertical_d3", "vertical_d4"
];

// Définition des animations
// Chaque animation est une liste de noms de fichiers dans l'ordre
const ANIMATIONS = {
  "marche_bas":     ["bas_d1", "bas_d2", "bas_d3", "bas_d4"],
  "marche_haut":    ["haut_d1", "haut_d2", "haut_d3", "haut_d4"],
  "marche_profil":  ["vertical_d1", "vertical_d2", "vertical_d3", "vertical_d4"],
  "idle":           ["idle_d4", "idle_d5"],
  "mort":           ["mort1", "mort2", "mort3", "mort4"],
  // Les hit ne sont pas des animations en boucle, on les choisit selon les dégâts
  "hit_leger":      ["hit_d4"],
  "hit_moyen":      ["hit_d1"],
  "hit_fort":       ["hit_d2"],
  "hit_critique_d": ["hit_d3"],
  "hit_critique_g": ["hit_g3"]
};

// État de l'animation courante
let animationCourante = "idle";
let frameIndex = 0;
let frameTimer = 0;
let regardeAGauche = false;
const DUREE_FRAME      = 150;  // ms par frame pour les animations de mouvement
const DUREE_FRAME_IDLE = 400;  // ms par frame pour l'idle (plus lent)

// Hauteur d'affichage du joueur sur la MAP (en pixels écran)
// Change cette valeur pour ajuster la taille du personnage
const HAUTEUR_SPRITE_MAP = 60;

// Hauteur d'affichage du joueur en COMBAT — change ce chiffre pour ajuster
const HAUTEUR_SPRITE_COMBAT = 70;

const OFFSET_PIEDS = {
  "vertical_d1": 15
};

// Charge toutes les images du dossier assets/sprites/
function chargerSpritesheet(callback) {
  let total = FICHIERS_SPRITES.length;
  let charges = 0;

  for (let i = 0; i < FICHIERS_SPRITES.length; i++) {
    let nom = FICHIERS_SPRITES[i];
    let img = new Image();

    img.onload = function() {
      charges = charges + 1;
      if (charges === total) {
        spritesheetChargee = true;
        callback();
      }
    };

    img.onerror = function() {
      charges = charges + 1;
      if (charges === total) {
        spritesheetChargee = true;
        callback();
      }
    };

    img.src = "assets/sprites/" + nom + ".png";
    spritesJoueur[nom] = img;
  }
}

// Met à jour l'animation selon la direction du mouvement
function mettreAJourAnimationJoueur(deltaTime, dx, dy) {

  if (dx !== 0 || dy !== 0) {
    if (dx < 0) { regardeAGauche = true; }
    if (dx > 0) { regardeAGauche = false; }

    if (dy > 0) {
      animationCourante = "marche_bas";
    } else if (dy < 0) {
      animationCourante = "marche_haut";
    } else {
      animationCourante = "marche_profil";
    }

  } else {
    animationCourante = "idle";
  }

  frameTimer = frameTimer + deltaTime;

  // L'idle est plus lente que les autres animations
  let duree = DUREE_FRAME;
  if (animationCourante === "idle") { duree = DUREE_FRAME_IDLE; }

  if (frameTimer >= duree) {
    frameTimer = 0;
    let nbFrames = ANIMATIONS[animationCourante].length;
    frameIndex = (frameIndex + 1) % nbFrames;
  }
}

// Dessine le joueur à la position écran donnée
// ecranX et ecranY correspondent au pixel bas-centre du personnage
function dessinerSprite(ctx, ecranX, ecranY) {
  if (!spritesheetChargee) { return false; }

  let frames = ANIMATIONS[animationCourante];
  if (!frames || frames.length === 0) { return false; }

  let nomFrame = frames[frameIndex % frames.length];
  dessinerUnSprite(ctx, nomFrame, ecranX, ecranY, regardeAGauche);

  return true;
}

// Dessine une image précise centrée horizontalement, collée en bas
// Si miroir est true et que ce n'est pas une image de mort ou hit_g3, on retourne
function dessinerUnSprite(ctx, nomFichier, ecranX, ecranY, miroir) {
  let img = spritesJoueur[nomFichier];
  if (!img || !img.complete || img.naturalWidth === 0) { return; }

  // Taille affichée : hauteur fixe, largeur proportionnelle
  let hauteur  = HAUTEUR_SPRITE_MAP;
  let largeur  = Math.round(img.naturalWidth * (hauteur / img.naturalHeight));

  // Offset pieds mis à l'échelle (exprimé en pixels image originale)
  let echelle     = hauteur / img.naturalHeight;
  let offsetPieds = Math.round((OFFSET_PIEDS[nomFichier] || 0) * echelle);

  // Position : centrée horizontalement, collée en bas (pieds = ecranY)
  let drawX = ecranX - largeur / 2;
  let drawY = ecranY - hauteur + offsetPieds;

  // La mort n'a pas de miroir, on dessine toujours dans le même sens
  // hit_g3 est déjà le miroir de hit_d3, on ne la retourne pas non plus
  let estMort    = nomFichier.startsWith("mort");
  let estHitG    = nomFichier === "hit_g3";
  let doitMiroir = miroir && !estMort && !estHitG;

  if (doitMiroir) {
    ctx.save();
    ctx.translate(ecranX, ecranY);
    ctx.scale(-1, 1);
    ctx.drawImage(img, -largeur / 2, -hauteur + offsetPieds, largeur, hauteur);
    ctx.restore();
  } else {
    ctx.drawImage(img, drawX, drawY, largeur, hauteur);
  }
}

// Joue une animation de hit selon l'intensité des dégâts
// intensite : 1 (léger) à 4 (critique)
// La direction (gauche/droite) est prise en compte pour le hit_critique
function jouerAnimationHit(intensite) {
  if (intensite <= 1) {
    animationCourante = "hit_leger";
  } else if (intensite === 2) {
    animationCourante = "hit_moyen";
  } else if (intensite === 3) {
    animationCourante = "hit_fort";
  } else {
    // hit critique : version gauche ou droite selon où va le joueur
    if (regardeAGauche) {
      animationCourante = "hit_critique_g";
    } else {
      animationCourante = "hit_critique_d";
    }
  }
  frameIndex = 0;
  frameTimer = 0;
}

// Joue l'animation de mort
function jouerAnimationMort() {
  animationCourante = "mort";
  frameIndex = 0;
  frameTimer = 0;
}

// Permet d'imposer une animation depuis l'extérieur (ex: combat.js)
function setAnimation(nom) {
  if (ANIMATIONS[nom] && animationCourante !== nom) {
    animationCourante = nom;
    frameIndex = 0;
    frameTimer = 0;
  }
}
