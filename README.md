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
quatre coloris d'interface (poussin, crème, jaune, inversé) et trois langues
d'interface (français, anglais, italien), mémorisés d'une session à l'autre. La
langue de départ suit celle du navigateur.

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

Le classeur reprend la disposition des fiches déjà utilisées en cuisine, sur trois
onglets identiques : `FR`, `EN`, `IT`, plus un `LISEZ-MOI`.

Dans chaque onglet :

| Cellule | Contenu |
| --- | --- |
| `A1` / `B1` | restaurant / saison |
| `A2` / `B2` | date (AAAA-MM-JJ) / chef |
| `A3` / `B3` | nom du plat / catégorie |
| ligne 5 | en-têtes : un bloc par paire de colonnes — titre du bloc, puis « Quantité » |
| ligne 6 et suivantes | les ingrédients de chaque bloc, dans sa paire de colonnes |
| ligne « PRÉPARATION » | ouvre la zone des étapes |
| en dessous | pour chaque bloc : une ligne de titre, puis une ligne de texte fusionnée |

Un bloc d'ingrédients de plus, ce sont deux colonnes de plus à droite. Un ingrédient
de plus, c'est une ligne de plus. Les cases de langue laissées vides reprennent le
français.

Les quantités s'écrivent librement : `600 g`, `600GR`, `1 PC`, `100 ml`, `QS`, `PM`,
`QB`, `2 c. à soupe`. `parseQty()` en extrait le nombre et le code d'unité (`g` `kg`
`ml` `cl` `l` `qs` `tsp` `tbsp` `pinch` `pc`) ; sans unité reconnue elle retient le
gramme, sans chiffre elle retient QS.

L'import est tolérant. Si les onglets `FR` / `EN` / `IT` n'existent pas, le premier
onglet est lu comme du français : c'est ce qui permet de reprendre une fiche déjà
écrite par un chef sans rien y changer. Un titre de sous-bloc posé au milieu d'une
colonne, sans quantité en face, est reconnu comme tel. Un texte long ou multiligne
trouvé hors de la zone `PRÉPARATION` est traité comme des étapes, pas comme un
ingrédient.

Les classeurs à colonnes `SECTION` / `RÉF` produits par les versions 1.2 à 1.4
restent lisibles : un onglet nommé `FICHE` bascule l'import sur l'ancien parseur.

L'écriture passe par `xlsx-js-style`, un fork de SheetJS qui gère les styles de
cellule — sans lui, la mise en forme serait perdue. Si son chargement échoue, le
code retombe sur SheetJS et le classeur sort sans mise en forme.

## Développement

```
src/01-head.html   interface : jetons de couleur, coloris, styles de la fiche A4
src/02-body.html   structure : accueil, page d'import, écran d'édition
src/03-state.js    langues, unités, liste des polices, état, sauvegarde locale
src/04-i18n.js     interface en français, anglais et italien
src/05-sheet.js    chargement des polices, rendu de la fiche A4, mise à l'échelle
src/06-editor.js   génération des panneaux de formulaire
src/07-app.js      roue chromatique, sélecteur de police, exports, imports, démarrage
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
