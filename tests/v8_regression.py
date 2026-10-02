"""Offline functional regression; image fixtures are NOT visual brand approval.
Requires Python Playwright and Chromium. No package installation is performed. DOM tests use set_content; no remote navigation.
Run from any directory: python tests/v8_regression.py
"""
from pathlib import Path
import base64, json, shutil
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT.parent / 'test-results'
OUT.mkdir(exist_ok=True)
PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=')
def render(page, script=True):
    html = (ROOT/'v8-preview.html').read_text().replace('<link rel="stylesheet" href="/assets/v8-quality.css">', '<style>'+(ROOT/'assets/v8-quality.css').read_text()+'</style>').replace('<script defer src="/assets/v8-quality.js"></script>', '')
    page.set_content(html)
    if script:
        page.add_script_tag(content=(ROOT/'assets/v8-quality.js').read_text())
results = []
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=shutil.which('chromium'), headless=True, args=['--no-sandbox'])
        for w,h in [(320,740),(390,844),(430,932),(768,1024),(1440,900),(844,390)]:
            ctx = browser.new_context(viewport={'width':w,'height':h}, has_touch=w<821, is_mobile=w<821)
            page = ctx.new_page()
            errors, images = [], []
            page.on('pageerror', lambda error: errors.append(str(error)))
            def image_route(route):
                images.append(route.request.url)
                route.fulfill(status=200, body=PNG, content_type='image/png')
            page.route('**/images/**', image_route)
            render(page)
            page.wait_for_timeout(200)
            assert page.locator('.media img[src]').count()==0, 'case image src assigned before interaction'
            assert page.locator('h1').inner_text() == '外牆工程'
            for item in page.locator('.topbar nav button,.topbar nav a').all():
                assert item.is_visible()
                b=item.bounding_box(); assert b['height']>=44 and b['x']>=0 and b['x']+b['width']<=w+1
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), 'horizontal page overflow'
            for i in range(5):
                page.locator(f'[data-stage="{i}"]').click()
                assert page.locator('#visual').get_attribute('data-scene') == str(i)
                assert page.locator(f'[data-stage="{i}"]').get_attribute('aria-pressed') == 'true'
            page.wait_for_timeout(150)
            assert page.locator('.media img[src]').count()==1
            page.locator('#scrub').focus()
            page.keyboard.press('Home'); assert page.locator('#scrub').input_value()=='0'
            page.keyboard.press('End'); assert page.locator('#scrub').input_value()=='100'
            page.locator('[data-panel="services"]').click()
            assert page.locator('#services').evaluate('(e)=>e.open')
            for _ in range(8):
                page.keyboard.press('Tab')
                assert page.evaluate('!!document.activeElement.closest("#services")'), 'focus escaped modal'
            page.keyboard.press('Escape'); page.wait_for_timeout(200)
            assert not page.locator('#services').evaluate('(e)=>e.open')
            assert page.evaluate('document.activeElement.dataset.panel')=='services'
            page.locator('[data-panel="journal"]').click()
            assert page.locator('#journal .note-list a').count()==3
            assert all(a.get_attribute('href').startswith('/journal/') for a in page.locator('#journal .note-list a').all())
            assert page.locator('#journal time').count()==0
            page.locator('#journal .close').click(); page.wait_for_timeout(150)
            page.locator('[data-panel="projects"]').click(); page.wait_for_timeout(250)
            assert page.locator('#projects').evaluate('(e)=>e.open')
            page.locator('[data-direction="1"]').click(); page.wait_for_timeout(600)
            assert page.locator('#project-rail').evaluate('(e)=>e.scrollLeft') > 0
            page.evaluate('history.back()'); page.wait_for_timeout(200)
            assert not page.locator('#projects').evaluate('(e)=>e.open')
            page.evaluate('history.forward()'); page.wait_for_timeout(200)
            assert page.locator('#projects').evaluate('(e)=>e.open')
            page.keyboard.press('Escape'); page.wait_for_timeout(200)
            page.locator('[data-stage="0"]').click()
            page.screenshot(path=str(OUT / f'{w}x{h}-fixture.png'), full_page=True)
            assert not errors, errors
            results.append({'viewport':f'{w}x{h}','status':'passed','checks':['mobile nav','no initial case src','five stages','native range','modal focus','Esc restoration','real article hrefs','gallery','history','no pageerror']})
            ctx.close()
        # Image errors and retries use synthetic DOM events; this does not test real downloads.
        ctx=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
        page=ctx.new_page()
        def retry_route(route):
            route.fulfill(status=200 if '?retry=' in route.request.url else 404, body=PNG if '?retry=' in route.request.url else b'',content_type='image/png')
        page.route('**/images/**', retry_route)
        render(page); page.locator('[data-stage="4"]').click(); page.wait_for_timeout(200)
        page.locator('#field-photo img').evaluate("e=>e.dispatchEvent(new Event('error'))"); assert page.locator('#field-photo').get_attribute('data-state')=='error'
        page.locator('#field-photo .retry').click(); page.wait_for_timeout(200)
        assert '?retry=' in page.locator('#field-photo img').get_attribute('src'); page.locator('#field-photo img').evaluate("e=>e.dispatchEvent(new Event('load'))"); assert page.locator('#field-photo').get_attribute('data-state')=='ready'
        # Native touch: vertical range should increase rather than be processed twice.
        page.locator('[data-stage="0"]').click(); page.locator('#scrub').scroll_into_view_if_needed()
        rect=page.locator('#scrub').bounding_box(); cdp=ctx.new_cdp_session(page)
        x=rect['x']+rect['width']/2; y=rect['y']+rect['height']*.15
        cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
        cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':rect['y']+rect['height']*.7}]})
        cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        assert int(page.locator('#scrub').input_value())>50
        page.emulate_media(reduced_motion='reduce')
        page.locator('[data-panel="journal"]').click()
        assert page.locator('#journal').evaluate('(e)=>getComputedStyle(e).animationName')=='none'
        results.append({'status':'passed','checks':['synthetic image error/load + retry-src','native touch slider','reduced motion']})
        ctx.close()
        ctx=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
        page=ctx.new_page(); page.route('**/images/**',lambda r:r.fulfill(status=200,body=PNG,content_type='image/png'))
        render(page,script=False)
        assert page.locator('.fallback').is_visible()
        assert page.locator('.fallback a[href="/journal"]').is_visible()
        results.append({'status':'passed','checks':['no-JS direct content links']})
        ctx.close(); browser.close()
finally:
    (OUT/'regression.json').write_text(json.dumps({'scope':'Offline Chromium DOM tests via set_content because navigation is blocked by administrator. Synthetic image events; no real photos/logo/HTTP asset loading/Safari/performance verification.','results':results},ensure_ascii=False,indent=2))
print(json.dumps(results,ensure_ascii=False,indent=2))
