// ============================================================
// HUD-NAVBAR.JS — navbar, minimap, indicateur boost, PV
// ============================================================

let pointsCompetences = 3;

let competences = {
  attaque: 0,
  defense: 0,
  vie: 0
};

function initialiserHUD() {
  creerNavbar();
  creerMinimap();
  creerPanneauInventaire();
  creerPanneauSucces();
  creerPanneauCompetences();
  creerPanneauShop();
  creerPanneauMap();
  creerPanneauParametres();

  document.addEventListener("keydown", function(event) {
    if (combatEnCours) { return; }
    if (event.key === "i" || event.key === "I") { basculerPanneau("inventaire"); }
    if (event.key === "c" || event.key === "C") { basculerPanneau("competences"); }
  });
}

// =====================
// NAVBAR
// =====================

function creerNavbar() {
  let nav = document.createElement("div");
  nav.id = "navbar-haut";
  document.getElementById("game-wrapper").appendChild(nav);

  let exit = creerBoutonIcone("Sortie.png", "Quitter", function(e) {
    e.stopPropagation();
    let confirmation = confirm("Quitter le jeu ?");
    if (confirmation) { location.reload(); }
  });
  exit.id = "nav-exit";
  nav.appendChild(exit);

  let centre = document.createElement("div");
  centre.id = "nav-centre";
  nav.appendChild(centre);

  // Indicateur boost (à gauche de la barre de vie)
  let boostZone = document.createElement("div");
  boostZone.id = "nav-boost-zone";

  let boostImg = document.createElement("img");
  boostImg.src = "assets/nav/extract/Potion marron.png";
  boostImg.id  = "nav-boost-img";
  boostImg.alt = "Boost";

  let boostCount = document.createElement("span");
  boostCount.id = "nav-boost-count";
  boostCount.textContent = "";

  boostZone.appendChild(boostImg);
  boostZone.appendChild(boostCount);
  centre.appendChild(boostZone);

  // Barre de vie
  let pvZone = document.createElement("div");
  pvZone.id = "nav-pv-zone";

  let coeur = document.createElement("img");
  coeur.src = "assets/nav/extract/Coeur.png";
  coeur.id  = "nav-coeur-img";
  coeur.alt = "PV";

  let pvOuter = document.createElement("div"); pvOuter.id = "nav-pv-outer";
  let pvMid   = document.createElement("div"); pvMid.id   = "nav-pv-mid";
  let pvInner = document.createElement("div"); pvInner.id = "nav-pv-inner";
  let pvWrap  = document.createElement("div"); pvWrap.id  = "nav-pv-wrap";
  let pvFill  = document.createElement("div"); pvFill.id  = "nav-pv-fill";
  let pvText  = document.createElement("span"); pvText.id = "nav-pv-text";
  pvText.textContent = "100/100";

  pvWrap.appendChild(pvFill);
  pvWrap.appendChild(pvText);
  pvInner.appendChild(pvWrap);
  pvMid.appendChild(pvInner);
  pvOuter.appendChild(pvMid);
  pvZone.appendChild(coeur);
  pvZone.appendChild(pvOuter);
  centre.appendChild(pvZone);

  let sep = document.createElement("div");
  sep.id = "nav-sep";
  centre.appendChild(sep);

  let boutonsData = [
    { icone: "Inventaire.png",  label: "Inventaire",  panneau: "inventaire" },
    { icone: "Succès.png",      label: "Succès",       panneau: "succes" },
    { icone: "Compétences.png", label: "Compétences",  panneau: "competences" },
    { icone: "Coffre.png",      label: "Shop",         panneau: "shop" },
    { icone: "Map.png",         label: "Map",          panneau: "map" }
  ];

  for (let i = 0; i < boutonsData.length; i++) {
    let data = boutonsData[i];
    let bouton = creerBoutonIcone(data.icone, data.label, (function(nomPanneau) {
      return function() { basculerPanneau(nomPanneau); };
    })(data.panneau));
    centre.appendChild(bouton);
  }

  let params = creerBoutonIcone("Paramètres.png", "Paramètres", function() {
    basculerPanneau("parametres");
  });
  params.id = "nav-params";
  nav.appendChild(params);
}

function creerBoutonIcone(fichierIcone, label, action) {
  let wrap = document.createElement("div");
  wrap.className = "nav-btn-wrap";

  let btn = document.createElement("button");
  btn.className = "nav-btn";
  btn.style.backgroundImage = "url('assets/nav/extract/Boutton.png')";

  let img = document.createElement("img");
  img.src = "assets/nav/extract/" + fichierIcone;
  img.alt = label;
  img.className = "nav-icone";

  btn.appendChild(img);
  btn.addEventListener("click", action);

  let lbl = document.createElement("span");
  lbl.className = "nav-label";
  lbl.textContent = label;

  wrap.appendChild(btn);
  wrap.appendChild(lbl);
  return wrap;
}

// =====================
// MINIMAP
// =====================

let canvasMinimap = null;
let ctxMinimap    = null;

function creerMinimap() {
  let wrapper = document.createElement("div");
  wrapper.id = "minimap-wrapper";

  canvasMinimap = document.createElement("canvas");
  canvasMinimap.width  = 160;
  canvasMinimap.height = 90;
  ctxMinimap = canvasMinimap.getContext("2d");

  wrapper.appendChild(canvasMinimap);
  document.getElementById("game-wrapper").appendChild(wrapper);
}

function mettreAJourMinimap(mapImage) {
  if (ctxMinimap === null || mapImage === null) { return; }

  ctxMinimap.drawImage(mapImage, 0, 0, 160, 90);

  let mx = (joueur.x / MAP_LARGEUR) * 160;
  let my = (joueur.y / MAP_HAUTEUR) * 90;
  ctxMinimap.fillStyle = "#fff";
  ctxMinimap.beginPath();
  ctxMinimap.arc(mx, my, 3, 0, Math.PI * 2);
  ctxMinimap.fill();

  let cx = (camera.x / MAP_LARGEUR) * 160;
  let cy = (camera.y / MAP_HAUTEUR) * 90;
  let cw = (camera.largeur / MAP_LARGEUR) * 160;
  let ch = (camera.hauteur / MAP_HAUTEUR) * 90;
  ctxMinimap.strokeStyle = "rgba(255,255,255,0.5)";
  ctxMinimap.lineWidth   = 1;
  ctxMinimap.strokeRect(cx, cy, cw, ch);
}

// =====================
// MISE À JOUR HUD
// =====================

function mettreAJourHUDNavbar() {
  let fill = document.getElementById("nav-pv-fill");
  let text = document.getElementById("nav-pv-text");
  if (fill !== null) { fill.style.width = (joueur.hp / joueur.hpMax * 100) + "%"; }
  if (text !== null) { text.textContent = joueur.hp + "/" + joueur.hpMax; }
  mettreAJourBoostNavbar();
}

function mettreAJourBoostNavbar() {
  let zone  = document.getElementById("nav-boost-zone");
  let count = document.getElementById("nav-boost-count");
  if (zone === null || count === null) { return; }

  let toursRestants = combattant.attackBoostTours || 0;

  if (toursRestants <= 0) {
    zone.style.display = "none";
  } else {
    zone.style.display = "flex";
    count.textContent  = "×" + toursRestants;
  }
}

function mettreAJourSucces() {
  mettreAJourPanneau("succes");
}

function donnerPointCompetence() {
  pointsCompetences = pointsCompetences + 1;
}