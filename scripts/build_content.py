"""Build crawlable service, case and editorial pages. Run from repository root."""
from pathlib import Path
from html import escape as e
import json,re,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
BASE='https://www.orientalclean.com.tw'
DATE='2026-09-23'
SERVICES=[
('wall-cleaning','外牆清洗','清楚界定清洗範圍，才能比較報價。','磁磚、石材、玻璃帷幕與金屬板的清潔需求不同。先確認表面材質、髒污情形與可施工位置，再安排試洗和作業方式。',[
('清洗哪些位置','報價前先區分建築立面、窗玻璃、窗框、陽台外側、雨遮與一樓店面。相同一棟樓，包含的部位不同，所需工時與保護措施也不同。'),
('先看材質與髒污','一般積塵、雨痕、附著污垢及玻璃表面狀況，需要分別確認。遇到不明痕跡或既有刮傷，先記錄並評估試洗；清潔與玻璃修復是不同工項。'),
('作業方式與配合事項','依建築外形、屋頂進出條件與地面空間評估繩索、吊籠或高空設備。另需確認用水、排水、行人動線，以及住戶關窗與物品移置安排。'),
('交付與驗收','施工前約定清洗範圍、排除項目與驗收方式。工作紀錄和重點位置照片，可協助管委會核對完成區域，並留下下次維護的參考。')],'/images/case-tonlin.jpg','/journal/facade-cleaning-quote'),
('wall-repair','外牆修繕','把損壞位置與修繕範圍說清楚。','磁磚鬆動、裂縫、填縫老化與局部剝落，需要先確認狀況，再討論修繕項目、範圍和外觀要求。',[
('先記錄，再決定修繕範圍','先整理樓層、方位與照片，辨識既有損壞及影響區域。局部修補與整面整修的目的、工期及費用不同，報價應分開說明。'),
('常見修繕內容','依現況評估磁磚修補、裂縫處理、接縫更新及局部面層整理。不同工法各有適用條件，須在場勘後確認，不能只憑一張照片決定。'),
('材料與外觀','既有磁磚可能停產或有日曬色差，補料的尺寸、色澤及完成面需事先討論。若另有防水需求，也應清楚列入工項。'),
('範圍變動如何處理','拆除後才看得到的基層狀況，可能影響修繕方式。建議事前約定紀錄、追加報價與確認程序，再進行超出原範圍的工作。')],None,'/journal/facade-repair-scope'),
('wall-inspection','外牆安檢','讓檢查結果成為維護決策的依據。','外牆檢查先釐清目的：掌握現況、安排局部修繕，或配合特定管理需求。檢查範圍與方法應在委託前確認。',[
('先確認委託目的','不同目的需要不同深度的調查。請提供建築位置、屋齡資料、既有檢查紀錄及欲了解的問題，方便評估作業內容。'),
('檢查範圍與限制','立面哪些部位能接近、哪些受遮蔽，以及是否需要高空設備，都會影響可檢查範圍。看不到或無法接近的區域，應在紀錄中說明。'),
('方法與紀錄','依現況評估目視、敲擊或其他適合的方法。若需要特定檢測設備或正式報告，須先確認執行人員、方法、交付格式與服務範圍。'),
('接續修繕規劃','將位置照片、異常描述與後續建議對照整理，方便管委會討論處理順序。檢查與修繕分別列項，有助於核對委託內容。')],None,'/journal/facade-repair-scope'),
('waterproof','防水工程','先整理漏水線索，再討論處理方式。','屋頂、外牆、窗框與接縫的滲漏，可能有不同原因。先了解發生時間、位置和過往處理紀錄，再安排現場評估。',[
('場勘前準備','記錄哪個位置出水、什麼天氣容易發生、是否與用水同時出現，以及過去修補的位置。室內痕跡與外部照片都能提供判斷線索。'),
('範圍包含哪些部位','外牆塗層、窗框接縫、屋頂與其他介面需分別確認。報價應說明處理位置、材料系統、基層整理及不包含的區域。'),
('施工條件','材料適用範圍與施工條件依選定系統確認；既有面層、乾燥狀況、天候及可施工動線都需要納入安排。'),
('完工後如何核對','事先約定檢查方式、觀察期間及後續聯絡方式。若有保固，將適用部位、期限、涵蓋事項與排除條件寫清楚。')],None,'/journal/leak-inspection-preparation'),
('high-altitude','高空工程','依案場條件選擇作業方式。','高空作業的安排，取決於施工位置、接近方式、地面空間及周邊使用情況；設備選擇需與實際工項一起評估。',[
('現場條件','提供建物高度、施工方位、屋頂出入口、地面照片與可使用時段。若有雨遮、退縮樓層或鄰棟距離限制，也請一併說明。'),
('作業方式','可依案場條件評估繩索、吊籠或高空設備。能否使用及配置方式，需要現勘確認，不以樓層高低單獨決定。'),
('地面與住戶配合','施工前確認隔離範圍、人車動線、物品保護與聯絡窗口；若需要道路或公共空間協調，另行確認相關安排。'),
('工期與費用','工作量、設備進退場、施作位置和可工作時段都會影響費用。遇天候不適合施工時，需重新協調作業時間。')],None,'/journal/facade-cleaning-quote'),
('special','特殊作業','從施工位置，確認可行的維護安排。','高處燈具、燈箱、構件與特殊位置的維護，先確認設備、尺寸、作業空間及所需工項，再安排人員與器材。',[
('常見需求','燈具更新、燈箱清潔、燈管更換及其他高處維護。請提供設備外觀、安裝位置與問題描述，方便評估。'),
('資料與材料','設備型號、數量、尺寸、固定方式及替換材料規格，會影響備料和工時。資料不完整時，需先場勘確認。'),
('使用時段與作業範圍','商場或社區的作業時間可能受到營運與住戶活動影響，應先協調可施工時段及現場聯絡人。'),
('完成紀錄','依委託範圍記錄處理位置、完成項目與照片；如有無法施作的部位，另行列出原因與後續安排。')],'/images/case-dajiang.jpg','/journal/facade-cleaning-quote')]
ARTICLES=[
('facade-cleaning-quote','外牆清洗費用怎麼看？社區比價前先核對六件事','比價先統一範圍，再比較總價。從清洗部位、材質、作業方式到驗收紀錄，整理管委會詢價時需要的資料。',[
('總價相近，內容可能不同','同一棟社區的外牆清洗，兩份報價可能包含不同的部位。一份含窗玻璃、窗框及一樓店面，另一份只列建築外牆；若只比總價，容易把工作量不同的方案放在一起比較。建議先整理一份共同需求，再請各廠商逐項回覆。清楚的範圍，比單看每坪或每平方公尺單價更有比較價值。'),
('一、把清洗部位列出來','列明各棟、各向立面，以及玻璃、磁磚、石材、金屬板、雨遮、陽台外側和一樓區域是否包含。若不確定面積，先提供全景照片或立面圖，避免自行用樓地板面積直接換算外牆面積。遇到退縮、挑空與遮蔽區域，也應指出位置。'),
('二、說明目前的髒污與期待','提供遠景和局部近照，描述積塵、雨痕或其他附著痕跡。特別在意的位置可標示在照片上。既有刮傷、材質變色或老化未必能靠清洗改善，宜在試洗或場勘時先分辨，並確認哪些項目屬於清潔、哪些需要另外評估修復。'),
('三、確認作業方式和設備','詢問報價採用繩索、吊籠或其他高空設備，以及進退場是否包含在內。屋頂能否進出、地面是否能放置設備、樓層外凸構件及鄰近道路，都可能影響安排。不要只憑建築樓層高低推定需要哪一種方式。'),
('四、把現場配合寫清楚','用水位置、排水、人車動線、住戶關窗、陽台物品移置及施工時段，都需要事前協調。管委會可指定一位聯絡窗口，統一公告與回覆，減少施工當天逐戶確認造成的延誤。若有商店營業時間或夜間限制，也要先列出。'),
('五、比較包含費用與追加條件','確認稅額、設備、材料、現場保護及清理是否已包含。另問哪些情況需要重新報價，例如臨時增加立面、工作範圍改變或原先無法接近的部位。追加項目應先說明位置、原因與金額，再由約定窗口確認。'),
('六、事先約定驗收方式','驗收以雙方約定的施作範圍為基礎。可事先選定重點位置，約定照片紀錄、完工確認及後續反映方式。有助於區分已完成項目、受限位置與另需修繕的問題。照片若涉及住戶室內，應避開私人生活細節。'),
('第一次詢價，準備這些就夠了','準備社區名稱與地址、棟數樓層、四向外觀照片、想清洗的部位、目前問題，以及希望施作的時間。沒有完整圖面也能先諮詢；需要補充的資料，可在初步討論後再整理。東方繩洗會依提供資訊與場勘結果確認報價範圍，不以本文作為固定單價或承諾。')],'/services/wall-cleaning'),
('facade-repair-scope','外牆磁磚修繕怎麼委託？把檢查、範圍與驗收分開看','外牆修繕比價前，先整理異常位置、檢查範圍、材料外觀與追加處理方式，讓管委會更容易核對方案。',[
('先把現況記錄完整','管委會收到住戶反映時，可先整理樓層、方位、出現時間及照片。同一個位置，遠景照片用來辨認位置，近景照片用來說明外觀；兩者一起保存，比只留一張特寫更容易溝通。不要為了拍照自行攀出窗外、靠近剝落區域或試著敲除鬆動材料。'),
('檢查與修繕，各自回答不同問題','檢查的目的在於了解狀況與範圍，修繕則是針對已確認的問題提出處理方式。若只憑可見的缺角直接估算所有損壞，可能漏掉需要進一步確認的區域。委託時應說明檢查方法、可接近範圍、交付照片和紀錄格式；受遮蔽或無法施作的位置也需列出。'),
('局部修補與整面整修要分清楚','局部修補著重已確認的區域，整面整修涉及更大範圍的材料、外觀和工期。方案比較時，先核對各立面的處理位置，再看數量及單價。修補範圍以何種方式量測、邊界如何認定、零星位置如何計算，都適合在報價階段說明。'),
('施工前先討論完成面的樣子','舊磁磚可能已有日曬色差，也可能買不到相同規格。請先確認替代材料、接縫顏色及可接受的外觀差異；必要時以樣品或小範圍完成面討論。若要搭配塗裝、防水或其他表面處理，應另列工項與施工範圍。'),
('拆除後的狀況，如何追加確認','部分基層狀況必須在拆除後才能看清楚。可先約定：由施工方提供照片、位置與處理建議，再提出追加費用和工期影響，由授權窗口確認後執行。這樣能避免完工後才發現雙方對原報價的理解不同。'),
('驗收需要什麼紀錄','建議至少保留位置對照、施作範圍、使用材料與完成照片；如有檢測、試驗或保固要求，應事先寫進委託內容。只看完工外觀，不足以回溯每個位置做過哪些處理。社區保留完整資料，也方便日後維護或更換管理窗口。'),
('發現剝落時，先處理現場風險','若已發生材料掉落，先通知管理單位並避開下方區域，由專業人員評估現場與後續處理。本文供委託與溝通準備使用，不能代替現場檢查或個別建築的判定。')],'/services/wall-repair'),
('leak-inspection-preparation','外牆、窗框漏水，場勘前該準備哪些資料？','整理漏水時間、出水位置、雨天與用水情況，以及歷次修補紀錄，讓場勘討論更有依據。',[
('先保存線索，不急著猜材料','看到室內水痕時，很容易直接判定是最近的一道裂縫或窗框接縫出了問題。但實際處理仍需要結合現場觀察，不能只根據出水位置決定工法。第一次聯絡廠商時，把已知的現象整理清楚，比先指定某一種防水材料更有幫助。'),
('記錄什麼時候發生','記下發現日期、降雨情況、是否連續下雨後才發生，或是否與使用水源同時出現。若能安全地記錄同一位置在不同時間的照片，也有助於比較變化。無法確認的部分可直接標示未知，不必憑印象補出時間。'),
('照片要能辨認位置','同一處可拍室內全景、出水位置及附近牆面；外部照片從安全位置拍攝即可。標示樓層、朝向及鄰近窗戶，並說明照片中的位置是否為同一處。請勿自行探出外牆、登上無防護屋頂，或拆開高處構件找漏水點。'),
('整理以前做過的工程','曾修補的部位、材料名稱、施工時間與當時照片，都可提供參考。如果只有一張收據或原廠商的報價，也能先整理出已處理的範圍；不清楚的部分保留待確認。這能協助區分新發現的位置與過去處理過的區域。'),
('防水報價應包含哪些說明','請核對施作部位、基層整理、裂縫或接縫處理、材料系統，以及完成後的檢查方式。不同部位可能需要不同處理，不能只用「防水一式」取代所有內容。材料的適用條件與施工安排，須依現場和選定系統確認。'),
('安排現勘與後續觀察','提供可聯絡的窗口、可進入的時段、屋頂或公共區域的管理規定，並確認是否需要住戶配合。完工後若需要觀察，也應事先約定觀察方式、反映窗口與保固範圍。沒有看到漏水，不等於能省略原先約定的確認程序。'),
('傳給業務的簡要資料','可依序提供：社區／案場名稱、地址與樓層、漏水位置、常發生的情況、現況照片、曾做過的修補，以及方便聯絡和場勘的時間。東方繩洗會依資料安排討論；處理方式與服務範圍仍以現場評估及正式報價為準。')],'/services/waterproof')]
CASES=[
('morten41','林口森聯摩天41','新北市林口區','2025/10/1–12/3','外牆清洗',
'高層住宅的玻璃與外牆清洗紀錄。依2025年度成果報告整理，呈現不同位置的現場作業照片。',
[('morten41-glass-cleaning.webp','森聯摩天41玻璃外側清洗作業'),('morten41-ground-glass.webp','森聯摩天41一樓玻璃立面工作紀錄'),('morten41-glass-comparison.webp','森聯摩天41高樓層玻璃外側作業紀錄')],
[('工項與紀錄','本案為2025年度外牆清洗。成果報告記載的施工期間為2025年10月1日至12月3日，工作照片包含玻璃外側清洗、一樓玻璃立面及不同高度位置的作業。'),('怎麼閱讀案例照片','照片用來說明本案施作位置與工作紀錄。照片中的光線、角度與建物條件各不相同，不以單張影像推算清洗面積、工期或其他案場的報價。'),('類似社區如何詢價','可先提供社區棟數、樓層、外觀照片及欲清洗部位。陽台外側、窗框、一樓店面或其他附屬位置是否包含，需在委託前逐項確認。')]),
('tonlin-taipei','台北統領百貨','台北市','2025/8/20–8/29','外牆清洗',
'百貨建築外牆清洗紀錄。依2025年度成果報告整理，呈現不同立面與高處位置的清洗作業。',
[('tonlin-facade-cleaning.webp','台北統領百貨磁磚與玻璃立面清洗紀錄'),('tonlin-rope-cleaning.webp','台北統領百貨高處外牆繩索清洗作業')],
[('工項與紀錄','本案為2025年度外牆清洗，成果報告記載施工期間為2025年8月20日至8月29日。現場照片呈現建築磁磚及玻璃立面，並記錄繩索方式進行的高處作業。'),('不同立面的施作條件','照片可見外牆構件、設備與商業立面配置。其他商業建築委託清洗時，也需先確認各面的可接近位置、營運時間及人車動線，再討論施工安排。'),('百貨與商辦的詢價準備','提供各向立面照片、希望處理的位置、可施工時段及現場窗口。若部分區域需要分段安排，應在報價階段一併說明。')])]


# ---------------------------------------------------------------------------
# Rendering — one header, one footer, one stylesheet (assets/site.css), one script (assets/site.js).
# Static pages (home, about, contact, testimonials) are generated here too, so the shell has one source.
# ---------------------------------------------------------------------------
LINE='https://line.me/R/ti/p/@oriental_clean'
MAIL='orientalclean@gmail.com'
PRO360='https://www.pro360.com.tw/service/124195'
FB='https://www.facebook.com/OrientaClean/'
CITIES=['台北','新北','桃園','新竹','苗栗','台中','彰化','嘉義','台南','高雄','宜蘭','基隆']
HOURS=[('週一至週五','08:00–18:00'),('週六','09:00–17:00'),('週日','預約制')]
ADDR1='臺北市中正區'; ADDR2='忠孝西路一段 72 號 2 樓之 5'

_dims={}
def dims(src):
    """(w,h) of a site image, read from disk; None if unavailable."""
    if src in _dims:return _dims[src]
    try:
        from PIL import Image
        with Image.open(ROOT/src.lstrip('/')) as im:_dims[src]=im.size
    except Exception:_dims[src]=None
    return _dims[src]
def img(src,alt,cls='',lazy=True,sizes=None,extra=''):
    d=dims(src);wh=f' width="{d[0]}" height="{d[1]}"' if d else ''
    return f'<img src="{e(src)}" alt="{e(alt)}"{wh}'+(f' class="{cls}"' if cls else '')+(' loading="lazy" decoding="async"' if lazy else '')+(' '+extra if extra else '')+'>'
def link(path,label,cls=''):return f'<a href="{e(path)}"'+(f' class="{cls}"' if cls else '')+f'>{e(label)}</a>'
def section(title,body):return f'<section><h2>{e(title)}</h2><p>{e(body)}</p></section>'
def tel(n):return 'tel:'+n.replace('-','')

NAVLINKS=[('/services','服務'),('/portfolio','案例'),('/journal','筆記'),('/contact','聯絡')]
def header(path):
    def cur(p):return ' aria-current="page"' if (path==p or path.startswith(p+'/') or (p=='/portfolio' and path.startswith('/cases'))) else ''
    links=''.join(f'<a href="{p}"{cur(p)}>{t}</a>' for p,t in NAVLINKS)
    return ('<a class="skip" href="#main">跳至內容</a><header class="header"><div class="header__in wrap">'
      '<a class="brand" href="/" aria-label="東方繩洗首頁"><svg role="img" aria-label="東方繩洗 ORIENTAL CLEAN" width="168" height="48" viewBox="60 265 1130 310" preserveAspectRatio="xMinYMid meet"><image href="/images/logo-horizontal-dark.png" width="1250" height="833"/></svg></a>'
      '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">選單</button>'
      f'<nav class="nav" id="nav" aria-label="主要選單">{links}<a class="btn btn--sm" href="{LINE}">LINE 預約場勘</a></nav></div></header>')

def footer():
    cols=[
      ['東方繩洗有限公司','統一編號 83365645',ADDR1+'<br><span style="white-space:nowrap">'+ADDR2+'</span>'],
      [link('/services','服務'),link('/portfolio','案例'),link('/journal','工程筆記'),link('/about','關於'),link('/testimonials','評價'),link('/contact','聯絡')],
      [f'<a href="{LINE}">LINE @oriental_clean</a>',f'<a href="{FB}">Facebook</a>',f'<a href="{PRO360}">PRO360 評價</a>'],
      ['服務地區','、'.join(f'<span style="white-space:nowrap">{c}</span>' for c in CITIES)],
    ]
    # first <li> of each column is the full-ink line
    cols[1].insert(0,'頁面');cols[2].insert(0,'社群')
    h=''.join('<ul>'+''.join(f'<li>{c}</li>' for c in col)+'</ul>' for col in cols)
    return ('<footer class="footer on-dark"><div class="footer__cols">'+h+'</div><div></div>'
      '<div class="footer__word"><svg viewBox="0 -10 400 125" role="img" aria-label="東方繩洗"><text x="0" y="92" font-size="100" textLength="400" lengthAdjust="spacingAndGlyphs">東方繩洗</text></svg>'
      '<div class="footer__legal"><span>© 2026 東方繩洗有限公司</span><span>orientalclean@gmail.com</span></div></div></footer>')

ORG_FULL={'@context':'https://schema.org','@type':'Organization','@id':BASE+'/#organization','name':'東方繩洗有限公司','alternateName':'ORIENTAL CLEAN','url':BASE+'/','logo':BASE+'/images/logo-brand-color.png','telephone':'+886972171246','email':MAIL,'sameAs':[FB,LINE]}
FONTS='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&amp;family=Noto+Serif+TC:wght@600;700&amp;display=swap" rel="stylesheet">'
ORG={'@context':'https://schema.org','@type':'Organization','@id':BASE+'/#organization','name':'東方繩洗有限公司','url':BASE+'/','telephone':'+886972171246','logo':BASE+'/images/logo.jpg'}
paths=[]
def write_page(path,title,desc,body,kind='WebPage',image=None,full_title=None,home=False,out=None,og_image=None):
    t=full_title or title+'｜東方繩洗'
    schema={'@context':'https://schema.org','@type':kind,'name':title,'headline':title,'description':desc,'url':BASE+path,'inLanguage':'zh-TW','publisher':{'@id':BASE+'/#organization'}}
    if kind=='Article':schema.update(author={'@id':BASE+'/#organization'},datePublished=DATE,dateModified=DATE)
    if image:schema['image']=BASE+image
    org=ORG_FULL if home else ORG
    ogimg=og_image or (BASE+(image or '/images/logo.jpg'))
    ver='<meta name="google-site-verification" content="eAkZ1b6TOeRyy9jqAGPDx6MBl5SbndICBZAEbL3ddWQ">' if home else ''
    canon=BASE+(path if path!='/' else '/')
    html=(f'<!doctype html><html lang="zh-TW" class="no-js"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
      f'<title>{e(t)}</title><meta name="description" content="{e(desc)}"><link rel="canonical" href="{canon}"><meta name="robots" content="index,follow">'
      f'<meta property="og:type" content="{"article" if kind=="Article" else "website"}"><meta property="og:locale" content="zh_TW"><meta property="og:site_name" content="東方繩洗"><meta property="og:title" content="{e(t)}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{canon}"><meta property="og:image" content="{ogimg}">'
      f'<link rel="icon" href="/images/logo.jpg">{ver}{FONTS}<link rel="stylesheet" href="/assets/site.css">'
      '<script>document.documentElement.className="js"</script>'
      f'<script type="application/ld+json">{json.dumps(org,ensure_ascii=False)}</script><script type="application/ld+json">{json.dumps(schema,ensure_ascii=False)}</script></head>'
      f'<body>{header(path)}<main id="main">{body}</main>{footer()}<script src="/assets/site.js" defer></script></body></html>')
    dest=ROOT/(out or (path.lstrip('/')+'.html'));dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(html)
    paths.append(path)

# ---------- shared sections ----------
def cta():
    return ('<section class="band sec--tight" aria-labelledby="cta-h"><div class="wrap grid band__in"><h2 id="cta-h" data-r="t">先聊聊案場的狀況</h2>'
      '<p class="lead" data-r>提供地址、現況照片與工程需求，方便我們協助安排評估。</p>'
      f'<div class="band__acts" data-r><a class="btn" href="{LINE}">LINE 工程諮詢</a><a class="link" href="{tel("0972-171-246")}">辛俞緻 Viki · 0972-171-246</a></div></div></section>')

SVC_LIST=[
 ('wall-cleaning','外牆清洗','每平方公尺 30–70 元','/images/cases/morten41-glass-cleaning.webp','森聯摩天41玻璃外側清洗作業','純水清洗玻璃、磁磚、石材與金屬板。報價前先列清楚清洗部位，比價才比得準。'),
 ('wall-inspection','外牆安檢','依案件規模報價','/images/service-inspection.jpg','師傅在石材外牆上執行檢查','持外牆檢查人員證照執行目視、敲擊等檢查，依位置整理照片與紀錄，作為修繕依據。'),
 ('wall-repair','外牆修繕','依現場評估','/images/service-repair.jpg','紅色磁磚外牆上的繩索修繕作業','磁磚修補、裂縫處理與接縫更新。先記錄損壞位置，再把局部修補與整面整修分開報價。'),
 ('waterproof','防水工程','依現場評估','/images/service-waterproof.jpg','師傅在玻璃屋頂上施作防水填縫','屋頂、外牆、窗框與接縫滲漏。先整理漏水時間與位置，再說明處理部位與材料系統。'),
 ('high-altitude','高空工程','9,000 元／人／日起','/images/service-rope.webp','師傅以繩索在石材立面上作業','繩索、吊籠或高空設備，依建物外形、屋頂進出與地面空間選擇作業方式。'),
 ('special','特殊作業','依需求報價','/images/case-dajiang.jpg','大江購物中心挑高空間的燈箱維護','高處燈具更新、燈箱除塵與燈管更換，配合商場營運時段安排施工。'),
]
def svc_list(h2='服務與參考價格',hid='svc-h',lead=None):
    pics=''.join(img(p[3],p[4],lazy=(i>0)) for i,p in enumerate(SVC_LIST))
    rows=''.join(f'<li class="svc"><div class="svc__head"><a class="svc__name" href="/services/{s}">{n}</a><span class="svc__price">{pr}</span></div><div class="svc__body"><div><p>{d}</p></div></div></li>' for s,n,pr,_,_,d in SVC_LIST)
    return (f'<section class="sec svcs" aria-labelledby="{hid}"><div class="wrap grid svcs__grid"><div class="svcs__pic">{pics}</div>'
      f'<h2 id="{hid}" class="svcs__h" data-r="t">{h2}</h2><ul class="svcs__list">{rows}</ul><p class="small svcs__note" data-r>價格為舊有參考區間，實際以現場評估與正式報價為準。</p></div></section>')

WORK=[ # slug, label, image, line, placement, row
 ('fubon-xihua','西華富邦（台北市大直）','/images/cases/fubon-xihua-3.jpg','玻璃帷幕與建築立面的繩索清洗。','l',1),
 ('tonlin-taipei','台北統領百貨','/images/cases/tonlin-rope-cleaning.webp','2025 年 8 月，百貨立面磁磚與玻璃清洗。','r',2),
 ('morten41','林口森聯摩天41','/images/case-morten41.jpg','2025 年 10 月至 12 月，41 層住宅玻璃與外牆清洗。','m',3),
 ('metrowalk-sealant','大江購物中心','/images/cases/metrowalk-sealant-1.jpg','商場玻璃立面矽利康更新，也做挑高燈箱維護。','l',4),
 ('lien-jade-oriental','聯聚東方（台中市）','/images/cases/lien-jade-oriental-2.jpg','高處立面與欄杆外側清洗。','r',5),
 ('guomei-star','國美之星','/images/cases/guomei-star-2.jpg','屋頂圓頂接縫防水。','m',6),
]
def work(h2='案例',hid='work-h',more=True):
    items=[]
    for slug,label,src,line,pl,row in WORK:
        items.append(f'<a class="work__item work__item--{pl}" href="/cases/{slug}" style="grid-row:{row}" data-r><span class="name">{label}</span><span class="pic">{img(src,label+"施工照片")}</span><span class="desc"><u>{line}</u></span></a>')
        if row==2:items.append('<p class="work__remark" style="grid-row:2" data-r>每個案場都留工作紀錄與照片，<br>完工時交給管委會核對。</p>')
    tail='<p class="work__more" data-r><a class="link" href="/portfolio">看全部案例</a></p>' if more else ''
    return f'<section class="sec work" aria-labelledby="{hid}"><div class="wrap"><h2 id="{hid}" class="work__head" data-r="t">{h2}</h2><div class="grid work__grid">{"".join(items)}</div>{tail}</div></section>'

HOW=[
 ('先傳照片給我們','地址、四向外觀照片、想處理的部位。沒有圖面也能先問。','/images/hero-bg.jpg','印有電話的東方繩洗工程車',110),
 ('到場免費評估','看材質、髒污與屋頂進出，確認繩索、吊籠或高空設備怎麼安排。','/images/cases/lien-jade-oriental-1.jpg','師傅在聯聚東方高處立面作業',80),
 ('報價寫清楚範圍','施作部位、排除項目、追加條件與驗收方式，都列在報價上。','/images/service-drone.jpg','以無人機與繩索作業的外牆',140),
 ('公告與現場配合','用水、排水、人車動線、住戶關窗，透過管委會窗口一次協調。','/images/cases/morten41-ground-glass.webp','森聯摩天41一樓玻璃立面',100),
 ('雙繩垂降施作','每位師傅掛工作繩與確保繩，持雙繩技術認證上牆。','/images/cases/metrowalk-sealant-3.jpg','師傅掛雙繩在玻璃立面施作',130),
 ('照片紀錄與驗收','重點位置拍照記錄，依約定範圍一起核對完成區域。','/images/cases/morten41-glass-comparison.webp','森聯摩天41高樓層玻璃外側作業紀錄',90),
]
ARROW_L='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M17 10H3m6-6L3 10l6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
ARROW_R='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h14m-6-6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
def how(hid='how-h'):
    cols=''.join(f'<li class="col"><h3>{t}</h3><p>{d}</p><span class="sp" style="--sp:{sp}px"></span><div class="ph">{img(src,alt)}</div></li>' for t,d,src,alt,sp in HOW)
    return (f'<section class="sec how" aria-labelledby="{hid}"><div class="wrap how__top"><h2 id="{hid}" data-r="t">從詢價到驗收</h2>'
      f'<div class="how__btns"><button class="sq" type="button" data-prev aria-label="上一張">{ARROW_L}</button><button class="sq" type="button" data-next aria-label="下一張">{ARROW_R}</button></div></div>'
      f'<div class="bar" aria-hidden="true"><i></i></div><ol class="rail" aria-label="詢價到驗收的六個步驟">{cols}</ol></section>')

TYPES=['社區大樓','商業大樓','透天厝','工廠','公共建築','其他']
PARTS=['玻璃','磁磚','石材','金屬板','窗框','雨遮','陽台外側','一樓店面']
DEFAULT_MSG='東方繩洗您好，想詢問外牆工程：\n案場：（尚未填寫）\n項目：（尚未選擇）\n部位：（尚未選擇）\n現況：（尚未填寫）\n希望時間：（尚未填寫）\n（外觀照片我另外傳）'
def inquiry(h2='把案場狀況整理成一則訊息',hid='inq-h'):
    types=''.join(f'<label class="chip"><input type="radio" name="type" value="{t}"><span>{t}</span></label>' for t in TYPES)
    items=''.join(f'<label class="chip"><input type="checkbox" name="item" value="{s[1]}"><span>{s[1]}</span></label>' for s in SERVICES)
    parts=''.join(f'<label class="chip"><input type="checkbox" name="part" value="{t}"><span>{t}</span></label>' for t in PARTS)
    cities=''.join(f'<option value="{c}">{c}</option>' for c in CITIES)
    return (f'<section class="sec inq" id="inquiry" aria-labelledby="{hid}"><div class="wrap grid inq__grid"><div class="inq__head"><h2 id="{hid}" data-r="t">{h2}</h2><p class="lead" style="margin-top:20px" data-r="t">準備這些，就能拿到能比較的報價。</p></div>'
      f'<form class="inq__form" id="inq-form" action="mailto:{MAIL}" method="post" enctype="text/plain">'
      f'<fieldset data-r="t"><legend>案場類型</legend><div class="chips">{types}</div></fieldset>'
      f'<div class="row2" data-r="t"><label class="field"><span>所在縣市</span><select name="city"><option value="">請選擇</option>{cities}</select></label><label class="field"><span>樓層數</span><input name="floors" type="number" inputmode="numeric" min="1" max="120" placeholder="例如 12"></label></div>'
      f'<fieldset data-r="t"><legend>要處理的項目（可複選）</legend><div class="chips">{items}</div></fieldset>'
      f'<fieldset data-r="t"><legend>清洗或處理部位（可複選）</legend><div class="chips">{parts}</div></fieldset>'
      '<label class="field" data-r="t"><span>目前狀況</span><textarea name="note" rows="4" placeholder="例如：玻璃外側積塵、部分磁磚有剝落"></textarea></label>'
      '<div class="row2" data-r="t"><label class="field"><span>希望施工時間</span><input name="when" type="text" placeholder="例如：11 月底前"></label><label class="field"><span>聯絡人與電話（選填）</span><input name="who" type="text" autocomplete="off" placeholder="例如：王先生 0912-345-678"></label></div>'
      '<noscript><button class="btn" type="submit">用 Email 寄出</button></noscript></form>'
      '<aside class="inq__note" aria-label="訊息預覽"><div class="paper" data-r="t"><h3>可直接傳給業務的訊息</h3>'
      f'<div class="msg" id="inq-msg" aria-live="polite">{e(DEFAULT_MSG)}</div>'
      f'<div class="acts"><a class="btn" href="{LINE}" data-copy-line>複製並開啟 LINE</a><button class="link" type="submit" form="inq-form">用 Email 寄出</button></div>'
      '<p role="status" id="inq-status"></p><p class="small">報價以現場評估為準。</p></div></aside></div></section>')

def proof():
    names='&nbsp;·&nbsp;'.join(f'<span style="white-space:nowrap">{n}</span>' for n in ['台北統領百貨','大江購物中心','林口森聯摩天41','西華富邦','聯聚東方','國美之星','高雄流行音樂中心'])
    return ('<section class="proof on-dark" aria-labelledby="pf-h"><div class="proof__card"><h2 id="pf-h">做過的案場</h2>'
      f'<figure>{img("/images/case-tonlin.jpg","台北統領百貨外牆作業")}</figure><p>{names}</p></div></section>')

def testimonial():
    return ('<section class="tq on-dark" aria-labelledby="tq-h"><h2 id="tq-h" class="sr-only">客戶評價</h2>'
      f'{img("/images/case-3.jpg","師傅在玻璃帷幕外側作業，背景是城市")}'
      '<div class="tq__in grid"><blockquote data-r><p>「是一個好的團隊，社區會固定找他清洗。」</p></blockquote>'
      '<div class="tq__who" data-r>郭○美・新竹市北區・PRO360 評價<br><a class="link" href="/testimonials">看全部評價</a></div></div></section>')

def visit(hid='visit-h',alt='印有電話與 LINE 帳號的東方繩洗工程車'):
    hrs=''.join(f'<div><dt>{d}</dt><dd>{t}</dd></div>' for d,t in HOURS)
    return (f'<section class="visit" aria-labelledby="{hid}">{img("/images/hero-bg.jpg",alt)}'
      f'<div class="card" data-r="t"><h2 id="{hid}">聯絡東方繩洗</h2><address>{ADDR1}<br>{ADDR2}</address><dl>{hrs}</dl>'
      f'<a class="tel" href="{tel("0980-929-106")}">0980-929-106</a><a class="tel" href="{tel("0972-171-246")}">業務經理 辛俞緻 0972-171-246</a>'
      f'<a class="mail" href="mailto:{MAIL}">{MAIL}</a><a class="btn btn--block" href="{LINE}">LINE 預約場勘</a></div></section>')

def page_head(h1,lead=None,crumb=None,cls='display'):
    return ('<div class="wrap page-head grid">'
      +f'<h1 class="{cls}" data-r="t">{h1}</h1>'+(f'<p class="lead" data-r>{e(lead)}</p>' if lead else '')+(f'<p class="crumb" data-r>{crumb}</p>' if crumb else '')+'</div>')

POOL={
 'wall-cleaning':[('/images/cases/fubon-xihua-2.jpg','西華富邦玻璃立面清洗作業','/cases/fubon-xihua','西華富邦'),('/images/cases/tonlin-facade-cleaning.webp','台北統領百貨磁磚與玻璃立面清洗','/cases/tonlin-taipei','台北統領百貨'),('/images/case-morten41.jpg','林口森聯摩天41外牆作業','/cases/morten41','林口森聯摩天41')],
 'wall-repair':[('/images/cases/metrowalk-sealant-2.jpg','大江購物中心窗框接縫處理','/cases/metrowalk-sealant','大江購物中心'),('/images/cases/guomei-star-2.jpg','國美之星屋頂金屬構件接縫處理','/cases/guomei-star','國美之星'),('/images/service-drone.jpg','以無人機與繩索作業的外牆',None,'高處外牆作業')],
 'wall-inspection':[('/images/cases/lien-jade-oriental-1.jpg','聯聚東方高處立面作業','/cases/lien-jade-oriental','聯聚東方'),('/images/case-tonlin.jpg','台北統領百貨外牆','/cases/tonlin-taipei','台北統領百貨'),('/images/cases/morten41-ground-glass.webp','森聯摩天41一樓玻璃立面','/cases/morten41','林口森聯摩天41')],
 'waterproof':[('/images/cases/metrowalk-sealant-1.jpg','大江購物中心弧形玻璃立面接縫更新','/cases/metrowalk-sealant','大江購物中心'),('/images/cases/guomei-star-1.jpg','國美之星屋頂圓頂','/cases/guomei-star','國美之星'),('/images/cases/metrowalk-sealant-3.jpg','師傅掛雙繩在玻璃立面施作','/cases/metrowalk-sealant','大江購物中心')],
 'high-altitude':[('/images/case-3.jpg','師傅在玻璃帷幕外側作業',None,'玻璃帷幕外側作業'),('/images/cases/fubon-xihua-1.jpg','西華富邦玻璃帷幕上的師傅','/cases/fubon-xihua','西華富邦'),('/images/case-morten41.jpg','林口森聯摩天41外牆作業','/cases/morten41','林口森聯摩天41')],
 'special':[('/images/cases/metrowalk-sealant-1.jpg','大江購物中心玻璃立面','/cases/metrowalk-sealant','大江購物中心'),('/images/case-4.jpg','玻璃帷幕上的三位師傅',None,'玻璃帷幕作業'),('/images/cases/guomei-star-1.jpg','國美之星屋頂圓頂','/cases/guomei-star','國美之星')],
}
ART_PIC={'facade-cleaning-quote':('/images/cases/morten41-ground-glass.webp','森聯摩天41一樓玻璃立面'),'facade-repair-scope':('/images/service-repair.jpg','紅色磁磚外牆上的繩索修繕作業'),'leak-inspection-preparation':('/images/service-waterproof.jpg','師傅在玻璃屋頂上施作防水填縫')}
def strip(h2,items,hid):
    """Three photographs at three sizes, biggest picture in the widest slot so nothing is enlarged past 1.3x."""
    its=sorted(items,key=lambda i:-(dims(i[0]) or (0,0))[0])
    figs=''
    for k,(src,alt,href,cap) in zip(('a','b','c'),its):
        inner=img(src,alt)+f'<figcaption>{e(cap)}</figcaption>'
        figs+=f'<figure class="strip__{k}" data-r>'+(f'<a href="{href}">{inner}</a>' if href else inner)+'</figure>'
    return f'<section class="sec--tight" aria-labelledby="{hid}" style="padding-bottom:var(--section)"><div class="wrap"><h2 id="{hid}" class="strip__h" data-r="t">{h2}</h2><div class="grid strip">{figs}</div></div></section>'
def crumb(*parts):return '<p class="crumb">'+' ／ '.join(parts)+'</p>'

# ---------- home ----------
FEATURES=[
 ('一條繩，到得了的牆',None),
 ('整片玻璃帷幕',('/images/case-2.jpg','玻璃帷幕上垂降清洗的師傅','/images/case-4.jpg','玻璃帷幕上的三位師傅')),
 ('磁磚與石材立面',('/images/service-inspection.jpg','師傅在石材外牆上執行檢查','/images/cases/metrowalk-sealant-2.jpg','師傅沿窗框與玻璃接縫施作')),
 ('屋頂圓頂接縫',('/images/cases/guomei-star-1.jpg','國美之星屋頂圓頂','/images/cases/guomei-star-2.jpg','國美之星屋頂金屬構件接縫')),
 ('商場挑高燈箱',('/images/case-dajiang.jpg','大江購物中心挑高空間的燈箱維護','/images/cases/metrowalk-sealant-3.jpg','師傅掛雙繩在商場玻璃立面施作')),
 ('四十一層的高樓',('/images/case-morten41.jpg','林口森聯摩天41外牆作業','/images/cases/morten41-glass-cleaning.webp','森聯摩天41玻璃外側清洗')),
]
def features():
    st=''.join((f'<h2 id="f-h" class="st is-on">{t}</h2>' if i==0 else f'<p class="st">{t}</p>') for i,(t,_) in enumerate(FEATURES))
    pairs=''.join(f'<div class="pair" data-i="{i}">{img(p[0],p[1],"a")}{img(p[2],p[3],"b")}</div>' for i,(t,p) in enumerate(FEATURES) if p)
    marks='<i></i>'*len(FEATURES)
    return ('<section class="features" aria-labelledby="f-h"><div class="features__stage">'
      f'{img("/images/cases/fubon-xihua-2.jpg","師傅在西華富邦玻璃帷幕垂降清洗",cls="features__bg",lazy=True)}<div class="features__scrim"></div>'
      f'<div class="features__stack">{st}</div>{pairs}</div><div class="features__marks" aria-hidden="true">{marks}</div></section>')
HERO_EXTRA='fetchpriority="high"'
def hero():
    return ('<section class="hero" aria-label="東方繩洗"><div class="hero__stage"><div class="hero__pic"><div class="hero__zoom">'
      f'{img("/images/cases/fubon-xihua-1.jpg","西華富邦藍色玻璃帷幕上，多位師傅以繩索清洗外牆",lazy=False,extra=HERO_EXTRA)}</div></div><div class="hero__scrim"></div>'
      '</div><div class="hero__copy"><h1><span>東方繩洗</span><span>高樓外牆工程</span></h1><div class="hero__aside"><p>外牆清洗、修繕、防水與安檢。持證師傅雙繩垂降，到場評估免費。</p>'
      f'<a class="btn" href="{LINE}">LINE 預約場勘</a></div></div></section>')

HOME_DESC='東方繩洗有限公司提供外牆清洗、外牆修繕、防水、高空檢查及繩索與吊籠作業。依建築條件、外牆材質與現場問題安排施工，提供工程案例與現場評估。'
write_page('/','東方繩洗',HOME_DESC,hero()+features()+svc_list()+work()+how()+inquiry()+proof()+testimonial()+visit(),
    full_title='東方繩洗｜外牆清洗・修繕・防水・高空工程',home=True,out='index.html',og_image=BASE+'/images/logo-brand-color.png')

# ---------- services ----------
SVC_PIC={s[0]:(s[3],s[4]) for s in SVC_LIST}
for slug,name,tagline,desc,sections,img0,related in SERVICES:
    path='/services/'+slug;src,alt=SVC_PIC[slug]
    body=('<div class="page-head" style="padding-bottom:0"></div>'
      f'<section class="wrap grid split" aria-labelledby="h1"><div class="split__txt"><h1 id="h1" class="display" data-r="t">{e(name)}</h1><p class="lead" data-r>{e(tagline)}</p><p class="desc" data-r>{e(desc)}</p>{crumb(link("/services","服務"),e(name))}</div>'
      f'<div class="split__pic" data-r>{img(src,alt,lazy=False)}</div></section>')
    rows=''.join(f'<div class="grid rd__row" data-r><h2>{e(t)}</h2><p>{e(b)}</p></div>' for t,b in sections+[('詢價前準備','請提供案場名稱、地址、現況照片、欲處理的範圍及方便聯絡的時間。服務內容、工期與費用以現場評估及正式報價為準。')])
    links=f'<p data-r>延伸閱讀：'+link(related,next(a[1] for a in ARTICLES if related.endswith(a[0])))+'</p>'
    if slug=='wall-cleaning':links+='<p data-r>實際案例：'+link('/cases/morten41','森聯摩天41')+'、'+link('/cases/tonlin-taipei','台北統領百貨')+'</p><p data-r>更多案例：'+link('/cases/fubon-xihua','西華富邦')+'、'+link('/cases/lien-jade-oriental','聯聚東方')+'</p>'
    if slug=='waterproof':links+='<p data-r>實際案例：'+link('/cases/metrowalk-sealant','大江購物中心矽利康更新')+'、'+link('/cases/guomei-star','國美之星屋頂接縫防水')+'</p>'
    body+=f'<section class="sec rd" aria-label="{e(name)}說明" style="padding-top:clamp(72px,8vw,120px)"><div class="wrap">{rows}<div class="rd__links">{links}</div></div></section>'+strip('現場照片',POOL[slug],'pool-h')+cta()
    write_page(path,name+'服務',desc,body,image=src)

svc_page=(page_head('工程服務','從清洗、檢查到修繕與防水，先了解問題再安排工程。')+svc_list('六項服務與參考價格','svc-h2')+how('how-h2')+cta())
write_page('/services','工程服務','外牆清洗、修繕、安檢、防水、高空工程與特殊作業，依案場現況確認範圍與施作方式。',svc_page)

# ---------- journal ----------
for slug,title,desc,sections,service in ARTICLES:
    rows=''.join(f'<div class="grid rd__row" data-r><h2>{e(t)}</h2><p>{e(b)}</p></div>' for t,b in sections)
    links='<p data-r>相關服務：'+link(service,next(s[1] for s in SERVICES if service.endswith(s[0])))+'</p>'
    refs=''
    if slug=='leak-inspection-preparation':refs='<div class="grid rd__row refs"><h2>延伸資料</h2><p>'+link('https://twn.sika.com/zh/construction/52673.html','台灣西卡：建築防水填縫與黏結')+'。材料與接縫系統仍須依現況及產品文件確認。</p></div>'
    if slug=='facade-repair-scope':refs='<div class="grid rd__row refs"><h2>延伸資料</h2><p>'+link('https://www.sto.com/en/portfolio/facade-systems/facade-refurbishment--protection-systems-/facade-refurbishment--protection-systems.html','Sto：外牆整修與保護系統')+'。不同修繕系統的適用條件需個別評估。</p></div>'
    ap=ART_PIC[slug]
    head=('<div class="wrap page-head grid">'
      f'<h1 class="art-h1" data-r="t">{e(title)}</h1><p class="lead" data-r>{e(desc)}</p><p class="byline" data-r>東方繩洗有限公司 · 更新於 2026年9月23日</p>{crumb(link("/journal","工程筆記"),"委託前閱讀")}</div>'
      f'<div class="wrap grid"><figure class="artpic" data-r>{img(ap[0],ap[1],lazy=False)}</figure></div>')
    head=head.replace('<h1 class="art-h1"','<h1 class="art-h1" style="grid-column:1/11"',1)
    body=head+f'<article class="sec rd" style="padding-top:clamp(40px,5vw,72px)"><div class="wrap">{rows}{refs}<div class="rd__links">{links}</div></div></article>'+strip('相關現場照片',POOL[service.split('/')[-1]],'pool-h')+cta()
    write_page('/journal/'+slug,title,desc,body,'Article')
jrows=''.join(f'<a class="jrow" href="/journal/{a[0]}" data-r><div class="wrap grid"><div class="jt"><h2>{e(a[1])}</h2><p>{e(a[2])}</p></div><div class="jp" data-r>{img(ART_PIC[a[0]][0],ART_PIC[a[0]][1])}</div></div></a>' for a in ARTICLES)
write_page('/journal','工程筆記','外牆清洗比價、磁磚修繕委託與漏水場勘資料整理，協助社區與業主把工程需求說清楚。',
    page_head('工程筆記','整理社區詢價、修繕討論與場勘準備中，真正需要核對的事項。').replace('</div>',f'<div class="head-pic" data-r>{img("/images/cases/fubon-xihua-3.jpg","西華富邦建築立面繩索作業",lazy=False)}</div></div>',1)+f'<section class="sec--tight" aria-label="文章列表" style="padding-bottom:var(--section)"><div class="jlist">{jrows}</div></section>'+cta())

# ---------- cases ----------
def shots(photos):
    """Size each photograph by its native width (never past 1.3x) and place them at different sizes on the 12-column grid."""
    COLW=lambda n:92.7*n+24*(n-1)
    info=[]
    for f,alt in photos:
        src='/images/cases/'+f;w,h=dims(src) or (1200,900)
        n=max(3,max([k for k in range(3,13) if COLW(k)<=w*1.3] or [3]))
        info.append((src,alt,w,h,n))
    fig=lambda src,alt,w,h,style,cls='shot':f'<figure class="{cls}" style="{style};--w:{w}" data-r>{img(src,alt,lazy=(style.find("grid-row:1")<0))}<figcaption>{e(alt)}</figcaption></figure>'
    out=[]
    s0=info[0]
    if s0[3]>s0[2]:  # portrait first: left column, the rest stacked on the right
        n0=min(s0[4],5);out.append(fig(s0[0],s0[1],s0[2],s0[3],f'grid-column:1/span {n0};grid-row:1/span {max(1,len(info)-1)}'))
        for k,(src,alt,w,h,n) in enumerate(info[1:]):
            n=min(n,6 if k==0 else 5);col=7 if k%2==0 else 13-n
            out.append(fig(src,alt,w,h,f'grid-column:{col}/span {n};grid-row:{k+1};align-self:{"start" if k==0 else "end"}'))
    else:
        n0=min(s0[4],12);wide=n0>=9 and s0[2]>=s0[3]
        out.append(fig(s0[0],s0[1],s0[2],s0[3],f'grid-column:1/span {n0};grid-row:1','shot shot--wide' if wide else 'shot'))
        row=1;used=n0
        for k,(src,alt,w,h,n) in enumerate(info[1:],start=1):
            n=min(n,7)
            if used<=8 and 12-used>=4:
                n=min(n,12-used);out.append(fig(src,alt,w,h,f'grid-column:{13-n}/span {n};grid-row:{row};align-self:end'));used=12
            else:
                row+=1;out.append(fig(src,alt,w,h,f'grid-column:1/span {n};grid-row:{row}'));used=n
    return '<section class="sec--tight" aria-label="施工照片"><div class="wrap grid shots">'+''.join(out)+'</div></section>'
def case_page(slug,title,seo_title,desc,facts,photos,reading,related_html,image):
    fx=''.join(f'<div><dt>{e(k)}</dt><dd>{e(v)}</dd></div>' for k,v in facts)
    head=('<div class="wrap page-head grid">'
      f'<h1 class="display" data-r="t">{e(title)}</h1><p class="lead" data-r>{e(desc)}</p><dl class="facts" style="grid-column:1/-1;margin-top:40px" data-r>{fx}</dl>{crumb(link("/portfolio","施工案例"),e(title))}</div>')
    others_=[(w[2],w[1]+'施工照片','/cases/'+w[0],w[1]) for w in WORK if w[0]!=slug][:3]
    rows=''.join(f'<div class="grid rd__row" data-r><h2>{e(t)}</h2><p>{e(b)}</p></div>' for t,b in reading)
    body=head+shots(photos)+f'<section class="sec rd" aria-label="案例說明"><div class="wrap">{rows}<div class="grid rd__row"><span></span><p class="source-note" style="margin-top:0">{reading_note.get(slug,"")}</p></div><div class="rd__links">{related_html}</div></div></section>'+strip('其他案例',others_,'oth-h2')+cta()
    write_page('/cases/'+slug,seo_title,desc,body,image=image)
reading_note={}
for slug,title,loc,period,service,desc,photos,sections in CASES:
    reading_note[slug]='資料來源：東方繩洗2025年度本案成果報告。公開頁僅整理案場、工項與施工照片。'
    rel='<p>'+link('/services/wall-cleaning','了解外牆清洗服務')+' · '+link('/journal/facade-cleaning-quote','清洗報價比較重點')+'</p>'
    case_page(slug,title,title+'外牆清洗案例',desc,[('案場地區',loc),('施作工項',service),('報告記載施工期間',period)],photos,sections,rel,'/images/cases/'+photos[0][0])
FEATURED=json.loads((ROOT/'scripts/featured_cases.json').read_text())
for c in FEATURED:
    reading_note[c['slug']]='資料來源：東方繩洗案場照片。'+('資料夾紀錄日期：'+c['date']+'。' if c['date'] else '')+'照片呈現本案施作位置，實際委託範圍依個別案場確認。'
    rel='<p>'+link('/services/'+c['route'],'了解'+('外牆清洗' if c['route']=='wall-cleaning' else '防水工程')+'服務')+'</p>'
    case_page(c['slug'],c['name'],c['name']+c['service']+'案例',c['desc'],[('案場',c['location']),('施作工項',c['service'])],c['photos'],[('現場紀錄',c['desc'])],rel,'/images/cases/'+c['photos'][0][0])

# ---------- portfolio ----------
others=('<section class="others wrap" aria-labelledby="oth-h"><h2 id="oth-h" data-r="t">其他公開案例</h2>'
  '<div class="orow" data-r><h3>大江購物中心</h3><p class="meta">桃園市 · 燈箱除塵與燈管更換</p><p class="t">'+link('/services/special','了解特殊作業','link')+f'</p><figure>{img("/images/case-dajiang.jpg","大江購物中心燈箱作業")}</figure></div>'
  '<div class="orow" data-r><h3>高雄流行音樂中心</h3><p class="meta">高雄市 · 外牆清洗</p><p class="t">'+link('/services/wall-cleaning','了解外牆清洗','link')+f'</p><figure style="max-width:290px">{img("/images/case-1.jpg","高雄流行音樂中心外牆清洗")}</figure></div></section>')
others=others.replace('<h2 id="oth-h" data-r="t">','<h2 id="oth-h" style="margin-bottom:24px" data-r="t">')
write_page('/portfolio','施工案例','西華富邦、聯聚東方、大江購物中心、國美之星與森聯摩天41等案場的清洗、防水與維護照片。',
    page_head('施工案例','從現場照片、工項與施工紀錄，了解東方繩洗的實際作業。')+work('案場與工作紀錄','work-h2',more=False).replace('class="sec work"','class="sec work" style="padding-top:0"')+f'<section class="sec--tight" style="padding-top:0">{others}</section>'+cta())

# ---------- about ----------
CREED=[('安全第一','所有人員持有雙繩作業證照，嚴格遵守安全規範，保持零工安紀錄。安全不是口號，而是我們的日常。','/images/cases/metrowalk-sealant-3.jpg','師傅掛工作繩與確保繩在玻璃立面施作'),
 ('品質至上','採用純水清洗技術，搭配專業清潔藥劑，有效縮短作業工時，確保每次作業都能達到最佳清潔效果，讓客戶滿意。','/images/cases/morten41-glass-cleaning.webp','森聯摩天41玻璃外側清洗'),
 ('客戶導向','免費場勘、客製化報價、即時溝通回覆。我們以客戶需求為中心，提供最適合的服務方案。','/images/service-drone.jpg','高處外牆作業現場')]
CERTS=[('台灣雙繩技術認證','台灣雙繩技術認證合格'),('CRAA Lv.1','中華民國繩索技術協會 Level 1 認證'),('外牆檢查人員證照','建築物外牆檢查專業人員認證')]
INFO=[('公司名稱','東方繩洗有限公司'),('英文名稱','ORIENTAL CLEAN'),('統一編號','83365645'),('負責人','遲望年'),('資本額','新台幣 5,000,000 元'),('成立日期','2020 年'),('公司地址','臺北市中正區忠孝西路一段 72 號 2 樓之 5'),('聯絡電話','0980-929-106 / 0972-171-246'),('業務經理','辛俞緻')]
about=(page_head('關於東方繩洗','以安全、品質與清楚的溝通，處理高樓外牆的事。')
 +'<section class="sec--tight" aria-labelledby="ab-h" style="padding-top:0;padding-bottom:var(--section)"><div class="wrap grid about__grid"><div class="about__txt"><h2 id="ab-h" data-r="t">公司簡介</h2>'
 '<p data-r>東方繩洗有限公司成立於 2020 年，專注於高空外牆清潔、檢測、修繕與防水工程服務。我們擁有台灣雙繩技術認證及 CRAA 中華民國繩索技術協會認證，團隊成員均持有雙繩作業證照，保持零工安紀錄的優良成績。</p>'
 '<p data-r>我們深信，高空工程不僅需要技術，更需要對安全的絕對堅持。自成立以來，東方繩洗始終維持零工安事故的優良紀錄，這是我們對每一位客戶最堅實的承諾。</p>'
 '<p data-r>從台北統領百貨到高雄流行音樂中心，從社區大樓到商業建築，我們的足跡遍布全台各地。每一次作業，都是對專業的再次證明。</p></div>'
 f'<div class="about__pic" data-r>{img("/images/service-inspection.jpg","師傅在石材外牆上以繩索執行檢查")}</div></div></section>'
 +'<section class="sec--tight" aria-labelledby="cr-h" style="padding-top:0;padding-bottom:var(--section)"><div class="wrap"><h2 id="cr-h" data-r="t">經營理念</h2><div class="creed">'
 +''.join(f'<div class="grid" data-r><h3>{t}</h3><p>{d}</p><figure>{img(src,alt)}</figure></div>' for t,d,src,alt in CREED)+'</div></div></section>'
 +'<section class="sec--tight" aria-labelledby="ce-h" style="padding-top:0;padding-bottom:var(--section)"><div class="wrap"><h2 id="ce-h" data-r="t">專業認證</h2><ul class="certs">'
 +''.join(f'<li data-r><b>{t}</b><span>{d}</span></li>' for t,d in CERTS)+'</ul></div></section>'
 +'<section class="sec--tight" aria-labelledby="in-h" style="padding-top:0;padding-bottom:var(--section)"><div class="wrap"><h2 id="in-h" data-r="t">公司基本資料</h2><table class="info" data-r><tbody>'
 +''.join(f'<tr><th scope="row">{k}</th><td>{v}</td></tr>' for k,v in INFO)+'</tbody></table></div></section>'
 +'<section class="sec--tight" aria-labelledby="ci-h" style="padding-top:0;padding-bottom:var(--section)"><div class="wrap"><h2 id="ci-h" data-r="t">全台服務據點</h2><p class="cities" data-r>'+''.join(f'<span>{c}</span>' for c in CITIES)+'</p></div></section>'
 +cta())
write_page('/about','關於東方繩洗','認識東方繩洗有限公司，了解外牆清潔、檢測、修繕與高空工程服務，以及團隊的施工與服務理念。',about,full_title='關於東方繩洗｜外牆與高空工程團隊')

# ---------- testimonials ----------
REVIEWS=[('小○物','新北市永和區','東方繩洗的公司團隊非常認真專業，從企劃說明到執行，態度積極又誠懇，連洗窗的水質都特別用心再過濾，價錢物超所值。本社區經過東方繩洗團隊的協助，非常明顯的煥然一新，住戶們完全肯定他們的努力！'),
 ('Yun 先生','苗栗縣頭份市','剛開始與業務專員洽談時，業務專員很詳細的解說，對於我們的需求也提出專業的建議！當天施作清洗時，師傅們秉持著專業與仔細的清洗，而清洗過程中出現問題時，能即時的應變與積極處理到好，是值得推薦的廠商！'),
 ('陳○生','台北市中正區','師傅有繩索合格證照、做事勤快負責且價格合理，推薦～'),
 ('何○姐','台北市','從前期溝通開始廠商就很細心，中間來回確認時回覆也很迅速詳細，清潔完工的也很符合我們的要求很滿意！這次合作是很好的經驗。'),
 ('林○蓉','新竹市','很棒很專業...收費也很實在..值得推薦'),
 ('郭○美','新竹市北區','是一個好的團隊，社區會固定找他清洗。')]
tq=''.join(f'<figure class="tq2" data-r><blockquote><p>「{e(c)}」</p></blockquote><figcaption>{a}・{l}・外牆清潔</figcaption></figure>' for a,l,c in REVIEWS)
tpage=(page_head('客戶評價','PRO360 達人網 5.0 分，100 則以上評價。以下節錄自該平台。')
 +f'<section class="sec--tight" aria-labelledby="rv-h" style="padding-top:0;padding-bottom:var(--section)"><div class="wrap grid tpage"><div class="tpage__pic">{img("/images/cases/fubon-xihua-2.jpg","西華富邦玻璃立面上作業的師傅",extra="data-r")}{img("/images/cases/tonlin-rope-cleaning.webp","台北統領百貨高處外牆繩索清洗作業",extra="data-r")}{img("/images/cases/morten41-glass-cleaning.webp","森聯摩天41玻璃外側清洗",extra="data-r")}{img("/images/cases/metrowalk-sealant-1.jpg","大江購物中心玻璃立面接縫更新",extra="data-r")}</div>'
 f'<div class="tpage__list"><h2 id="rv-h" class="sr-only">六則客戶評價</h2>{tq}<p class="tpage__more" data-r><a class="btn" href="{PRO360}">到 PRO360 看全部評價</a></p></div></div></section>'+cta())
write_page('/testimonials','客戶回饋','閱讀東方繩洗客戶對外牆清潔、施工品質與服務溝通的回饋，搭配實際施工案例了解團隊。',tpage,full_title='客戶回饋｜外牆工程服務評價｜東方繩洗')

# ---------- contact ----------
cpage=(page_head('聯絡我們','外牆清洗、修繕、安檢或防水工程需求，歡迎聯絡東方繩洗。提供案場地址、現況照片與需求，方便業務協助安排評估。')
 +'<div class="cpage-photo">'+visit('visit-h','印有電話與 LINE 帳號的東方繩洗工程車')+'</div>'
 +inquiry('把案場狀況整理成一則訊息','inq-h')
 +'<section class="sec--tight" aria-labelledby="free-h" style="padding-top:0;padding-bottom:var(--section)"><div class="wrap grid free"><h2 id="free-h" data-r="t">免費場勘服務</h2><p data-r>我們提供免費現場場勘服務，由專業人員到場評估施工條件，為您制定最佳方案與精確報價。</p>'
 f'<figure class="free__a" data-r>{img("/images/service-inspection.jpg","師傅在石材外牆上以繩索執行檢查")}</figure><figure class="free__b" data-r>{img("/images/cases/metrowalk-sealant-2.jpg","師傅沿窗框與玻璃接縫施作")}</figure><figure class="free__c" data-r>{img("/images/cases/fubon-xihua-2.jpg","西華富邦玻璃立面清洗作業")}</figure></div></section>')
write_page('/contact','聯絡東方繩洗','外牆清洗、修繕、安檢或防水工程需求，歡迎聯絡東方繩洗。提供案場地址、現況照片與需求，方便業務協助安排評估。',cpage,full_title='聯絡東方繩洗｜工程諮詢與場勘洽詢')

# ---------- admin (React bundle kept for /admin only) ----------
(ROOT/'admin.html').write_text('''<!DOCTYPE html>
<html lang="zh-TW">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" sizes="48x48" href="/images/logo-cyan-bg.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex,nofollow" />
    <title>東方繩洗後台</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;600;700;900&display=swap" rel="stylesheet" />
    <script type="module" crossorigin src="/assets/index-BcuK7-8T.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-DDUQB6Q9.css">
    <link rel="stylesheet" href="/assets/polish.css">
    <script defer src="/assets/polish.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
''')
vj=json.loads((ROOT/'vercel.json').read_text())
vj['rewrites']=[{'source':'/admin','destination':'/admin.html'},{'source':'/admin/:path*','destination':'/admin.html'}]
(ROOT/'vercel.json').write_text(json.dumps(vj,ensure_ascii=False,indent=2)+'\n')
old=ROOT/'assets/content.css'
if old.exists():old.unlink()

# Update sitemap without losing prior public URLs.
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
existing=[n.text for n in ET.fromstring((ROOT/'sitemap.xml').read_text()).findall('s:url/s:loc',ns)]
urls=list(dict.fromkeys(existing+[BASE+p for p in paths]))
(ROOT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join('<url><loc>'+u+'</loc></url>\n' for u in urls)+'</urlset>\n')
print('Generated',len(paths),'pages;',len(urls),'sitemap URLs')
