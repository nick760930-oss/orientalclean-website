"""Static QA for the generated previews.

    python3 concept-src/check.py [a b c]

Checks every generated page for: resolvable internal links and images,
exactly one <h1>, title / description / canonical / OG / Twitter tags,
parseable JSON-LD with a BreadcrumbList on inner pages, alt text on every
image, and duplicate element ids. Exits non-zero on any failure.
"""
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.imgs, self.ids, self.h1, self.meta, self.ld = [], [], [], 0, {}, []
        self._ld, self._buf, self.title = False, '', ''
        self._title = False
        self.canonical = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            self.ids.append(a['id'])
        if tag == 'a' and 'href' in a:
            self.links.append(a['href'])
        if tag == 'img':
            self.imgs.append(a)
        if tag == 'h1':
            self.h1 += 1
        if tag == 'meta':
            k = a.get('name') or a.get('property')
            if k:
                self.meta[k] = a.get('content', '')
        if tag == 'link' and a.get('rel') == 'canonical':
            self.canonical = a.get('href')
        if tag == 'link' and a.get('rel') in ('stylesheet', 'icon', 'apple-touch-icon', 'preload') and a.get('href', '').startswith('/'):
            self.links.append(a['href'])
        if tag == 'script' and a.get('type') == 'application/ld+json':
            self._ld, self._buf = True, ''
        if tag == 'script' and a.get('src', '').startswith('/'):
            self.links.append(a['src'])
        if tag == 'title':
            self._title = True

    def handle_endtag(self, tag):
        if tag == 'script' and self._ld:
            self.ld.append(self._buf)
            self._ld = False
        if tag == 'title':
            self._title = False

    def handle_data(self, data):
        if self._ld:
            self._buf += data
        if self._title:
            self.title += data


def resolve(path):
    path = path.split('#')[0].split('?')[0]
    if not path:
        return True
    p = ROOT / path.lstrip('/')
    if path.endswith('/'):
        return (p / 'index.html').exists()
    return p.exists() or p.with_suffix('.html').exists() or (ROOT / (path.lstrip('/') + '.html')).exists()


def check(key):
    out = ROOT / f'claude-{key}-preview'
    errors = []
    pages = sorted(out.rglob('*.html'))
    for f in pages:
        rel = f.relative_to(ROOT)
        p = Page()
        p.feed(f.read_text(encoding='utf-8'))
        err = lambda m: errors.append(f'{rel}: {m}')
        if p.h1 != 1:
            err(f'{p.h1} <h1> elements')
        if not p.title.strip():
            err('missing <title>')
        for k in ('description', 'og:title', 'og:description', 'og:image', 'og:url', 'twitter:card', 'robots'):
            if not p.meta.get(k):
                err(f'missing meta {k}')
        if not (p.canonical or '').startswith('https://www.orientalclean.com.tw/'):
            err('bad canonical')
        if len(p.meta.get('description', '')) > 160:
            err(f'description {len(p.meta["description"])} chars')
        types = []
        for raw in p.ld:
            try:
                types.append(json.loads(raw).get('@type'))
            except json.JSONDecodeError as ex:
                err(f'JSON-LD parse error {ex}')
        if 'Organization' not in types:
            err('no Organization JSON-LD')
        if f.name != 'index.html' or f.parent != out:
            if 'BreadcrumbList' not in types:
                err('no BreadcrumbList')
        for img in p.imgs:
            if 'alt' not in img:
                err(f'img without alt {img.get("src")}')
            if img.get('src', '').startswith('/') and not resolve(img['src']):
                err(f'missing image {img["src"]}')
            for part in (img.get('srcset') or '').split(','):
                u = part.strip().split(' ')[0]
                if u and not resolve(u):
                    err(f'missing srcset image {u}')
        for href in p.links:
            if href.startswith(('http', 'mailto:', 'tel:', '#')):
                continue
            if not resolve(href):
                err(f'broken link {href}')
        dup = {i for i in p.ids if p.ids.count(i) > 1}
        if dup:
            err(f'duplicate ids {sorted(dup)}')
    print(f'concept {key}: {len(pages)} pages, {len(errors)} problems')
    for x in errors[:60]:
        print('  ', x)
    return not errors


if __name__ == '__main__':
    keys = sys.argv[1:] or ['a', 'b', 'c']
    ok = all([check(k) for k in keys])
    sys.exit(0 if ok else 1)
