"""/claude-preview/：三版總覽（只在整合分支上產生，不進入各概念分支）。"""
import json
from html import escape as e
from pathlib import Path

CONCEPTS = [
    ('a', '立面索引', 'FACADE INDEX', '品牌系統型',
     '首頁沒有照片：Logo 青藍色面與一張可操作的示意立面。把雙繩拖到不同材質上，判讀卡說明常見問題、判斷方式與工法。案例是可篩選的索引表，照片只在案例頁出現。',
     ['拖曳雙繩判讀立面材質', '現場問題索引', '案例索引表篩選', '案例頁色面收起帶出照片']),
    ('b', '現場紀錄', 'FIELD RECORD', '攝影編輯型',
     '像一本建築出版物：封面照片從一條縫隙展開，接著是目錄、案例特寫、工法圖版與工程筆記，最後是版權頁。案例以印樣瀏覽，放大鏡可連續翻看所有案場照片。',
     ['封面縫隙展開與捲動裁切', '目錄對話框', '印樣放大鏡（左右翻看）', '縮圖 Match Cut 到案例封面']),
    ('c', '垂降', 'DESCENT', '空間／電影型',
     '以一次作業的時間為結構：從玻璃外側、屋頂、立面到地面。桌機上捲動控制時間，場景橫向前進；手機改為原生滑動。開場可在現場照片上刮除 WebGL 水膜。',
     ['捲動控制橫向場景與高度計', 'WebGL 水膜刮除', '案例膠卷拖曳', '接近方式示意圖分頁']),
]
DIFF = [
    ('資訊架構起點', '現場問題 → 材質 → 工法', '案例 → 工法 → 筆記', '作業順序與接近方式'),
    ('首頁表現', '無照片，可操作的立面', '刊物封面、目錄、圖版', '水膜開場與橫向場景'),
    ('導覽', '固定選單與索引', '目錄對話框', '高度計與場景按鈕'),
    ('攝影', '只在案例頁出現', '全站主角', '場景與全幅標題照片'),
    ('Typography', '粗黑體與等寬編碼', '明體標題與黑體圖說', '黑體與窄體數字'),
    ('動態', '繩索物理', '裁切、遮罩與 Match Cut', '捲動控制時間、WebGL'),
    ('案例瀏覽', '可篩選索引表', '印樣與放大鏡', '橫向膠卷與清單'),
    ('背景', '白與青藍色面', '紙白', '深海青'),
]


def build(root):
    root = Path(root)
    out = root / 'claude-preview'
    out.mkdir(exist_ok=True)
    deploy_file = root / 'concept-src' / 'docs' / 'deployments.json'
    deploys = json.loads(deploy_file.read_text()) if deploy_file.exists() else {}
    cols = []
    for key, name, en, kind, desc, points in CONCEPTS:
        d = deploys.get(key, {})
        branch = f'<a href="{e(d["url"])}claude-{key}-preview/" rel="noopener">獨立分支預覽</a>' if d.get('url') else ''
        shots = ''.join(
            f'<img src="shots/{key}-{v}.webp" alt="{name}{"桌機" if v == "desktop" else "手機"}首頁截圖" loading="lazy" class="{v}">'
            for v in ('desktop', 'mobile') if (out / 'shots' / f'{key}-{v}.webp').exists())
        cols.append(f'''<article class="col">
<p class="kind">{kind}</p><h2>{key.upper()}｜{name}<small>{en}</small></h2>
<div class="shots">{shots}</div>
<p>{e(desc)}</p><ul>{''.join(f'<li>{e(x)}</li>' for x in points)}</ul>
<p class="go"><a class="btn" href="/claude-{key}-preview/">開啟 {key.upper()}</a>{branch}</p>
<p class="small">分支：<code>claude/concept-{key}</code></p>
</article>''')
    rows = ''.join(f'<tr><th scope="row">{a}</th><td>{b}</td><td>{c}</td><td>{d}</td></tr>' for a, b, c, d in DIFF)
    html = f'''<!doctype html>
<html lang="zh-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>三版概念總覽｜東方繩洗</title>
<link rel="icon" type="image/png" href="/images/logo-cyan-bg.png">
<style>
:root{{--cyan:#74C7D6;--ink:#0E3A43;--line:#D5E6EA;--mist:#5C767C}}
*{{box-sizing:border-box}}body{{margin:0;font:16px/1.8 "PingFang TC","Microsoft JhengHei","Noto Sans CJK TC",system-ui,sans-serif;color:var(--ink);background:#fff}}
header{{background:var(--cyan);padding:28px clamp(16px,4vw,56px)}}header img{{width:170px;height:auto;display:block;margin-bottom:18px}}
h1{{font-size:clamp(26px,3vw,40px);margin:0 0 8px}}header p{{margin:0;max-width:52em}}
main{{padding:0 clamp(16px,4vw,56px) 64px;max-width:1500px;margin:0 auto}}
.cols{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:40px;margin-top:40px}}
.col{{border-top:3px solid var(--ink);padding-top:16px}}.kind{{font-size:13px;color:var(--mist);margin:0}}
h2{{font-size:26px;margin:4px 0 14px}}h2 small{{display:block;font-size:12px;letter-spacing:.2em;color:var(--mist)}}
.shots{{position:relative;margin-bottom:16px}}.shots img{{display:block;border:1px solid var(--line)}}.shots .desktop{{width:100%}}
.shots .mobile{{position:absolute;right:8px;bottom:-12px;width:26%;box-shadow:0 6px 18px rgba(0,0,0,.18)}}
ul{{padding-left:1.2em;margin:10px 0 16px}}.go{{display:flex;gap:16px;align-items:center;flex-wrap:wrap}}
.btn{{display:inline-block;background:var(--ink);color:#fff;text-decoration:none;padding:10px 18px}}
.small{{font-size:13px;color:var(--mist)}}code{{font-size:13px}}
table{{width:100%;border-collapse:collapse;margin-top:16px;font-size:15px}}th,td{{text-align:left;padding:10px 12px 10px 0;border-top:1px solid var(--line);vertical-align:top}}
thead th{{border-top:0;border-bottom:2px solid var(--ink);font-size:13px}}h3{{font-size:22px;margin:64px 0 4px}}
.note{{background:#EAF6F8;padding:16px 20px;margin-top:40px;font-size:15px}}
@media(max-width:1000px){{.cols{{grid-template-columns:1fr}}.shots .mobile{{width:22%}}table{{font-size:14px}}}}
</style></head><body>
<header><img src="/claude-a-preview/brand/logo-white.webp" alt="東方繩洗 ORIENTAL CLEAN">
<h1>三版官網概念總覽</h1><p>三個方向的資訊架構、首頁、導覽、互動、攝影、字體、動態與案例瀏覽方式都不同；內容、案例資料與 SEO 架構共用。這一頁只做比較，不替任何一版評分。</p></header>
<main>
<div class="cols">{''.join(cols)}</div>
<h3>三版差異</h3>
<table><thead><tr><th scope="col"></th><th scope="col">A 立面索引</th><th scope="col">B 現場紀錄</th><th scope="col">C 垂降</th></tr></thead><tbody>{rows}</tbody></table>
<div class="note">三版都未使用貨車照片或 AI 生成照片；沒有資料的欄位標示「待補資料」，證照與紀錄類說法標示「待公司確認」。
完整交付說明、待補素材清單與 SEO 架構見 repository 的 <code>concept-src/docs/</code>。所有預覽路徑都帶有 noindex 標頭，正式站未修改。</div>
</main></body></html>
'''
    (out / 'index.html').write_text(html, encoding='utf-8')
    print('hub -> claude-preview/index.html')
