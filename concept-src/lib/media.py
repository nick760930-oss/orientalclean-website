"""Responsive image variants from the repository's real photos and logo files.

Every photo is re-encoded to WebP at a few widths so pages never ship the
original 500 KB JPEGs to phones. Logos are only trimmed and re-encoded; the
artwork itself is untouched.
"""
import json
from pathlib import Path
from PIL import Image

WIDTHS = (240, 480, 800, 1200, 1600)
QUALITY = 78


class Media:
    def __init__(self, root, out_dir, url_prefix):
        self.root = Path(root)
        self.out = Path(out_dir) / 'media'
        self.brand = Path(out_dir) / 'brand'
        self.prefix = url_prefix
        self.out.mkdir(parents=True, exist_ok=True)
        self.brand.mkdir(parents=True, exist_ok=True)
        self.cache_file = self.out / '.manifest.json'
        self.cache = json.loads(self.cache_file.read_text()) if self.cache_file.exists() else {}

    def save(self):
        self.cache_file.write_text(json.dumps(self.cache, ensure_ascii=False, indent=1))

    def get(self, src):
        """src is relative to /images. Returns dict with srcset data."""
        path = self.root / 'images' / src
        key = src
        mtime = path.stat().st_mtime
        hit = self.cache.get(key)
        if hit and hit.get('mtime') == mtime and hit.get('spec') == [list(WIDTHS), QUALITY] and all((self.out / f).exists() for f in hit['files']):
            return hit
        im = Image.open(path).convert('RGB')
        w, h = im.size
        stem = src.replace('/', '-').rsplit('.', 1)[0]
        widths = [x for x in WIDTHS if x < w] + [min(w, WIDTHS[-1])]
        widths = sorted(set(widths))
        files, variants = [], []
        for vw in widths:
            vh = round(h * vw / w)
            name = f'{stem}-{vw}.webp'
            im.resize((vw, vh), Image.LANCZOS).save(self.out / name, 'WEBP', quality=QUALITY, method=5)
            files.append(name)
            variants.append([name, vw])
        tiny = im.resize((1, 1), Image.BOX).getpixel((0, 0))
        info = {'mtime': mtime, 'spec': [list(WIDTHS), QUALITY], 'w': w, 'h': h, 'files': files, 'variants': variants,
                'color': '#%02x%02x%02x' % tiny, 'original': '/images/' + src}
        self.cache[key] = info
        return info

    def url(self, name):
        return f'{self.prefix}/media/{name}'

    def srcset(self, info):
        return ', '.join(f'{self.url(n)} {w}w' for n, w in info['variants'])

    def largest(self, info):
        return self.url(info['variants'][-1][0])

    def brand_assets(self):
        """Trim the official logo files and build the social preview image."""
        out = {}
        for name, src in [('logo-white', 'logo-white-transparent.png'),
                          ('logo-cyan', 'logo-light-white-bg.png'),
                          ('logo-ink', 'logo-horizontal-dark.png')]:
            im = Image.open(self.root / 'images' / src).convert('RGBA')
            im = im.crop(im.getbbox())
            w = 720
            im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
            im.save(self.brand / f'{name}.png', optimize=True)
            im.save(self.brand / f'{name}.webp', 'WEBP', quality=90, lossless=False)
            out[name] = {'w': im.width, 'h': im.height}
        bg = Image.open(self.root / 'images' / 'logo-cyan-bg.png').convert('RGB')
        bw, bh = bg.size
        crop_h = round(bw * 630 / 1200)
        top = (bh - crop_h) // 2
        bg.crop((0, top, bw, top + crop_h)).resize((1200, 630), Image.LANCZOS).save(
            self.brand / 'og-brand.jpg', 'JPEG', quality=88)
        return out
