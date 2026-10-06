"""Fusionne les 3 PDF du book en un seul fichier léger pour le bouton « Portfolio PDF ».

- pages 25 et 45 (en double aux jonctions) gardées une seule fois -> 63 pages
- images réduites à 150 ppi, JPEG qualité 72 (lisible à l'écran, imprimable en A4 correct)
- le texte caché portant le nom de l'ancienne binôme (couche texte invisible, page 30) est retiré
Usage : BOOK_SRC=sources python3 tools/fusion_pdf.py public/portfolio-laura-pras.pdf
"""
import os
import sys

import pymupdf

SRC = os.environ.get("BOOK_SRC", "sources")


def reduire_masquees(doc, cible=125, qualite=70):
    """Images à masque de transparence (ignorées par rewrite_images) : si le masque est
    entièrement opaque, on le supprime et on rééchantillonne l'image en JPEG."""
    import io
    from PIL import Image
    faits = set()
    for page in doc:
        for info in page.get_image_info(xrefs=True):
            x = info["xref"]
            if not x or x in faits:
                continue
            smask = doc.xref_get_key(x, "SMask")
            if smask[0] != "xref":
                continue
            faits.add(x)
            b = pymupdf.Rect(info["bbox"])
            if b.width < 1:
                continue
            ppi = max(info["width"], info["height"]) / max(b.width, b.height) * 72
            sx = int(smask[1].split()[0])
            mask = pymupdf.Pixmap(doc, sx)
            if min(mask.samples) < 250:
                continue  # vraie transparence (collages) : on n'y touche pas
            pix = pymupdf.Pixmap(doc, x)
            if pix.n - pix.alpha < 3:
                pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
            im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples if not pix.alpha else pymupdf.Pixmap(pix, 0).samples)
            if ppi > cible * 1.15:
                k = cible / ppi
                im = im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.LANCZOS)
            buf = io.BytesIO()
            im.save(buf, "JPEG", quality=qualite, optimize=True)
            page.replace_image(x, stream=buf.getvalue())

def main(out):
    doc = pymupdf.open()
    for name, start in (("book1.pdf", 0), ("book2.pdf", 1), ("book3.pdf", 1)):
        src = pymupdf.open(os.path.join(SRC, name))
        doc.insert_pdf(src, from_page=start, to_page=len(src) - 1)
    print("pages :", len(doc))
    for page in doc:
        # le texte est invisible (rogné), search_for ne le voit pas : on lit les spans bruts
        hits = []
        for b in page.get_text("dict", flags=0)["blocks"]:
            for line in b.get("lines", []):
                for sp in line["spans"]:
                    if "MEUNIER" in sp["text"].upper() or "Mathilde" in sp["text"]:
                        hits.append(pymupdf.Rect(sp["bbox"]))
        for r in hits:
            page.add_redact_annot(r)
        if hits:
            page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE, graphics=pymupdf.PDF_REDACT_LINE_ART_NONE)
            print("texte caché retiré page", page.number + 1, len(hits))
    doc.rewrite_images(dpi_threshold=135, dpi_target=125, quality=70)
    reduire_masquees(doc)
    doc.set_metadata({"title": "Portfolio Laura Pras", "author": "Laura Pras", "subject": "Portfolio d'architecture 2026"})
    doc.save(out, garbage=4, deflate=True, clean=True)
    print("taille :", round(os.path.getsize(out) / 1e6, 1), "Mo")


if __name__ == "__main__":
    main(sys.argv[1])
