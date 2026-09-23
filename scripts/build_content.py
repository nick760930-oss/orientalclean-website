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

def link(path,label):return f'<a href="{e(path)}">{e(label)}</a>'
def section(title,body):return f'<section><h2>{e(title)}</h2><p>{e(body)}</p></section>'
NAV='<header class="site-header"><a class="brand" href="/" aria-label="東方繩洗首頁"><svg role="img" aria-label="東方繩洗 ORIENTAL CLEAN" width="190" height="68" viewBox="60 265 1130 310" preserveAspectRatio="xMidYMid meet"><image href="/images/logo-light-white-bg.png" width="1250" height="833"/></svg></a><nav aria-label="主要選單">'+''.join(link(p,t) for p,t in [('/','首頁'),('/services','工程服務'),('/portfolio','施工案例'),('/journal','工程筆記'),('/contact','聯絡我們')])+'</nav></header>'
CTA='<aside class="contact"><p class="eyebrow">TALK TO US</p><h2>先聊聊案場的狀況</h2><p>提供地址、現況照片與工程需求，方便我們協助安排評估。</p><div class="actions"><a class="button" href="https://line.me/R/ti/p/@oriental_clean">LINE 工程諮詢</a><a class="button secondary" href="tel:0972171246">辛俞緻 Viki · 0972-171-246</a></div></aside>'
FOOT='<footer><p>東方繩洗有限公司 · ORIENTAL CLEAN</p><p>'+link('/services','工程服務')+' · '+link('/portfolio','施工案例')+' · '+link('/journal','工程筆記')+' · '+link('/contact','聯絡我們')+'</p><p>orientalclean@gmail.com</p></footer>'
ORG={'@context':'https://schema.org','@type':'Organization','@id':BASE+'/#organization','name':'東方繩洗有限公司','url':BASE+'/','telephone':'+886972171246','logo':BASE+'/images/logo.jpg'}
paths=[]
def write_page(path,title,desc,body,kind='WebPage',image=None):
    schema={'@context':'https://schema.org','@type':kind,'name':title,'headline':title,'description':desc,'url':BASE+path,'inLanguage':'zh-TW','publisher':{'@id':BASE+'/#organization'}}
    if kind=='Article':schema.update(author={'@id':BASE+'/#organization'},datePublished=DATE,dateModified=DATE)
    if image:schema['image']=BASE+image
    html=f'''<!doctype html><html lang="zh-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)}｜東方繩洗</title><meta name="description" content="{e(desc)}"><link rel="canonical" href="{BASE+path}"><meta name="robots" content="index,follow"><meta property="og:type" content="{'article' if kind=='Article' else 'website'}"><meta property="og:title" content="{e(title)}｜東方繩洗"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{BASE+path}"><meta property="og:image" content="{BASE+(image or '/images/logo.jpg')}"><link rel="icon" href="/images/logo.jpg"><link rel="stylesheet" href="/assets/content.css"><script type="application/ld+json">{json.dumps(ORG,ensure_ascii=False)}</script><script type="application/ld+json">{json.dumps(schema,ensure_ascii=False)}</script></head><body><a class="skip" href="#main">跳至內容</a>{NAV}<main id="main">{body}{CTA}</main>{FOOT}</body></html>'''
    dest=ROOT/(path.lstrip('/')+'.html');dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(html);paths.append(path)
def intro(label,title,desc):return f'<div class="intro"><p class="eyebrow">{e(label)}</p><h1>{e(title)}</h1><p class="lead">{e(desc)}</p></div>'
def card(path,title,desc,image=None):return '<article class="card">'+(f'<img loading="lazy" width="1200" height="900" src="{e(image)}" alt="{e(title)}">' if image else '')+f'<h2>{link(path,title)}</h2><p>{e(desc)}</p></article>'
for slug,name,tagline,desc,sections,img,related in SERVICES:
    path='/services/'+slug
    body='<div class="crumb">'+link('/services','工程服務')+' / '+e(name)+'</div>'+intro('OUR SERVICES',name,tagline)+'<div class="reading"><p class="lead">'+e(desc)+'</p>'+''.join(section(*s) for s in sections)
    body+=section('詢價前準備','請提供案場名稱、地址、現況照片、欲處理的範圍及方便聯絡的時間。服務內容、工期與費用以現場評估及正式報價為準。')
    body+='<p class="related">延伸閱讀：'+link(related,next(a[1] for a in ARTICLES if related.endswith(a[0])))+'</p>'
    if slug=='wall-cleaning':body+='<p class="related">實際案例：'+link('/cases/morten41','森聯摩天41')+'、'+link('/cases/tonlin-taipei','台北統領百貨')+'</p>'
    body+='</div>'
    write_page(path,name+'服務',desc,body)
write_page('/services','工程服務','外牆清洗、修繕、安檢、防水、高空工程與特殊作業，依案場現況確認範圍與施作方式。',intro('OUR SERVICES','先了解問題，再安排工程。','從清洗、檢查到修繕與防水，依建物狀況討論適合的施作範圍。')+'<div class="grid">'+''.join(card('/services/'+s[0],s[1],s[2]) for s in SERVICES)+'</div>')
for slug,title,desc,sections,service in ARTICLES:
    body='<div class="crumb">'+link('/journal','工程筆記')+' / 委託前閱讀</div>'+intro('FIELD NOTES',title,desc)+'<p class="byline">東方繩洗有限公司 · 更新於 2026年9月23日</p><article class="reading">'+''.join(section(*s) for s in sections)
    body+='<p class="related">相關服務：'+link(service,next(s[1] for s in SERVICES if service.endswith(s[0])))+'</p>'
    if slug=='leak-inspection-preparation':body+='<div class="references"><h2>延伸資料</h2><p>'+link('https://twn.sika.com/zh/construction/52673.html','台灣西卡：建築防水填縫與黏結')+'。材料與接縫系統仍須依現況及產品文件確認。</p></div>'
    if slug=='facade-repair-scope':body+='<div class="references"><h2>延伸資料</h2><p>'+link('https://www.sto.com/en/portfolio/facade-systems/facade-refurbishment--protection-systems-/facade-refurbishment--protection-systems.html','Sto：外牆整修與保護系統')+'。不同修繕系統的適用條件需個別評估。</p></div>'
    body+='</article>';write_page('/journal/'+slug,title,desc,body,'Article')
write_page('/journal','工程筆記','外牆清洗比價、磁磚修繕委託與漏水場勘資料整理，協助社區與業主把工程需求說清楚。',intro('FIELD NOTES','委託之前，先把問題說清楚。','整理社區詢價、修繕討論與場勘準備中，真正需要核對的事項。')+'<div class="article-list">'+''.join(card('/journal/'+a[0],a[1],a[2]) for a in ARTICLES)+'</div>')
for slug,title,loc,period,service,desc,photos,sections in CASES:
    body='<div class="crumb">'+link('/portfolio','施工案例')+' / '+e(title)+'</div>'+intro('SELECTED WORK',title,desc)+f'<dl class="facts"><div><dt>案場地區</dt><dd>{e(loc)}</dd></div><div><dt>施作工項</dt><dd>{e(service)}</dd></div><div><dt>報告記載施工期間</dt><dd>{e(period)}</dd></div></dl>'
    body+='<div class="gallery">'+''.join(f'<figure><img src="/images/cases/{f}" alt="{e(alt)}" loading="lazy" width="{900 if f=='morten41-glass-cleaning.webp' else 1200}" height="{1200 if f=='morten41-glass-cleaning.webp' else 900}"><figcaption>{e(alt)}</figcaption></figure>' for f,alt in photos)+'</div><div class="reading">'+''.join(section(*s) for s in sections)+'<p class="source-note">資料來源：東方繩洗2025年度本案成果報告。公開頁僅整理案場、工項與施工照片。</p><p class="related">'+link('/services/wall-cleaning','了解外牆清洗服務')+' · '+link('/journal/facade-cleaning-quote','清洗報價比較重點')+'</p></div>'
    write_page('/cases/'+slug,title+'外牆清洗案例',desc,body,image='/images/cases/'+photos[0][0])
portfolio=intro('SELECTED WORK','留下每個案場的工作紀錄。','從現場照片、工項與施工紀錄，了解東方繩洗的實際作業。')+'<div class="grid">'+''.join(card('/cases/'+c[0],c[1],c[4]+' · '+c[2],'/images/cases/'+c[6][0][0]) for c in CASES)+'</div>'
portfolio+='<section class="more-cases"><h2>其他公開案例</h2><div class="grid"><article class="card"><img loading="lazy" width="1200" height="900" src="/images/case-dajiang.jpg" alt="大江購物中心燈箱作業"><h3>大江購物中心</h3><p>桃園市 · 燈箱除塵與燈管更換</p>'+link('/services/special','了解特殊作業')+'</article><article class="card"><img loading="lazy" width="1200" height="900" src="/images/case-1.jpg" alt="高雄流行音樂中心外牆清洗"><h3>高雄流行音樂中心</h3><p>高雄市 · 外牆清洗</p>'+link('/services/wall-cleaning','了解外牆清洗')+'</article></div></section>'
write_page('/portfolio','施工案例', '森聯摩天41、台北統領百貨的外牆清洗施工紀錄，以及其他公開工程案例。',portfolio)
css='''@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&display=swap');:root{--blue:#087f99;--ink:#183e4a;--line:#dce8eb;--muted:#536d77}*{box-sizing:border-box}body{margin:0;color:var(--ink);background:#fff;font-family:"Noto Sans TC",sans-serif;line-height:1.85}a{color:var(--blue);text-underline-offset:5px}a:hover{text-decoration-thickness:2px}a:focus-visible{outline:3px solid #11afca;outline-offset:5px}.site-header{max-width:1220px;margin:auto;padding:15px 32px;display:flex;align-items:center;justify-content:space-between;gap:25px;border-bottom:1px solid var(--line)}.brand img,.brand svg{width:190px;height:68px;object-fit:contain}.site-header nav{display:flex;gap:25px;flex-wrap:wrap}.site-header nav a{font-size:14px;text-decoration:none;color:var(--ink)}main{max-width:1156px;margin:auto;padding:0 32px}.intro{padding:80px 0 45px;max-width:820px}.eyebrow{font-size:12px;letter-spacing:.18em;color:var(--blue);font-weight:600}h1{font-size:clamp(30px,4vw,48px);line-height:1.4;letter-spacing:-.02em;margin:15px 0 25px;font-weight:600}h2{font-size:24px;line-height:1.5;font-weight:600;margin:0 0 17px}h3{font-size:21px;font-weight:600}.lead{font-size:18px;color:var(--muted)}p{margin:0 0 20px}.crumb{font-size:13px;padding-top:30px;color:var(--muted)}.crumb+.intro{padding-top:32px}.reading{max-width:740px;margin:0 auto}.reading section{padding:29px 0;border-bottom:1px solid var(--line)}.reading p{line-height:2.05;font-size:17px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:24px 40px}.card{padding:30px 0;border-top:1px solid var(--line)}.card h2 a{text-decoration:none}.card p{color:var(--muted)}.card img{width:100%;height:280px;object-fit:cover;margin-bottom:24px}.article-list{max-width:820px}.article-list .card{padding:32px 0}.byline{font-size:13px;color:var(--muted);margin-bottom:30px}.related{margin-top:28px}.contact{margin:70px 0 50px;padding:40px;background:#f0f8fa;border-top:3px solid var(--blue)}.actions{display:flex;gap:14px;flex-wrap:wrap}.button{padding:12px 22px;background:var(--blue);color:white;text-decoration:none;font-size:15px}.button.secondary{background:white;color:var(--blue);border:1px solid #b7dce3}.facts{display:flex;gap:40px;flex-wrap:wrap;padding:20px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin:0 0 35px}.facts dt{font-size:12px;color:var(--muted)}.facts dd{margin:5px 0;font-weight:500}.gallery{display:grid;grid-template-columns:1fr 1fr;gap:30px}.gallery figure{margin:0}.gallery figure:first-child{grid-column:1/-1}.gallery img{display:block;width:100%;height:auto;max-height:700px;object-fit:contain;background:#f5f8f9}.gallery figcaption{font-size:13px;color:var(--muted);padding:10px 0}.source-note{font-size:13px!important;color:var(--muted);margin-top:24px}.references{padding-top:30px}.references h2{font-size:18px}.references p{font-size:14px}.more-cases{margin-top:60px}footer{padding:36px 32px;text-align:center;border-top:1px solid var(--line);font-size:13px;color:var(--muted)}footer p{margin-bottom:8px}.skip{position:absolute;left:-9999px}.skip:focus{left:10px;top:10px;background:white;padding:8px;z-index:99}@media(max-width:640px){.site-header{display:block;padding:10px 20px}.brand img,.brand svg{width:160px;height:55px}.site-header nav{gap:12px;justify-content:space-between}.site-header nav a{font-size:12px}main{padding:0 22px}.intro{padding:45px 0 30px}h1{font-size:32px}h2{font-size:22px}.grid,.gallery{grid-template-columns:1fr;gap:12px}.card{padding:24px 0}.card img{height:240px}.contact{padding:26px 22px;margin-top:40px}.button{width:100%;text-align:center;padding:12px}.facts{gap:18px}.facts>div{min-width:42%}.reading p{font-size:16px}.gallery figure:first-child{grid-column:auto}}'''
(ROOT/'assets/content.css').write_text(css)
# Update sitemap without losing prior public URLs.
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
existing=[n.text for n in ET.fromstring((ROOT/'sitemap.xml').read_text()).findall('s:url/s:loc',ns)]
urls=list(dict.fromkeys(existing+[BASE+p for p in paths]))
(ROOT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join('<url><loc>'+u+'</loc></url>\n' for u in urls)+'</urlset>\n')
print('Generated',len(paths),'content pages;',len(urls),'sitemap URLs')
