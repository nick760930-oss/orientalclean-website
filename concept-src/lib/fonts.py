"""Self-hosted CJK display fonts, subset at build time.

Loading Noto Sans/Serif TC from Google Fonts pulls 1.4–1.6 MB of unicode-range
slices per page. The build already knows every heading, so it cuts the
variable font down to exactly those glyphs (tens of KB) and serves one WOFF2
per weight. Body text stays on system CJK fonts.

Source fonts (OFL) are downloaded once into ~/.cache/oriental-clean-fonts or
$OC_FONT_DIR. If fontTools or the download is unavailable, the build falls
back to the Google Fonts stylesheet and prints a warning.
"""
import hashlib
import io
import os
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

SOURCES = {
    'NotoSansTC': 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanstc/NotoSansTC%5Bwght%5D.ttf',
    'NotoSerifTC': 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoseriftc/NotoSerifTC%5Bwght%5D.ttf',
}
VOID = {'br', 'img', 'input', 'meta', 'link', 'source', 'hr', 'wbr'}


class _Collect(HTMLParser):
    def __init__(self, tags, classes):
        super().__init__()
        self.tags, self.classes, self.stack, self.chars = tags, classes, [], set()

    def handle_starttag(self, tag, attrs):
        if tag in VOID:
            return
        cls = set((dict(attrs).get('class') or '').split())
        self.stack.append(tag in self.tags or bool(cls & self.classes))

    def handle_endtag(self, tag):
        if self.stack and tag not in VOID:
            self.stack.pop()

    def handle_data(self, data):
        if any(self.stack):
            self.chars |= set(data)


def _source(name):
    folder = Path(os.environ.get('OC_FONT_DIR', Path.home() / '.cache' / 'oriental-clean-fonts'))
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / f'{name}.ttf'
    if not path.exists() or path.stat().st_size < 1_000_000:
        print(f'  downloading {name} (one time)…')
        urllib.request.urlretrieve(SOURCES[name], path)
    return path


def build(site, spec):
    """spec: {'faces': [(source, family, weight)], 'tags': set, 'classes': set}. Returns CSS or ''."""
    try:
        from fontTools.ttLib import TTFont
        from fontTools.varLib import instancer
        from fontTools import subset
    except ImportError:
        print('  ! fontTools not installed; using Google Fonts fallback (pip install fonttools brotli)')
        return '', []
    chars = set()
    for f in site.out.rglob('*.html'):
        p = _Collect(spec['tags'], spec['classes'])
        p.feed(f.read_text(encoding='utf-8'))
        chars |= p.chars
    chars |= set('0123456789０１２３４５６７８９，。、；：？！「」（）／・—')
    text = ''.join(sorted(c for c in chars if c.strip()))
    digest = hashlib.sha1(text.encode()).hexdigest()[:8]
    out = site.out / 'assets' / 'fonts'
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob('*.woff2'):
        old.unlink()
    css, preload = [], []
    try:
        for source, family, weight in spec['faces']:
            font = instancer.instantiateVariableFont(TTFont(_source(source)), {'wght': weight})
            opts = subset.Options()
            opts.flavor = 'woff2'
            opts.layout_features = ['kern', 'palt', 'halt', 'liga', 'locl']
            sub = subset.Subsetter(opts)
            sub.populate(text=text)
            sub.subset(font)
            font.flavor = 'woff2'
            name = f'{source}-{weight}-{digest}.woff2'
            buf = io.BytesIO()
            font.save(buf)
            (out / name).write_bytes(buf.getvalue())
            url = f'{site.prefix}/assets/fonts/{name}'
            css.append(f'@font-face{{font-family:"{family}";font-style:normal;font-weight:{weight};font-display:swap;src:url("{url}") format("woff2");}}')
            preload.append(url)
            print(f'  font {family} {weight}: {len(text)} glyphs, {len(buf.getvalue()) // 1024} KB')
    except Exception as ex:  # network or font errors must not break the build
        print(f'  ! font subsetting failed ({ex}); using Google Fonts fallback')
        return '', []
    return '/* 自架字型：建置時依標題文字子集化 */\n' + '\n'.join(css) + '\n', preload
