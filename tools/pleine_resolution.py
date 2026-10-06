"""Versions pleine résolution (WebP, côté long <= 4800 px) des plans scannés et croquis,
chargées seulement quand on zoome dans la visionneuse de plans."""
import io
import json
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
import extract_content as ec  # noqa: E402

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.join(os.path.dirname(__file__), "..", "content")


def main():
    ext = json.load(open(os.path.join(ROOT, "extraction.json")))
    kinds = {(i["projet"], i["nom"]): i["type"] for i in ext["images"]}
    for slug, name, parts, kind, _ in ec.IMAGES:
        if kind not in ("plan-scan", "croquis") or slug == "_site":
            continue
        if parts == [(32, 201)]:
            import pymupdf
            p = ec.page(32)
            img = Image.open(io.BytesIO(pymupdf.Pixmap(p.parent, 201).tobytes("png"))).convert("RGB")
        elif parts == [(24, 596)]:
            continue  # plan masse du Passage : déjà à 5222 px dans la version 2000 ? on la produit à part
        else:
            img, _ = ec.extract_image(parts)
        if max(img.size) > 4800:
            img.thumbnail((4800, 4800), Image.LANCZOS)
        f = os.path.join(ROOT, "projets", slug, "images", f"{name}-full.webp")
        img.save(f, "WEBP", quality=86, method=6)
        print(slug, name, img.size, os.path.getsize(f) // 1024, "Ko")


if __name__ == "__main__":
    main()
