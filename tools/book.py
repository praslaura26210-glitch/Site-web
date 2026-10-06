"""Accès unifié aux 3 PDF du book : numéro de page global (1-63) -> page PyMuPDF.

Les PDF se chevauchent d'une page à chaque jonction (25 et 45) : on ne la compte qu'une fois.
"""
import os
import pymupdf

SRC = os.environ.get("BOOK_SRC", "sources")
FILES = [("book1.pdf", 1), ("book2.pdf", 25), ("book3.pdf", 45)]  # (fichier, n° global de sa 1re page)
TOTAL = 63

_docs = {}


def doc(name):
    if name not in _docs:
        _docs[name] = pymupdf.open(os.path.join(SRC, name))
    return _docs[name]


def page(n):
    """Page globale n (1..63). Les doublons de jonction sont lus dans le fichier qui suit."""
    for name, first in reversed(FILES):
        if n >= first:
            return doc(name)[n - first]
    raise ValueError(n)
