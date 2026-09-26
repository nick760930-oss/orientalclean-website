"""Concept B 現場紀錄 — photographic editorial, case-first.

IA starts from the work: 案例 → 工法 → 筆記. Photographs carry the page;
text behaves like captions and essays in an architectural publication.
"""
from lib.site import e, PENDING, HOME_TITLE, HOME_DESC, STAGE

NAV = [('/projects/', '案例'), ('/services/', '工法'), ('/insights/', '筆記'), ('/about', '公司'), ('/contact', '聯絡')]
PLATES = [('wall-cleaning', 'cases/tonlin-facade-cleaning.webp', 'wide'), ('facade-inspection', 'service-inspection.jpg', 'tall'),
          ('waterproof', 'service-waterproof.jpg', 'half'), ('wall-repair', 'service-repair.jpg', 'half'),
          ('rope-access', 'case-3.jpg', 'wide'), ('special', 'case-dajiang.jpg', 'tall')]
PLATE_CAPTION = {
    'cases/tonlin-facade-cleaning.webp': '台北統領百貨，磁磚與玻璃立面清洗。',
    'service-inspection.jpg': '石材外牆敲擊檢查。案場資料待補資料。',
    'service-waterproof.jpg': '玻璃天窗接縫施作。案場資料待補資料。',
    'service-repair.jpg': '磁磚外牆繩索作業。案場資料待補資料。',
    'case-3.jpg': '高樓玻璃外側繩索作業。案場資料待補資料。',
    'case-dajiang.jpg': '大江購物中心，挑空燈箱繩索作業。',
}
CURRENT = ' aria-current="page"'


def vt(slug):
    return f'style="view-transition-name:case-{slug}"'


# --------------------------------------------------------------- frame
def contents_dialog(site):
    cases = ''.join(f'<li><a href="{site.url("/projects/" + c["slug"])}"><span>{e(c["name"])}</span><small>{e(c["work"])}</small></a></li>' for c in site.sorted_cases())
    svcs = ''.join(f'<li><a href="{site.url("/services/" + s["slug"])}"><span>{s["name"]}</span></a></li>' for s in site.services.values())
    notes = ''.join(f'<li><a href="{site.url("/insights/" + a["slug"])}"><span>{e(a["title"])}</span></a></li>' for a in site.sorted_articles())
    return f'''<dialog class="b-contents" id="b-contents" aria-labelledby="b-contents-h">
<div class="b-contents__inner">
<div class="b-contents__top"><p id="b-contents-h" class="b-contents__h">目錄</p><button type="button" class="b-close" data-close>關閉</button></div>
<div class="b-contents__cols">
<section><h2><a href="{site.url('/projects/')}">案例</a></h2><ol>{cases}</ol></section>
<section><h2><a href="{site.url('/services/')}">工法</a></h2><ol>{svcs}</ol>
<h2 class="b-contents__gap"><a href="{site.url('/about')}">公司</a></h2><h2><a href="{site.url('/contact')}">委託與聯絡</a></h2></section>
<section><h2><a href="{site.url('/insights/')}">工程筆記</a></h2><ol>{notes}</ol></section>
</div></div></dialog>'''


def header(site, route):
    items = ''.join(f'<li><a href="{site.url(r)}"{CURRENT if route.startswith(r) else ""}>{label}</a></li>' for r, label in NAV)
    b = site.brand['logo-cyan']
    return f'''<header class="b-head">
<a class="b-brand" href="{site.url('/')}" aria-label="東方繩洗首頁"><img src="{site.prefix}/brand/logo-cyan.webp" width="{b['w']}" height="{b['h']}" alt="東方繩洗 ORIENTAL CLEAN"></a>
<nav class="b-nav" aria-label="主要選單"><ul>{items}</ul></nav>
<button type="button" class="b-toc-btn" data-open-contents aria-haspopup="dialog" aria-controls="b-contents">目錄</button>
</header>{contents_dialog(site)}'''


def colophon(site):
    lines = ''.join(f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in site.contact_lines())
    company = ''.join(f'<div><dt>{k}</dt><dd>{e(v)}</dd></div>' for k, v in site.company_lines())
    c = site.company
    return f'''<footer class="b-colophon" aria-labelledby="colophon-h">
<div class="b-colophon__band"><p class="b-colophon__ask">委託外牆清洗、修繕、防水或檢查，先提供案場地址與現況照片。</p>
<div class="b-colophon__acts"><a class="b-btn b-btn--solid" href="{site.url('/contact')}" data-track="cta_colophon">安排現場勘查</a><a class="b-btn" href="{c['line_url']}" rel="noopener" data-track="line">LINE {c['line_id']}</a><a class="b-btn" href="tel:{c['phone'].replace('-', '')}" data-track="call">{c['phone']}</a></div></div>
<div class="b-colophon__grid">
<h2 id="colophon-h" class="b-colophon__h">版權頁</h2>
<dl class="b-dl">{company}</dl>
<dl class="b-dl">{lines}</dl>
</div>
<p class="b-colophon__note">概念原型 B「現場紀錄」｜預覽用，不影響正式站。照片皆為東方繩洗現場照片；案場資料未確認處標示「{PENDING}」。</p>
</footer>'''


def crumbs(site, items):
    lis = ''.join(f'<li><a href="{site.url(r)}">{e(n)}</a></li>' for n, r in items[:-1])
    return f'<nav class="b-crumb" aria-label="頁面位置"><ol>{lis}<li aria-current="page">{e(items[-1][0])}</li></ol></nav>'


def page(site, route, *, title, desc, body, trail=None, schema=(), og_type='website', image=None, cls=''):
    schema = list(schema) + [site.org()]
    if trail:
        schema.append(site.breadcrumb(trail))
    html = site.head(title=title, description=desc, route=route, og_type=og_type, image=image, schema=schema, body_class='b ' + cls)
    html += header(site, route) + '<main id="main">' + (crumbs(site, trail) if trail else '') + body + '</main>' + colophon(site) + '\n</body>\n</html>\n'
    site.write(route, html)


def pend(v):
    if v in (None, '', PENDING) or v == [PENDING]:
        return f'<span class="b-pending">{PENDING}</span>'
    return e('、'.join(v) if isinstance(v, list) else v)


def fig(site, src, caption, sizes, *, num=None, cls='', eager=False, alt=None, style='', reveal=True, extra='', lowres=False):
    w, h = site.ratio(src)
    if lowres:
        style += f'max-width:{w * 2}px;'
    label = f'<span class="b-fignum">圖{num}</span>' if num else ''
    return (f'<figure class="b-fig {cls}"><div class="b-fig__frame{" b-reveal" if reveal else ""}" style="aspect-ratio:{w}/{h};{style}">'
            f'{site.pic(src, sizes, alt=alt if alt is not None else caption, eager=eager)}</div>'
            f'<figcaption>{label}{caption}{extra}</figcaption></figure>')


def case_facts_line(site, c):
    bits = [c['region'] if c['region'] != PENDING else None, c['work'], c['period'] if c['period'] != PENDING else None]
    return '　'.join(e(b) for b in bits if b)


# ------------------------------------------------------------------ pages
def home(site):
    cover_case = site.cases['fubon-xihua']
    cover = cover_case['photos'][1]
    w, h = site.ratio(cover['src'])
    toc_cases = ''.join(f'''<li><a href="{site.url('/projects/' + c['slug'])}">
<span class="b-thumb" {vt(c['slug'])}>{site.pic(c['photos'][0]['src'], '96px', alt='')}</span>
<span class="b-toc__t">{e(c['name'])}</span><span class="b-toc__m">{e(c['work'])}・{pend(c['region'])}</span></a></li>''' for c in site.sorted_cases())
    toc_notes = ''.join(f'<li><a href="{site.url("/insights/" + a["slug"])}"><span class="b-toc__t">{e(a["title"])}</span><span class="b-toc__m">{e(a["category"])}</span></a></li>' for a in site.sorted_articles()[:6])
    toc_svcs = ''.join(f'<li><a href="{site.url("/services/" + s["slug"])}"><span class="b-toc__t">{s["name"]}</span><span class="b-toc__m">{e(s["lead"])}</span></a></li>' for s in site.services.values())

    m = site.cases['morten41']
    lead_photo = m['photos'][0]
    seq = ''.join(fig(site, p['src'], e(p['caption']), '(min-width: 900px) 30vw, 80vw', num=i + 2, cls='b-seq__item')
                  for i, p in enumerate(m['photos'][1:]))

    plates = ''.join(f'''<article class="b-plate b-plate--{kind}">
{fig(site, src, e(PLATE_CAPTION[src]), '(min-width: 900px) 60vw, 100vw', num=i + 1)}
<div class="b-plate__text"><h3><a href="{site.url('/services/' + slug)}">{site.services[slug]['name']}</a></h3><p>{e(site.services[slug]['lead'])}</p></div>
</article>''' for i, (slug, src, kind) in enumerate(PLATES))

    first, *rest = site.sorted_articles()[:5]
    more = ''.join(f'<li><a href="{site.url("/insights/" + a["slug"])}">{e(a["title"])}</a></li>' for a in rest)
    body = f'''
<section class="b-cover" aria-labelledby="cover-h">
<div class="b-cover__meta"><span>現場紀錄</span><span>案例 {len(site.cases)} 件・工程筆記 {len(site.articles)} 篇</span></div>
<figure class="b-cover__fig">
<div class="b-cover__frame" style="aspect-ratio:{w}/{h}" data-cover>{site.pic(cover['src'], '100vw', photo=cover, eager=True)}</div>
<figcaption><span class="b-fignum">封面</span>{e(cover_case['name'])}，{e(cover_case['region'])}。玻璃帷幕繩索清洗，多位作業人員在不同位置分段作業。<a href="{site.url('/projects/' + cover_case['slug'])}">閱讀案例</a></figcaption>
</figure>
<div class="b-cover__title">
<h1 id="cover-h">外牆清洗、修繕、防水與高空作業的現場紀錄</h1>
<p>東方繩洗以繩索與吊籠進行外牆清洗、修繕、防水與檢查。依建築條件、外牆材質與現場問題決定施工方式，並留下每一個位置的施工紀錄。</p>
</div>
</section>

<section class="b-toc" aria-labelledby="toc-h">
<h2 id="toc-h" class="b-sec-label">本期目錄</h2>
<div class="b-toc__cols">
<div><h3 class="b-toc__h">案例</h3><ol class="b-toc__cases">{toc_cases}</ol><a class="b-more" href="{site.url('/projects/')}">全部案例與印樣</a></div>
<div><h3 class="b-toc__h">工法</h3><ol class="b-toc__list">{toc_svcs}</ol>
<h3 class="b-toc__h b-toc__h--gap">工程筆記</h3><ol class="b-toc__list">{toc_notes}</ol></div>
</div>
</section>

<section class="b-feature" aria-labelledby="feat-h">
<p class="b-sec-label">特寫</p>
<div class="b-feature__spread">
{fig(site, lead_photo['src'], e(lead_photo['caption']), '(min-width: 900px) 50vw, 100vw', num=1, cls='b-feature__main', alt=lead_photo['alt'])}
<div class="b-feature__text">
<h2 id="feat-h" class="b-h2">{e(m['name'])}</h2>
<p class="b-facts">{case_facts_line(site, m)}</p>
<p class="b-stand">{e(m['summary'])}</p>
<p>成果報告記載的施工期間為 2025 年 10 月 1 日至 12 月 3 日。照片包含弧形玻璃外側、低樓層立面與一樓玻璃的作業位置；各張照片的光線、角度與建物條件不同，不以單張影像推算清洗面積或工期。</p>
<a class="b-more" href="{site.url('/projects/' + m['slug'])}">閱讀完整案例</a>
</div></div>
<div class="b-seq">{seq}</div>
</section>

<section class="b-plates" aria-labelledby="plates-h">
<header class="b-sec-head"><p class="b-sec-label">圖版</p><h2 id="plates-h" class="b-h2">六種工作，六張現場照片</h2>
<p>每一項服務都以實際作業照片說明。照片未對應到案場的，圖說中標示「{PENDING}」。</p></header>
<div class="b-plates__grid">{plates}</div>
</section>

<section class="b-essay" aria-labelledby="essay-h">
<p class="b-sec-label">工程筆記</p>
<article class="b-essay__lead">
<p class="b-kicker">{e(first['category'])}</p>
<h2 id="essay-h" class="b-h2"><a href="{site.url('/insights/' + first['slug'])}">{e(first['title'])}</a></h2>
<p class="b-stand">{e(first['answer'])}</p>
<a class="b-more" href="{site.url('/insights/' + first['slug'])}">閱讀全文</a>
</article>
<ul class="b-essay__more">{more}</ul>
</section>
'''
    page(site, '/', title=HOME_TITLE, desc=HOME_DESC, body=body, cls='b-home', schema=[site.website(), site.local()])


def loupe():
    return '''<dialog class="b-loupe" id="b-loupe" aria-label="放大檢視照片">
<figure class="b-loupe__fig"><div class="b-loupe__img"></div><figcaption class="b-loupe__cap"></figcaption></figure>
<div class="b-loupe__bar"><button type="button" data-loupe-prev aria-label="上一張">上一張</button><span class="b-loupe__count" aria-live="polite"></span><button type="button" data-loupe-next aria-label="下一張">下一張</button><a class="b-loupe__case" href="#">閱讀案例</a><button type="button" class="b-close" data-close>關閉</button></div>
</dialog>'''


def projects_index(site):
    cases = site.sorted_cases()
    counts = {}
    for c in cases:
        counts[c['service']] = counts.get(c['service'], 0) + 1
    filt = ''.join(f'<button type="button" data-filter="{k}" aria-pressed="false">{site.services[k]["name"]}<span>{n}</span></button>' for k, n in counts.items())
    strips = []
    frame_no = 0
    for c in cases:
        frames = []
        for i, p in enumerate(c['photos']):
            frame_no += 1
            info = site.media.get(p['src'])
            frames.append(f'''<li><a class="b-frame" href="{site.media.largest(info)}" data-loupe data-caption="{e(c['name'])}｜{e(p['caption'])}" data-case="{site.url('/projects/' + c['slug'])}" data-w="{info['w']}" data-h="{info['h']}"{' ' + vt(c['slug']) if i == 0 else ''}>
{site.pic(p['src'], '(min-width: 900px) 220px, 44vw', alt=p['alt'])}<span class="b-frame__no">{c['code']}・{i + 1}</span></a></li>''')
        strips.append(f'''<section class="b-strip" data-tags="{c['service']}" aria-labelledby="strip-{c['slug']}">
<header class="b-strip__label"><p class="b-kicker">{c['code']}</p><h2 id="strip-{c['slug']}"><a href="{site.url('/projects/' + c['slug'])}">{e(c['name'])}</a></h2>
<p>{e(c['work'])}<br>{pend(c['region'])}</p><p class="b-strip__date">{e(c['period']) if c['period'] != PENDING else (e(c['record_date'].replace('-', '/')) + '　照片紀錄' if c.get('record_date') else pend(PENDING))}</p></header>
<ol class="b-strip__frames">{''.join(frames)}</ol></section>''')
    body = f'''<header class="b-page-head"><p class="b-sec-label">案例</p><h1 class="b-h1">工程案例</h1>
<p class="b-stand">每一列是一個案場的印樣。點選照片放大檢視，左右切換所有案場的照片；點選案場名稱閱讀完整紀錄。</p></header>
<div class="b-filter" data-filter-for="#b-sheet" data-filter-count="#b-count" hidden><button type="button" data-filter="*" aria-pressed="true">全部<span>{len(cases)}</span></button>{filt}<p class="b-filter__n" aria-live="polite">顯示 <span id="b-count">{len(cases)}</span> 個案場</p></div>
<div class="b-sheet" id="b-sheet">{''.join(strips)}</div>
{loupe()}'''
    items = [(c['name'], '/projects/' + c['slug']) for c in cases]
    page(site, '/projects/', title='工程案例', desc='東方繩洗的外牆清洗、矽利康更新、屋頂接縫防水與特殊高空作業現場照片與案例紀錄。',
         body=body, trail=[('首頁', '/'), ('案例', '/projects/')], schema=[site.itemlist('工程案例', items)], cls='b-sheetpage')


def case_page(site, c, next_c):
    route = '/projects/' + c['slug']
    cover = c['photos'][0]
    w, h = site.ratio(cover['src'])
    svc = site.services[c['service']]
    fields = [('地區', pend(c['region'])), ('建築類型', pend(c['building_type'])), ('工項', e(c['work'])),
              ('現場問題', pend(c['problem'])), ('外牆材質', pend(c['materials']) + (f'<small>{e(c["materials_note"])}</small>' if c.get('materials_note') else '')),
              ('施工範圍', pend(c['scope'])), ('使用設備', pend(c['equipment'])),
              ('接近方式', pend('、'.join(site.methods[x]['name'] for x in c['access']) or PENDING)), ('工法', pend(c['methods'])),
              ('施工期間', pend(c['period']) + (f'<small>{e(c["period_note"])}</small>' if c.get('period_note') else '')),
              ('照片紀錄', (e(c['record_date'].replace('-', '/')) + f'<small>{e(c.get("record_date_note", ""))}</small>') if c.get('record_date') else pend(PENDING)),
              ('照片', f'施工前 {pend(PENDING)}<br>施工中 {sum(p["stage"] == "during" for p in c["photos"])} 張<br>完工 {pend(PENDING)}'),
              ('可公開程度', e(c['disclosure']))]
    dl = ''.join(f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in fields)
    figs = ''.join(fig(site, p['src'], f'{e(p["caption"])}<span class="b-stage">{STAGE[p["stage"]]}</span>', '(min-width: 1100px) 56vw, 100vw', num=i + 1, lowres=bool(p.get('lowres')),
                       extra='<span class="b-lowres">低解析原檔，待補高解析照片。</span>' if p.get('lowres') else '')
                   for i, p in enumerate(c['photos'][1:], start=1))
    texts = ''.join(f'<h3>{k}</h3><p>{pend(v)}</p>' for k, v in [('現場問題', c['problem']), ('特殊問題', c['special_issue']), ('處理方式', c['handling']), ('完工結果', c['result'])])
    notes = ''.join(f'<li><a href="{site.url("/insights/" + a["slug"])}">{e(a["title"])}</a></li>' for a in site.articles_for_case(c))
    nx = next_c['photos'][0]
    body = f'''<article class="b-case">
<figure class="b-case__cover{' b-case__cover--lowres' if cover.get('lowres') else ''}" style="--native:{w * 2}px"><div class="b-case__frame" style="aspect-ratio:{w}/{h}" {vt(c['slug'])} data-cover>{site.pic(cover['src'], '100vw', photo=cover, eager=True)}</div>
<figcaption><span class="b-fignum">圖1</span>{e(cover['caption'])}<span class="b-stage">{STAGE[cover['stage']]}</span>{'<span class="b-lowres">低解析原檔，待補高解析照片。</span>' if cover.get('lowres') else ''}</figcaption></figure>
<header class="b-case__head"><p class="b-kicker">{c['code']}｜{e(c['work'])}</p><h1 class="b-h1">{e(c['name'])}</h1><p class="b-stand">{e(c['summary'])}</p></header>
<div class="b-case__body">
<aside class="b-case__data" aria-label="案件資料"><h2 class="b-sec-label">案件資料</h2><dl class="b-dl b-dl--data">{dl}</dl><p class="b-source">資料來源：{e(c['source'])}</p></aside>
<div class="b-case__main">
{figs}
<section class="b-case__ba" aria-labelledby="ba-h"><h2 id="ba-h" class="b-h3">施工前後</h2>{site.before_after(c, '(min-width: 1100px) 56vw, 100vw')}</section>
<section class="b-case__text" aria-labelledby="rec-h"><h2 id="rec-h" class="b-h3">處理紀錄</h2>{texts}</section>
<section aria-labelledby="rel-h"><h2 id="rel-h" class="b-h3">延伸閱讀</h2><ul class="b-list"><li><a href="{site.url('/services/' + svc['slug'])}">{svc['name']}：{e(svc['lead'])}</a></li>{notes}</ul></section>
</div></div>
<a class="b-next" href="{site.url('/projects/' + next_c['slug'])}"><span class="b-next__img" {vt(next_c['slug'])}>{site.pic(nx['src'], '(min-width: 900px) 40vw, 100vw', alt='')}</span>
<span class="b-next__t"><small>下一個案例</small>{e(next_c['name'])}<em>{e(next_c['work'])}</em></span></a>
</article>'''
    page(site, route, title=f'{c["name"]}｜{c["work"]}案例', desc=c['summary'] + ' 施工照片與案場紀錄。', body=body, cls='b-casepage',
         trail=[('首頁', '/'), ('案例', '/projects/'), (c['name'], route)], schema=[site.case_ld(c)], image=cover['src'])


def services_index(site):
    plates = ''.join(f'''<article class="b-plate b-plate--{kind}" id="{slug}">
{fig(site, src, e(PLATE_CAPTION[src]), '(min-width: 900px) 60vw, 100vw', num=i + 1)}
<div class="b-plate__text"><h2 class="b-h3"><a href="{site.url('/services/' + slug)}">{site.services[slug]['name']}</a></h2>
<p class="b-plate__lead">{e(site.services[slug]['lead'])}</p><p>{e(site.services[slug]['intro'])}</p>
<a class="b-more" href="{site.url('/services/' + slug)}">閱讀{site.services[slug]['name']}</a></div></article>''' for i, (slug, src, kind) in enumerate(PLATES))
    body = f'''<header class="b-page-head"><p class="b-sec-label">工法</p><h1 class="b-h1">外牆清洗、修繕、防水、檢查與高空作業</h1>
<p class="b-stand">高空接近方式只是手段。每一項工作都從現場判斷開始：外牆材質、缺失範圍、作業動線與固定位置。</p></header>
<div class="b-plates__grid b-plates__grid--page">{plates}</div>'''
    items = [(s['name'], '/services/' + s['slug']) for s in site.services.values()]
    page(site, '/services/', title='工程服務', desc='外牆清洗、外牆修繕、外牆防水、外牆安全檢查、高空作業與特殊高空作業，以現場照片說明各項工作。',
         body=body, trail=[('首頁', '/'), ('工法', '/services/')], schema=[site.itemlist('工程服務', items)])


def service_page(site, s):
    route = '/services/' + s['slug']
    photo = s['photo']
    w, h = site.ratio(photo['src'])

    def method(m):
        x = site.methods[m]
        note = f'<p class="b-note">{e(x["note"])}</p>' if x.get('note') else ''
        return f'''<article class="b-method" id="m-{m}"><h3>{x['name']}<small>{x['en']}</small></h3>
<dl class="b-dl b-dl--method"><div><dt>做什麼</dt><dd>{e(x['what'])}</dd></div><div><dt>適用</dt><dd>{e(x['fit'])}</dd></div>
<div><dt>限制</dt><dd>{e(x['limits'])}</dd></div><div><dt>留下的紀錄</dt><dd>{e(x['record'])}</dd></div></dl>{note}</article>'''
    access = [m for m in s['access'] if m not in s['methods']]
    li = lambda xs: ''.join(f'<li>{e(x)}</li>' for x in xs)
    issues = ''.join(f'<li><strong>{site.issues[i]["name"]}</strong>{e(site.issues[i]["sign"])}</li>' for i in s['issues'])
    faq = ''.join(f'<details class="b-faq"><summary>{e(q["q"])}</summary><p>{e(q["a"])}</p></details>' for q in s['faq'])
    cases = site.cases_for_service(s['slug'])
    case_row = ''.join(f'<li><a href="{site.url("/projects/" + c["slug"])}"><span class="b-thumb b-thumb--lg">{site.pic(c["photos"][0]["src"], "(min-width: 900px) 22vw, 45vw", alt="")}</span><span class="b-toc__t">{e(c["name"])}</span><span class="b-toc__m">{e(c["work"])}</span></a></li>' for c in cases)
    case_html = f'<ul class="b-caserow">{case_row}</ul>' if cases else f'<p class="b-pending-block">可公開的{s["name"]}案例：{PENDING}</p>'
    notes = ''.join(f'<li><a href="{site.url("/insights/" + a)}">{e(site.articles[a]["title"])}</a></li>' for a in s['articles'])
    pend_note = f'<p class="b-pending-block">{e(s["pending"])}</p>' if s.get('pending') else ''
    body = f'''<article class="b-svc">
<figure class="b-svc__cover"><div class="b-svc__frame" style="aspect-ratio:{w}/{h}" data-cover>{site.pic(photo['src'], '100vw', alt=photo['alt'], eager=True)}</div>
<figcaption><span class="b-fignum">圖1</span>{e(photo['alt'])}。</figcaption></figure>
<header class="b-case__head"><p class="b-kicker">{e(s['en'])}</p><h1 class="b-h1">{s['name']}</h1><p class="b-stand">{e(s['lead'])}</p></header>
<div class="b-reading">
<p class="b-intro">{e(s['intro'])}</p>
<h2 class="b-h3">適用問題</h2><ul class="b-issues">{issues or '<li>依現場條件評估</li>'}</ul>
<h2 class="b-h3">現場如何判斷</h2><ol class="b-ol">{li(s['judge'])}</ol>
<h2 class="b-h3">工法</h2>{''.join(method(m) for m in s['methods'])}
{('<h2 class="b-h3">接近方式</h2>' + ''.join(method(m) for m in access)) if access else ''}
<h2 class="b-h3">交付紀錄</h2><ul class="b-list">{li(s['deliverables'])}</ul>
<h2 class="b-h3">限制條件</h2><ul class="b-list">{li(s['limits'])}</ul>{pend_note}
<h2 class="b-h3">詢價前準備</h2><ul class="b-list">{li(s['prep'])}</ul>
<p><a class="b-btn b-btn--solid" href="{site.url('/contact')}" data-track="cta_service">安排現場勘查</a></p>
<h2 class="b-h3">常見問題</h2>{faq}
</div>
<section class="b-svc__cases" aria-labelledby="sc-h"><h2 id="sc-h" class="b-sec-label">相關案例</h2>{case_html}</section>
<section class="b-reading" aria-labelledby="sn-h"><h2 id="sn-h" class="b-h3">工程筆記</h2><ul class="b-list">{notes}</ul></section>
</article>'''
    page(site, route, title=s['title'], desc=s['description'], body=body, cls='b-svcpage',
         trail=[('首頁', '/'), ('工法', '/services/'), (s['name'], route)], schema=[site.service_ld(s)], image=photo['src'])


def insights_index(site):
    arts = site.sorted_articles()
    first, rest = arts[0], arts[1:]
    rows = ''.join(f'''<li><a href="{site.url('/insights/' + a['slug'])}"><span class="b-kicker">{e(a['category'])}</span>
<span class="b-notes__t">{e(a['title'])}</span><span class="b-notes__a">{e(a['answer'])}</span><span class="b-notes__d">更新 {a['updated']}・{e(a['status'])}</span></a></li>''' for a in rest)
    body = f'''<header class="b-page-head"><p class="b-sec-label">工程筆記</p><h1 class="b-h1">工程筆記</h1>
<p class="b-stand">從現場問題寫起：現象、原因、判斷方式、工法與限制。每一篇由工程人員審閱後發布；目前為初稿。</p></header>
<article class="b-essay__lead b-essay__lead--page"><p class="b-kicker">{e(first['category'])}</p>
<h2 class="b-h2"><a href="{site.url('/insights/' + first['slug'])}">{e(first['title'])}</a></h2><p class="b-stand">{e(first['answer'])}</p>
<p class="b-notes__d">更新 {first['updated']}・{e(first['status'])}</p></article>
<ul class="b-notes">{rows}</ul>'''
    items = [(a['title'], '/insights/' + a['slug']) for a in arts]
    page(site, '/insights/', title='工程筆記', desc='外牆磁磚空鼓、滲水、矽利康老化、玻璃水垢、清洗價格與修繕發包的工程筆記。',
         body=body, trail=[('首頁', '/'), ('筆記', '/insights/')], schema=[site.itemlist('工程筆記', items)])


def article_page(site, a):
    route = '/insights/' + a['slug']
    secs = ''.join(f'<section id="{s["id"]}" aria-labelledby="{s["id"]}-h"><h2 id="{s["id"]}-h" class="b-h3">{e(s["title"])}</h2>{s["html"]}</section>' for s in a['sections'])
    toc = ''.join(f'<li><a href="#{s["id"]}">{e(s["title"])}</a></li>' for s in a['sections'])
    svcs = ''.join(f'<li><a href="{site.url("/services/" + x)}">{site.services[x]["name"]}</a></li>' for x in a.get('services', []))
    cases = [site.cases[x] for x in a.get('cases', [])]
    case_html = ''.join(f'<li><a href="{site.url("/projects/" + c["slug"])}"><span class="b-thumb b-thumb--side">{site.pic(c["photos"][0]["src"], "200px", alt="")}</span><span class="b-toc__t">{e(c["name"])}</span><span class="b-toc__m">{e(c["work"])}</span></a></li>' for c in cases) \
        or f'<li class="b-pending-block">相關案例：{PENDING}</li>'
    review = ''.join(f'<div><dt>{k}</dt><dd>{e(v)}</dd></div>' for k, v in site.review_block(a))
    related = ''.join(f'<li><a href="{site.url("/insights/" + x)}">{e(site.articles[x]["title"])}</a></li>' for x in a.get('related', []))
    body = f'''<article class="b-article">
<header class="b-article__head"><p class="b-kicker">{e(a['category'])}</p><h1 class="b-h1">{e(a['title'])}</h1>
<p class="b-stand b-answer"><span class="b-answer__label">快速回答</span>{e(a['answer'])}</p>
<p class="b-notes__d">更新 <time datetime="{a['updated']}">{a['updated']}</time>・{e(a['status'])}・工程審閱：{e(a['reviewer'])}</p></header>
<div class="b-article__body">
<aside class="b-article__side" aria-label="文章資訊"><p class="b-sec-label">段落</p><ol class="b-side-toc">{toc}</ol>
<p class="b-sec-label">相關服務</p><ul class="b-list b-list--tight">{svcs}</ul>
<p class="b-sec-label">相關案例</p><ul class="b-sidecases">{case_html}</ul></aside>
<div class="b-prose">{secs}
<section class="b-review" aria-labelledby="rv-h"><h2 id="rv-h" class="b-h3">更新日期與工程審閱</h2><dl class="b-dl">{review}</dl>
<p class="b-note">本文供委託與溝通準備使用，不能代替現場檢查。實際工法與費用依現場評估與正式報價為準。</p></section>
<section aria-labelledby="rl-h"><h2 id="rl-h" class="b-h3">延伸閱讀</h2><ul class="b-list">{related}</ul></section>
</div></div></article>'''
    page(site, route, title=a['title'], desc=a['description'], body=body, og_type='article', cls='b-artpage',
         trail=[('首頁', '/'), ('筆記', '/insights/'), (a['title'], route)], schema=[site.article_ld(a)])


def about(site):
    values = [('安全', '先確認固定點、繩索配置、地面隔離與天候，條件不符合就不作業。'),
              ('品質', '施工前試洗、試做或標記範圍，依材質選擇藥劑、材料與工具。'),
              ('服務', '指定聯絡窗口，事先說明住戶與管理單位需要配合的事項。'),
              ('現場判斷', '依建築條件、外牆材質與缺失範圍判斷，不以一張照片或樓層高度決定工法。'),
              ('工法選擇', '清洗、修繕、防水與檢查分開列項，說明每種工法的限制。'),
              ('施工紀錄', '處理位置、使用材料與施工照片對照整理。'),
              ('可追溯的工程結果', '完工紀錄可供驗收、日後維護與管理窗口交接使用。')]
    vals = ''.join(f'<div><dt>{k}</dt><dd>{e(v)}</dd></div>' for k, v in values)
    claims = ''.join(f'<div><dt>{e(x["item"])}</dt><dd><span class="b-pending">待公司確認</span>{e(x["status"])}</dd></div>' for x in site.company['claims_pending'])
    company = ''.join(f'<div><dt>{k}</dt><dd>{e(v)}</dd></div>' for k, v in site.company_lines())
    body = f'''<header class="b-page-head"><p class="b-sec-label">公司</p><h1 class="b-h1">東方繩洗有限公司</h1>
<p class="b-stand">高空接近方式只是手段。工作是找出問題、選擇正確工法、完成施工，並留下可以驗收與追蹤的紀錄。</p></header>
<div class="b-about">{fig(site, 'service-rope.webp', '低處立面清洗作業。案場資料待補資料。', '(min-width: 900px) 45vw, 100vw', num=1)}
<div class="b-reading b-reading--flush">
<h2 class="b-h3">工作原則</h2><dl class="b-dl b-dl--terms">{vals}</dl>
<h2 class="b-h3">公司資料</h2><dl class="b-dl">{company}</dl>
<h2 class="b-h3">資格、證照與紀錄</h2><p>以下項目在正式站或公司資料中出現，需公司提供文件確認後再公開陳述。</p><dl class="b-dl">{claims}</dl>
<h2 class="b-h3">服務地區</h2><p>{e('、'.join(site.company['areas']))}</p><p class="b-note">{e(site.company['areas_note'])}</p>
</div></div>'''
    page(site, '/about', title='關於東方繩洗', desc='東方繩洗有限公司的工作原則、公司資料、服務地區與待確認的資格資料。',
         body=body, trail=[('首頁', '/'), ('公司', '/about')], schema=[site.local()])


def contact(site):
    lines = ''.join(f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in site.contact_lines())
    body = f'''<header class="b-page-head"><p class="b-sec-label">委託與聯絡</p><h1 class="b-h1">安排現場勘查</h1>
<p class="b-stand">提供案場地址、現況照片與想處理的範圍，就可以開始討論。沒有完整圖面也沒關係。</p></header>
<div class="b-contact"><div class="b-contact__form">{site.inquiry(heading='詢價資料', intro='勾選問題與建築類型，填入地區與聯絡方式。下方會即時組成一段訊息，可以直接貼到 LINE 或寄出 Email。')}</div>
<aside class="b-contact__side"><h2 class="b-sec-label">聯絡方式</h2><dl class="b-dl">{lines}</dl></aside></div>'''
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
