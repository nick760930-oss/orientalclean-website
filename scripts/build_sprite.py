"""Build icon sprites. Run from repository root: python3 scripts/build_sprite.py

Inputs
  icons/*.svg          vector icons  -> images/sprite.svg  (<symbol id="icon-NAME">)
  icons/raster/*.png   bitmap icons  -> images/sprite.png  (needs Pillow; skipped if absent)
Outputs
  images/sprite.svg, images/sprite.png, assets/icons.css, icons/preview.html

Flags
  --check   do not write; exit 1 if any output differs from what would be built (for CI)
  --scale N raster sprite pixel density (default 2, i.e. @2x assets; CSS uses background-size)

Usage in HTML:   <svg class="icon"><use href="/images/sprite.svg#icon-check"/></svg>
Usage in CSS:    <span class="sprite sprite-NAME"></span>
"""
from pathlib import Path
import re, sys, hashlib, xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SRC, RASTER = ROOT / 'icons', ROOT / 'icons/raster'
OUT_SVG, OUT_PNG, OUT_CSS, OUT_PREVIEW = ROOT / 'images/sprite.svg', ROOT / 'images/sprite.png', ROOT / 'assets/icons.css', ROOT / 'icons/preview.html'
NS = 'http://www.w3.org/2000/svg'
XLINK = 'http://www.w3.org/1999/xlink'
HEX = re.compile(r'^#(?:[0-9a-fA-F]{3}){1,2}$|^rgba?\(|^hsla?\(', re.I)
NAME = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')


def die(msg):
    print('build_sprite:', msg, file=sys.stderr)
    sys.exit(1)


def strip_ns(tag):
    return tag.split('}', 1)[1] if tag.startswith('{') else tag


def to_symbol(path):
    """Parse one source SVG and return (name, viewBox, inner_markup)."""
    name = path.stem
    if not NAME.match(name):
        die(f'{path.name}: file name must be kebab-case (a-z, 0-9, "-")')
    root = ET.parse(path).getroot()
    if strip_ns(root.tag) != 'svg':
        die(f'{path.name}: root element is not <svg>')
    vb = root.get('viewBox')
    if not vb:
        w, h = root.get('width'), root.get('height')
        if not (w and h):
            die(f'{path.name}: needs a viewBox (or width+height)')
        vb = f'0 0 {w} {h}'
    # Colour normalisation: a hard-coded colour becomes currentColor so the icon
    # follows CSS `color`. A source file can opt out with data-keep-color="true".
    keep = root.get('data-keep-color') == 'true'
    for el in root.iter():
        el.tag = strip_ns(el.tag)
        for attr in list(el.attrib):
            if attr.startswith('{'):
                # move xlink:href to plain href, drop other namespaced attrs
                if attr == f'{{{XLINK}}}href':
                    el.set('href', el.attrib.pop(attr))
                else:
                    del el.attrib[attr]
            elif not keep and attr in ('fill', 'stroke') and HEX.match(el.get(attr, '')):
                el.set(attr, 'currentColor')
        if el.get('id') and el is not root:
            el.set('id', f'{name}-{el.get("id")}')  # avoid id collisions across icons
    children = ''.join(ET.tostring(c, encoding='unicode') for c in root)
    # presentation attributes on the root (fill, stroke, stroke-width ...) must survive
    inherited = {k: v for k, v in root.attrib.items() if k not in ('viewBox', 'width', 'height', 'xmlns', 'version', 'data-keep-color', 'class', 'id')}
    attrs = ''.join(f' {k}="{v}"' for k, v in sorted(inherited.items()))
    inner = children if not attrs else f'<g{attrs}>{children}</g>'
    return name, vb, re.sub(r'\s+', ' ', inner).replace('> <', '><').strip()


def build_svg():
    files = sorted(SRC.glob('*.svg'))
    if not files:
        die(f'no source icons in {SRC.relative_to(ROOT)}/')
    symbols = [to_symbol(f) for f in files]
    seen = set()
    for n, _, _ in symbols:
        if n in seen:
            die(f'duplicate icon name {n}')
        seen.add(n)
    body = ''.join(f'<symbol id="icon-{n}" viewBox="{vb}">{inner}</symbol>' for n, vb, inner in symbols)
    svg = f'<svg xmlns="{NS}" style="display:none">{body}</svg>\n'
    return svg, [n for n, _, _ in symbols]


def build_png(scale):
    """Shelf-pack PNGs into one sheet. Returns (png_bytes, css_rules) or (None, '')."""
    files = sorted(RASTER.glob('*.png'))
    if not files:
        return None, ''
    try:
        from PIL import Image
    except ImportError:
        print('build_sprite: Pillow not installed, skipping raster sprite (pip install pillow)', file=sys.stderr)
        return None, ''
    imgs = []
    for f in files:
        if not NAME.match(f.stem):
            die(f'{f.name}: file name must be kebab-case')
        imgs.append((f.stem, Image.open(f).convert('RGBA')))
    pad = 2 * scale
    max_w = 1024 * scale
    # shelf packing: sort by height, fill rows left to right
    imgs.sort(key=lambda t: (-t[1].height, t[0]))
    x = y = row_h = sheet_w = 0
    placed = []
    for name, im in imgs:
        if x + im.width + pad > max_w and x:
            x, y, row_h = 0, y + row_h + pad, 0
        placed.append((name, im, x, y))
        x += im.width + pad
        row_h = max(row_h, im.height)
        sheet_w = max(sheet_w, x)
    sheet_h = y + row_h
    sheet = Image.new('RGBA', (sheet_w, sheet_h), (0, 0, 0, 0))
    for _, im, px, py in placed:
        sheet.paste(im, (px, py), im)
    rules = [f'.sprite{{display:inline-block;background:url("/images/sprite.png") no-repeat;background-size:{sheet_w / scale:g}px {sheet_h / scale:g}px}}']
    for name, im, px, py in sorted(placed, key=lambda p: p[0]):
        rules.append(f'.sprite-{name}{{width:{im.width / scale:g}px;height:{im.height / scale:g}px;background-position:-{px / scale:g}px -{py / scale:g}px}}')
    import io
    buf = io.BytesIO()
    sheet.save(buf, 'PNG', optimize=True)
    return buf.getvalue(), '\n'.join(rules) + '\n'


def build_css(svg_names, png_css, sprite_hash):
    css = ['/* generated by scripts/build_sprite.py - do not edit */',
           f'/* sprite version {sprite_hash}: reference as /images/sprite.svg?v={sprite_hash}#icon-NAME */',
           '.icon{display:inline-block;width:1em;height:1em;vertical-align:-0.125em;fill:none;stroke:currentColor;overflow:visible}']
    if png_css:
        css.append(png_css.rstrip())
    return '\n'.join(css) + '\n'


def build_preview(svg_names, png_names, sprite_hash):
    cells = ''.join(f'<figure><svg class="icon"><use href="/images/sprite.svg?v={sprite_hash}#icon-{n}"/></svg><figcaption>icon-{n}</figcaption></figure>' for n in svg_names)
    cells += ''.join(f'<figure><span class="sprite sprite-{n}"></span><figcaption>sprite-{n}</figcaption></figure>' for n in png_names)
    return ('<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Sprite preview</title>'
            '<link rel="stylesheet" href="/assets/icons.css"><style>body{font:14px/1.4 system-ui;margin:24px;color:#0b2a33;background:#fff}'
            '.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:16px}figure{margin:0;padding:12px;border:1px solid #d7e4e8;border-radius:8px;text-align:center;font-size:40px;color:#16d6e8}'
            'figcaption{font-size:12px;color:#456;margin-top:8px;font-family:monospace}</style></head><body>'
            f'<h1 style="font-size:18px">Sprite preview · {len(svg_names)} SVG · {len(png_names)} PNG</h1><div class="grid">{cells}</div></body></html>\n')


def main(argv):
    check = '--check' in argv
    scale = int(argv[argv.index('--scale') + 1]) if '--scale' in argv else 2
    svg, svg_names = build_svg()
    sprite_hash = hashlib.sha1(svg.encode()).hexdigest()[:8]
    png, png_css = build_png(scale)
    png_names = re.findall(r'\.sprite-([a-z0-9-]+)\{', png_css)
    outputs = {OUT_SVG: svg.encode(), OUT_CSS: build_css(svg_names, png_css, sprite_hash).encode(),
               OUT_PREVIEW: build_preview(svg_names, png_names, sprite_hash).encode()}
    if png is not None:
        outputs[OUT_PNG] = png
    stale = [p for p, data in outputs.items() if not p.exists() or p.read_bytes() != data]
    if png is None and OUT_PNG.exists():
        stale.append(OUT_PNG)
    if check:
        for p in stale:
            print('stale:', p.relative_to(ROOT))
        print('sprite outputs up to date' if not stale else f'{len(stale)} output(s) need rebuilding: python3 scripts/build_sprite.py')
        sys.exit(1 if stale else 0)
    for p, data in outputs.items():
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(data)
    if png is None and OUT_PNG.exists():
        OUT_PNG.unlink()
    print(f'sprite.svg: {len(svg_names)} icons ({len(svg)} bytes, v={sprite_hash}) -> {OUT_SVG.relative_to(ROOT)}')
    if png is not None:
        print(f'sprite.png: {len(png_names)} images ({len(png)} bytes) -> {OUT_PNG.relative_to(ROOT)}')
    print(f'css -> {OUT_CSS.relative_to(ROOT)}, preview -> {OUT_PREVIEW.relative_to(ROOT)}')


if __name__ == '__main__':
    main(sys.argv[1:])
