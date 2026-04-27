# World Quest JS

## Principe du projet

World Quest JS est un jeu vidéo développé en JavaScript, basé sur un mélange d’exploration et de combat. Le joueur contrôle un personnage qui évolue sur une île découpée en plusieurs zones.

Le principe est simple : explorer, trouver des monuments et battre les gardiens qui les protègent. Chaque monument représente un objectif. Une fois tous les monuments d’une zone terminés, une nouvelle zone se débloque avec plus de difficulté.

Le projet a été pensé pour rester accessible mais évolutif, avec une structure claire et des mécaniques qui peuvent être améliorées facilement.

---

## Arborescence du projet

```
World-Quest-JS/
├── assets/
├── css/
│   ├── style-base.css
│   └── style-panneaux.css
├── js/
│   ├── camera.js
│   ├── collision.js
│   ├── combat-data.js
│   ├── combat-hud.js
│   ├── combat-ia-monstre.js
│   ├── combat-ia.js
│   ├── combat-physique.js
│   ├── combat-speciales-base.js
│   ├── combat-speciales-laser.js
│   ├── combat-speciales-tp.js
│   ├── dev.js
│   ├── hud-navbar.js
│   ├── hud-panneaux.js
│   ├── main.js
│   ├── map.js
│   ├── monuments.js
│   ├── player.js
│   ├── sprites.js
│   ├── titre.js
│   └── zones.js
├── index.html
└── README.md
```

### Explication rapide

* **assets/** : contient toutes les ressources graphiques (images, sprites…)
* **css/** : gère l’apparence du jeu (interface, HUD, panneaux)
* **js/** : contient toute la logique du jeu

  * déplacement (player.js, camera.js)
  * carte (map.js, zones.js)
  * collisions (collision.js)
  * combats (fichiers combat-*)
  * interface (hud-*)
* **index.html** : fichier principal qui lance le jeu
* **README.md** : documentation

---

## Gameplay

### Déplacement

Le joueur se déplace sur la carte avec les touches :

* **Z / Q / S / D** : déplacement (haut / gauche / bas / droite)

Le système de caméra suit le joueur pour donner une impression de monde plus grand.

---

### Exploration

Le joueur doit :

* parcourir la carte
* chercher les monuments
* éviter ou atteindre certaines zones

Les zones sont verrouillées au début et se débloquent avec la progression.

---

### Monuments et progression

* Chaque zone contient plusieurs monuments
* Lorsqu’un joueur s’approche d’un monument → un combat se lance
* Une fois le gardien battu → le monument est validé
* Quand tous les monuments sont terminés → nouvelle zone débloquée

Plus on avance :

* plus la carte est grande
* plus les ennemis sont forts
* plus il y a d’objectifs

---

### Combat

Le combat est une partie importante du jeu :

* Déclenché automatiquement
* Interface dédiée (HUD de combat)
* Gestion des attaques et capacités

Il existe plusieurs systèmes liés au combat :

* IA des ennemis
* attaques spéciales (laser, téléportation, etc.)
* physique des interactions

---

### Interface / Raccourcis

Pour naviguer dans le jeu :

* **I** : ouvrir l’inventaire
* **C** : ouvrir les compétences
* **M** : ouvrir la carte
* **Échap** : fuir un combat

Ces panneaux permettent de gérer la progression du joueur.

---

## Téléchargement / Utilisation

### 1. Récupérer le projet

Cloner le dépôt :

```
git clone https://github.com/PayetGabriel/World-Quest-JS.git
```

Ou télécharger en ZIP depuis GitHub puis extraire.

---

### 2. Ouvrir le projet

* Ouvrir le dossier dans **VS Code**
* Vérifier que tous les fichiers sont présents

---

### 3. Lancer le jeu (important)

Le projet utilise une extension pour fonctionner correctement :

* Installer l’extension **Live Server** sur VS Code
* Faire clic droit sur **index.html**
* Cliquer sur **"Open with Live Server"**

Le jeu va s’ouvrir automatiquement dans le navigateur.

---

### 4. Pourquoi utiliser Live Server ?

Live Server permet :

* d’éviter les problèmes de chargement de fichiers (JS / assets)
* d’avoir un rechargement automatique
* de simuler un vrai environnement web

Sans ça, certaines fonctionnalités peuvent ne pas marcher.

---

## Résumé

World Quest JS est un projet de jeu simple mais complet qui combine :

* exploration d’un monde
* progression par zones
* combats contre des ennemis

Le code est séparé en plusieurs fichiers pour rester lisible et compréhensible, même pour un niveau débutant/intermédiaire.

Le projet peut être amélioré facilement (nouveaux ennemis, nouvelles zones, nouvelles mécaniques), ce qui en fait une bonne base pour apprendre le développement de jeu en JavaScript.
