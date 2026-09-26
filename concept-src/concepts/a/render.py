"""Concept A 立面索引 — brand system, diagnostic index.

IA starts from the field problem: 現場問題 → 材質 → 工法 → 服務.
The homepage carries no photographs; real photos first appear inside a case.
"""
from lib.site import e, PENDING, HOME_TITLE, HOME_DESC, STAGE

NAV = [('/insights/', '現場問題'), ('/services/', '工程服務'), ('/projects/', '案例索引'), ('/about', '公司')]
GROUPS = [('access', '接近方式'), ('clean', '清洗'), ('repair', '修繕'), ('waterproof', '防水'), ('inspect', '檢查與紀錄')]
CURRENT = ' aria-current="page"'
FILL = '<span class="a-fill" title="適用">適用</span>'
EMPTY = '<span class="a-empty">—</span>'
ZONE_ORDER = ['tile', 'glass', 'joint', 'stone', 'metal', 'render']


# --------------------------------------------------------------- frame
def header(site, route):
    items = ''.join(
        f'<li><a href="{site.url(r)}"{CURRENT if route.startswith(r) and r != "/" else ""}>{label}</a></li>'
        for r, label in NAV)
    b = site.brand['logo-white']
    return f'''<header class="a-head">
<a class="a-brand" href="{site.url('/')}" aria-label="東方繩洗首頁"><img src="{site.prefix}/brand/logo-white.webp" width="{b['w']}" height="{b['h']}" alt="東方繩洗 ORIENTAL CLEAN"></a>
<nav class="a-nav" id="a-nav" aria-label="主要選單"><ul>{items}<li class="a-nav__cta"><a href="{site.url('/contact')}"{' aria-current="page"' if route == '/contact' else ''}>安排勘查</a></li></ul></nav>
<button class="a-menu" type="button" aria-expanded="false" aria-controls="a-nav"><span>選單</span></button>
</header>'''


def footer(site):
    contact = ''.join(f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in site.contact_lines())
    company = ''.join(f'<div><dt>{k}</dt><dd>{e(v)}</dd></div>' for k, v in site.company_lines())
    links = ''.join(f'<li><a href="{site.url("/services/" + s["slug"])}">{s["name"]}</a></li>' for s in site.services.values())
    return f'''<footer class="a-foot">
<div class="a-foot__grid">
<section><h2 class="a-foot__h">聯絡</h2><dl class="a-dl">{contact}</dl></section>
<section><h2 class="a-foot__h">公司資料</h2><dl class="a-dl">{company}</dl></section>
<section><h2 class="a-foot__h">工程服務</h2><ul class="a-foot__links">{links}</ul>
<ul class="a-foot__links"><li><a href="{site.url('/projects/')}">案例索引</a></li><li><a href="{site.url('/insights/')}">現場問題與工程筆記</a></li></ul></section>
</div>
<p class="a-foot__note">概念原型 A「立面索引」｜預覽用，不影響正式站。</p>
</footer>'''


def crumbs(site, items):
    lis = ''.join(f'<li><a href="{site.url(r)}">{e(n)}</a></li>' for n, r in items[:-1])
    return f'<nav class="a-crumb" aria-label="頁面位置"><ol>{lis}<li aria-current="page">{e(items[-1][0])}</li></ol></nav>'


def page(site, route, *, title, desc, body, trail=None, schema=(), og_type='website', image=None, cls=''):
    schema = list(schema) + [site.org()]
    if trail:
        schema.append(site.breadcrumb(trail))
    html = site.head(title=title, description=desc, route=route, og_type=og_type, image=image, schema=schema, body_class='a ' + cls)
    html += header(site, route) + '<main id="main">' + (crumbs(site, trail) if trail else '') + body + '</main>' + footer(site) + '\n</body>\n</html>\n'
    site.write(route, html)


def tag(code):
    return f'<span class="a-code">{e(code)}</span>'


def pending(v):
    if v in (None, '', PENDING) or v == [PENDING]:
        return f'<span class="a-pending">{PENDING}</span>'
    return e('、'.join(v) if isinstance(v, list) else v)


# --------------------------------------------------------------- facade
def facade_svg(site):
    """Schematic elevation. Every zone is a real material the company works on."""
    tiles = ''.join(f'<rect class="a-win" x="{x}" y="{y}" width="30" height="20"/>'
                    for y in range(150, 600, 40) for x in (420, 480))
    mull = ''.join(f'<line x1="{x}" y1="130" x2="{x}" y2="620"/>' for x in range(225, 400, 35))
    tran = ''.join(f'<line x1="190" y1="{y}" x2="400" y2="{y}"/>' for y in range(170, 620, 40))
    refl = ''.join(f'<line x1="{x}" y1="{y}" x2="{x + 22}" y2="{y - 30}"/>' for x, y in [(205, 250), (240, 330), (300, 210), (330, 450), (260, 540), (360, 300)])
    seams = ''.join(f'<line x1="{x}" y1="72" x2="{x}" y2="130"/>' for x in range(204, 540, 14))
    stone = ''.join(f'<line x1="150" y1="{y}" x2="600" y2="{y}"/>' for y in (655, 690, 725)) + \
        ''.join(f'<line x1="{x}" y1="620" x2="{x}" y2="760"/>' for x in range(225, 600, 75))
    joints = ''.join(f'<rect x="{x}" y="{y}" width="30" height="20"/>' for y in range(150, 600, 40) for x in (420, 480))
    zones = [
        ('render', 40, 520, 110, 240), ('stone', 150, 620, 450, 140), ('glass', 190, 130, 202, 490),
        ('joint', 392, 130, 16, 490), ('tile', 408, 130, 132, 490), ('metal', 190, 70, 350, 60)]
    hits = ''.join(f'<rect class="a-hit" data-zone="{z}" x="{x}" y="{y}" width="{w}" height="{h}"/>' for z, x, y, w, h in zones)
    labels = [('metal', 552, 96, 540, 100), ('glass', 150, 180, 190, 190), ('joint', 560, 380, 408, 380),
              ('tile', 560, 250, 540, 250), ('stone', 612, 700, 600, 700), ('render', 20, 500, 60, 520)]
    lab = ''.join(
        f'<g class="a-label" data-zone="{z}"><line x1="{x2}" y1="{y2}" x2="{x}" y2="{y}"/>'
        f'<rect x="{x - 17}" y="{y - 11}" width="34" height="20"/><text x="{x}" y="{y + 4}">{site.materials[z]["code"]}</text></g>'
        for z, x, y, x2, y2 in labels)
    return f'''<svg class="a-facade" viewBox="0 0 640 800" role="img" aria-labelledby="facade-t facade-d" data-facade>
<title id="facade-t">外牆材質示意立面</title>
<desc id="facade-d">示意立面，包含玻璃帷幕、磁磚、石材、金屬板、塗裝外牆與接縫。選擇不同位置可查看常見問題與對應工法。非特定建築。</desc>
<defs>
<pattern id="tilegrid" width="10" height="5" patternUnits="userSpaceOnUse"><path d="M10 0H0V5" fill="none" stroke="currentColor" stroke-width=".4"/></pattern>
</defs>
<line class="a-ground" x1="0" y1="760" x2="640" y2="760"/>
<g class="a-zone" data-zone="render"><rect x="40" y="520" width="110" height="240"/><rect class="a-win" x="70" y="570" width="44" height="30"/><rect class="a-win" x="70" y="650" width="44" height="30"/><path class="a-crack" d="M128 540 l-6 18 l5 10 l-7 22 l4 12"/></g>
<g class="a-zone" data-zone="stone"><rect x="150" y="620" width="450" height="140"/><g class="a-lines">{stone}</g><rect class="a-win" x="330" y="690" width="90" height="70"/></g>
<g class="a-zone" data-zone="glass"><rect x="190" y="130" width="210" height="490"/><g class="a-lines">{mull}{tran}</g><g class="a-refl">{refl}</g></g>
<g class="a-zone" data-zone="tile"><rect x="400" y="130" width="140" height="490"/><rect class="a-tilefill" x="400" y="130" width="140" height="490" fill="url(#tilegrid)"/>{tiles}</g>
<g class="a-zone" data-zone="metal"><rect x="190" y="70" width="350" height="60"/><g class="a-lines">{seams}</g></g>
<g class="a-zone a-zone--joint" data-zone="joint"><line x1="400" y1="130" x2="400" y2="620"/><line x1="190" y1="620" x2="540" y2="620"/><g class="a-jwin">{joints}</g></g>
<g class="a-roof"><line x1="186" y1="70" x2="544" y2="70"/><path d="M214 70v-14h10M514 70v-14h-10"/></g>
{lab}
<g class="a-rope-layer" aria-hidden="true"><path class="a-rope" d="M220 60 L470 380"/><path class="a-rope a-rope--backup" d="M224 60 L474 380"/>
<g class="a-reticle"><rect x="-9" y="-9" width="18" height="18"/><line x1="-15" y1="0" x2="-4" y2="0"/><line x1="4" y1="0" x2="15" y2="0"/><line x1="0" y1="-15" x2="0" y2="-4"/><line x1="0" y1="4" x2="0" y2="15"/></g></g>
<g class="a-hits">{hits}</g>
<text class="a-titleblock" x="632" y="792" text-anchor="end">示意立面｜非特定建築</text>
</svg>'''


def reading_panel(site, slug, first):
    m = site.materials[slug]
    methods = ''.join(f'<li><a href="{site.url("/services/" + svc_for_method(site, x))}#m-{x}">{site.methods[x]["name"]}</a></li>' for x in m['methods'])
    services = '、'.join(f'<a href="{site.url("/services/" + s)}">{site.services[s]["name"]}</a>' for s in m['services'])
    notes = ''.join(f'<li><a href="{site.url("/insights/" + a)}">{site.articles[a]["title"]}</a></li>' for a in m['articles'])
    issues = ''.join(f'<li>{e(i)}</li>' for i in m['issues'])
    return f'''<article class="a-read{' is-active' if first else ''}" data-read="{slug}" id="read-{slug}" aria-labelledby="read-{slug}-h">
<h3 id="read-{slug}-h">{tag(m['code'])}{e(m['name'])}</h3>
<div class="a-read__grid">
<div><h4>常見問題</h4><ul class="a-read__issues">{issues}</ul></div>
<div><h4>現場如何判斷</h4><p>{e(m['judge'])}</p></div>
<div><h4>施工注意</h4><p>{e(m['care'])}</p></div>
<div><h4>對應工法</h4><ul class="a-pills">{methods}</ul></div>
</div>
<p class="a-read__more">相關服務：{services}</p>
<ul class="a-read__notes">{notes}</ul>
</article>'''


def svc_for_method(site, method):
    for s in site.services.values():
        if method in s['methods']:
            return s['slug']
    return 'rope-access'


def issue_rows(site, limit=None, heading='h3'):
    rows = []
    for i in list(site.issues.values())[:limit]:
        codes = ''.join(tag(site.materials[m]['code']) for m in i['materials'])
        methods = ''.join(f'<li>{site.methods[x]["name"]}</li>' for x in i['methods'])
        s = site.services[i['service']]
        a = site.articles[i['article']]
        rows.append(f'''<details class="a-issue" id="issue-{i['slug']}">
<summary><{heading} class="a-issue__name">{e(i['name'])}</{heading}><span class="a-issue__codes">{codes}</span><span class="a-issue__svc">{s['name']}</span></summary>
<div class="a-issue__body">
<dl class="a-dl a-dl--inline"><div><dt>現象</dt><dd>{e(i['sign'])}</dd></div><div><dt>判斷</dt><dd>{e(i['judge'])}</dd></div></dl>
<div><p class="a-mini">可能工法</p><ul class="a-pills a-pills--static">{methods}</ul></div>
<p class="a-issue__links"><a href="{site.url('/services/' + s['slug'])}">{s['name']}</a><a href="{site.url('/insights/' + a['slug'])}">{e(a['title'])}</a></p>
</div></details>''')
    return '<div class="a-issues">' + ''.join(rows) + '</div>'


def case_table(site, cases, filters=False):
    def access(c):
        return '、'.join(site.methods[x]['name'] for x in c['access']) or PENDING

    def when(c):
        if c['period'] != PENDING:
            return e(c['period'])
        if c.get('record_date'):
            return e(c['record_date'].replace('-', '/')) + '<small>照片紀錄</small>'
        return f'<span class="a-pending">{PENDING}</span>'
    rows = ''.join(f'''<tr data-tags="{c['service']} {' '.join(c['access'])}" data-href="{site.url('/projects/' + c['slug'])}">
<td class="a-t-code">{c['code']}</td>
<th scope="row"><a href="{site.url('/projects/' + c['slug'])}">{e(c['name'])}</a></th>
<td data-label="地區">{pending(c['region'])}</td>
<td data-label="建築類型">{pending(c['building_type'])}</td>
<td data-label="工項">{e(c['work'])}</td>
<td data-label="材質">{pending(c['materials'])}</td>
<td data-label="接近方式">{pending(access(c))}</td>
<td data-label="期間">{when(c)}</td>
<td data-label="照片" class="a-t-num">{len(c['photos'])}</td>
</tr>''' for c in cases)
    bar = ''
    if filters:
        counts = {}
        for c in cases:
            counts[c['service']] = counts.get(c['service'], 0) + 1
        btns = ''.join(f'<button type="button" data-filter="{k}" aria-pressed="false">{site.services[k]["name"]}<span>{n}</span></button>' for k, n in counts.items())
        acc = ''.join(f'<button type="button" data-filter="{k}" aria-pressed="false">{site.methods[k]["name"]}</button>' for k in ('double-rope', 'ground'))
        bar = f'''<div class="a-filter" data-filter-for="#case-table" data-filter-count="#case-count" hidden>
<button type="button" data-filter="*" aria-pressed="true">全部<span>{len(cases)}</span></button>{btns}{acc}
<p class="a-filter__count" aria-live="polite">顯示 <span id="case-count">{len(cases)}</span> 件</p></div>'''
    return f'''{bar}<div class="a-table-wrap"><table class="a-table" id="case-table">
<caption class="oc-vh">工程案例索引</caption>
<thead><tr><th scope="col">編號</th><th scope="col">案場</th><th scope="col">地區</th><th scope="col">建築類型</th><th scope="col">工項</th><th scope="col">材質</th><th scope="col">接近方式</th><th scope="col">期間</th><th scope="col">照片</th></tr></thead>
<tbody>{rows}</tbody></table></div>'''


def note_list(site, articles, show_answer=False):
    return '<ul class="a-notes">' + ''.join(
        f'<li><a href="{site.url("/insights/" + a["slug"])}"><span class="a-notes__cat">{e(a["category"])}</span>'
        f'<span class="a-notes__t">{e(a["title"])}</span>'
        + (f'<span class="a-notes__a">{e(a["answer"])}</span>' if show_answer else '') +
        f'<span class="a-notes__d">更新 {a["updated"]}・{a["status"]}</span></a></li>' for a in articles) + '</ul>'


def methods_columns(site):
    cols = []
    for g, label in GROUPS:
        items = ''.join(f'<li><a href="{site.url("/services/" + svc_for_method(site, m["slug"]))}#m-{m["slug"]}">{m["name"]}</a></li>'
                        for m in site.methods.values() if m['group'] == g)
        cols.append(f'<div class="a-mcol"><h3>{label}</h3><ul>{items}</ul></div>')
    return '<div class="a-mcols">' + ''.join(cols) + '</div>'


# ------------------------------------------------------------------ pages
def home(site):
    panels = ''.join(reading_panel(site, z, i == 0) for i, z in enumerate(ZONE_ORDER))
    legend = ''.join(
        f'<li><button type="button" data-zone-btn="{z}" aria-pressed="{str(i == 0).lower()}" aria-controls="read-{z}">{tag(site.materials[z]["code"])}{site.materials[z]["short"]}</button></li>'
        for i, z in enumerate(ZONE_ORDER))
    body = f'''
<section class="a-hero" aria-labelledby="hero-h">
<div class="a-hero__plane">
<p class="a-kicker">ORIENTAL CLEAN｜外牆工程</p>
<h1 id="hero-h">外牆清洗、修繕、防水與高空檢查</h1>
<p class="a-hero__lead">東方繩洗以繩索與吊籠進行外牆清洗、修繕、防水與檢查。依建築條件、外牆材質與現場問題決定施工方式。</p>
<div class="a-hero__actions"><a class="a-btn a-btn--ink" href="{site.url('/contact')}" data-track="cta_survey">安排勘查</a><a class="a-btn" href="{site.url('/projects/')}">案例索引</a></div>
</div>
<div class="a-hero__drawing">
<div class="a-stage" data-stage tabindex="0" aria-describedby="stage-help">
{facade_svg(site)}
</div>
<p class="a-stage__help" id="stage-help">拖曳或點選立面上的位置，繩索會移到該處；也可以用下方材質按鈕或鍵盤方向鍵切換。</p>
<ul class="a-legend" aria-label="選擇外牆材質">{legend}</ul>
</div>
<div class="a-hero__read" aria-live="polite">
<p class="a-kicker a-kicker--ink">立面判讀</p>
{panels}
</div>
</section>

<section class="a-sec" aria-labelledby="issues-h">
<header class="a-sec__head"><h2 id="issues-h">從現場問題開始</h2><p>先說明看到什麼，再判斷原因與工法。每一項都對應到服務與工程筆記。</p></header>
{issue_rows(site)}
</section>

<section class="a-sec a-sec--record" aria-labelledby="record-h">
<header class="a-sec__head"><h2 id="record-h">每一個處理位置，都能對回紀錄</h2>
<p>施工前確認外牆材質、作業動線、固定位置與缺失範圍，再安排清洗、修繕或防水。完工後，位置、工法、照片與確認人員放在同一張表上。</p></header>
<div class="a-sheet" role="group" aria-label="工程紀錄表欄位範例">
<div class="a-sheet__head"><span>工程紀錄表</span><span>欄位範例</span></div>
<div class="a-sheet__row a-sheet__row--h"><span>立面／樓層</span><span>位置</span><span>現場問題</span><span>工法</span><span>照片（前・中・後）</span><span>確認</span></div>
<div class="a-sheet__row"><span>東向／12F</span><span>窗台下緣</span><span>磁磚空鼓</span><span>空鼓灌注</span><span>三張，同角度</span><span>管委會窗口</span></div>
<div class="a-sheet__row a-sheet__row--blank"><span></span><span></span><span></span><span></span><span></span><span></span></div>
<p class="a-sheet__note">表格內容為欄位說明範例，不是實際案場資料。</p>
</div>
</section>

<section class="a-sec" aria-labelledby="cases-h">
<header class="a-sec__head a-sec__head--row"><h2 id="cases-h">案例索引</h2><a class="a-more" href="{site.url('/projects/')}">完整索引與篩選</a></header>
{case_table(site, site.sorted_cases()[:5])}
<p class="a-hint">照片只在案例頁出現。未取得的資料標示為「{PENDING}」。</p>
</section>

<section class="a-sec" aria-labelledby="methods-h">
<header class="a-sec__head"><h2 id="methods-h">工法與接近方式</h2><p>高空接近方式只是手段。依建築條件、材質與缺失範圍，選擇清洗、修繕、防水與檢查的做法。</p></header>
{methods_columns(site)}
</section>

<section class="a-sec" aria-labelledby="notes-h">
<header class="a-sec__head a-sec__head--row"><h2 id="notes-h">工程筆記</h2><a class="a-more" href="{site.url('/insights/')}">全部筆記</a></header>
{note_list(site, site.sorted_articles()[:4])}
</section>

<div class="a-inquiry-wrap">{site.inquiry()}</div>
'''
    page(site, '/', title=HOME_TITLE, desc=HOME_DESC, body=body, cls='a-home',
         schema=[site.website(), site.local()])


def services_index(site):
    mats = list(site.materials.values())
    head = ''.join(f'<th scope="col"><a href="#{s["slug"]}">{s["name"]}</a></th>' for s in site.services.values())
    rows = ''.join(
        f'<tr><th scope="row">{tag(m["code"])}{m["name"]}</th>' + ''.join(
            f'<td>{FILL if s["slug"] in m["services"] else EMPTY}</td>'
            for s in site.services.values()) + '</tr>' for m in mats)
    blocks = ''.join(f'''<article class="a-svc" id="{s['slug']}">
<h2><a href="{site.url('/services/' + s['slug'])}">{s['name']}</a></h2>
<p class="a-svc__lead">{e(s['lead'])}</p><p>{e(s['intro'])}</p>
<p class="a-mini">工法</p><ul class="a-pills a-pills--static">{''.join(f'<li>{site.methods[m]["name"]}</li>' for m in s['methods'])}</ul>
<a class="a-more" href="{site.url('/services/' + s['slug'])}">{s['name']}技術說明</a></article>''' for s in site.services.values())
    body = f'''<header class="a-page-head"><p class="a-kicker a-kicker--ink">工程服務</p><h1>外牆清洗、修繕、防水、檢查與高空作業</h1>
<p class="a-page-lead">依建築條件、外牆材質與現場問題決定施工方式。下表列出每一種材質常對應的服務。</p></header>
<section class="a-sec a-sec--tight" aria-labelledby="matrix-h"><h2 id="matrix-h" class="a-h-small">材質與服務對照</h2>
<div class="a-table-wrap a-scroll"><table class="a-matrix"><caption class="oc-vh">外牆材質與工程服務對照表</caption><thead><tr><th scope="col">材質</th>{head}</tr></thead><tbody>{rows}</tbody></table></div></section>
<div class="a-svcs">{blocks}</div>
<section class="a-sec" aria-labelledby="m-h"><header class="a-sec__head"><h2 id="m-h">工法一覽</h2></header>{methods_columns(site)}</section>
'''
    items = [(s['name'], '/services/' + s['slug']) for s in site.services.values()]
    page(site, '/services/', title='工程服務', desc='東方繩洗的外牆清洗、外牆修繕、外牆防水、外牆安全檢查、高空作業與特殊高空作業，依材質與現場問題對照適用工法。',
         body=body, trail=[('首頁', '/'), ('工程服務', '/services/')], schema=[site.itemlist('工程服務', items)])


def service_page(site, s):
    route = '/services/' + s['slug']
    toc = [('issues', '適用問題'), ('judge', '現場如何判斷'), ('methods', '工法'), ('access', '接近方式'),
           ('deliver', '交付紀錄'), ('limits', '限制條件'), ('prep', '詢價前準備'), ('faq', '常見問題'), ('related', '相關案例與筆記')]
    issues = ''.join(f'<li><a href="{site.url("/insights/")}#issue-{i}">{site.issues[i]["name"]}</a><span>{e(site.issues[i]["sign"])}</span></li>' for i in s['issues'])
    mats = ''.join(f'<li>{tag(site.materials[m]["code"])}{site.materials[m]["name"]}</li>' for m in s['materials']) or '<li>依現場條件</li>'
    judge = ''.join(f'<li>{e(x)}</li>' for x in s['judge'])

    def mtable(slugs, anchor=True):
        return '<div class="a-table-wrap"><table class="a-spec"><thead><tr><th scope="col">工法</th><th scope="col">做什麼</th><th scope="col">適用</th><th scope="col">限制</th><th scope="col">留下的紀錄</th></tr></thead><tbody>' + ''.join(
            f'<tr id="m-{m}"><th scope="row">{site.methods[m]["name"]}<small>{site.methods[m]["en"]}</small></th><td>{e(site.methods[m]["what"])}</td><td>{e(site.methods[m]["fit"])}</td><td>{e(site.methods[m]["limits"])}</td><td>{e(site.methods[m]["record"])}'
            + (f'<small class="a-note">{e(site.methods[m]["note"])}</small>' if site.methods[m].get('note') else '') + '</td></tr>'
            for m in slugs) + '</tbody></table></div>'
    access = [m for m in s['access'] if m not in s['methods']]
    listing = lambda xs: ''.join(f'<li>{e(x)}</li>' for x in xs)
    faq = ''.join(f'<details class="a-faq"><summary>{e(q["q"])}</summary><p>{e(q["a"])}</p></details>' for q in s['faq'])
    cases = site.cases_for_service(s['slug'])
    related_cases = case_table(site, cases) if cases else f'<p class="a-pending-block">可公開的{s["name"]}案例：{PENDING}</p>'
    notes = note_list(site, [site.articles[a] for a in s['articles']])
    pend = f'<p class="a-pending-block">{e(s["pending"])}</p>' if s.get('pending') else ''
    body = f'''<header class="a-page-head a-page-head--plane"><p class="a-kicker a-kicker--ink">{e(s['en'])}</p><h1>{s['name']}</h1>
<p class="a-page-lead">{e(s['lead'])}</p><p class="a-page-intro">{e(s['intro'])}</p>
<ul class="a-mats">{mats}</ul></header>
<div class="a-doc">
<nav class="a-toc" aria-label="本頁段落"><p>本頁段落</p><ol>{''.join(f'<li><a href="#{k}">{v}</a></li>' for k, v in toc)}</ol></nav>
<div class="a-doc__body">
<section id="issues"><h2>適用問題</h2><ul class="a-issuelist">{issues or '<li>依現場條件評估</li>'}</ul></section>
<section id="judge"><h2>現場如何判斷</h2><ol class="a-steps">{judge}</ol></section>
<section id="methods"><h2>工法</h2>{mtable(s['methods'])}</section>
<section id="access"><h2>接近方式</h2>{mtable(access) if access else '<p>見上方工法表。</p>'}<p><a href="{site.url('/services/rope-access')}">比較所有接近方式</a></p></section>
<section id="deliver"><h2>交付紀錄</h2><ul class="a-check">{listing(s['deliverables'])}</ul></section>
<section id="limits"><h2>限制條件</h2><ul class="a-bullets">{listing(s['limits'])}</ul>{pend}</section>
<section id="prep"><h2>詢價前準備</h2><ul class="a-check">{listing(s['prep'])}</ul><a class="a-btn a-btn--ink" href="{site.url('/contact')}" data-track="cta_service">安排勘查</a></section>
<section id="faq"><h2>常見問題</h2>{faq}</section>
<section id="related"><h2>相關案例與筆記</h2>{related_cases}{notes}</section>
</div></div>'''
    page(site, route, title=s['title'], desc=s['description'], body=body,
         trail=[('首頁', '/'), ('工程服務', '/services/'), (s['name'], route)], schema=[site.service_ld(s)], image=s['photo']['src'])


def projects_index(site):
    cases = site.sorted_cases()
    body = f'''<header class="a-page-head"><p class="a-kicker a-kicker--ink">案例索引</p><h1>工程案例索引</h1>
<p class="a-page-lead">每一列是一個案場。欄位依案場名稱、地區、建築類型、工項、材質、接近方式與期間排列；照片在案例頁中閱讀。</p></header>
<section class="a-sec a-sec--tight">{case_table(site, cases, filters=True)}
<p class="a-hint">編號為網站索引編號，不是公司工程編號。期間以成果報告記載為準；只有照片資料夾日期時另外標示。</p></section>'''
    items = [(c['name'], '/projects/' + c['slug']) for c in cases]
    page(site, '/projects/', title='工程案例索引', desc='東方繩洗外牆清洗、矽利康更新、屋頂接縫防水與特殊高空作業案例索引，依工項與接近方式篩選。',
         body=body, trail=[('首頁', '/'), ('案例索引', '/projects/')], schema=[site.itemlist('工程案例', items)])


def case_page(site, c, prev_c, next_c):
    route = '/projects/' + c['slug']
    svc = site.services[c['service']]
    fields = [('案場名稱', e(c['name'])), ('地區', pending(c['region'])), ('建築類型', pending(c['building_type'])),
              ('現場問題', pending(c['problem'])), ('外牆材質', pending(c['materials']) + (f'<small>{e(c["materials_note"])}</small>' if c.get('materials_note') else '')),
              ('施工範圍', pending(c['scope'])), ('使用設備', pending(c['equipment'])),
              ('接近方式', pending('、'.join(site.methods[x]['name'] for x in c['access']) or PENDING)),
              ('工法', pending(c['methods'])),
              ('施工期間', pending(c['period']) + (f'<small>{e(c["period_note"])}</small>' if c.get('period_note') else '')),
              ('照片紀錄日期', pending((c.get('record_date') or PENDING).replace('-', '/')) + (f'<small>{e(c["record_date_note"])}</small>' if c.get('record_date_note') else '')),
              ('施工前照片', f'<span class="a-pending">{PENDING}</span>'),
              ('施工中照片', f'{sum(p["stage"] == "during" for p in c["photos"])} 張'),
              ('完工照片', f'<span class="a-pending">{PENDING}</span>'),
              ('可公開程度', e(c['disclosure']))]
    dl = ''.join(f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in fields)
    figs = []
    for i, p in enumerate(c['photos']):
        w, h = site.ratio(p['src'])
        low = '<span class="a-lowres">低解析原檔，待補高解析照片</span>' if p.get('lowres') else ''
        cap = f';max-width:{w * 2}px' if p.get('lowres') else ''
        figs.append(f'''<figure class="a-photo{' a-photo--first' if i == 0 else ''}" style="--r:{w}/{h}{cap}">
<div class="a-photo__frame">{site.pic(p['src'], '(min-width: 1000px) 62vw, 100vw', photo=p, eager=(i == 0))}{'<div class="a-photo__plane" aria-hidden="true"></div>' if i == 0 else ''}</div>
<figcaption><span class="a-code">{STAGE[p['stage']]}</span><span>照片 {i + 1}／{len(c['photos'])}</span>{e(p['caption'])}{low}</figcaption></figure>''')
    texts = [('現場問題', c['problem']), ('特殊問題', c['special_issue']), ('處理方式', c['handling']), ('完工結果', c['result'])]
    text_html = ''.join(f'<div><h3>{k}</h3><p>{pending(v)}</p></div>' for k, v in texts)
    notes = note_list(site, site.articles_for_case(c))
    nav = f'''<nav class="a-pager" aria-label="其他案例"><a href="{site.url('/projects/' + prev_c['slug'])}"><small>上一個</small>{e(prev_c['name'])}</a><a href="{site.url('/projects/')}">案例索引</a><a href="{site.url('/projects/' + next_c['slug'])}"><small>下一個</small>{e(next_c['name'])}</a></nav>'''
    body = f'''<header class="a-page-head a-case-head"><p class="a-kicker a-kicker--ink"><span class="a-code">{c['code']}</span>{e(c['work'])}</p>
<h1>{e(c['name'])}<span>{e(c['work'])}</span></h1><p class="a-page-lead">{e(c['summary'])}</p></header>
<div class="a-case">
<aside class="a-case__data" aria-label="案件資料"><h2 class="a-h-small">案件資料</h2><dl class="a-dl a-dl--sheet">{dl}</dl>
<p class="a-source">資料來源：{e(c['source'])}</p></aside>
<div class="a-case__photos">{''.join(figs)}
<section class="a-case__ba" aria-labelledby="ba-h"><h2 id="ba-h" class="a-h-small">施工前後對照</h2>{site.before_after(c)}</section>
<section class="a-case__text" aria-labelledby="t-h"><h2 id="t-h" class="a-h-small">處理紀錄</h2><div class="a-case__grid">{text_html}</div></section>
<section aria-labelledby="rel-h"><h2 id="rel-h" class="a-h-small">相關服務與筆記</h2><p><a class="a-more" href="{site.url('/services/' + svc['slug'])}">{svc['name']}</a></p>{notes}</section>
</div></div>{nav}'''
    page(site, route, title=f'{c["name"]}｜{c["work"]}案例', desc=c['summary'] + ' 案場資料、施工照片與處理紀錄。', body=body, cls='a-casepage',
         trail=[('首頁', '/'), ('案例索引', '/projects/'), (c['name'], route)], schema=[site.case_ld(c)], image=c['photos'][0]['src'])


def insights_index(site):
    cats = {}
    for a in site.sorted_articles():
        cats.setdefault(a['category'], []).append(a)
    groups = ''.join(f'<section class="a-notegroup" aria-labelledby="cat-{i}"><h3 id="cat-{i}">{e(k)}</h3>{note_list(site, v, show_answer=True)}</section>'
                     for i, (k, v) in enumerate(cats.items()))
    body = f'''<header class="a-page-head"><p class="a-kicker a-kicker--ink">現場問題與工程筆記</p><h1>現場問題</h1>
<p class="a-page-lead">先從看到的現象找起。每一項問題都整理了判斷方式、可能工法與對應服務；需要更完整的說明時，進入工程筆記。</p></header>
<section class="a-sec a-sec--tight" aria-labelledby="iss-h"><h2 id="iss-h" class="a-h-small">問題索引</h2>{issue_rows(site)}</section>
<section class="a-sec" aria-labelledby="notes-h"><header class="a-sec__head"><h2 id="notes-h">工程筆記</h2><p>長篇文章經工程審閱後發布。目前為初稿，審閱人與日期待公司確認。</p></header>{groups}</section>'''
    items = [(a['title'], '/insights/' + a['slug']) for a in site.sorted_articles()]
    page(site, '/insights/', title='現場問題與工程筆記', desc='外牆磁磚空鼓、剝落、滲水、矽利康老化、玻璃水垢與接近方式等現場問題的判斷方式、工法與限制。',
         body=body, trail=[('首頁', '/'), ('現場問題', '/insights/')], schema=[site.itemlist('工程筆記', items)])


def article_page(site, a):
    route = '/insights/' + a['slug']
    toc = ''.join(f'<li><a href="#{s["id"]}">{e(s["title"])}</a></li>' for s in a['sections'])
    secs = ''.join(f'<section id="{s["id"]}" aria-labelledby="{s["id"]}-h"><h2 id="{s["id"]}-h">{e(s["title"])}</h2>{s["html"]}</section>' for s in a['sections'])
    svcs = ''.join(f'<li><a href="{site.url("/services/" + x)}">{site.services[x]["name"]}</a></li>' for x in a.get('services', []))
    cases = [site.cases[x] for x in a.get('cases', [])]
    case_html = case_table(site, cases) if cases else f'<p class="a-pending-block">相關案例：{PENDING}</p>'
    review = ''.join(f'<div><dt>{k}</dt><dd>{e(v)}</dd></div>' for k, v in site.review_block(a))
    related = note_list(site, [site.articles[x] for x in a.get('related', [])])
    body = f'''<header class="a-page-head a-art-head"><p class="a-kicker a-kicker--ink">{e(a['category'])}</p><h1>{e(a['title'])}</h1>
<p class="a-art-meta">更新 <time datetime="{a['updated']}">{a['updated']}</time>・{e(a['status'])}</p></header>
<div class="a-answer" role="note" aria-label="快速回答"><p class="a-kicker a-kicker--ink">快速回答</p><p>{e(a['answer'])}</p></div>
<div class="a-doc">
<nav class="a-toc" aria-label="文章段落"><p>文章段落</p><ol>{toc}</ol><div class="a-toc__bar" aria-hidden="true"><span></span></div></nav>
<article class="a-doc__body a-prose">{secs}
<section aria-labelledby="rs-h"><h2 id="rs-h">相關服務</h2><ul class="a-pills">{svcs}</ul></section>
<section aria-labelledby="rc-h"><h2 id="rc-h">相關案例</h2>{case_html}</section>
<section aria-labelledby="rv-h" class="a-review"><h2 id="rv-h">更新日期與工程審閱</h2><dl class="a-dl a-dl--sheet">{review}</dl>
<p class="a-hint">本文供委託與溝通準備使用，不能代替現場檢查。實際工法與費用依現場評估與正式報價為準。</p></section>
<section aria-labelledby="rn-h"><h2 id="rn-h">延伸閱讀</h2>{related}</section>
</article></div>
<div class="a-inquiry-wrap">{site.inquiry(heading='把現場狀況告訴我們')}</div>'''
    page(site, route, title=a['title'], desc=a['description'], body=body, og_type='article',
         trail=[('首頁', '/'), ('現場問題', '/insights/'), (a['title'], route)], schema=[site.article_ld(a)])


def about(site):
    values = [('安全', '先確認固定點、繩索配置、地面隔離與天候，條件不符合就不作業。'),
              ('品質', '施工前試洗、試做或標記範圍，依材質選擇藥劑、材料與工具。'),
              ('服務', '指定聯絡窗口，事先說明住戶與管理單位需要配合的事項。'),
              ('現場判斷', '依建築條件、外牆材質與缺失範圍判斷，不以一張照片或樓層高度決定工法。'),
              ('工法選擇', '清洗、修繕、防水與檢查分開列項，說明每種工法的限制。'),
              ('施工紀錄', '處理位置、使用材料與施工照片對照整理。'),
              ('可追溯的結果', '完工紀錄可供驗收、日後維護與管理窗口交接使用。')]
    vals = ''.join(f'<div><dt>{k}</dt><dd>{e(v)}</dd></div>' for k, v in values)
    claims = ''.join(f'<tr><th scope="row">{e(x["item"])}</th><td><span class="a-pending">待公司確認</span>{e(x["status"])}</td></tr>' for x in site.company['claims_pending'])
    company = ''.join(f'<div><dt>{k}</dt><dd>{e(v)}</dd></div>' for k, v in site.company_lines())
    areas = ''.join(f'<li>{a}</li>' for a in site.company['areas'])
    body = f'''<header class="a-page-head a-page-head--plane"><p class="a-kicker a-kicker--ink">公司</p><h1>東方繩洗有限公司</h1>
<p class="a-page-lead">外牆清洗、修繕、防水與檢查的工程團隊。高空接近方式只是手段，工作是找出問題、選擇正確工法、完成施工，並留下可以驗收與追蹤的紀錄。</p></header>
<div class="a-doc a-doc--plain"><div class="a-doc__body">
<section><h2>工作原則</h2><dl class="a-dl a-dl--values">{vals}</dl></section>
<section><h2>公司資料</h2><dl class="a-dl a-dl--sheet">{company}</dl></section>
<section><h2>資格、證照與紀錄</h2><p>以下項目在正式站或公司資料中出現。網站上線前，需要公司提供文件確認後才公開陳述。</p>
<div class="a-table-wrap"><table class="a-spec a-spec--2"><tbody>{claims}</tbody></table></div></section>
<section><h2>服務地區</h2><ul class="a-areas">{areas}</ul><p class="a-hint">{e(site.company['areas_note'])}</p></section>
</div></div>'''
    page(site, '/about', title='關於東方繩洗', desc='東方繩洗有限公司的工作原則、公司資料、服務地區與待確認的資格資料。',
         body=body, trail=[('首頁', '/'), ('公司', '/about')], schema=[site.local()])


def contact(site):
    lines = ''.join(f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in site.contact_lines())
    steps = [('聯絡', '以 LINE、電話或 Email 提供案場地址、現況照片與需求。'), ('初步討論', '確認問題類型、範圍與需要補充的資料。'),
             ('現場勘查', '確認外牆材質、作業動線、固定位置與缺失範圍。'), ('報價', '列出施作範圍、工法、接近方式、排除項目與配合事項。'),
             ('施工與紀錄', '依約定施工，整理位置、照片與使用材料。')]
    flow = ''.join(f'<li><strong>{k}</strong>{e(v)}</li>' for k, v in steps)
    body = f'''<header class="a-page-head"><p class="a-kicker a-kicker--ink">聯絡</p><h1>安排現場勘查</h1>
<p class="a-page-lead">提供案場地址、現況照片與想處理的範圍，就可以開始討論。沒有完整圖面也沒關係。</p></header>
<div class="a-contact">
<div class="a-inquiry-wrap a-inquiry-wrap--flat">{site.inquiry(heading='詢價資料', intro='勾選問題與建築類型，填入地區與聯絡方式。下方會即時組成一段訊息，可以直接貼到 LINE 或寄出 Email。')}</div>
<aside class="a-contact__side"><h2 class="a-h-small">聯絡方式</h2><dl class="a-dl a-dl--sheet">{lines}</dl>
<h2 class="a-h-small">從聯絡到完工</h2><ol class="a-flow">{flow}</ol></aside>
</div>'''
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
        case_page(site, c, cases[i - 1], cases[(i + 1) % len(cases)])
    insights_index(site)
    for a in site.sorted_articles():
        article_page(site, a)
    about(site)
    contact(site)
