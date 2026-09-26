"""Shared site model: content, routing, SEO head, JSON-LD and components.

Each concept renders its own markup, but every page goes through the same
head/SEO layer so all three prototypes carry identical crawlable metadata.
"""
import hashlib
import json
import shutil
from datetime import date
from html import escape
from pathlib import Path

from . import md
from .media import Media

BASE = 'https://www.orientalclean.com.tw'
TODAY = '2026-09-26'
PENDING = '待補資料'
HOME_TITLE = '東方繩洗｜外牆清洗・修繕・防水・高空工程'
HOME_DESC = '東方繩洗有限公司提供外牆清洗、外牆修繕、防水、高空檢查及繩索與吊籠作業。依建築條件、外牆材質與現場問題安排施工，提供工程案例與現場評估。'
STAGE = {'before': '施工前', 'during': '施工中', 'after': '完工', 'context': '建築外觀'}
REVIEW = {'reviewer': '待公司指定工程審閱人', 'author': '東方繩洗有限公司'}
# 文章流程：draft 草稿 → review 工程審閱中 → published 已發布（只有 published 才應進入正式 sitemap）
STATUS = {'draft': ('草稿・待工程審閱', 'Draft'), 'review': ('工程審閱中', 'Draft'), 'published': ('已發布', 'Published')}


def e(text):
    return escape(str(text), quote=True)


def jsonld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + '</script>'


class Site:
    def __init__(self, concept, root, fonts, theme_color, name):
        self.concept = concept
        self.name = name
        self.root = Path(root)
        self.src = self.root / 'concept-src'
        self.prefix = f'/claude-{concept}-preview'
        self.out = self.root / f'claude-{concept}-preview'
        self.fonts = fonts
        self.theme_color = theme_color
        c = self.src / 'content'
        self.company = json.loads((c / 'company.json').read_text())
        k = json.loads((c / 'knowledge.json').read_text())
        self.methods = {m['slug']: m for m in k['methods']}
        self.materials = {m['slug']: m for m in k['materials']}
        self.issues = {i['slug']: i for i in k['issues']}
        self.services = {s['slug']: s for s in json.loads((c / 'services.json').read_text())}
        cases = json.loads((c / 'cases.json').read_text())
        self.cases = {x['slug']: x for x in cases['cases']}
        self.loose_photos = cases['unattributed_photos']
        self.articles = {}
        for p in sorted((c / 'insights').glob('*.md')):
            a = md.read(p)
            a.update({k2: a.get(k2, v) for k2, v in REVIEW.items()})
            a['state'] = a.get('status', 'draft') if a.get('status', 'draft') in STATUS else 'draft'
            a['status'], a['schema_status'] = STATUS[a['state']]
            self.articles[a['slug']] = a
        self.check_refs()
        if self.out.exists():
            for child in self.out.iterdir():
                if child.name != 'media':
                    shutil.rmtree(child) if child.is_dir() else child.unlink()
        self.out.mkdir(parents=True, exist_ok=True)
        self.media = Media(self.root, self.out, self.prefix)
        self.brand = self.media.brand_assets()
        self.pages = []
        self.asset_version = ''
        self.font_preload = []

    # ------------------------------------------------------------------ refs
    def check_refs(self):
        for s in self.services.values():
            for ref, pool in [('cases', self.cases), ('articles', self.articles), ('methods', self.methods),
                              ('access', self.methods), ('issues', self.issues), ('materials', self.materials)]:
                for x in s.get(ref, []):
                    assert x in pool, f'service {s["slug"]}: unknown {ref} {x}'
        for a in self.articles.values():
            for ref, pool in [('services', self.services), ('cases', self.cases), ('related', self.articles)]:
                for x in a.get(ref, []):
                    assert x in pool, f'article {a["slug"]}: unknown {ref} {x}'
        for c in self.cases.values():
            assert c['service'] in self.services, c['slug']
            for x in c['articles']:
                assert x in self.articles, f'case {c["slug"]}: unknown article {x}'

    # --------------------------------------------------------------- routing
    def url(self, route):
        return self.prefix + route

    def canonical(self, route):
        return BASE + route

    def asset(self, name):
        return f'{self.prefix}/assets/{name}?v={self.asset_version}'

    def write(self, route, html):
        rel = 'index.html' if route == '/' else (route.lstrip('/') + 'index.html' if route.endswith('/') else route.lstrip('/') + '.html')
        dest = self.out / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(html, encoding='utf-8')
        self.pages.append(route)

    # ---------------------------------------------------------------- lookup
    def cases_for_service(self, slug):
        return [c for c in self.cases.values() if c['service'] == slug or c['slug'] in self.services[slug]['cases']]

    def articles_for_case(self, case):
        return [self.articles[a] for a in case['articles']]

    def sorted_cases(self):
        return sorted(self.cases.values(), key=lambda c: c['code'])

    def sorted_articles(self):
        return list(self.articles.values())

    def cover(self, case):
        return case['photos'][0]

    # ------------------------------------------------------------------ head
    def head(self, *, title, description, route, og_type='website', image=None, schema=(), extra='', body_class=''):
        full_title = title if route == '/' else f'{title}｜東方繩洗'
        og_image = BASE + '/images/logo-brand-color.png'
        if image:
            og_image = BASE + '/images/' + image
        fonts = ''.join(f'<link rel="preload" as="font" type="font/woff2" href="{u}" crossorigin>' for u in self.font_preload)
        fonts += ''.join(f'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?{f}&display=swap">' for f in self.fonts)
        blocks = [jsonld(s) for s in schema]
        return f'''<!doctype html>
<html lang="zh-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(full_title)}</title>
<meta name="description" content="{e(description)}">
<link rel="canonical" href="{self.canonical(route)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="{self.theme_color}">
<meta property="og:type" content="{og_type}">
<meta property="og:locale" content="zh_TW">
<meta property="og:site_name" content="東方繩洗">
<meta property="og:title" content="{e(full_title)}">
<meta property="og:description" content="{e(description)}">
<meta property="og:url" content="{self.canonical(route)}">
<meta property="og:image" content="{og_image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(full_title)}">
<meta name="twitter:description" content="{e(description)}">
<meta name="twitter:image" content="{og_image}">
<link rel="icon" type="image/png" sizes="48x48" href="/images/logo-cyan-bg.png">
<link rel="apple-touch-icon" href="/images/logo-cyan-bg.png">
{'<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' if self.fonts else ''}
{fonts}
<link rel="stylesheet" href="{self.asset('site.css')}">
<script>document.documentElement.classList.add('js')</script>
<script defer src="{self.asset('site.js')}"></script>
{extra}
{''.join(blocks)}
</head>
<body class="{body_class}">
<a class="oc-skip" href="#main">跳至內容</a>
'''

    # -------------------------------------------------------------- JSON-LD
    def org(self):
        c = self.company
        return {'@context': 'https://schema.org', '@type': 'Organization', '@id': BASE + '/#organization',
                'name': c['name'], 'alternateName': c['name_en'], 'url': BASE + '/',
                'logo': BASE + '/images/logo-brand-color.png', 'telephone': c['phone_e164'], 'email': c['email'],
                'taxID': c['tax_id'], 'foundingDate': c['founded_iso'],
                'address': self.postal(), 'sameAs': [c['facebook'], c['line_url']]}

    def postal(self):
        a = self.company['address_parts']
        return {'@type': 'PostalAddress', 'addressCountry': a['country'], 'addressRegion': a['region'],
                'addressLocality': a['locality'], 'streetAddress': a['street']}

    def local(self):
        c = self.company
        hours = []
        for h in c['hours']:
            if h['schema']:
                days, span = h['schema'].split(' ')
                opens, closes = span.split('-')
                names = {'Mo-Fr': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], 'Sa': ['Saturday']}[days]
                hours.append({'@type': 'OpeningHoursSpecification', 'dayOfWeek': names, 'opens': opens, 'closes': closes})
        return {'@context': 'https://schema.org', '@type': 'HomeAndConstructionBusiness', '@id': BASE + '/#localbusiness',
                'name': c['name'], 'alternateName': c['name_en'], 'url': BASE + '/', 'image': BASE + '/images/logo-brand-color.png',
                'logo': BASE + '/images/logo-brand-color.png', 'telephone': c['phone_e164'], 'email': c['email'],
                'address': self.postal(), 'openingHoursSpecification': hours,
                'areaServed': [{'@type': 'AdministrativeArea', 'name': x} for x in c['areas']],
                'parentOrganization': {'@id': BASE + '/#organization'},
                'knowsAbout': [s['name'] for s in self.services.values()]}

    def website(self):
        return {'@context': 'https://schema.org', '@type': 'WebSite', '@id': BASE + '/#website', 'name': '東方繩洗',
                'url': BASE + '/', 'inLanguage': 'zh-TW', 'publisher': {'@id': BASE + '/#organization'}}

    def breadcrumb(self, items):
        return {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': i + 1, 'name': name, 'item': self.canonical(route)}
            for i, (name, route) in enumerate(items)]}

    def service_ld(self, s):
        return {'@context': 'https://schema.org', '@type': 'Service', '@id': self.canonical(f'/services/{s["slug"]}') + '#service',
                'name': s['name'], 'serviceType': s['name'], 'description': s['description'],
                'url': self.canonical(f'/services/{s["slug"]}'), 'image': BASE + '/images/' + s['photo']['src'],
                'provider': {'@id': BASE + '/#localbusiness'},
                'areaServed': [{'@type': 'AdministrativeArea', 'name': x} for x in self.company['areas']]}

    def article_ld(self, a):
        route = f'/insights/{a["slug"]}'
        return {'@context': 'https://schema.org', '@type': 'Article', 'headline': a['title'], 'description': a['description'],
                'datePublished': a['published'], 'dateModified': a['updated'], 'inLanguage': 'zh-TW',
                'author': {'@type': 'Organization', '@id': BASE + '/#organization', 'name': self.company['name']},
                'publisher': {'@id': BASE + '/#organization'}, 'mainEntityOfPage': self.canonical(route),
                'image': BASE + '/images/logo-brand-color.png', 'keywords': a.get('tags', []),
                'articleSection': a['category'], 'creativeWorkStatus': a['schema_status'],
                'about': [{'@id': self.canonical(f'/services/{x}') + '#service'} for x in a.get('services', [])]}

    def case_ld(self, c):
        route = f'/projects/{c["slug"]}'
        ld = {'@context': 'https://schema.org', '@type': 'CreativeWork', 'genre': '工程案例', 'name': f'{c["name"]}｜{c["work"]}',
              'description': c['summary'], 'url': self.canonical(route), 'inLanguage': 'zh-TW',
              'publisher': {'@id': BASE + '/#organization'},
              'image': [BASE + '/images/' + p['src'] for p in c['photos']],
              'about': {'@id': self.canonical(f'/services/{c["service"]}') + '#service'}}
        if c['region'] != PENDING:
            ld['contentLocation'] = {'@type': 'Place', 'name': c['region']}
        if c['period'] != PENDING:
            ld['temporalCoverage'] = c['period'].replace('/', '-').replace('–', '/')
        return ld

    def itemlist(self, name, items):
        return {'@context': 'https://schema.org', '@type': 'ItemList', 'name': name, 'itemListElement': [
            {'@type': 'ListItem', 'position': i + 1, 'url': self.canonical(route), 'name': label}
            for i, (label, route) in enumerate(items)]}

    # ----------------------------------------------------------- components
    def pic(self, src, sizes='100vw', alt=None, cls='', eager=False, attrs='', photo=None):
        info = self.media.get(src)
        alt = alt if alt is not None else (photo or {}).get('alt', '')
        load = 'fetchpriority="high" loading="eager"' if eager else 'loading="lazy"'
        return (f'<img class="{cls}" src="{self.media.largest(info)}" srcset="{self.media.srcset(info)}" sizes="{sizes}" '
                f'width="{info["w"]}" height="{info["h"]}" alt="{e(alt)}" decoding="async" {load} '
                f'style="background-color:{info["color"]}" data-oc-img {attrs}>')

    def ratio(self, src):
        info = self.media.get(src)
        return info['w'], info['h']

    def missing(self, label, note=PENDING, cls=''):
        return f'<div class="oc-missing {cls}" role="img" aria-label="{e(label)}：{e(note)}"><span>{e(label)}</span><small>{e(note)}</small></div>'

    def before_after(self, case, sizes='(min-width: 900px) 60vw, 100vw'):
        photo = next((p for p in case['photos'] if p['stage'] in ('during', 'after')), case['photos'][0])
        w, h = self.ratio(photo['src'])
        right = STAGE[photo['stage']]
        return f'''<figure class="oc-ba" data-ba>
<div class="oc-ba__stage" style="aspect-ratio:{w}/{h}">
<div class="oc-ba__layer oc-ba__after">{self.pic(photo['src'], sizes, photo=photo)}<span class="oc-ba__tag oc-ba__tag--r">{right}</span></div>
<div class="oc-ba__layer oc-ba__before">{self.missing('施工前同角度照片')}<span class="oc-ba__tag">施工前</span></div>
<div class="oc-ba__handle" aria-hidden="true"><span></span></div>
</div>
<label class="oc-ba__control"><span class="oc-vh">左右拖曳，比較施工前與{right}照片</span><input type="range" min="0" max="100" value="50" step="1" data-ba-range></label>
<figcaption>前後對照：左側為施工前（{PENDING}），右側為{right}紀錄。本案尚無同角度施工前、完工照片，取得後直接替換左側。</figcaption>
</figure>'''

    def inquiry(self, heading_tag='h2', heading='安排現場勘查', intro='留下案場資料，我們會依內容安排初步討論與現場勘查。'):
        c = self.company
        needs = ['外牆清洗', '磁磚空鼓／剝落', '外牆裂縫', '滲水／防水', '矽利康更新', '外牆檢查', '特殊高空作業', '還不確定']
        types = ['住宅社區', '商辦大樓', '百貨商場', '飯店', '工廠', '學校', '公共建築', '其他']
        chips = lambda name, opts, kind: ''.join(
            f'<label class="oc-chip"><input type="{kind}" name="{name}" value="{e(o)}"><span>{e(o)}</span></label>' for o in opts)
        return f'''<section class="oc-inquiry" id="inquiry" aria-labelledby="inquiry-title">
<{heading_tag} id="inquiry-title">{heading}</{heading_tag}>
<p class="oc-inquiry__intro">{intro}</p>
<form class="oc-inquiry__form" data-inquiry novalidate>
<fieldset><legend>需要處理的問題（可複選）</legend><div class="oc-chips">{chips('need', needs, 'checkbox')}</div></fieldset>
<fieldset><legend>建築類型</legend><div class="oc-chips">{chips('type', types, 'radio')}</div></fieldset>
<div class="oc-fields">
<label><span>案場地區或地址</span><input name="place" autocomplete="street-address" placeholder="例：台北市中正區"></label>
<label><span>樓層數</span><input name="floors" inputmode="numeric" placeholder="例：15"></label>
<label><span>聯絡人</span><input name="name" autocomplete="name"></label>
<label><span>聯絡電話</span><input name="tel" type="tel" autocomplete="tel"></label>
<label class="oc-fields__wide"><span>現況說明</span><textarea name="note" rows="3" placeholder="位置、發生時間、希望處理的範圍"></textarea></label>
</div>
<output class="oc-inquiry__preview" data-inquiry-preview aria-live="polite"></output>
<div class="oc-inquiry__actions">
<button type="button" class="oc-btn oc-btn--primary" data-inquiry-line>複製內容並開啟 LINE</button>
<a class="oc-btn" data-inquiry-mail href="mailto:{c['email']}">以 Email 寄出</a>
<a class="oc-btn" href="tel:{c['phone'].replace('-', '')}" data-track="call">撥打 {c['phone']}</a>
</div>
<p class="oc-inquiry__note">現況照片請在 LINE 對話中直接傳送。表單內容只在您的裝置上組成訊息，不會自動送出或儲存。</p>
</form>
</section>'''

    def contact_lines(self):
        c = self.company
        hours = '；'.join(f'{h["days"]} {h["time"]}' for h in c['hours'])
        return [('電話', f'<a href="tel:{c["phone"].replace("-", "")}">{c["phone"]}</a>　{c["phone_contact"]}'),
                ('LINE', f'<a href="{c["line_url"]}" rel="noopener">{c["line_id"]}</a>'),
                ('Email', f'<a href="mailto:{c["email"]}">{c["email"]}</a>'),
                ('地址', e(c['address'])),
                ('服務時間', e(hours)),
                ('服務地區', e('、'.join(c['areas'])))]

    def company_lines(self):
        c = self.company
        return [('公司名稱', f'{c["name"]}　{c["name_en"]}'), ('統一編號', c['tax_id']), ('成立', c['founded']),
                ('資本額', c['capital']), ('負責人', c['representative']), ('地址', c['address'])]

    def review_block(self, a):
        return [('更新日期', a['updated']), ('初稿日期', a['published']), ('撰寫', a['author']),
                ('工程審閱', a['reviewer']), ('狀態', a['status'])]

    def method_names(self, slugs):
        return '、'.join(self.methods[m]['name'] for m in slugs) if slugs else PENDING

    # ---------------------------------------------------------------- finish
    def copy_assets(self, files, extra_css=''):
        """files: {output_name: [source paths]} concatenated in order."""
        out = self.out / 'assets'
        out.mkdir(parents=True, exist_ok=True)
        digest = hashlib.sha1()
        for name, sources in files.items():
            data = '\n'.join(Path(s).read_text(encoding='utf-8') for s in sources)
            if name.endswith('.css') and extra_css:
                data = extra_css + data
            (out / name).write_text(data, encoding='utf-8')
            digest.update(data.encode())
        self.asset_version = digest.hexdigest()[:8]

    def published(self, route):
        """Only articles marked `status: published` belong in the launch sitemap."""
        if route.startswith('/insights/') and route != '/insights/':
            return self.articles[route.split('/')[-1]]['state'] == 'published'
        return True

    def finish(self):
        self.media.save()
        drafts = [r for r in self.pages if not self.published(r)]
        urls = ''.join(f'<url><loc>{self.canonical(r)}</loc><lastmod>{TODAY}</lastmod></url>\n' for r in self.pages if self.published(r))
        note = ''.join(f'<!-- 草稿未列入：{self.canonical(r)} -->\n' for r in drafts)
        (self.out / 'sitemap.xml').write_text(
            '<?xml version="1.0" encoding="UTF-8"?>\n<!-- 上線用 sitemap：網址為正式站路徑。工程筆記需 status: published 才會列入。預覽期間不提交。 -->\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + note + '</urlset>\n', encoding='utf-8')
        (self.out / 'robots.txt').write_text(
            '# 上線用 robots.txt 提案（預覽期間不生效；正式站根目錄 robots.txt 未修改）\n'
            '# 爬蟲只遵守最符合自己的一組規則，所以每一組都重複列出 Disallow。\n'
            '# 是否允許模型訓練爬蟲（GPTBot、Google-Extended）待公司決定；目前由 * 規則處理。\n'
            + ''.join(f'User-agent: {ua}\nAllow: /\nDisallow: /admin/\nDisallow: /survey\n\n'
                      for ua in ('Googlebot', 'OAI-SearchBot', 'ChatGPT-User', '*'))
            + f'Sitemap: {BASE}/sitemap.xml\n', encoding='utf-8')
        lines = [f'# {self.company["name"]}（{self.company["name_en"]}）', '',
                 '> 外牆清洗、外牆修繕、外牆防水、外牆安全檢查與高空作業（繩索、吊籠、高空車、吊車、施工架）。',
                 f'> 電話 {self.company["phone"]}；LINE {self.company["line_id"]}；{self.company["address"]}', '', '## 工程服務']
        lines += [f'- [{s["name"]}]({self.canonical("/services/" + s["slug"])}): {s["lead"]}' for s in self.services.values()]
        lines += ['', '## 工程案例']
        lines += [f'- [{c["name"]}｜{c["work"]}]({self.canonical("/projects/" + c["slug"])}): {c["summary"]}' for c in self.sorted_cases()]
        lines += ['', '## 工程筆記']
        lines += [f'- [{a["title"]}]({self.canonical("/insights/" + a["slug"])}): {a["answer"]}' for a in self.articles.values() if a['state'] == 'published']
        lines += [f'<!-- 草稿，審閱後列入：{a["title"]} -->' for a in self.articles.values() if a['state'] != 'published']
        (self.out / 'llms.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')
