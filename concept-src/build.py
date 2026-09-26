"""Build the three concept previews.

    python3 concept-src/build.py            # a, b, c
    python3 concept-src/build.py a          # one concept
    python3 concept-src/build.py --hub      # also write /claude-preview/ index

Output goes to /claude-<x>-preview/ at the repository root and is committed,
because the Vercel project serves the repository as static files.
"""
import importlib
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))

from lib.site import Site  # noqa: E402
from lib import fonts  # noqa: E402

CONFIG = {
    'a': dict(name='立面索引', theme_color='#74C7D6',
              fonts=['family=IBM+Plex+Mono:wght@400;500'],
              subset={'faces': [('NotoSansTC', 'Noto Sans TC', 700), ('NotoSansTC', 'Noto Sans TC', 900)],
                      'tags': {'h1', 'h2', 'h3'}, 'classes': {'a-notes__t'},
                      'fallback': 'family=Noto+Sans+TC:wght@700;900'}),
    'b': dict(name='現場紀錄', theme_color='#F7F9F9',
              fonts=[],
              subset={'faces': [('NotoSerifTC', 'Noto Serif TC', 500), ('NotoSerifTC', 'Noto Serif TC', 700)],
                      'tags': {'h1', 'h2', 'h3'},
                      'classes': {'b-stand', 'b-toc__t', 'b-fignum', 'b-notes__t', 'b-contents__h', 'b-colophon__ask', 'b-next__t',
                                  'b-toc-btn', 'b-essay__more', 'b-faq', 'b-issues', 'b-dl--terms', 'b-plate__text'},
                      'fallback': 'family=Noto+Serif+TC:wght@500;700'}),
    'c': dict(name='垂降', theme_color='#071B20',
              fonts=['family=Barlow+Condensed:wght@400;500;600'], subset=None),
}


def build(key):
    cfg = dict(CONFIG[key])
    spec = cfg.pop('subset')
    site = Site(key, ROOT, **cfg)
    assets = {
        'site.css': [HERE / 'shared/core.css', HERE / f'concepts/{key}/site.css'],
        'site.js': [HERE / 'shared/core.js', HERE / f'concepts/{key}/site.js'],
    }
    render = importlib.import_module(f'concepts.{key}.render').build
    if spec:
        # 第一次輸出只為了收集標題文字；子集字型完成後再輸出正式頁面
        site.copy_assets(assets)
        render(site)
        css, preload = fonts.build(site, spec)
        if css:
            site.font_preload = preload[-1:]
        else:
            site.fonts = site.fonts + [spec['fallback']]
        site.pages = []
        site.copy_assets(assets, extra_css=css)
    else:
        site.copy_assets(assets)
    for extra in sorted((HERE / f'concepts/{key}').glob('*.module.js')):
        (site.out / 'assets' / extra.name).write_text(extra.read_text(encoding='utf-8'), encoding='utf-8')
    render(site)
    site.finish()
    print(f'concept {key}: {len(site.pages)} pages -> {site.out.relative_to(ROOT)}')


def main(args):
    hub = '--hub' in args
    keys = [a for a in args if not a.startswith('--')] or [k for k in CONFIG if (HERE / 'concepts' / k / 'render.py').exists()]
    for key in keys:
        build(key)
    if hub and (HERE / 'hub.py').exists():
        importlib.import_module('hub').build(ROOT)


if __name__ == '__main__':
    main(sys.argv[1:])
