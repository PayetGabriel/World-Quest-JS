// Niveau de zoom (plus grand = plus zoomé)
const ZOOM = 2;

// Objet caméra
const camera = {
  x: 0,
  y: 0,
  largeur: 0,
  hauteur: 0
};

// Initialisation de la caméra
function initialiserCamera() {
  camera.largeur = CANVAS_LARGEUR / ZOOM;
  camera.hauteur = CANVAS_HAUTEUR / ZOOM;
}

// Mise à jour de la caméra pour suivre le joueur
function mettreAJourCamera(joueur) {

  // On centre la caméra sur le joueur
  camera.x = joueur.x - camera.largeur / 2;
  camera.y = joueur.y - camera.hauteur / 2;

  // Empêcher de sortir de la map
  if (camera.x < 0) {
    camera.x = 0;
  }

  if (camera.y < 0) {
    camera.y = 0;
  }

  if (camera.x + camera.largeur > MAP_LARGEUR) {
    camera.x = MAP_LARGEUR - camera.largeur;
  }

  if (camera.y + camera.hauteur > MAP_HAUTEUR) {
    camera.y = MAP_HAUTEUR - camera.hauteur;
  }
}

// Convertir coordonnées map → écran
function mapVersEcran(x, y) {
  return {
    x: (x - camera.x) * (CANVAS_LARGEUR / camera.largeur),
    y: (y - camera.y) * (CANVAS_HAUTEUR / camera.hauteur)
  };
}