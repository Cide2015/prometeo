#!/usr/bin/env python3
"""okf_lint.py — Validador de la wiki OKF (Open Knowledge Format) de Prometeo.

Verifica la estructura del grafo de conocimiento:
  1. El wiki/index.md existe y es el mapa maestro.
  2. Cada archivo .md de wiki/entities, wiki/concepts, wiki/sources tiene
     frontmatter YAML con type, title, description y timestamp.
  3. No hay archivos .md en la raiz de wiki/ salvo index.md y log.md.
  4. Los enlaces del index.md apuntan a archivos existentes.

Uso: python3 okf_lint.py [--wiki ./wiki]
Devuelve exit 0 si no hay errores, 1 si los hay. (Hook pre-commit OKF.)

Compatibilidad: funciona con 'python' (Windows hook) y 'python3' (WSL2).
"""
import sys
import re
from pathlib import Path


def lint(wiki: Path) -> int:
    errors = 0

    index = wiki / "index.md"
    log = wiki / "log.md"

    if not index.exists():
        print(f"[ERROR] Falta el mapa maestro: {index}")
        errors += 1

    # 1. Estructura de directorios
    for sub in ["entities", "concepts", "sources", "raw"]:
        d = wiki / sub
        if not d.is_dir():
            print(f"[ERROR] Falta directorio wiki/{sub}")
            errors += 1

    # 2. Frontmatter de los .md en entities/concepts/sources
    for sub in ["entities", "concepts", "sources"]:
        d = wiki / sub
        if not d.is_dir():
            continue
        for f in sorted(d.glob("*.md")):
            text = f.read_text(encoding="utf-8")
            if not text.startswith("---"):
                print(f"[ERROR] {f}: falta frontmatter YAML (debe iniciar con '---')")
                errors += 1
                continue
            for field in ["type:", "title:", "description:", "timestamp:"]:
                if not re.search(rf"^{re.escape(field)}", text, re.MULTILINE):
                    print(f"[ERROR] {f}: falta campo '{field}' en el frontmatter")
                    errors += 1

    # 3. index.md y log.md con frontmatter
    for f in [index, log]:
        if f and f.exists():
            text = f.read_text(encoding="utf-8")
            if not text.startswith("---"):
                print(f"[ERROR] {f}: falta frontmatter YAML")
                errors += 1

    # 4. Enlaces del index.md a archivos existentes
    if index.exists():
        text = index.read_text(encoding="utf-8")
        for m in re.finditer(r"\]\((/wiki/[^)]+)\)", text):
            rel = m.group(1).replace("/wiki/", "")
            target = wiki / rel
            if not target.exists():
                print(f"[ERROR] index.md enlaza a inexistente: {rel}")
                errors += 1

    if errors == 0:
        print("[OKF] wiki OK: estructura y frontmatter válidos.")
    else:
        print(f"[OKF] {errors} error(es) en la wiki.")
    return 1 if errors else 0


if __name__ == "__main__":
    args = sys.argv[1:]
    wiki_path = "./wiki"
    if "--wiki" in args:
        i = args.index("--wiki")
        wiki_path = args[i + 1]
    sys.exit(lint(Path(wiki_path)))
