// On stocke les données de l'image de collision ici
let collisionImageData = null;
let collisionImageWidth = 0;
let collisionImageHeight = 0;

// Cette fonction charge l'image Collisions.png et lit ses pixels
function chargerCollisions(callback) {
  const image = new Image();
  image.src = "assets/Collisions.jpg";

  image.onload = function() {
    // On crée un canvas temporaire juste pour lire les pixels
    const canvasTemp = document.createElement("canvas");
    canvasTemp.width = image.width;
    canvasTemp.height = image.height;

    const ctxTemp = canvasTemp.getContext("2d");
    ctxTemp.drawImage(image, 0, 0);

    // getImageData retourne tous les pixels : [r, g, b, a, r, g, b, a, ...]
    collisionImageData = ctxTemp.getImageData(0, 0, image.width, image.height).data;
    collisionImageWidth = image.width;
    collisionImageHeight = image.height;

    console.log("Collisions chargées :", image.width, "x", image.height);

    callback();
  };

  image.onerror = function() {
    console.error("Impossible de charger Collisions.png");
  };
}

// Cette fonction vérifie si un point (px, py) sur la MAP est bloqué
// px et py sont des coordonnées sur la map originale (2552x1392)
function estBloque(px, py) {
  // Si on est en dehors de l'image, c'est bloqué
  if (px < 0 || py < 0 || px >= collisionImageWidth || py >= collisionImageHeight) {
    return true;
  }

  // Chaque pixel a 4 valeurs : rouge, vert, bleu, alpha
  // La formule pour trouver l'index dans le tableau est :
  // (ligne * largeur + colonne) * 4
  const index = (Math.floor(py) * collisionImageWidth + Math.floor(px)) * 4;

  const rouge = collisionImageData[index];
  const vert = collisionImageData[index + 1];
  const bleu = collisionImageData[index + 2];

  // Si le pixel est rouge (rouge élevé, vert et bleu faibles) = bloqué
  if (rouge > 150 && vert < 80 && bleu < 80) {
    return true;
  }

  // Si le pixel est dans une zone non débloquée = bloqué
  if (estBloqueParZone(px, py)) {
    return true;
  }

  return false;
}
