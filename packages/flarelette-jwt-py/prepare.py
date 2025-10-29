#!/usr/bin/env python3
import shutil
import sys
from pathlib import Path

PKG_DIR = Path(__file__).resolve().parent
MD_ROOT = (PKG_DIR / "../..").resolve()

README_SRC = MD_ROOT / "README.md"
CONTRIB_SRC = MD_ROOT / "CONTRIBUTING.md"
THIRD_PARTY_SRC = MD_ROOT / "THIRD_PARTY_LICENSES.md"
LICENSE_SRC = MD_ROOT / "LICENSE"
DOCS_DIR = PKG_DIR
DOCS_DIR.mkdir(parents=True, exist_ok=True)

print(f"Copying documentation files from {MD_ROOT} to {DOCS_DIR} directory...")
for src, dst_name in [
    (README_SRC, "README.md"),
    (CONTRIB_SRC, "CONTRIBUTING.md"),
    (THIRD_PARTY_SRC, "THIRD_PARTY_LICENSES.md"),
    (LICENSE_SRC, "LICENSE"),
]:
    if not src.is_file():
        print(f"ERROR: Missing {src}", file=sys.stderr)
        sys.exit(1)
    print(f"Copying {dst_name}...")
    shutil.copy2(src, DOCS_DIR / dst_name)
print("Copy complete")
