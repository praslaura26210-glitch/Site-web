"""Intègre les polices Mont dans la page et l'enveloppe dans un document HTML complet."""
import base64, sys

src, fonts, out = sys.argv[1:4]
page = open(src, encoding='utf-8').read()
for w in ('300', '500'):
    data = base64.b64encode(open(f'{fonts}/mont-{w}.woff2', 'rb').read()).decode()
    page = page.replace('{{MONT%s}}' % w, data)
head = ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<meta name="robots" content="noindex">\n')
page = page.replace('<div id="app">', '</head>\n<body>\n<div id="app">', 1)
page = page.replace('html, body { height: 100%; }', 'html, body { height: 100%; margin: 0; }')
open(out, 'w', encoding='utf-8').write(head + page + '\n</body>\n</html>\n')
