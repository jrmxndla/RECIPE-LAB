# Recipe Lab

Générateur de fiches techniques de cuisine pour les restaurants du groupe Giraudi.
Une fiche se saisit une fois et s'exporte en français, anglais et italien, en PDF
prêt à imprimer et en Excel remodifiable.

L'outil est une page web autonome. Pas de serveur, pas de base de données, pas de
compte : tout se passe dans le navigateur de la personne qui l'utilise, et rien
ne sort de sa machine.

---

## Lancer l'outil

Ouvrir `index.html` dans un navigateur récent. C'est tout — le fichier contient
l'interface, les polices et les illustrations.

Pour le mettre en ligne, n'importe quel hébergement statique suffit. Avec GitHub
Pages : réglages du dépôt → *Pages* → source *Deploy from a branch* → branche
`main`, dossier `/ (root)`. L'outil est alors servi à la racine du site.

Trois bibliothèques sont chargées depuis un CDN, mais seulement au moment d'un
export : jsPDF, html2canvas et SheetJS. Sans connexion, la saisie et l'aperçu
fonctionnent, les exports non.

## Ce que fait l'outil

Un menu d'accueil mène à la création ou à la reprise d'une fiche, et propose
trois coloris d'interface (crème, jaune, inversé) mémorisés d'une session à
l'autre.

L'éditeur couvre l'en-tête (restaurant, logo, saison, date, chef, catégorie, nom
du plat), les ingrédients en blocs titrés avec quantité et unité, les étapes de
préparation en blocs titrés, deux photos facultatives, et la charte graphique de
la fiche : fond, cinq couleurs réglables à la roue chromatique, et le choix parmi
Lineal et trente familles libres de droit.

Le contenu se saisit dans les trois langues via le sélecteur FR / EN / IT. Un
champ laissé vide reprend le français à l'impression.

## Exports et réimport

| Format | Contient | Réimportable |
| --- | --- | --- |
| PDF | 3 pages, une par langue, plus la fiche complète en données cachées | oui, tout revient |
| XLSX | textes et quantités, trois colonnes de langue | oui, le style en place est conservé |
| JSON | la fiche entière, images comprises | oui, tout revient |

Le PDF embarque ses propres données : après le `%%EOF`, le fichier porte un bloc
`%RECIPELAB1:<base64 du JSON>:ENDRECIPELAB` que l'outil relit à l'import. Les
lecteurs PDF ignorent ces octets.

### Format du classeur Excel

Onglet `FICHE`, sept colonnes : `SECTION`, `RÉF`, `FRANÇAIS`, `ENGLISH`,
`ITALIANO`, `QUANTITÉ`, `UNITÉ`.

| SECTION | Rôle | RÉF |
| --- | --- | --- |
| `META` | en-tête de la fiche | nom du champ |
| `ING_TITRE` | titre d'un bloc d'ingrédients | numéro du bloc |
| `ING` | une ligne d'ingrédient | numéro du bloc parent |
| `PREP_TITRE` | titre d'un bloc de préparation | numéro du bloc |
| `PREP` | texte des étapes | numéro du bloc parent |

Codes d'unité : `g` `kg` `ml` `cl` `l` `qs` `tsp` `tbsp` `pinch` `pc`.

L'outil sait générer un modèle vierge de ce classeur (*Exporter → Modèle Excel
vierge*).

## Développement

```
src/01-head.html   interface : jetons de couleur, coloris, styles de la fiche A4
src/02-body.html   structure : écran d'accueil et écran d'édition
src/03-state.js    langues, unités, liste des polices, état, sauvegarde locale
src/04-sheet.js    chargement des polices, rendu de la fiche A4, mise à l'échelle
src/05-editor.js   génération des panneaux de formulaire
src/06-app.js      roue chromatique, sélecteur de police, exports, imports, démarrage
build.py           assemble le tout en index.html
assets/            illustrations et logo (WebP détouré)
fonts/             Lineal en quatre graisses + sa licence
```

Après modification d'un fichier de `src/`, `assets/` ou `fonts/` :

```bash
python3 build.py
```

Le script encode les polices et les illustrations en base64 et écrit `index.html`.
Ce fichier est versionné pour que l'outil reste ouvrable sans rien installer ; il
ne se modifie pas à la main.

Quelques repères pour reprendre le code. L'état tient dans un seul objet `S`,
sérialisé tel quel en JSON pour la sauvegarde et les exports. Les textes
traduisibles sont des objets `{fr, en, it}`, lus par `tx(valeur, langue)` qui
retombe sur le français. La fiche est rendue par `sheetHTML(langue)` dans un bloc
de 794 × 1123 px, soit une A4 à 96 ppp ; `autofit()` réduit ensuite la taille du
texte par paliers jusqu'à ce que les deux colonnes tiennent sur la page. L'export
PDF rend cette même page hors écran, une fois par langue, via html2canvas.

La version affichée en pied de page vient de la constante `VERSION` dans
`src/03-state.js`.

## Vie privée

Aucune donnée n'est transmise. Le brouillon en cours est conservé dans le
`localStorage` du navigateur, sur l'appareil seulement, et l'entrée est effacée
par *Nouvelle fiche vierge*. Les exports sont fabriqués localement.

Une réserve à connaître : appeler une des trente familles Google Fonts déclenche
une requête vers les serveurs de Google, qui reçoit alors l'adresse IP de la
personne. Lineal est embarquée et n'appelle rien. Pour un outil totalement muet,
retirer les familles distantes de la liste `FONTS` dans `src/03-state.js`.

## Licences

Le code de l'outil est sous licence MIT (voir `LICENSE`).

Lineal, dessinée par Frank Adebiaye avec Anton Moglia et Ariel Martín Pérez, est
publiée par la [Velvetyne Type Foundry](https://velvetyne.fr/fonts/lineal/) sous
SIL Open Font License 1.1. Son texte de licence accompagne les fichiers dans
`fonts/Lineal-OFL.txt`, comme l'OFL l'exige.

Les trente autres familles sont chargées depuis Google Fonts sous SIL OFL 1.1 ou
Apache 2.0 et ne sont pas redistribuées ici.

Les bibliothèques d'export sont sous MIT (jsPDF, html2canvas) et Apache 2.0
(SheetJS).

Le logo Recipe Lab, les personnages et l'univers graphique appartiennent à
Giraudi et ne sont pas couverts par la licence MIT. Les retirer avant toute
réutilisation du code hors du groupe.

---

© Giraudi — [giraudi.com](https://www.giraudi.com/)
