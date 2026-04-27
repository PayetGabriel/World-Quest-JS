// Coordonnées sur la map originale 3840x2095

const MONUMENTS = [
  {
    id: "tour-eiffel",
    nom: "Tour Eiffel",
    pays: "France",
    x: 1868,
    y: 1147,
    decouvert: false,
    gardien: {
      nom: "Gardien Gaulois",
      hpMax: 60,
      hp: 60,
      attaque: 6,
      defense: 1,
      couleur: "#3498db"
    }
  },
  {
    id: "acropole",
    nom: "Acropole d'Athènes",
    pays: "Grèce",
    x: 2571,
    y: 1698,
    decouvert: false,
    gardien: {
      nom: "Gardien Grec",
      hpMax: 80,
      hp: 80,
      attaque: 8,
      defense: 3,
      couleur: "#f39c12"
    }
  },
  {
    id: "kinkakuji",
    nom: "Kinkaku-ji",
    pays: "Japon",
    x: 3374,
    y: 1711,
    decouvert: false,
    gardien: {
      nom: "Samouraï Doré",
      hpMax: 100,
      hp: 100,
      attaque: 10,
      defense: 4,
      couleur: "#f1c40f"
    }
  },
  {
    id: "taj-mahal",
    nom: "Taj Mahal",
    pays: "Inde",
    x: 2724,
    y: 1070,
    decouvert: false,
    gardien: {
      nom: "Gardien Moghol",
      hpMax: 120,
      hp: 120,
      attaque: 12,
      defense: 5,
      couleur: "#e91e8c"
    }
  },
  {
    id: "christ-redeempteur",
    nom: "Christ Rédempteur",
    pays: "Brésil",
    x: 1764,
    y: 1715,
    decouvert: false,
    gardien: {
      nom: "Gardien Tropical",
      hpMax: 140,
      hp: 140,
      attaque: 14,
      defense: 6,
      couleur: "#27ae60"
    }
  },
  {
    id: "burj-khalifa",
    nom: "Burj Khalifa",
    pays: "Émirats arabes unis",
    x: 3072,
    y: 615,
    decouvert: false,
    gardien: {
      nom: "Gardien du Golfe",
      hpMax: 155,
      hp: 155,
      attaque: 16,
      defense: 7,
      couleur: "#8e44ad"
    }
  },
  {
    id: "statue-liberte",
    nom: "Statue de la Liberté",
    pays: "États-Unis",
    x: 824,
    y: 1460,
    decouvert: false,
    gardien: {
      nom: "Gardien de l'Ouest",
      hpMax: 165,
      hp: 165,
      attaque: 18,
      defense: 8,
      couleur: "#1abc9c"
    }
  },
  {
    id: "pyramides",
    nom: "Pyramides de Gizeh",
    pays: "Égypte",
    x: 1138,
    y: 843,
    decouvert: false,
    gardien: {
      nom: "Gardien du Désert",
      hpMax: 180,
      hp: 180,
      attaque: 20,
      defense: 9,
      couleur: "#e67e22"
    }
  },
  {
    id: "colisee",
    nom: "Colisée",
    pays: "Italie",
    x: 1964,
    y: 486,
    decouvert: false,
    gardien: {
      nom: "Gladiateur",
      hpMax: 200,
      hp: 200,
      attaque: 22,
      defense: 10,
      couleur: "#c0392b"
    }
  },
];