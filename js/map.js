let mapImage = null;
let mapChargee = false;

// Taille réelle de la map en pixels
const MAP_LARGEUR = 3840;
const MAP_HAUTEUR = 2095;

// Rayon de détection pour déclencher un combat (en pixels sur la map)
const RAYON_DETECTION_MONUMENT = 40;

function chargerMap(callback) {
  mapImage = new Image();
  mapImage.src = "assets/Map Upgrade.jpg";

  mapImage.onload = function() {
    mapChargee = true;
    console.log("Map chargée :", mapImage.width, "x", mapImage.height);
    callback();
  };

  mapImage.onerror = function() {
    console.error("Impossible de charger Map.png");
  };
}

// Dessine la portion visible de la map selon la position de la caméra
function dessinerMap(ctx, camera) {
  if (!mapChargee) {
    return;
  }

  // drawImage avec découpe :
  // source : sx, sy, sLargeur, sHauteur (ce qu'on prend dans l'image originale)
  // destination : dx, dy, dLargeur, dHauteur (où on le dessine sur le canvas)
  ctx.drawImage(
    mapImage,
    camera.x,        // pixel de départ horizontal dans la map
    camera.y,        // pixel de départ vertical dans la map
    camera.largeur,  // combien de pixels on prend en largeur
    camera.hauteur,  // combien de pixels on prend en hauteur
    0,               // on dessine depuis le bord gauche du canvas
    0,               // on dessine depuis le bord haut du canvas
    CANVAS_LARGEUR,  // on étire jusqu'à la largeur du canvas
    CANVAS_HAUTEUR   // on étire jusqu'à la hauteur du canvas
  );
}

// Dessine les indicateurs de monuments (point d'exclamation si pas découvert, étoile si découvert)
function dessinerMonuments(ctx, camera) {
  for (let i = 0; i < MONUMENTS.length; i++) {
    const monument = MONUMENTS[i];

    // On convertit la position du monument (sur la map) en position à l'écran
    const ecranX = (monument.x - camera.x) * (CANVAS_LARGEUR / camera.largeur);
    const ecranY = (monument.y - camera.y) * (CANVAS_HAUTEUR / camera.hauteur);

    // On ne dessine que si le monument est visible à l'écran
    if (ecranX < -30 || ecranX > CANVAS_LARGEUR + 30) {
      continue;
    }
    if (ecranY < -30 || ecranY > CANVAS_HAUTEUR + 30) {
      continue;
    }

    if (monument.decouvert) {
      // Etoile jaune si découvert
      ctx.fillStyle = "#f0c040";
      ctx.font = "36px Arial";
      ctx.textAlign = "center";
      ctx.fillText("★", ecranX, ecranY);
    } else {
      // Point d'exclamation rouge si pas encore découvert
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.beginPath();
      ctx.arc(ecranX, ecranY, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#e74c3c";
      ctx.font = "bold 28px Arial";
      ctx.textAlign = "center";
      ctx.fillText("!", ecranX, ecranY + 5);
    }
  }

  ctx.textAlign = "left";
}

// Vérifie si le joueur est assez proche d'un monument pour déclencher le combat
// Retourne le monument touché ou null
function verifierProximiteMonuments(joueur) {
  for (let i = 0; i < MONUMENTS.length; i++) {
    const monument = MONUMENTS[i];

    if (monument.decouvert) {
      continue;
    }

    const distanceX = joueur.x - monument.x;
    const distanceY = joueur.y - monument.y;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    if (distance < RAYON_DETECTION_MONUMENT) {
      return monument;
    }
  }

  return null;
}
