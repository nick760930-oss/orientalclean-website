/* 迴響維度 — title, pause, boot */
(function(){
'use strict';
const {TAU,$}=G;
const menu=$('menu');

const HELP='<h3>操作</h3><table>'+
 '<tr><td>移動</td><td>WASD／方向鍵，或按住畫面</td></tr>'+
 '<tr><td>聆聽</td><td>空白鍵／「聆聽」──發出聲音，讓周圍的形狀浮現</td></tr>'+
 '<tr><td>絲線</td><td>E 或 Tab／「絲線」──看見事物之間的因果。<br>用游標或方向鍵選擇一條線；有些線可以按 Enter 牽引</td></tr>'+
 '<tr><td>互動</td><td>Enter／點擊人或物</td></tr>'+
 '<tr><td>對話</td><td>Enter、空白鍵或點擊──繼續</td></tr>'+
 '<tr><td>選單</td><td>Esc</td></tr></table>'+
 '<p style="margin-top:14px;color:var(--ink-dim)">這個世界只在聲音碰到的地方存在。建議配戴耳機。<br>進度會在場景切換與重要時刻自動保存。</p>';

function open(html){menu.innerHTML=html;menu.classList.add('show');G.overlayOpen=true;}
function close(){menu.classList.remove('show');menu.innerHTML='';G.overlayOpen=false;}
function btn(label,fn,dis){const b=document.createElement('button');b.type='button';b.textContent=label;if(dis)b.disabled=true;b.onclick=()=>{G.AU.init();fn();};return b;}

G.showTitle=function(){
  G.mode='title';G.def=null;G.pal=G.PAL.stone;G.vig=null;document.body.classList.remove('light','closed');
  G.setLoc('');$('fade').style.transition='opacity 1.2s';$('fade').style.opacity=0;
  G.AU.amb('stone');
  const save=G.readSave();
  menu.innerHTML='';const m=document.createElement('div');m.className='menu';
  m.innerHTML='<h1>迴響維度</h1><h2>因果織圖</h2>';
  if(save&&save.done){
    const p=document.createElement('p');p.style.cssText='color:var(--ink-dim);letter-spacing:.3em;font-size:13px;margin:-18px 0 22px';p.textContent='這條時間線已經執行。';m.appendChild(p);
    m.appendChild(btn('重讀介入紀錄',()=>{close();G.S=save;G.replayRecord&&G.replayRecord();}));
    m.appendChild(btn('新的旅程',()=>newGame(true)));
  }else{
    m.appendChild(btn('新的旅程',()=>newGame(!!save)));
    m.appendChild(btn('繼續',()=>continueGame(save),!save));
  }
  m.appendChild(btn('操作說明',()=>help(G.showTitle)));
  m.appendChild(btn('音效：'+(G.AU.on?'開':'關'),function(){G.AU.setOn(!G.AU.on);G.showTitle();}));
  const f=document.createElement('div');f.className='foot';f.innerHTML='一名蒙眼的修復者，以聲音與因果絲線走過世界。<br>建議配戴耳機。';m.appendChild(f);
  menu.appendChild(m);menu.classList.add('show');G.overlayOpen=true;
  setTimeout(()=>{const b=m.querySelector('button:not(:disabled)');b&&b.focus();},50);
};
function help(back){
  open('<div class="panel">'+HELP+'<div class="row"><button type="button" id="hb">返回</button></div></div>');
  $('hb').onclick=()=>{close();back();};$('hb').focus();
}
async function newGame(confirmFirst){
  if(confirmFirst){close();const ok=await G.confirm('開始新的旅程？','目前的進度會被覆蓋。','開始','取消');if(!ok){G.showTitle();return;}}
  close();G.S=G.freshState();G.clearSave();G.mode='play';G.closed=false;
  $('fade').style.transition='none';$('fade').style.opacity=1;
  await G.gotoScene('pro_chamber',275,330,{instant:true});
}
async function continueGame(save){
  if(!save)return;close();G.S=save;G.mode='play';G.closed=false;
  if(!G.scenes[save.scene]){save.scene='pro_chamber';save.x=275;save.y=392;}
  await G.gotoScene(save.scene,save.x,save.y);
}
G.pause=function(){
  if(G.mode!=='play'||G.overlayOpen)return;
  const m=document.createElement('div');m.className='menu';
  m.appendChild(btn('繼續',close));
  m.appendChild(btn('音效：'+(G.AU.on?'開':'關'),()=>{G.AU.setOn(!G.AU.on);close();G.pause();}));
  const sp={22:'慢',34:'中',60:'快'};
  m.appendChild(btn('文字速度：'+(sp[G.textSpeed]||'中'),()=>{G.textSpeed=G.textSpeed===22?34:G.textSpeed===34?60:22;try{localStorage.setItem('echo-speed',G.textSpeed);}catch(e){}close();G.pause();}));
  m.appendChild(btn('操作說明',()=>help(G.pause)));
  m.appendChild(btn('保存並回到標題',()=>{if(G.script===0)G.save();close();location.reload();}));
  menu.innerHTML='';menu.appendChild(m);menu.classList.add('show');G.overlayOpen=true;
  setTimeout(()=>{m.querySelector('button').focus();},30);
};
addEventListener('keydown',e=>{if(e.code==='Escape'&&menu.classList.contains('show')&&G.mode!=='title'){close();}});
try{const s=+localStorage.getItem('echo-speed');if(s)G.textSpeed=s;}catch(e){}

/* title animation: threads drifting over the dark, echoes from the centre */
let tp=[],tT=0;
G.titleUpdate=function(dt){tT+=dt;if(Math.random()<dt*0.5)tp.push({r:0,a:0.35});tp.forEach(p=>{p.r+=dt*120;p.a-=dt*0.05;});tp=tp.filter(p=>p.a>0);};
G.titleDraw=function(ctx){
  const W=G.W,H=G.H,cx=W/2,cy=H*0.46;
  ctx.lineWidth=1;
  for(const p of tp){ctx.strokeStyle='rgba(255,255,255,'+p.a*0.35+')';ctx.beginPath();ctx.arc(cx,cy,p.r,0,TAU);ctx.stroke();}
  ctx.globalCompositeOperation='lighter';
  for(let i=0;i<9;i++){
    const y0=H*(0.12+i*0.1),y1=H*(0.9-i*0.08),ph=tT*0.18+i*1.3;
    ctx.beginPath();ctx.moveTo(-20,y0);
    ctx.bezierCurveTo(W*0.3,y0+Math.sin(ph)*H*0.2,W*0.6,y1+Math.cos(ph*1.2)*H*0.2,W+20,y1);
    const a=0.05+0.05*Math.sin(ph*0.7);ctx.strokeStyle='rgba(236,200,128,'+a+')';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='rgba(236,200,128,'+(a*2.2)+')';ctx.lineWidth=1;ctx.stroke();
  }
  ctx.globalCompositeOperation='source-over';
};

/* boot */
function boot(){
  const q=new URLSearchParams(location.search);
  if(q.get('auto')==='1'){G.auto=true;}
  G.showTitle();
}
if(document.readyState==='complete')boot();else addEventListener('load',boot);
})();
