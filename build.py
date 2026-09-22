#!/usr/bin/env python3
"""
Recipe Lab — construction du fichier autonome index.html

    python3 build.py

Rassemble src/, fonts/ et assets/ en un seul fichier HTML sans aucune
dépendance locale : polices et illustrations y sont encodées en base64.
Seules les bibliothèques d'export (jsPDF, html2canvas, SheetJS) sont
appelées à la demande depuis un CDN, au moment où l'on exporte.
"""

import base64
import pathlib

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
FONTS = ROOT / "fonts"
ASSETS = ROOT / "assets"
OUT = ROOT / "index.html"

# graisses de Lineal embarquées, dans l'ordre des poids CSS
WEIGHTS = [(400, "Regular"), (500, "Medium"), (700, "Bold"), (900, "Black")]

# illustrations : le nom du fichier devient la clé utilisée dans le code
ART_NAMES = [
    "taste", "pizza", "waiter", "baker", "barista", "pasta", "whisk",
    "cake", "chop", "coffee", "brioche", "steak", "sushi", "carrot", "logo",
]


def data_uri(path, mime):
    return "data:%s;base64,%s" % (mime, base64.b64encode(path.read_bytes()).decode())


def font_css():
    rules = []
    for weight, style in WEIGHTS:
        uri = data_uri(FONTS / ("Lineal-%s.woff2" % style), "font/woff2")
        rules.append(
            "@font-face{font-family:'Lineal';src:url(%s) format('woff2');"
            "font-weight:%d;font-style:normal;font-display:swap}" % (uri, weight)
        )
    return "\n".join(rules)


def art_js():
    import json
    art = {n: data_uri(ASSETS / ("%s.webp" % n), "image/webp") for n in ART_NAMES}
    return "const ART=" + json.dumps(art) + ";"


def main():
    head = (SRC / "01-head.html").read_text(encoding="utf-8")
    if "/*__LINEAL__*/" not in head:
        raise SystemExit("01-head.html : marqueur /*__LINEAL__*/ introuvable")
    head = head.replace("/*__LINEAL__*/", font_css())

    parts = [
        head,
        (SRC / "02-body.html").read_text(encoding="utf-8"),
        "<script>\n",
        art_js(),
        "\n</script>\n",
        (SRC / "03-state.js").read_text(encoding="utf-8"),
        (SRC / "04-i18n.js").read_text(encoding="utf-8"),
        (SRC / "05-sheet.js").read_text(encoding="utf-8"),
        (SRC / "06-editor.js").read_text(encoding="utf-8"),
        (SRC / "07-app.js").read_text(encoding="utf-8"),
    ]
    OUT.write_text("".join(parts), encoding="utf-8")
    print("index.html écrit — %d Ko" % (OUT.stat().st_size // 1024))


if __name__ == "__main__":
    main()
