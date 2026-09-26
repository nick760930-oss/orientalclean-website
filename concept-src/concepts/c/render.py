"""Concept C 垂降 — spatial / cinematic, organised by the job sequence.

IA starts from how the facade is reached and worked: 屋頂 → 立面 → 地面 → 紀錄.
On desktop, vertical scroll drives a horizontal descent (scroll controls time);
on touch devices the same scenes are a native swipe track.
"""
from lib.site import e, PENDING, HOME_TITLE, HOME_DESC, STAGE

NAV = [('/services/rope-access', '接近方式'), ('/services/', '工程服務'), ('/projects/', '案例'), ('/insights/', '工法手冊'), ('/about', '公司')]
CURRENT = ' aria-current="page"'
SCENES = [
    {'id': 'roof', 'floor': 'RF', 'stage': '屋頂', 'title': '固定點與作業前確認', 'photo': 'cases/lien-jade-oriental-2.jpg',
     'text': '施工前確認屋頂出入口、固定點位置與承載條件，規劃每一條垂降線的區段，並在地面劃出隔離範圍。',
     'facts': ['工作繩與確保繩各自固定', '確認女兒牆與屋頂構件條件', '天候不適合時停止作業'], 'link': ('rope-access', '接近方式')},
    {'id': 'survey', 'floor': '立面', 'stage': '判讀', 'title': '敲擊、目視與標記', 'photo': 'service-inspection.jpg',
     'text': '沿立面下降，以敲擊與目視檢查空鼓、裂縫與接縫，把異常位置標在立面圖或照片上。',
     'facts': ['空鼓以敲擊確認範圍', '紅外線熱像只作輔助', '無法接近的位置註明原因'], 'link': ('facade-inspection', '外牆安全檢查')},
    {'id': 'clean', 'floor': '立面', 'stage': '清洗', 'title': '水、藥劑與材質', 'photo': 'cases/tonlin-rope-cleaning.webp',
     'text': '依外牆材質與髒污分級決定用水、藥劑與工具，先在不顯眼處試洗。玻璃最後以純水沖洗，減少水痕。',
     'facts': ['含鈣石材避免未試洗的酸性藥劑', '接縫附近降低水壓', '刮傷與蝕刻不屬清洗範圍'], 'link': ('wall-cleaning', '外牆清洗')},
    {'id': 'repair', 'floor': '立面', 'stage': '修繕', 'title': '磁磚、裂縫與基層', 'photo': 'service-repair.jpg',
     'text': '磁磚空鼓、剝落與裂縫先確認範圍，再評估空鼓灌注、局部修補或打除重做。拆除後的基層狀況，先拍照確認再追加。',
     'facts': ['灌注後以敲擊複查', '補料色差事先討論', '結構性裂縫交由結構專業評估'], 'link': ('wall-repair', '外牆修繕')},
    {'id': 'seal', 'floor': '立面', 'stage': '防水', 'title': '接縫與矽利康', 'photo': 'service-waterproof.jpg',
     'text': '先找水從哪裡進來。老化的矽利康清除乾淨，接縫清潔乾燥、放置背襯材與底漆後重新施打，不在舊膠上加打。',
     'facts': ['潮濕天候不施作', '避免三面黏結', '記錄接縫位置與使用產品'], 'link': ('waterproof', '外牆防水')},
    {'id': 'ground', 'floor': 'GL', 'stage': '地面', 'title': '隔離、動線與用水', 'photo': 'cases/morten41-ground-glass.webp',
     'text': '高空作業期間，地面管理人車動線、用水與排水；一樓玻璃與店面以地面設備完成。',
     'facts': ['隔離範圍涵蓋落物與水花', '公共空間作業事先協調', '住戶關窗與物品移置先公告'], 'link': ('rope-access', '高空作業與接近方式')},
    {'id': 'record', 'floor': 'GL', 'stage': '紀錄', 'title': '位置、照片與驗收', 'photo': 'cases/morten41-glass-comparison.webp',
     'text': '每一個處理位置對回照片、工法與使用材料。完工紀錄可以驗收，也能留給下一次維護與管理窗口交接。',
     'facts': ['施工前、中、後同位置照片', '範圍標記與使用材料', '無法施作的位置另列原因'], 'link': None},
]
GROUPS = [('勘查與判斷', ['hollow-tile-diagnosis', 'tile-fall-first-steps', 'leak-water-path']),
          ('清洗', ['facade-cleaning-cost', 'glass-water-stain']),
          ('修繕', ['injection-vs-patch-vs-retile']),
          ('防水', ['waterproofing-corner-leak', 'sealant-aging']),
          ('接近方式與發包', ['rope-access-vs-gondola', 'community-repair-tender'])]


# --------------------------------------------------------------- frame
def header(site, route):
    items = ''.join(f'<li><a href="{site.url(r)}"{CURRENT if (route == r or (r.endswith("/") and route.startswith(r) and route != "/services/rope-access")) else ""}>{label}</a></li>' for r, label in NAV)
    b = site.brand['logo-white']
    return f'''<header class="c-head">
<a class="c-brand" href="{site.url('/')}" aria-label="東方繩洗首頁"><img src="{site.prefix}/brand/logo-white.webp" width="{b['w']}" height="{b['h']}" alt="東方繩洗 ORIENTAL CLEAN"></a>
<nav class="c-nav" id="c-nav" aria-label="主要選單"><ul>{items}<li class="c-nav__cta"><a href="{site.url('/contact')}"{CURRENT if route == '/contact' else ''}>安排勘查</a></li></ul></nav>
<button class="c-menu" type="button" aria-expanded="false" aria-controls="c-nav">選單</button>
</header>'''


def footer(site):
    lines = ''.join(f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in site.contact_lines())
    company = ''.join(f'<div><dt>{k}</dt><dd>{e(v)}</dd></div>' for k, v in site.company_lines())
    svcs = ''.join(f'<li><a href="{site.url("/services/" + s["slug"])}">{s["name"]}</a></li>' for s in site.services.values())
    return f'''<footer class="c-foot">
<div class="c-foot__grid">
<section><h2 class="c-label">聯絡</h2><dl class="c-dl">{lines}</dl></section>
<section><h2 class="c-label">公司資料</h2><dl class="c-dl">{company}</dl></section>
<section><h2 class="c-label">工程服務</h2><ul class="c-foot__links">{svcs}<li><a href="{site.url('/projects/')}">案例</a></li><li><a href="{site.url('/insights/')}">工法手冊</a></li></ul></section>
</div>
<p class="c-foot__note">概念原型 C「垂降」｜預覽用，不影響正式站。</p>
</footer>'''


def crumbs(site, items):
    lis = ''.join(f'<li><a href="{site.url(r)}">{e(n)}</a></li>' for n, r in items[:-1])
    return f'<nav class="c-crumb" aria-label="頁面位置"><ol>{lis}<li aria-current="page">{e(items[-1][0])}</li></ol></nav>'


def page(site, route, *, title, desc, body, trail=None, schema=(), og_type='website', image=None, cls='', extra=''):
    schema = list(schema) + [site.org()]
    if trail:
        schema.append(site.breadcrumb(trail))
    html = site.head(title=title, description=desc, route=route, og_type=og_type, image=image, schema=schema, body_class='c ' + cls, extra=extra)
    html += header(site, route) + '<main id="main">' + (crumbs(site, trail) if trail else '') + body + '</main>' + footer(site) + '\n</body>\n</html>\n'
    site.write(route, html)


def pend(v):
    if v in (None, '', PENDING) or v == [PENDING]:
        return f'<span class="c-pending">{PENDING}</span>'
    return e('、'.join(v) if isinstance(v, list) else v)


def reel(site, cases, big=False):
    frames = []
    for c in cases:
        p = c['photos'][0]
        access = '、'.join(site.methods[x]['name'] for x in c['access']) or PENDING
        frames.append(f'''<li class="c-reel__item" data-tags="{c['service']}"><a class="c-frame" href="{site.url('/projects/' + c['slug'])}">
<span class="c-frame__img">{site.pic(p['src'], '(min-width: 900px) 46vw, 84vw' if big else '(min-width: 900px) 30vw, 78vw', alt=p['alt'])}</span>
<span class="c-frame__meta"><span class="c-num">{c['code']}</span><strong>{e(c['name'])}</strong><span>{e(c['work'])}・{pend(c['region'])}</span><span class="c-frame__acc">{pend(access)}</span></span></a></li>''')
    return f'''<div class="c-reel{' c-reel--big' if big else ''}" data-reel>
<div class="c-reel__ctrl"><button type="button" data-reel-prev aria-label="上一個案例">上一個</button><span class="c-reel__count" aria-live="polite"><span data-reel-n>1</span>／{len(cases)}</span><button type="button" data-reel-next aria-label="下一個案例">下一個</button></div>
<ol class="c-reel__track" data-reel-track tabindex="0" aria-label="案例膠卷，可左右拖曳">{''.join(frames)}</ol></div>'''


# ------------------------------------------------------------------ pages
def home(site):
    opener = site.media.get('case-3.jpg')
    scenes = []
    for i, s in enumerate(SCENES):
        facts = ''.join(f'<li>{e(f)}</li>' for f in s['facts'])
        link = f'<a class="c-link" href="{site.url("/services/" + s["link"][0])}">{s["link"][1]}</a>' if s['link'] else \
            f'<a class="c-link" href="{site.url("/projects/")}">看案例紀錄</a><a class="c-link" href="{site.url("/contact")}">安排勘查</a>'
        w, h = site.ratio(s['photo'])
        low = s['photo'] in ('cases/lien-jade-oriental-2.jpg',)
        scenes.append(f'''<article class="c-scene" id="scene-{s['id']}" data-scene="{i + 1}" data-stage="{s['stage']}" data-floor="{s['floor']}" aria-labelledby="scene-{s['id']}-h">
<figure class="c-scene__photo"><span class="c-scene__img" style="aspect-ratio:{w}/{h}">{site.pic(s['photo'], '(min-width: 900px) 56vw, 100vw', alt=s['title'])}</span>
{'<figcaption>低解析原檔，待補高解析照片。</figcaption>' if low else ''}</figure>
<div class="c-scene__text"><p class="c-stage"><span class="c-num">{s['floor']}</span>{s['stage']}</p>
<h2 id="scene-{s['id']}-h">{s['title']}</h2><p>{e(s['text'])}</p><ul class="c-facts">{facts}</ul><p class="c-links">{link}</p></div>
</article>''')
    stations = ''.join(f'<li><button type="button" data-goto="{i}" aria-label="{s["stage"]}：{s["title"]}"><span class="c-num">{s["floor"]}</span><span>{s["stage"]}</span></button></li>'
                       for i, s in enumerate([{'floor': '外側', 'stage': '開場', 'title': '玻璃外側'}] + SCENES))
    arts = site.sorted_articles()
    notes = ''.join(f'<li><a href="{site.url("/insights/" + a["slug"])}"><span class="c-label">{e(a["category"])}</span><strong>{e(a["title"])}</strong></a></li>' for a in arts[:4])
    body = f'''
<section class="c-descent" data-descent aria-label="作業順序：從屋頂到地面">
<div class="c-descent__sticky">
<div class="c-track" data-track>
<article class="c-scene c-scene--open" id="scene-open" data-scene="0" data-stage="開場" data-floor="外側" aria-labelledby="open-h">
<div class="c-film" data-film data-src="{site.media.url(opener['variants'][-1][0])}" data-w="{opener['w']}" data-h="{opener['h']}">
{site.pic('case-3.jpg', '100vw', alt='高樓玻璃外側繩索作業', eager=True, cls='c-film__img')}
<canvas class="c-film__canvas" aria-hidden="true"></canvas>
<div class="c-film__load" data-film-load hidden><span>載入現場照片</span><span class="c-film__bar"><span data-film-bar></span></span><span data-film-pct>0%</span></div>
</div>
<div class="c-open__text">
<p class="c-stage"><span class="c-num">ORIENTAL CLEAN</span>外牆工程</p>
<h1 id="open-h">外牆清洗、修繕、防水與高空作業</h1>
<p class="c-open__lead">東方繩洗以繩索與吊籠進行外牆清洗、修繕、防水與檢查。依建築條件、外牆材質與現場問題決定施工方式。</p>
<p class="c-hint" data-film-hint>在照片上拖曳，刮除玻璃上的水膜。</p>
<p class="c-open__actions"><a class="c-btn c-btn--solid" href="{site.url('/contact')}" data-track="cta_survey">安排勘查</a><button type="button" class="c-btn" data-goto="1">往下：作業順序</button><button type="button" class="c-btn c-btn--ghost" data-film-reset hidden>重新噴水</button></p>
<p class="c-note">互動畫面使用現場照片；水膜為效果，不代表清洗前後。案場資料待補資料。</p>
</div>
</article>
{''.join(scenes)}
</div>
<nav class="c-alt" aria-label="作業順序">
<p class="c-alt__read"><span class="c-num" data-alt-floor>外側</span><span data-alt-stage>開場</span></p>
<div class="c-alt__rail"><span class="c-alt__marker" data-alt-marker></span></div>
<ol class="c-alt__list">{stations}</ol>
</nav>
<div class="c-hud" aria-hidden="true"><span class="c-num" data-hud-n>0</span><span class="c-hud__bar"><span data-hud-bar></span></span><span class="c-num">{len(SCENES)}</span></div>
<div class="c-steppers"><button type="button" data-step="-1" aria-label="上一個場景">上一個</button><button type="button" data-step="1" aria-label="下一個場景">下一個</button></div>
</div>
</section>

<section class="c-sec" aria-labelledby="reel-h">
<header class="c-sec__head"><p class="c-label">案例膠卷</p><h2 id="reel-h">現場紀錄</h2><p>左右拖曳或使用按鈕瀏覽。每一格是一個案場，資料未取得的欄位標示「{PENDING}」。</p><a class="c-link" href="{site.url('/projects/')}">全部案例</a></header>
{reel(site, site.sorted_cases())}
</section>

<section class="c-sec c-sec--split" aria-labelledby="access-h">
<header class="c-sec__head"><p class="c-label">接近方式</p><h2 id="access-h">繩索、吊籠、高空車、吊車、施工架與地面</h2>
<p>高空接近方式只是手段。依屋頂條件、立面外凸物、地面空間與工項所需材料，一起評估。</p><a class="c-link" href="{site.url('/services/rope-access')}">比較六種接近方式</a></header>
{access_diagram(site, compact=True)}
</section>

<section class="c-sec" aria-labelledby="notes-h">
<header class="c-sec__head"><p class="c-label">工法手冊</p><h2 id="notes-h">從現場問題寫起</h2><a class="c-link" href="{site.url('/insights/')}">全部工法手冊</a></header>
<ul class="c-notes">{notes}</ul>
</section>

<div class="c-inq">{site.inquiry(heading='從地面開始：安排勘查')}</div>
'''
    extra = f'<link rel="preload" as="image" href="{site.media.url(opener["variants"][-2][0])}" imagesrcset="{site.media.srcset(opener)}" imagesizes="100vw">'
    page(site, '/', title=HOME_TITLE, desc=HOME_DESC, body=body, cls='c-home', schema=[site.website(), site.local()], extra=extra)


def access_diagram(site, compact=False):
    """Elevation diagram: where each access method attaches to the building."""
    modes = ['double-rope', 'gondola', 'aerial-lift', 'crane', 'scaffold', 'ground']
    tabs = ''.join(f'<button type="button" role="tab" id="tab-{m}" aria-controls="panel-{m}" aria-selected="{str(i == 0).lower()}" tabindex="{0 if i == 0 else -1}" data-mode="{m}">{site.methods[m]["name"]}</button>' for i, m in enumerate(modes))
    panels = ''.join(f'''<div class="c-mode" role="tabpanel" id="panel-{m}" aria-labelledby="tab-{m}"{'' if i == 0 else ' hidden'}>
<h3>{site.methods[m]['name']}<small>{site.methods[m]['en']}</small></h3><p>{e(site.methods[m]['what'])}</p>
<dl class="c-dl c-dl--mode"><div><dt>適用</dt><dd>{e(site.methods[m]['fit'])}</dd></div><div><dt>限制</dt><dd>{e(site.methods[m]['limits'])}</dd></div>''' +
                     ('' if compact else f'<div><dt>留下的紀錄</dt><dd>{e(site.methods[m]["record"])}</dd></div>') + '</dl>' +
                     (f'<p class="c-note">{e(site.methods[m]["note"])}</p>' if site.methods[m].get('note') and not compact else '') + '</div>'
                     for i, m in enumerate(modes))
    svg = '''<svg class="c-diagram" viewBox="0 0 520 420" role="img" aria-label="接近方式示意：繩索與吊籠由屋頂懸吊，高空車、吊車、施工架與地面作業由地面支撐">
<line class="c-dg-ground" x1="0" y1="380" x2="520" y2="380"/>
<rect class="c-dg-bldg" x="180" y="60" width="160" height="320"/>
<g class="c-dg" data-mode="double-rope"><path d="M200 60v-14h12"/><line x1="206" y1="46" x2="206" y2="250"/><line x1="212" y1="46" x2="212" y2="250"/><rect x="198" y="250" width="18" height="12"/><text x="200" y="36">繩索</text></g>
<g class="c-dg" data-mode="gondola"><path d="M300 60v-18h30v18"/><line x1="306" y1="42" x2="306" y2="200"/><line x1="326" y1="42" x2="326" y2="200"/><rect x="296" y="200" width="40" height="18"/><text x="292" y="32">吊籠</text></g>
<g class="c-dg" data-mode="aerial-lift"><rect x="360" y="360" width="60" height="20"/><path d="M380 360 L410 250"/><rect x="398" y="236" width="28" height="14"/><text x="430" y="248">高空車</text></g>
<g class="c-dg" data-mode="crane"><rect x="440" y="356" width="50" height="24"/><path d="M462 356 L470 120 L350 90"/><line x1="350" y1="90" x2="350" y2="130"/><text x="440" y="110">吊車</text></g>
<g class="c-dg" data-mode="scaffold"><path d="M120 380V160M150 380V160M120 160h30M120 200h30M120 240h30M120 280h30M120 320h30M120 360h30M120 200l30 40M150 280l-30 40"/><text x="104" y="150">施工架</text></g>
<g class="c-dg" data-mode="ground"><path d="M40 380v-26M34 354h12"/><rect x="60" y="364" width="40" height="16"/><text x="36" y="344">地面</text></g>
<text class="c-dg-note" x="512" y="410" text-anchor="end">示意，非比例</text>
</svg>'''
    return f'''<div class="c-access" data-access>
<div class="c-access__fig">{svg}</div>
<div class="c-access__text"><div class="c-tabs" role="tablist" aria-label="接近方式">{tabs}</div>{panels}</div>
</div>'''


def services_index(site):
    rows = ''.join(f'''<article class="c-svcrow" id="{s['slug']}">
<a class="c-svcrow__img" href="{site.url('/services/' + s['slug'])}" tabindex="-1" aria-hidden="true">{site.pic(s['photo']['src'], '(min-width: 900px) 34vw, 100vw', alt='')}</a>
<div class="c-svcrow__text"><p class="c-label">{e(s['en'])}</p><h2><a href="{site.url('/services/' + s['slug'])}">{s['name']}</a></h2><p class="c-lead">{e(s['lead'])}</p><p>{e(s['intro'])}</p>
<p class="c-mini">工法：{site.method_names(s['methods'])}</p></div></article>''' for s in site.services.values())
    body = f'''<header class="c-page-head"><p class="c-label">工程服務</p><h1>外牆清洗、修繕、防水、檢查與高空作業</h1>
<p class="c-lead">依建築條件、外牆材質與現場問題決定施工方式。每一項服務都寫明判斷方式、工法、限制與交付紀錄。</p></header>
<div class="c-svcrows">{rows}</div>'''
    items = [(s['name'], '/services/' + s['slug']) for s in site.services.values()]
    page(site, '/services/', title='工程服務', desc='外牆清洗、外牆修繕、外牆防水、外牆安全檢查、高空作業與特殊高空作業的判斷方式、工法與限制。',
         body=body, trail=[('首頁', '/'), ('工程服務', '/services/')], schema=[site.itemlist('工程服務', items)])


def service_page(site, s):
    route = '/services/' + s['slug']
    photo = s['photo']
    steps = ''.join(f'<li><span class="c-num">{i + 1}</span><p>{e(x)}</p></li>' for i, x in enumerate(s['judge']))

    def spec(m):
        x = site.methods[m]
        return f'''<div class="c-spec" id="m-{m}"><h3>{x['name']}<small>{x['en']}</small></h3>
<dl class="c-dl"><div><dt>做什麼</dt><dd>{e(x['what'])}</dd></div><div><dt>適用</dt><dd>{e(x['fit'])}</dd></div><div><dt>限制</dt><dd>{e(x['limits'])}</dd></div><div><dt>紀錄</dt><dd>{e(x['record'])}</dd></div></dl>
{f'<p class="c-note">{e(x["note"])}</p>' if x.get('note') else ''}</div>'''
    li = lambda xs: ''.join(f'<li>{e(x)}</li>' for x in xs)
    issues = ''.join(f'<li><strong>{site.issues[i]["name"]}</strong><span>{e(site.issues[i]["sign"])}</span></li>' for i in s['issues'])
    faq = ''.join(f'<details class="c-faq"><summary>{e(q["q"])}</summary><p>{e(q["a"])}</p></details>' for q in s['faq'])
    cases = site.cases_for_service(s['slug'])
    case_html = reel(site, cases) if cases else f'<p class="c-pending-block">可公開的{s["name"]}案例：{PENDING}</p>'
    notes = ''.join(f'<li><a href="{site.url("/insights/" + a)}"><span class="c-label">{e(site.articles[a]["category"])}</span><strong>{e(site.articles[a]["title"])}</strong></a></li>' for a in s['articles'])
    is_access = s['slug'] == 'rope-access'
    methods_html = access_diagram(site) if is_access else ''.join(spec(m) for m in s['methods'])
    access = [m for m in s['access'] if m not in s['methods']]
    pend_note = f'<p class="c-pending-block">{e(s["pending"])}</p>' if s.get('pending') else ''
    body = f'''<section class="c-hero">
<div class="c-hero__img">{site.pic(photo['src'], '100vw', alt=photo['alt'], eager=True)}</div>
<div class="c-hero__text"><p class="c-label">{e(s['en'])}</p><h1>{s['name']}</h1><p class="c-lead">{e(s['lead'])}</p></div>
</section>
<div class="c-body">
<p class="c-intro">{e(s['intro'])}</p>
<section aria-labelledby="iss-h"><h2 id="iss-h" class="c-h2">適用問題</h2><ul class="c-issues">{issues or '<li>依現場條件評估</li>'}</ul></section>
<section aria-labelledby="st-h"><h2 id="st-h" class="c-h2">現場如何判斷</h2><ol class="c-steps" data-steps>{steps}</ol></section>
<section aria-labelledby="me-h"><h2 id="me-h" class="c-h2">{'六種接近方式' if is_access else '工法'}</h2>{methods_html}</section>
{('<section aria-labelledby="ac-h"><h2 id="ac-h" class="c-h2">接近方式</h2>' + ''.join(spec(m) for m in access) + '</section>') if access and not is_access else ''}
<section class="c-cols" aria-label="交付、限制與準備">
<div><h2 class="c-h2">交付紀錄</h2><ul class="c-list">{li(s['deliverables'])}</ul></div>
<div><h2 class="c-h2">限制條件</h2><ul class="c-list">{li(s['limits'])}</ul>{pend_note}</div>
<div><h2 class="c-h2">詢價前準備</h2><ul class="c-list">{li(s['prep'])}</ul><a class="c-btn c-btn--solid" href="{site.url('/contact')}" data-track="cta_service">安排勘查</a></div>
</section>
<section aria-labelledby="fq-h"><h2 id="fq-h" class="c-h2">常見問題</h2>{faq}</section>
</div>
<section class="c-sec" aria-labelledby="rc-h"><header class="c-sec__head"><p class="c-label">相關案例</p><h2 id="rc-h">現場紀錄</h2></header>{case_html}</section>
<section class="c-sec" aria-labelledby="rn-h"><header class="c-sec__head"><p class="c-label">工法手冊</p><h2 id="rn-h">延伸閱讀</h2></header><ul class="c-notes">{notes}</ul></section>'''
    page(site, route, title=s['title'], desc=s['description'], body=body, cls='c-svcpage',
         trail=[('首頁', '/'), ('工程服務', '/services/'), (s['name'], route)], schema=[site.service_ld(s)], image=photo['src'])


def projects_index(site):
    cases = site.sorted_cases()
    counts = {}
    for c in cases:
        counts[c['service']] = counts.get(c['service'], 0) + 1
    filt = ''.join(f'<button type="button" data-filter="{k}" aria-pressed="false">{site.services[k]["name"]}<span>{n}</span></button>' for k, n in counts.items())
    rows = ''.join(f'''<tr data-tags="{c['service']}"><td class="c-num">{c['code']}</td><th scope="row"><a href="{site.url('/projects/' + c['slug'])}">{e(c['name'])}</a></th>
<td>{e(c['work'])}</td><td>{pend(c['region'])}</td><td>{pend(c['building_type'])}</td><td>{pend('、'.join(site.methods[x]['name'] for x in c['access']) or PENDING)}</td><td>{pend(c['period'])}</td></tr>''' for c in cases)
    body = f'''<header class="c-page-head"><p class="c-label">案例</p><h1>工程案例</h1>
<p class="c-lead">左右拖曳膠卷瀏覽案場，或使用下方清單。每個案例都包含案場資料、施工照片與處理紀錄。</p></header>
<div class="c-filter" data-filter-for="#c-reel-main" hidden><button type="button" data-filter="*" aria-pressed="true">全部<span>{len(cases)}</span></button>{filt}</div>
<div id="c-reel-main">{reel(site, cases, big=True)}</div>
<section class="c-sec" aria-labelledby="list-h"><header class="c-sec__head"><p class="c-label">清單</p><h2 id="list-h">案例清單</h2></header>
<div class="c-tablewrap"><table class="c-table"><thead><tr><th scope="col">編號</th><th scope="col">案場</th><th scope="col">工項</th><th scope="col">地區</th><th scope="col">建築類型</th><th scope="col">接近方式</th><th scope="col">施工期間</th></tr></thead><tbody>{rows}</tbody></table></div></section>'''
    items = [(c['name'], '/projects/' + c['slug']) for c in cases]
    page(site, '/projects/', title='工程案例', desc='東方繩洗外牆清洗、矽利康更新、屋頂接縫防水與特殊高空作業案例，可左右拖曳瀏覽現場照片。',
         body=body, trail=[('首頁', '/'), ('案例', '/projects/')], schema=[site.itemlist('工程案例', items)])


def case_page(site, c, next_c):
    route = '/projects/' + c['slug']
    cover = c['photos'][0]
    svc = site.services[c['service']]
    fields = [('地區', pend(c['region'])), ('建築類型', pend(c['building_type'])), ('工項', e(c['work'])), ('現場問題', pend(c['problem'])),
              ('外牆材質', pend(c['materials'])), ('施工範圍', pend(c['scope'])), ('使用設備', pend(c['equipment'])),
              ('接近方式', pend('、'.join(site.methods[x]['name'] for x in c['access']) or PENDING)), ('工法', pend(c['methods'])),
              ('施工期間', pend(c['period']) + (f'<small>{e(c["period_note"])}</small>' if c.get('period_note') else '')),
              ('照片紀錄日期', (e(c['record_date'].replace('-', '/')) + f'<small>{e(c.get("record_date_note", ""))}</small>') if c.get('record_date') else pend(PENDING)),
              ('施工前照片', pend(PENDING)), ('施工中照片', f'{sum(p["stage"] == "during" for p in c["photos"])} 張'), ('完工照片', pend(PENDING)),
              ('可公開程度', e(c['disclosure']))]
    dl = ''.join(f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in fields)
    strip = ''.join(f'''<li><figure><span class="c-strip__img">{site.pic(p['src'], '(min-width: 900px) 44vw, 86vw', photo=p)}</span>
<figcaption><span class="c-num">{i + 1}／{len(c['photos'])}</span>{e(p['caption'])}<em>{STAGE[p['stage']]}</em>{'<small>低解析原檔，待補高解析照片。</small>' if p.get('lowres') else ''}</figcaption></figure></li>''' for i, p in enumerate(c['photos']))
    texts = ''.join(f'<div><h3>{k}</h3><p>{pend(v)}</p></div>' for k, v in [('現場問題', c['problem']), ('特殊問題', c['special_issue']), ('處理方式', c['handling']), ('完工結果', c['result'])])
    notes = ''.join(f'<li><a href="{site.url("/insights/" + a["slug"])}"><span class="c-label">{e(a["category"])}</span><strong>{e(a["title"])}</strong></a></li>' for a in site.articles_for_case(c))
    body = f'''<section class="c-hero c-hero--case{' c-hero--lowres' if cover.get('lowres') else ''}">
<div class="c-hero__img">{site.pic(cover['src'], '100vw', photo=cover, eager=True)}</div>
<div class="c-hero__text"><p class="c-label"><span class="c-num">{c['code']}</span>{e(c['work'])}</p><h1>{e(c['name'])}</h1><p class="c-lead">{e(c['summary'])}</p></div>
</section>
<section class="c-sec" aria-labelledby="sq-h"><header class="c-sec__head"><p class="c-label">現場照片</p><h2 id="sq-h">照片序列</h2><p>左右滑動。</p></header>
<div class="c-strip" data-reel><div class="c-reel__ctrl"><button type="button" data-reel-prev aria-label="上一張">上一張</button><span class="c-reel__count"><span data-reel-n>1</span>／{len(c['photos'])}</span><button type="button" data-reel-next aria-label="下一張">下一張</button></div>
<ol class="c-reel__track" data-reel-track tabindex="0" aria-label="照片序列">{strip}</ol></div></section>
<div class="c-body c-body--case">
<section aria-labelledby="dt-h" class="c-panel"><h2 id="dt-h" class="c-h2">案件資料</h2><dl class="c-dl c-dl--panel">{dl}</dl><p class="c-note">資料來源：{e(c['source'])}</p></section>
<section aria-labelledby="ba-h"><h2 id="ba-h" class="c-h2">施工前後對照</h2>{site.before_after(c, '(min-width: 900px) 60vw, 100vw')}</section>
<section aria-labelledby="tx-h"><h2 id="tx-h" class="c-h2">處理紀錄</h2><div class="c-cols c-cols--2">{texts}</div></section>
<section aria-labelledby="rl-h"><h2 id="rl-h" class="c-h2">相關服務與手冊</h2><p><a class="c-link" href="{site.url('/services/' + svc['slug'])}">{svc['name']}</a></p><ul class="c-notes">{notes}</ul></section>
</div>
<a class="c-next" href="{site.url('/projects/' + next_c['slug'])}"><span class="c-next__img">{site.pic(next_c['photos'][0]['src'], '100vw', alt='')}</span><span class="c-next__t"><span class="c-label">下一個案例</span><strong>{e(next_c['name'])}</strong><span>{e(next_c['work'])}</span></span></a>'''
    page(site, route, title=f'{c["name"]}｜{c["work"]}案例', desc=c['summary'] + ' 施工照片與案場紀錄。', body=body, cls='c-casepage',
         trail=[('首頁', '/'), ('案例', '/projects/'), (c['name'], route)], schema=[site.case_ld(c)], image=cover['src'])


def insights_index(site):
    chapters = ''.join(f'<li><a href="#ch-{i}">{e(g)}</a></li>' for i, (g, _) in enumerate(GROUPS))
    groups = ''.join(f'''<section class="c-chapter" id="ch-{i}" aria-labelledby="ch-{i}-h"><h2 id="ch-{i}-h" class="c-h2"><span class="c-num">{i + 1}</span>{e(g)}</h2>
<ul class="c-notes c-notes--full">{''.join(f'<li><a href="{site.url("/insights/" + a)}"><strong>{e(site.articles[a]["title"])}</strong><span>{e(site.articles[a]["answer"])}</span><span class="c-note">更新 {site.articles[a]["updated"]}・{e(site.articles[a]["status"])}</span></a></li>' for a in slugs)}</ul></section>'''
                     for i, (g, slugs) in enumerate(GROUPS))
    body = f'''<header class="c-page-head"><p class="c-label">工法手冊</p><h1>工法手冊</h1>
<p class="c-lead">依作業順序整理：先勘查判斷，再清洗、修繕、防水；最後是接近方式與發包。每一篇都經工程審閱後發布，目前為初稿。</p>
<nav class="c-chapters" aria-label="章節"><ol>{chapters}</ol></nav></header>
<div class="c-body">{groups}</div>'''
    items = [(a['title'], '/insights/' + a['slug']) for a in site.sorted_articles()]
    page(site, '/insights/', title='工法手冊', desc='依作業順序整理的外牆工程筆記：空鼓判斷、漏水水路、清洗價格、玻璃水垢、矽利康老化、接近方式與修繕發包。',
         body=body, trail=[('首頁', '/'), ('工法手冊', '/insights/')], schema=[site.itemlist('工法手冊', items)])


def article_page(site, a):
    route = '/insights/' + a['slug']
    secs = ''.join(f'<section id="{s["id"]}" aria-labelledby="{s["id"]}-h"><h2 id="{s["id"]}-h" class="c-h2">{e(s["title"])}</h2>{s["html"]}</section>' for s in a['sections'])
    toc = ''.join(f'<li><a href="#{s["id"]}">{e(s["title"])}</a></li>' for s in a['sections'])
    svcs = ''.join(f'<li><a href="{site.url("/services/" + x)}">{site.services[x]["name"]}</a></li>' for x in a.get('services', []))
    cases = [site.cases[x] for x in a.get('cases', [])]
    case_html = reel(site, cases) if cases else f'<p class="c-pending-block">相關案例：{PENDING}</p>'
    review = ''.join(f'<div><dt>{k}</dt><dd>{e(v)}</dd></div>' for k, v in site.review_block(a))
    related = ''.join(f'<li><a href="{site.url("/insights/" + x)}"><span class="c-label">{e(site.articles[x]["category"])}</span><strong>{e(site.articles[x]["title"])}</strong></a></li>' for x in a.get('related', []))
    body = f'''<div class="c-progress" aria-hidden="true"><span data-progress></span></div>
<header class="c-page-head c-art-head"><p class="c-label">{e(a['category'])}</p><h1>{e(a['title'])}</h1>
<div class="c-answer"><p class="c-label">快速回答</p><p>{e(a['answer'])}</p></div>
<p class="c-note">更新 <time datetime="{a['updated']}">{a['updated']}</time>・{e(a['status'])}</p></header>
<div class="c-article">
<nav class="c-art-toc" aria-label="文章段落"><p class="c-label">段落</p><ol>{toc}</ol></nav>
<article class="c-prose">{secs}
<section aria-labelledby="sv-h"><h2 id="sv-h" class="c-h2">相關服務</h2><ul class="c-pills">{svcs}</ul></section>
<section class="c-panel" aria-labelledby="rv-h"><h2 id="rv-h" class="c-h2">更新日期與工程審閱</h2><dl class="c-dl">{review}</dl>
<p class="c-note">本文供委託與溝通準備使用，不能代替現場檢查。實際工法與費用依現場評估與正式報價為準。</p></section>
</article></div>
<section class="c-sec" aria-labelledby="ca-h"><header class="c-sec__head"><p class="c-label">相關案例</p><h2 id="ca-h">現場紀錄</h2></header>{case_html}</section>
<section class="c-sec" aria-labelledby="re-h"><header class="c-sec__head"><p class="c-label">延伸閱讀</p><h2 id="re-h">工法手冊</h2></header><ul class="c-notes">{related}</ul></section>'''
    page(site, route, title=a['title'], desc=a['description'], body=body, og_type='article', cls='c-artpage',
         trail=[('首頁', '/'), ('工法手冊', '/insights/'), (a['title'], route)], schema=[site.article_ld(a)])


def about(site):
    values = [('安全', '先確認固定點、繩索配置、地面隔離與天候，條件不符合就不作業。'),
              ('品質', '施工前試洗、試做或標記範圍，依材質選擇藥劑、材料與工具。'),
              ('服務', '指定聯絡窗口，事先說明住戶與管理單位需要配合的事項。'),
              ('現場判斷', '依建築條件、外牆材質與缺失範圍判斷，不以一張照片或樓層高度決定工法。'),
              ('工法選擇', '清洗、修繕、防水與檢查分開列項，說明每種工法的限制。'),
              ('施工紀錄', '處理位置、使用材料與施工照片對照整理。'),
              ('可追溯的工程結果', '完工紀錄可供驗收、日後維護與管理窗口交接使用。')]
    vals = ''.join(f'<div><dt>{k}</dt><dd>{e(v)}</dd></div>' for k, v in values)
    claims = ''.join(f'<div><dt>{e(x["item"])}</dt><dd><span class="c-pending">待公司確認</span>{e(x["status"])}</dd></div>' for x in site.company['claims_pending'])
    company = ''.join(f'<div><dt>{k}</dt><dd>{e(v)}</dd></div>' for k, v in site.company_lines())
    body = f'''<section class="c-hero">
<div class="c-hero__img">{site.pic('cases/fubon-xihua-3.jpg', '100vw', alt='西華富邦建築立面繩索作業', eager=True)}</div>
<div class="c-hero__text"><p class="c-label">公司</p><h1>東方繩洗有限公司</h1><p class="c-lead">高空接近方式只是手段。工作是找出問題、選擇正確工法、完成施工，並留下可以驗收與追蹤的紀錄。</p></div></section>
<div class="c-body">
<section><h2 class="c-h2">工作原則</h2><dl class="c-dl c-dl--terms">{vals}</dl></section>
<section class="c-panel"><h2 class="c-h2">公司資料</h2><dl class="c-dl">{company}</dl></section>
<section><h2 class="c-h2">資格、證照與紀錄</h2><p>以下項目在正式站或公司資料中出現，需公司提供文件確認後再公開陳述。</p><dl class="c-dl">{claims}</dl></section>
<section><h2 class="c-h2">服務地區</h2><ul class="c-pills c-pills--static">{''.join(f'<li>{x}</li>' for x in site.company['areas'])}</ul><p class="c-note">{e(site.company['areas_note'])}</p></section>
</div>'''
    page(site, '/about', title='關於東方繩洗', desc='東方繩洗有限公司的工作原則、公司資料、服務地區與待確認的資格資料。',
         body=body, trail=[('首頁', '/'), ('公司', '/about')], schema=[site.local()])


def contact(site):
    lines = ''.join(f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in site.contact_lines())
    body = f'''<header class="c-page-head"><p class="c-label">聯絡</p><h1>安排現場勘查</h1>
<p class="c-lead">提供案場地址、現況照片與想處理的範圍，就可以開始討論。沒有完整圖面也沒關係。</p></header>
<div class="c-contact"><div class="c-inq c-inq--flat">{site.inquiry(heading='詢價資料', intro='勾選問題與建築類型，填入地區與聯絡方式。下方會即時組成一段訊息，可以直接貼到 LINE 或寄出 Email。')}</div>
<aside class="c-panel"><h2 class="c-h2">聯絡方式</h2><dl class="c-dl">{lines}</dl></aside></div>'''
    page(site, '/contact', title='聯絡與安排勘查', desc='外牆清洗、修繕、防水或檢查需求，提供案場地址、現況照片與需求，安排初步討論與現場勘查。',
         body=body, trail=[('首頁', '/'), ('聯絡', '/contact')], schema=[site.local()])


def build(site):
    home(site)
    services_index(site)
    for s in site.services.values():
        service_page(site, s)
    projects_index(site)
    cases = site.sorted_cases()
    for i, c in enumerate(cases):
        case_page(site, c, cases[(i + 1) % len(cases)])
    insights_index(site)
    for a in site.sorted_articles():
        article_page(site, a)
    about(site)
    contact(site)
