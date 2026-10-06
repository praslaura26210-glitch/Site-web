# Contenus du site, extraits du book

Généré à l'étape 0 à partir des 3 PDF du portfolio (63 pages, doublons de jonction retirés).

- `projets/<slug>/data.json` : fiche du projet (textes repris mot pour mot du book, `[À COMPLÉTER]` pour ce qui manque), liste des images et des plans.
- `projets/<slug>/plans/*.svg` : plans vectoriels, un dessin par fichier. Les couleurs suivent les variables CSS `--encre` (noir du plan) et `--papier` (blanc du plan).
- `projets/<slug>/images/*-2000.webp` et `*-1000.webp` : photos, rendus, croquis, plans scannés.
- `intro/` : le dessin de couverture en deux calques (lignes de construction, hachures).
- `site/` : portrait, dessin de couverture, `cv.json`.
- `extraction.json` : relevé technique (page d'origine, résolution, poids).

Pour tout régénérer : mettre `book1.pdf`, `book2.pdf`, `book3.pdf` dans `sources/`, puis
`pip install pymupdf pillow opencv-python-headless scikit-image` et `python3 tools/extract_content.py`.
