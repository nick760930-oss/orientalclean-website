'use strict';
(() => {
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const screens=$$('dialog.screen');
  const motion=window.OCMotion?.($('#fabric'),$('#motion-toggle')) || {pause(){},resume(){}};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let active=null, lastTrigger=null, homeTrigger=null, readerPath='', controller=null;
  const cache=new Map();
  const allowed = /^\/(?:journal(?:\/[a-z0-9-]+)?|cases\/[a-z0-9-]+|services(?:\/[a-z0-9-]+)?|portfolio|contact)\/?$/;
  function loadImage(box) {
    if(box.dataset.requested)return;
    box.dataset.requested='true';
    const img=box.querySelector('img');
    if(!img?.dataset.src)return;
    img.onload=()=>box.classList.add('ready');
    img.onerror=()=>{box.classList.add('failed');box.querySelector('.media-status').textContent='照片暫時無法載入，仍可點選閱讀施工紀錄。'};
    img.src=img.dataset.src;
  }
  function getRoute(){
    let hash;try{hash=decodeURIComponent(location.hash.slice(1))}catch{return {id:null}}
    if(hash.startsWith('read:')&&allowed.test(hash.slice(5)))return {id:'reader',path:hash.slice(5)};
    if(screens.some(s=>s.id===hash))return {id:hash};
    return {id:null};
  }
  function navigate(hash,trigger){
    if(trigger){lastTrigger=trigger;if(!trigger.closest('dialog'))homeTrigger=trigger;}
    history.pushState({ocBrand:true},'',location.href.split('#')[0]+hash);
    sync();
  }
  function close(){
    if(history.state?.ocBrand)history.back();
    else {history.replaceState(null,'',location.href.split('#')[0]);sync()}
  }
  function sync(){
    const route=getRoute();
    if(active?.id!==route.id){
      if(active){active.close();active=null}
      if(route.id){
        active=document.getElementById(route.id);
        active.showModal();active.scrollTop=0;
        active.querySelector('.close')?.focus({preventScroll:true});
        motion.pause();
        if(route.id==='projects')active.querySelectorAll('.media').forEach(loadImage);
      }else{motion.resume();if(homeTrigger?.isConnected)homeTrigger.focus({preventScroll:true})}
    }
    if(route.id==='reader'&&route.path)read(route.path);
    else if(controller){controller.abort();controller=null}
  }
  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const panel=event.target.closest('[data-panel]');
    if(panel){event.preventDefault();navigate('#'+panel.dataset.panel,panel);return}
    const link=event.target.closest('a[data-read],#reader-body a[href]');
    if(!link)return;
    const url=new URL(link.getAttribute('href'),document.baseURI);
    if(url.origin!==new URL(document.baseURI).origin||!allowed.test(url.pathname))return;
    event.preventDefault();navigate('#read:'+url.pathname,link);
  });
  for(const screen of screens){
    screen.querySelector('.close').addEventListener('click',close);
    screen.addEventListener('cancel',event=>{event.preventDefault();close()});
    screen.addEventListener('keydown',event=>{
      if(event.key!=='Tab')return;
      const controls=[...screen.querySelectorAll('a[href],button:not([disabled]),summary,input,[tabindex="0"]')].filter(el=>el.getClientRects().length&&!el.closest('[hidden]')&&(!el.closest('details:not([open])')||el.tagName==='SUMMARY'));
      const first=controls[0],last=controls.at(-1);
      if(!first){event.preventDefault();return}
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    });
  }
  addEventListener('popstate',sync);
  addEventListener('hashchange',sync);
  const rail=$('#works');
  function gallery(direction){
    const gap=innerWidth<=760?24:42;
    rail.scrollBy({left:direction*(rail.querySelector('.work').getBoundingClientRect().width+gap),behavior:reduced.matches?'instant':'smooth'});
  }
  $$('[data-direction]').forEach(button=>button.addEventListener('click',()=>gallery(Number(button.dataset.direction))));
  rail.addEventListener('keydown',event=>{if(event.target===rail&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();gallery(event.key==='ArrowRight'?1:-1)}});
  // Only one expanded service: deliberate reading rhythm; all content stays in semantic HTML.
  $$('.service-accordion details').forEach(item=>item.addEventListener('toggle',()=>{if(item.open)$$('.service-accordion details').filter(x=>x!==item).forEach(x=>x.open=false)}));
  function cleanMain(html){
    const doc=new DOMParser().parseFromString(html,'text/html');
    const main=doc.querySelector('main');
    const heading=main?.querySelector('h1');
    if(!main||!heading)throw new Error('Unrecognized article');
    const title=heading.textContent.trim();
    main.querySelectorAll('script,style,link,iframe,object,embed,form,input,button,svg,.crumb,.intro .eyebrow').forEach(el=>el.remove());
    heading.remove();
    for(const el of main.querySelectorAll('*')){
      for(const attr of [...el.attributes]){
        if(attr.name.startsWith('on')||['style','srcdoc','id'].includes(attr.name))el.removeAttribute(attr.name);
        if(['href','src'].includes(attr.name)&&/^\s*(javascript:|data:text\/html)/i.test(attr.value))el.removeAttribute(attr.name);
      }
      if(el.tagName==='IMG'){el.loading='lazy';el.decoding='async'}
      if(el.tagName==='A'&&el.getAttribute('href')?.startsWith('https:')){el.rel='noopener noreferrer'}
    }
    return {title,body:main.innerHTML};
  }
  async function read(path,force=false){
    if(readerPath===path&&!force&&$('#reader-body').dataset.loaded==='true')return;
    controller?.abort();controller=new AbortController();
    const request=controller;
    readerPath=path;
    const title=$('#reader-title'),body=$('#reader-body'),recovery=$('#reader-recovery');
    title.textContent='讀取工程內容';body.textContent='正在讀取文章與施工紀錄。';body.dataset.loaded='false';recovery.hidden=true;
    $('#reader-direct').href=path;
    const timer=setTimeout(()=>request.abort(),12000);
    try{
      let article=cache.get(path);
      if(!article||force){
        const response=await fetch(new URL(path,document.baseURI),{signal:request.signal,credentials:'same-origin',headers:{'Accept':'text/html'}});
        if(!response.ok)throw new Error('HTTP '+response.status);
        article=cleanMain(await response.text());cache.set(path,article);
      }
      if(controller!==request||getRoute().id!=='reader')return;
      title.textContent=article.title;body.innerHTML=article.body;body.dataset.loaded='true';
      $('#reader').scrollTop=0;
    }catch(error){
      if(controller!==request||getRoute().id!=='reader')return;
      title.textContent='工程內容';body.textContent='';recovery.hidden=false;
    }finally{clearTimeout(timer)}
  }
  $('#reader-retry').addEventListener('click',()=>read(readerPath,true));
  sync();
})();
