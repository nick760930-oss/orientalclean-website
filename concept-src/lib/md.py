"""Minimal Markdown + front matter reader for engineering notes.

Supports the subset the content engine writes: ## / ### headings, paragraphs,
- lists, **bold**, [text](url). Keeping it dependency-free means the build
runs on any machine with Python 3.
"""
import re
from html import escape

FRONT = re.compile(r'^---\n(.*?)\n---\n(.*)$', re.S)
LIST_KEYS = {'tags', 'services', 'cases', 'related'}


def read(path):
    raw = path.read_text(encoding='utf-8')
    m = FRONT.match(raw)
    if not m:
        raise ValueError(f'{path}: missing front matter')
    meta = {}
    for line in m.group(1).splitlines():
        if not line.strip():
            continue
        key, _, value = line.partition(':')
        key, value = key.strip(), value.strip()
        meta[key] = [v.strip() for v in value.split(',') if v.strip()] if key in LIST_KEYS else value
    meta['slug'] = path.stem
    meta['sections'] = sections(m.group(2))
    return meta


def inline(text):
    text = escape(text, quote=False)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    return re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2" rel="noopener">\1</a>', text)


def sections(body):
    """Split on ## headings -> [{title, id, html, text}]."""
    out = []
    for block in re.split(r'^## ', body.strip(), flags=re.M):
        if not block.strip():
            continue
        title, _, rest = block.partition('\n')
        out.append({'title': title.strip(), 'html': to_html(rest), 'text': plain(rest)})
    for i, s in enumerate(out):
        s['id'] = f's{i + 1}'
    return out


def to_html(md):
    html, para, items = [], [], []

    def flush():
        if para:
            html.append('<p>' + inline(' '.join(para)) + '</p>')
            para.clear()
        if items:
            html.append('<ul>' + ''.join(f'<li>{inline(i)}</li>' for i in items) + '</ul>')
            items.clear()

    for line in md.splitlines():
        s = line.strip()
        if not s:
            flush()
        elif s.startswith('### '):
            flush()
            html.append(f'<h3>{inline(s[4:])}</h3>')
        elif s.startswith('- '):
            if para:
                flush()
            items.append(s[2:])
        else:
            if items:
                flush()
            para.append(s)
    flush()
    return '\n'.join(html)


def plain(md):
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', md)
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    return re.sub(r'\s+', ' ', text.replace('- ', '')).strip()
