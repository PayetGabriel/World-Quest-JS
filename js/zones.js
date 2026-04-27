// Données de l'image Zones.jpg lues pixel par pixel
let zonesImageData = null;
let zonesImageWidth = 0;
let zonesImageHeight = 0;

// Canvas du brouillard affiché par dessus la map
let canvasBrouillard = null;
let ctxBrouillard = null;

// Texture du brouillard (image 1024x1024 seamless)
let textureBrouillard = null;
let textureBrouillardChargee = false;

const ZONES = [
  {
    nom: "Couloir départ",
    couleurR: 255, couleurV: 255, couleurB: 255,
    debloquee: true
  },
  {
    nom: "Tour Eiffel",
    couleurR: 168, couleurV: 20, couleurB: 255,
    debloquee: false
  },
  {
    nom: "Temple Grec",
    couleurR: 28, couleurV: 255, couleurB: 103,
    debloquee: false
  },
  {
    nom: "Sanctuaire Doré",
    couleurR: 255, couleurV: 246, couleurB: 12,
    debloquee: false
  },
  {
    nom: "Taj Mahal",
    couleurR: 255, couleurV: 0, couleurB: 203,
    debloquee: false
  },
  {
    nom: "Christ Rédempteur",
    couleurR: 0, couleurV: 0, couleurB: 0,
    debloquee: false
  },
  {
    nom: "Burj Khalifa",
    couleurR: 33, couleurV: 51, couleurB: 255,
    debloquee: false
  },
  {
    nom: "Statue de la Liberté",
    couleurR: 255, couleurV: 140, couleurB: 0,
    debloquee: false
  },
  {
    nom: "Pyramides",
    couleurR: 0, couleurV: 255, couleurB: 216,
    debloquee: false
  },
  {
    nom: "Colisée",
    couleurR: 0, couleurV: 161, couleurB: 255,
    debloquee: false
  }
];

function chargerZones(callback) {
  const image = new Image();
  image.src = "assets/Zones.jpg";

  image.onload = function() {
    const canvasTemp = document.createElement("canvas");
    canvasTemp.width = image.width;
    canvasTemp.height = image.height;

    const ctxTemp = canvasTemp.getContext("2d");
    ctxTemp.drawImage(image, 0, 0);

    zonesImageData = ctxTemp.getImageData(0, 0, image.width, image.height).data;
    zonesImageWidth = image.width;
    zonesImageHeight = image.height;

    console.log("Zones chargées :", image.width, "x", image.height);

    textureBrouillard = new Image();
    textureBrouillard.src = "assets/brouillard.jpg";
    textureBrouillard.onload = function() {
      textureBrouillardChargee = true;
    };

    creerCanvasBrouillard();
    callback();
  };

  image.onerror = function() {
    console.error("Impossible de charger Zones.jpg");
    callback();
  };
}

function creerCanvasBrouillard() {
  canvasBrouillard = document.createElement("canvas");
  canvasBrouillard.width = CANVAS_LARGEUR;
  canvasBrouillard.height = CANVAS_HAUTEUR;
  canvasBrouillard.style.position = "absolute";
  canvasBrouillard.style.top = "0";
  canvasBrouillard.style.left = "0";
  canvasBrouillard.style.pointerEvents = "none";
  canvasBrouillard.style.zIndex = "5";

  const wrapper = document.getElementById("game-wrapper");
  const premierEnfant = wrapper.firstChild;
  if (premierEnfant) {
    wrapper.insertBefore(canvasBrouillard, premierEnfant);
  } else {
    wrapper.appendChild(canvasBrouillard);
  }

  ctxBrouillard = canvasBrouillard.getContext("2d");
}

function getZoneDuPixel(mapX, mapY) {
  if (zonesImageData === null) {
    return null;
  }

  const px = Math.floor((mapX / MAP_LARGEUR) * zonesImageWidth);
  const py = Math.floor((mapY / MAP_HAUTEUR) * zonesImageHeight);

  if (px < 0 || py < 0 || px >= zonesImageWidth || py >= zonesImageHeight) {
    return null;
  }

  const index = (py * zonesImageWidth + px) * 4;
  const r = zonesImageData[index];
  const v = zonesImageData[index + 1];
  const b = zonesImageData[index + 2];

  for (let i = 0; i < ZONES.length; i++) {
    const zone = ZONES[i];
    const diffR = Math.abs(r - zone.couleurR);
    const diffV = Math.abs(v - zone.couleurV);
    const diffB = Math.abs(b - zone.couleurB);

    if (diffR < 15 && diffV < 15 && diffB < 15) {
      return zone;
    }
  }

  return null;
}

// Cache simple pour éviter de relire le même pixel plusieurs fois par frame
let cacheDerniereMapX = -1;
let cacheDerniereMapY = -1;
let cacheDernierResultat = false;

function estBloqueParZone(mapX, mapY) {
  if (zonesImageData === null) {
    return false;
  }

  const px = Math.round(mapX);
  const py = Math.round(mapY);
  if (px === cacheDerniereMapX && py === cacheDerniereMapY) {
    return cacheDernierResultat;
  }

  const zone = getZoneDuPixel(mapX, mapY);
  const resultat = (zone !== null && !zone.debloquee);

  cacheDerniereMapX = px;
  cacheDerniereMapY = py;
  cacheDernierResultat = resultat;

  return resultat;
}

let debloquageDepartFait = false;

function verifierDebloquageDepart() {
  if (debloquageDepartFait) {
    return;
  }

  if (joueur.y <= 1399 && joueur.x >= 2088 && joueur.x <= 2158) {
    debloquageDepartFait = true;
    debloquerZone(1);
    afficherMessage("Nouvelle zone débloquée : Tour Eiffel !");
  }
}

function debloquerZone(index) {
  if (index < ZONES.length) {
    ZONES[index].debloquee = true;
    console.log("Zone débloquée :", ZONES[index].nom);
  }
}

function debloquerZoneSuivante(nomMonument) {
  const correspondances = {
    "Tour Eiffel":           2,
    "Acropole d'Athènes":    3,
    "Kinkaku-ji":            4,
    "Taj Mahal":             5,
    "Christ Rédempteur":     6,
    "Burj Khalifa":          7,
    "Statue de la Liberté":  8,
    "Pyramides de Gizeh":    9,
  };

  const indexADebloquer = correspondances[nomMonument];
  if (indexADebloquer !== undefined) {
    debloquerZone(indexADebloquer);
    afficherMessage("Nouvelle zone débloquée : " + ZONES[indexADebloquer].nom + " !");
  }
}

// Vérifie si un pixel de masque doit être blanc (brouillard)
// On teste le pixel et ses 8 voisins dans l'image Zones.jpg
// Si au moins un voisin est dans une zone bloquée et aucun voisin n'est clairement libre,
// on remplit quand même pour éviter les trous de frontière
function pixelDoitEtreBrouillard(mapX, mapY) {
  const zone = getZoneDuPixel(mapX, mapY);

  // Pixel clairement dans une zone débloquée -> pas de brouillard
  if (zone !== null && zone.debloquee) {
    return false;
  }

  // Pixel clairement dans une zone bloquée -> brouillard
  if (zone !== null && !zone.debloquee) {
    return true;
  }

  // Pixel non classifiable (frontière JPG) -> on regarde les voisins
  // On convertit les coordonnées map en coordonnées image
  const pxCentre = Math.floor((mapX / MAP_LARGEUR) * zonesImageWidth);
  const pyCentre = Math.floor((mapY / MAP_HAUTEUR) * zonesImageHeight);

  // Taille d'un pixel écran en coordonnées image
  const pasImageX = zonesImageWidth / MAP_LARGEUR;
  const pasImageY = zonesImageHeight / MAP_HAUTEUR;

  let aVoisinBloque = false;
  let aVoisinLibre = false;

  // On teste les 8 pixels voisins dans l'image
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) { continue; }

      const vx = pxCentre + dx;
      const vy = pyCentre + dy;

      if (vx < 0 || vy < 0 || vx >= zonesImageWidth || vy >= zonesImageHeight) { continue; }

      const index = (vy * zonesImageWidth + vx) * 4;
      const r = zonesImageData[index];
      const v = zonesImageData[index + 1];
      const b = zonesImageData[index + 2];

      for (let i = 0; i < ZONES.length; i++) {
        const z = ZONES[i];
        const diffR = Math.abs(r - z.couleurR);
        const diffV = Math.abs(v - z.couleurV);
        const diffB = Math.abs(b - z.couleurB);

        if (diffR < 15 && diffV < 15 && diffB < 15) {
          if (z.debloquee) {
            aVoisinLibre = true;
          } else {
            aVoisinBloque = true;
          }
          break;
        }
      }
    }
  }

  // Si voisin bloqué sans voisin libre clairement identifié -> brouillard
  // Ça couvre les pixels de frontière sans mordre sur les zones libres
  if (aVoisinBloque && !aVoisinLibre) {
    return true;
  }

  return false;
}

function dessinerBrouillard() {
  if (ctxBrouillard === null || zonesImageData === null) {
    return;
  }

  const echelleReduite = 6;
  const largeurReduite = Math.ceil(CANVAS_LARGEUR / echelleReduite);
  const hauteurReduite = Math.ceil(CANVAS_HAUTEUR / echelleReduite);

  const masque = document.createElement("canvas");
  masque.width = largeurReduite;
  masque.height = hauteurReduite;
  const ctxMasque = masque.getContext("2d");

  for (let px = 0; px < largeurReduite; px++) {
    for (let py = 0; py < hauteurReduite; py++) {
      const ecranX = px * echelleReduite;
      const ecranY = py * echelleReduite;
      const mapX = camera.x + (ecranX / CANVAS_LARGEUR) * camera.largeur;
      const mapY = camera.y + (ecranY / CANVAS_HAUTEUR) * camera.hauteur;

      // On utilise la nouvelle fonction qui gère les pixels de frontière
      if (pixelDoitEtreBrouillard(mapX, mapY)) {
        ctxMasque.fillStyle = "rgba(255, 255, 255, 1)";
        ctxMasque.fillRect(px, py, 1, 1);
      }
    }
  }

  const final = document.createElement("canvas");
  final.width = CANVAS_LARGEUR;
  final.height = CANVAS_HAUTEUR;
  const ctxFinal = final.getContext("2d");

  if (textureBrouillardChargee) {
    const tailleTextureSurMap = 1024;

    const offsetX = camera.x % tailleTextureSurMap;
    const offsetY = camera.y % tailleTextureSurMap;

    const pixelMapParEcranX = camera.largeur / CANVAS_LARGEUR;
    const pixelMapParEcranY = camera.hauteur / CANVAS_HAUTEUR;
    const tailleTextureEcranX = tailleTextureSurMap / pixelMapParEcranX;
    const tailleTextureEcranY = tailleTextureSurMap / pixelMapParEcranY;

    const debutX = -(offsetX / pixelMapParEcranX);
    const debutY = -(offsetY / pixelMapParEcranY);

    let y = debutY;
    while (y < CANVAS_HAUTEUR) {
      let x = debutX;
      while (x < CANVAS_LARGEUR) {
        ctxFinal.drawImage(textureBrouillard, x, y, tailleTextureEcranX, tailleTextureEcranY);
        x = x + tailleTextureEcranX;
      }
      y = y + tailleTextureEcranY;
    }

  } else {
    ctxFinal.fillStyle = "rgba(240, 245, 255, 1)";
    ctxFinal.fillRect(0, 0, CANVAS_LARGEUR, CANVAS_HAUTEUR);
  }

  ctxFinal.imageSmoothingEnabled = true;
  ctxFinal.imageSmoothingQuality = "high";
  ctxFinal.globalCompositeOperation = "destination-in";
  ctxFinal.filter = "blur(28px)";
  ctxFinal.drawImage(masque, 0, 0, CANVAS_LARGEUR, CANVAS_HAUTEUR);
  ctxFinal.filter = "none";
  ctxFinal.globalCompositeOperation = "source-over";

  ctxFinal.globalCompositeOperation = "destination-in";
  ctxFinal.filter = "blur(6px)";
  ctxFinal.drawImage(masque, 0, 0, CANVAS_LARGEUR, CANVAS_HAUTEUR);
  ctxFinal.filter = "none";
  ctxFinal.globalCompositeOperation = "source-over";

  ctxBrouillard.clearRect(0, 0, CANVAS_LARGEUR, CANVAS_HAUTEUR);
  ctxBrouillard.drawImage(final, 0, 0);
}