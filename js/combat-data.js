// ============================================================
// COMBAT-DATA.JS
// Variables globales, état joueur/monstre, configs sprites
// ============================================================

let combatEnCours    = false;
let monumentEnCombat = null;
let inventaireOuvert = false;
let orJoueur         = 0;

const inventaire = {
  "potion-heal":  3,
  "potion-boost": 2
};

const GRAVITE    = 0.55;   // légèrement plus forte qu'avant (était 0.45)
const FORCE_SAUT = -17;

let canvasCombat = null;
let ctxCombat    = null;

let fondCombat               = null;
let fondCombatCharge         = false;
let collisionsImageData      = null;
let collisionsLargeur        = 0;
let collisionsHauteur        = 0;
let collisionsCombatChargees = false;

const FONDS_COMBAT = {
  "tour-eiffel":        "Fond Tour Effeil",
  "christ-redeempteur": "Rédempteur",
  "pyramides":          "Pyramides",
  "colisee":            "Colisée",
  "burj-khalifa":       "Burj Khalifa",
  "taj-mahal":          "Taj Mahal",
  "statue-liberte":     "Liberty",
  "acropole":           "Acropole d'Athènes",
  "kinkakuji":          "Kinkaku-Ji"
};

const combattant = {
  x: 200, y: 0,
  largeur: 100, hauteur: 160,
  velociteX: 0, velociteY: 0,
  auSol: false,
  regardeADroite: true,
  vitesse: 4,
  attackBoost: 0,
  attackBoostTours: 0,
  invincible: false,
  timerInvincible: 0,
  DUREE_INVINCIBLE: 600,
  timerCooldownStomp: 0,
  COOLDOWN_STOMP: 500,
  _iEnfoncee: false,
  _fEnfoncee: false,
  _gEnfoncee: false
};

const monstre = {
  x: 0, y: 0,
  largeur: 120, hauteur: 190,
  velociteX: 0, velociteY: 0,
  auSol: false,
  regardeADroite: false,

  animCourante: "idle",
  frameAnim: 0,
  timerAnim: 0,
  animTerminee: false,

  etat: "idle",
  timerIA: 0,
  timerAttaque: 0,
  timerSpecial: 0,
  timerSaut: 0,
  timerProtection: 0,
  enProtection: false,
  compteurStompsProtection: 0,

  // Données pour les spéciales complexes
  ondeActuelle: null,
  projectileActuel: null,
  zoneAuSol: null,
  tornadeActive: null,
  residusActifs: [],
  enCharge: false,
  enDisparition: false
};

// ============================================================
// CONFIGS PAR MONUMENT
// typeSpeciale : "onde" | "projectile" | "charge" | "seisme"
//               "laser" | "flamme_sol" | "disparition" | "tp_residu"
// ============================================================

const CONFIGS_MONSTRE = {

  "tour-eiffel": {
    dossier: "assets/battle/Tour Eiffel/",
    anims: {
      idle:    { frames: ["Idle 1", "Idle 2", "Idle 3"],                                     duree: 200 },
      move:    { frames: ["Move 1", "Move 2", "Move 3", "Move 4"],                           duree: 130 },
      hit:     { frames: ["Hit 1", "Hit 2"],                                                  duree: 120 },
      attack:  { frames: ["Attack 1", "Attack 2", "Attack 3", "Attack 4"],                  duree: 180 },
      special: { frames: ["Special 1", "Special 2", "Special 3", "Special 4", "Special 5"], duree: 200 },
      death:   { frames: ["Death 1", "Death 2", "Death 3", "Death 4"],                      duree: 180 }
    },
    DELAI_ATTAQUE: 2200,
    DELAI_SPECIAL: 8000,
    DELAI_SAUT:    4500,
    or: 50, coeff: 1.0,
    typeSpeciale: "onde"
  },

  "acropole": {
    dossier: "assets/battle/Acropole/",
    anims: {
      idle:       { frames: ["Idle 1", "Idle 2", "Idle 3"],                        duree: 200 },
      move:       { frames: ["Move 1", "Move 2", "Move 3", "Move 4"],              duree: 130 },
      hit:        { frames: ["Hit"],                                                duree: 140 },
      attack:     { frames: ["Attack 1", "Attack 2", "Attack 3", "Attack 4"],     duree: 180 },
      special:    { frames: ["Special 1", "Special 2", "Special 3", "Special 4"], duree: 200 },
      protection: { frames: ["Protection 1", "Protection 2"],                      duree: 200 },
      death:      { frames: ["Death 1", "Death 2", "Death 3", "Death 4"],          duree: 180 }
    },
    DELAI_ATTAQUE: 2000,
    DELAI_SPECIAL: 7000,
    DELAI_SAUT:    3800,
    DELAI_PROTECTION: 9000,
    DUREE_PROTECTION: 2000,
    STOMPS_POUR_CASSER: 2,
    or: 80, coeff: 1.6,
    typeSpeciale: "onde"
  },

  "kinkakuji": {
    dossier: "assets/battle/Kinkaku-Ji/",
    anims: {
      idle:    { frames: ["Idle 1", "Idle 2", "Idle 3"],                          duree: 200 },
      move:    { frames: ["Move 1", "Move 2", "Move 3", "Move 4"],                duree: 140 },
      hit:     { frames: ["Hit 1", "Hit 2"],                                       duree: 120 },
      attack:  { frames: ["Attack 1", "Attack 2", "Attack 3"],                    duree: 180 },
      special: { frames: ["Special 1", "Special 2", "Special 3", "Special 4"],   duree: 200 },
      death:   { frames: ["Death 1", "Death 2", "Death 3", "Death 4"],            duree: 180 }
    },
    DELAI_ATTAQUE: 2400,
    DELAI_SPECIAL: 7500,
    DELAI_SAUT:    5000,
    or: 110, coeff: 1.8,
    typeSpeciale: "projectile",
    VITESSE_PROJECTILE: 6
  },

  "taj-mahal": {
    dossier: "assets/battle/Taj Mahal/",
    anims: {
      idle:    { frames: ["Idle 1", "Idle 2", "Idle 3"],                          duree: 180 },
      move:    { frames: ["Move 1", "Move 2", "Move 3", "Move 4"],                duree: 100 },
      hit:     { frames: ["Hit 1", "Hit 2"],                                       duree: 110 },
      attack:  { frames: ["Attack 1", "Attack 2", "Attack 3"],                    duree: 160 },
      special: { frames: ["Special 1", "Special 2", "Special 3", "Special 4"],   duree: 180 },
      death:   { frames: ["Death 1", "Death 2", "Death 3", "Death 4"],            duree: 180 }
    },
    DELAI_ATTAQUE: 1600,
    DELAI_SPECIAL: 6000,
    DELAI_SAUT:    3000,
    or: 140, coeff: 2.0,
    typeSpeciale: "charge",
    VITESSE_CHARGE: 10
  },

  "christ-redeempteur": {
    dossier: "assets/battle/Rédempteur/",
    anims: {
      idle:    { frames: ["Idle 1", "Idle 2", "Idle 3"],                          duree: 220 },
      move:    { frames: ["Move 1", "Move 2", "Move 3", "Move 4"],                duree: 160 },
      hit:     { frames: ["Hit 1", "Hit 2"],                                       duree: 130 },
      attack:  { frames: ["Attack 1", "Attack 2", "Attack 3"],                    duree: 200 },
      special: { frames: ["Special 1", "Special 2", "Special 3", "Special 4"],   duree: 220 },
      death:   { frames: ["Death 1", "Death 2", "Death 3", "Death 4"],            duree: 200 }
    },
    DELAI_ATTAQUE: 3000,
    DELAI_SPECIAL: 9000,
    DELAI_SAUT:    6000,
    or: 170, coeff: 2.2,
    typeSpeciale: "seisme",
    RAYON_SEISME: 250
  },

  "burj-khalifa": {
    dossier: "assets/battle/Burj/",
    anims: {
      idle:    { frames: ["Idle 1", "Idle 2", "Idle 3"],                          duree: 180 },
      move:    { frames: ["Move 1", "Move 2", "Move 3", "Move 4"],                duree: 110 },
      hit:     { frames: ["Hit 1", "Hit 2"],                                       duree: 110 },
      attack:  { frames: ["Attack 1", "Attack 2", "Attack 3"],                    duree: 160 },
      special: { frames: ["Special 1", "Special 2", "Special 3"],                 duree: 180 },
      death:   { frames: ["Death 1", "Death 2", "Death 3", "Death 4"],            duree: 180 }
    },
    DELAI_ATTAQUE: 1800,
    DELAI_SPECIAL: 6500,
    DELAI_SAUT:    2800,
    or: 200, coeff: 2.4,
    typeSpeciale: "laser",
    VITESSE_LASER: 14
  },

  "statue-liberte": {
    dossier: "assets/battle/Liberty/",
    anims: {
      idle:    { frames: ["Idle 1", "Idle 2", "Idle 3"],                          duree: 200 },
      move:    { frames: ["Move 1", "Move 2", "Move 3", "Move 4"],                duree: 140 },
      hit:     { frames: ["Hit 1", "Hit 2"],                                       duree: 120 },
      attack:  { frames: ["Attack 1", "Attack 2"],                                 duree: 180 },
      special: { frames: ["Special 1", "Special 2", "Special 3"],                 duree: 200 },
      death:   { frames: ["Death 1", "Death 2", "Death 3", "Death 4"],            duree: 190 }
    },
    DELAI_ATTAQUE: 2500,
    DELAI_SPECIAL: 8000,
    DELAI_SAUT:    5000,
    or: 230, coeff: 2.6,
    typeSpeciale: "flamme_sol",
    DUREE_ZONE_FLAMME: 3000
  },

  "pyramides": {
    dossier: "assets/battle/Pyramides/",
    anims: {
      idle:    { frames: ["Idle 1", "Idle 2", "Idle 3"],                          duree: 190 },
      move:    { frames: ["Move 1", "Move 2", "Move 3", "Move 4"],                duree: 130 },
      hit:     { frames: ["Hit 1"],                                                duree: 130 },
      attack:  { frames: ["Attack 1", "Attack 2", "Attack 3", "Attack 4"],        duree: 170 },
      special: { frames: ["Special 1"],                                            duree: 200 },
      death:   { frames: ["Death 1", "Death 2", "Death 3", "Death 4"],            duree: 180 }
    },
    DELAI_ATTAQUE: 2000,
    DELAI_SPECIAL: 7000,
    DELAI_SAUT:    4000,
    or: 260, coeff: 2.8,
    typeSpeciale: "disparition",
    DUREE_DISPARITION: 2500
  },

  "colisee": {
    dossier: "assets/battle/Colisée/",
    anims: {
      idle:    { frames: ["Idle 1", "Idle 2", "Idle 3"],                          duree: 170 },
      move:    { frames: ["Move 1", "Move 2", "Move 3", "Move 4"],                duree: 110 },
      hit:     { frames: ["Hit 1"],                                                duree: 110 },
      attack:  { frames: ["Attack 1", "Attack 2", "Attack 3", "Attack 4"],        duree: 160 },
      special: { frames: ["Special 1", "Special 2", "Special 3", "Special 4"],   duree: 170 },
      death:   { frames: ["Death 1", "Death 2", "Death 3", "Death 4"],            duree: 180 }
    },
    DELAI_ATTAQUE: 1500,
    DELAI_SPECIAL: 5500,
    DELAI_SAUT:    2500,
    or: 300, coeff: 3.0,
    typeSpeciale: "tp_residu",
    DUREE_RESIDU: 4500
  }
};

const CONFIG_FALLBACK = {
  dossier: "assets/battle/Tour Eiffel/",
  anims: {
    idle:    { frames: ["Idle 1", "Idle 2", "Idle 3"],                                     duree: 200 },
    move:    { frames: ["Move 1", "Move 2", "Move 3", "Move 4"],                           duree: 130 },
    hit:     { frames: ["Hit 1", "Hit 2"],                                                  duree: 120 },
    attack:  { frames: ["Attack 1", "Attack 2", "Attack 3", "Attack 4"],                  duree: 110 },
    special: { frames: ["Special 1", "Special 2", "Special 3", "Special 4", "Special 5"], duree: 140 },
    death:   { frames: ["Death 1", "Death 2", "Death 3", "Death 4"],                      duree: 180 }
  },
  DELAI_ATTAQUE: 2200,
  DELAI_SPECIAL: 8000,
  DELAI_SAUT:    4500,
  or: 50, coeff: 1.0,
  typeSpeciale: "onde"
};

function getConfigMonstre() {
  if (monumentEnCombat === null) { return CONFIG_FALLBACK; }
  return CONFIGS_MONSTRE[monumentEnCombat.id] || CONFIG_FALLBACK;
}

// ============================================================
// CHARGEMENT SPRITES
// ============================================================

const monstreImages = {};

function chargerSpritesMonstre(callback) {
  let config  = getConfigMonstre();
  let dossier = config.dossier;
  let toutes  = [];

  for (let anim in config.anims) {
    let frames = config.anims[anim].frames;
    for (let i = 0; i < frames.length; i++) {
      let cle = dossier + frames[i];
      if (toutes.indexOf(cle) === -1) { toutes.push(cle); }
    }
  }

  // Sprites supplémentaires selon la spéciale
  let extras = [];
  if (config.typeSpeciale === "projectile")  { extras = [dossier + "Special Projectile"]; }
  if (config.typeSpeciale === "charge")      { extras = [dossier + "Special 5"]; }
  if (config.typeSpeciale === "flamme_sol")  { extras = [dossier + "Attack choc", dossier + "Special zone"]; }
  if (config.typeSpeciale === "laser")       { extras = [dossier + "Special 3 Laser Extension"]; }
  if (config.typeSpeciale === "disparition") {
    extras = [
      dossier + "Special 2 Disp",
      dossier + "Special 3 Invisible",
      dossier + "Special 4",
      dossier + "Special tornade"
    ];
  }
  if (config.typeSpeciale === "tp_residu") {
    extras = [
      dossier + "Special TP 1",
      dossier + "Special TP Invisible",
      dossier + "Special TP Résidu"
    ];
  }

  for (let i = 0; i < extras.length; i++) {
    if (toutes.indexOf(extras[i]) === -1) { toutes.push(extras[i]); }
  }

  let restant = toutes.length;
  if (restant === 0) { callback(); return; }

  toutes.forEach(function(cle) {
    if (monstreImages[cle] !== undefined) {
      restant--;
      if (restant === 0) { callback(); }
      return;
    }
    let img = new Image();
    img.onload  = function() { monstreImages[cle] = img;  restant--; if (restant === 0) { callback(); } };
    img.onerror = function() { monstreImages[cle] = null; restant--; if (restant === 0) { callback(); } };
    img.src = cle + ".png";
  });
}

function getImageFrame(nomFrame) {
  let config = getConfigMonstre();
  return monstreImages[config.dossier + nomFrame] || null;
}

// Surcharge : dossier explicite (pour les sprites spéciaux en dehors des anims)
function getImageFrameDossier(dossier, nomFrame) {
  return monstreImages[dossier + nomFrame] || null;
}

function getAnimData(nomAnim) {
  let config = getConfigMonstre();
  return config.anims[nomAnim] || config.anims["idle"];
}
