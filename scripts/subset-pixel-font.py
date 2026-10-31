"""Builds the web copy of Geist Pixel, which every page loads.

Each pixel of each letter is its own shape in the full font, so its 17 KB
download unpacks to 560 KB that stalls the page's first layout. This keeps only
the characters headings need and joins touching pixels into one shape.

Run after changing `CHARACTERS`, which needs `pip install fonttools brotli skia-pathops`:

    python scripts/subset-pixel-font.py
"""

import string
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont
from fontTools.ttLib.removeOverlaps import removeOverlaps

ROOT = Path(__file__).parent.parent
SOURCE = ROOT / "src/assets/resume/geist-pixel-regular.ttf"
TARGET = ROOT / "src/assets/fonts/geist-pixel.woff2"

CHARACTERS = string.ascii_letters + string.digits + " .,:-–/&'+()!?åäöÅÄÖ"

font = TTFont(SOURCE)

options = Options()
options.layout_features = ["kern"]
options.hinting = False
options.notdef_outline = True
subsetter = Subsetter(options)
subsetter.populate(text=CHARACTERS)
subsetter.subset(font)

removeOverlaps(font)

font.flavor = "woff2"
TARGET.parent.mkdir(exist_ok=True)
font.save(TARGET)
print(f"{TARGET.name}: {TARGET.stat().st_size} bytes")
