/* 迴響維度：因果織圖 — engine
 * The world is drawn only where sound has touched it. Kaila is blindfolded;
 * what the player sees is what her echoes return, plus the causal threads. */
(function(){
'use strict';
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const hyp=Math.hypot;
function mkRng(seed){let s=(seed>>>0)||7;return function(){s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function hashStr(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h;}
const $=id=>document.getElementById(id);

const G=window.G={
  TAU,clamp,lerp,hyp,mkRng,hashStr,$,
  W:0,H:0,dpr:1,zoom:1,t:0,
  cam:{x:0,y:0},scenes:{},def:null,sceneId:null,pal:null,
  segs:[],ents:[],threads:[],exits:[],circles:[],entById:{},
  pulses:[],rings:[],
  player:{x:0,y:0,vx:0,vy:0,r:9,hair:[],moving:false,step:0,kneel:0,hidden:false,alpha:1},
  mode:'title',script:0,dlg:null,walk:null,target:null,carry:null,
  keys:{},pointer:{x:0,y:0,has:false,down:false},hold:false,
  proxR:74,textSpeed:34,auto:false,noSave:false
};

/* ---------------- palettes ---------------- */
const PAL=G.PAL={
  stone:{bg:'#09090b',line:'226,222,212',acc:'255,255,255',warm:'214,190,150',dim:'112,110,106',th:'236,200,128',glow:1,tau:2.8},
  past:{bg:'#120c06',line:'226,194,146',acc:'255,238,204',warm:'246,170,96',dim:'128,104,72',th:'255,214,140',glow:1,tau:3.4,pitch:0.84},
  lim:{bg:'#050e09',line:'140,212,160',acc:'214,244,206',warm:'226,164,86',dim:'62,102,76',th:'240,206,120',glow:1,tau:2.4},
  future:{bg:'#0a0a0f',line:'152,148,174',acc:'214,210,234',warm:'176,156,196',dim:'78,74,96',th:'222,204,164',glow:1,tau:1.5,pitch:0.7,pspd:300},
  cam:{bg:'#100b05',line:'232,192,122',acc:'255,234,180',warm:'255,138,78',dim:'122,98,62',th:'250,214,130',glow:1,tau:2.4,pitch:1.12},
  inan:{bg:'#030812',line:'122,170,232',acc:'198,224,255',warm:'255,198,124',dim:'48,74,118',th:'240,210,140',glow:1,tau:2.9,pspd:250,stepF:260,pitch:0.9},
  elba:{bg:'#f0eee7',line:'40,40,46',acc:'0,0,0',warm:'164,118,30',dim:'150,148,140',th:'170,122,28',glow:0,tau:3.4,light:1,pitch:1.25,stepF:1800,stepVol:0.5},
  elbaPast:{bg:'#ece2cf',line:'78,58,34',acc:'40,26,10',warm:'168,110,30',dim:'150,130,100',th:'150,100,20',glow:0,tau:3.6,light:1,pitch:1.05},
  har:{bg:'#100505',line:'228,134,94',acc:'255,208,170',warm:'255,88,62',dim:'112,56,44',th:'246,204,120',glow:1,tau:2.0,stepF:900,pitch:0.95},
  axis:{bg:'#060608',line:'232,232,244',acc:'255,255,255',warm:'255,210,150',dim:'92,92,112',th:'246,214,140',glow:1,tau:4.2,pitch:0.75}
};
G.pal=PAL.stone;

/* ---------------- state & save ---------------- */
const SAVE_KEY='echo-dimension-save-v1';
G.freshState=function(){return{v:1,chapter:0,scene:'pro_chamber',x:270,y:392,f:{},lim:{},cam:{},inan:{},elba:{},har:{},axis:{},
  log:{moves:0,listens:0,threads:0,skips:0,locked:{},decisions:[],refusals:[],started:Date.now()},done:false,ending:null};};
G.S=G.freshState();
G.F=k=>!!G.S.f[k];
G.set=(k,v)=>{G.S.f[k]=(v===undefined)?true:v;};
G.save=function(){
  if(G.noSave||!G.sceneId) return;
  try{const P=G.player;G.S.scene=G.sceneId;G.S.x=Math.round(P.x);G.S.y=Math.round(P.y);localStorage.setItem(SAVE_KEY,JSON.stringify(G.S));}catch(e){}
};
G.readSave=function(){try{const s=localStorage.getItem(SAVE_KEY);return s?JSON.parse(s):null;}catch(e){return null;}};
G.clearSave=function(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}};

/* ---------------- audio ---------------- */
const AMB={
  stone:{vol:0.05,osc:[{f:55,v:0.6,lfo:0.07},{f:82.4,v:0.3,d:4},{f:164.8,v:0.07,lfo:0.13}]},
  lim:{vol:0.045,osc:[{f:110,t:'triangle',lp:500,v:0.5,lfo:0.05},{f:164.8,t:'triangle',lp:600,v:0.3,d:-6},{f:329.6,v:0.05,lfo:0.2}],noise:{lp:900,v:0.07}},
  future:{vol:0.05,osc:[{f:41,v:0.7},{f:1760,v:0.015,lfo:0.3}]},
  past:{vol:0.04,osc:[{f:130.8,t:'triangle',lp:700,v:0.4,lfo:0.1},{f:196,t:'triangle',lp:800,v:0.25}],noise:{lp:1500,v:0.05}},
  camFrozen:{vol:0.045,osc:[{f:196,v:0.4},{f:392.5,v:0.1,lfo:0.02},{f:587.3,v:0.035}]},
  cam:{vol:0.035,osc:[{f:98,t:'triangle',lp:400,v:0.4,lfo:0.06}],noise:{lp:1400,v:0.1}},
  inan:{vol:0.05,osc:[{f:49,v:0.6,lfo:0.03},{f:73.4,v:0.18}],noise:{lp:170,v:0.35}},
  elba:{vol:0.02,osc:[{f:880,v:0.18,lfo:0.05},{f:1318.5,v:0.1,lfo:0.07},{f:220,v:0.22}]},
  har:{vol:0.04,osc:[{f:73.4,t:'sawtooth',lp:260,v:0.5},{f:110,t:'square',lp:200,v:0.1,lfo:0.8}],noise:{lp:400,v:0.12}},
  axis:{vol:0.045,osc:[{f:110,v:0.4,lfo:0.04},{f:164.8,v:0.25,lfo:0.05},{f:220,v:0.16,lfo:0.06},{f:277.2,v:0.09,lfo:0.03}]},
  silence:{vol:0.0001,osc:[]}
};
const AU=G.AU={ctx:null,on:true,vol:0.8,ambNodes:null,ambName:null,want:null,
  init(){
    if(this.ctx){if(this.ctx.state==='suspended')this.ctx.resume();return;}
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    try{this.ctx=new C();}catch(e){return;}
    const c=this.ctx;
    this.master=c.createGain();this.master.gain.value=this.on?this.vol:0;this.master.connect(c.destination);
    this.comp=c.createDynamicsCompressor();this.comp.connect(this.master);
    const len=Math.floor(c.sampleRate*2.8),buf=c.createBuffer(2,len,c.sampleRate);
    for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.2);}
    this.verb=c.createConvolver();this.verb.buffer=buf;const wet=c.createGain();wet.gain.value=0.55;this.verb.connect(wet);wet.connect(this.comp);
    this.dry=c.createGain();this.dry.connect(this.comp);
    this.ambBus=c.createGain();this.ambBus.gain.value=0.9;this.ambBus.connect(this.comp);
    if(this.want)this.amb(this.want,true);
  },
  setOn(v){this.on=v;if(this.master)this.master.gain.setTargetAtTime(v?this.vol:0,this.ctx.currentTime,0.1);try{localStorage.setItem('echo-sound',v?'1':'0');}catch(e){}},
  tone(f,dur,vol,o){
    o=o||{};const c=this.ctx;if(!c||!this.on)return;
    const t=c.currentTime+(o.delay||0);
    const osc=c.createOscillator();osc.type=o.type||'sine';osc.frequency.setValueAtTime(f,t);
    if(o.slide)osc.frequency.exponentialRampToValueAtTime(o.slide,t+dur);
    const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+(o.att||0.008));g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    let node=osc;if(o.lp){const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=o.lp;osc.connect(fl);node=fl;}
    node.connect(g);let out=g;
    if(o.pan!=null&&c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=clamp(o.pan,-1,1);g.connect(p);out=p;}
    out.connect(this.dry);
    if(o.wet!==0){const s=c.createGain();s.gain.value=o.wet==null?0.6:o.wet;out.connect(s);s.connect(this.verb);}
    osc.start(t);osc.stop(t+dur+0.05);
  },
  noise(dur,vol,o){
    o=o||{};const c=this.ctx;if(!c||!this.on)return;
    const t=c.currentTime+(o.delay||0);
    const len=Math.max(1,Math.floor(c.sampleRate*dur)),b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
    const src=c.createBufferSource();src.buffer=b;
    const fl=c.createBiquadFilter();fl.type=o.type||'bandpass';fl.frequency.value=o.f||1200;fl.Q.value=o.q||0.8;
    const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+(o.att||0.004));g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    src.connect(fl);fl.connect(g);let out=g;
    if(o.pan!=null&&c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=clamp(o.pan,-1,1);g.connect(p);out=p;}
    out.connect(this.dry);
    if(o.wet){const s=c.createGain();s.gain.value=o.wet;out.connect(s);s.connect(this.verb);}
    src.start(t);src.stop(t+dur+0.05);
  },
  step(){const p=G.pal;this.noise(0.07,0.045*(p.stepVol||1),{f:p.stepF||520,q:1.2});},
  listen(){const b=G.pal.pitch||1;this.tone(660*b,1.7,0.075,{wet:0.95});this.tone(990*b,1.3,0.03,{delay:0.03,wet:0.95});},
  talk(pan){this.tone(280+Math.random()*140,0.07,0.016,{type:'triangle',lp:900,pan,wet:0.25});},
  voice(){this.tone(1480,0.05,0.016,{type:'square',lp:2600,wet:0.1});this.tone(740,0.12,0.012,{delay:0.05,type:'sine',wet:0.1});},
  thread(on){if(on){this.tone(1760,0.9,0.028,{wet:1});this.tone(2637,0.7,0.014,{delay:0.08,wet:1});}else this.tone(880,0.4,0.02,{wet:0.8});},
  tink(){this.tone(3136,0.3,0.035,{wet:0.8});this.tone(4699,0.2,0.012,{delay:0.02,wet:0.8});},
  crack(){this.noise(0.2,0.08,{f:3200,q:0.6,wet:0.5});this.tone(210,0.35,0.05,{type:'sawtooth',lp:600,slide:60});},
  rift(){this.tone(220,1.8,0.06,{slide:880,wet:1});this.tone(330,1.6,0.035,{slide:110,wet:1,delay:0.1});},
  bell(f,vol){f=f||196;vol=vol||0.12;[1,2.01,2.76,4.07,5.4].forEach((m,i)=>this.tone(f*m,4.2-i*0.6,vol/(i+1),{wet:0.9}));},
  creak(pan){this.tone(80+Math.random()*60,0.5,0.026,{type:'sawtooth',lp:380,slide:60+Math.random()*40,pan,wet:0.5});},
  clank(pan){this.noise(0.12,0.05,{f:900,q:3,pan,wet:0.4});this.tone(110,0.2,0.03,{type:'square',lp:500,pan,wet:0.2});},
  page(){this.noise(0.25,0.022,{f:4200,q:0.5,wet:0.3});},
  cut(){this.noise(0.1,0.09,{f:5200,q:0.4,wet:0.7});this.tone(1200,0.45,0.045,{slide:280,wet:0.8});},
  drop(){this.tone(150,0.3,0.06,{type:'triangle',lp:400,slide:70,wet:0.4});},
  amb(name,force){
    this.want=name;if(!this.ctx)return;if(this.ambName===name&&!force)return;
    const c=this.ctx,t=c.currentTime;
    if(this.ambNodes){const old=this.ambNodes;old.g.gain.setTargetAtTime(0.0001,t,0.7);setTimeout(()=>{old.src.forEach(s=>{try{s.stop();}catch(e){}});try{old.g.disconnect();}catch(e){}},4500);}
    this.ambName=name;this.ambNodes=null;const def=AMB[name];if(!def)return;
    const g=c.createGain();g.gain.value=0.0001;g.connect(this.ambBus);g.gain.setTargetAtTime(def.vol||0.05,t,1.4);
    const src=[];
    (def.osc||[]).forEach(o=>{
      const osc=c.createOscillator();osc.type=o.t||'sine';osc.frequency.value=o.f;if(o.d)osc.detune.value=o.d;
      const og=c.createGain();og.gain.value=o.v||0.5;let node=osc;
      if(o.lp){const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=o.lp;osc.connect(fl);node=fl;}
      if(o.lfo){const l=c.createOscillator();l.frequency.value=o.lfo;const lg=c.createGain();lg.gain.value=(o.v||0.5)*0.6;l.connect(lg);lg.connect(og.gain);l.start();src.push(l);}
      node.connect(og);og.connect(g);osc.start();src.push(osc);
    });
    if(def.noise){
      const len=c.sampleRate*3,b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
      const s=c.createBufferSource();s.buffer=b;s.loop=true;const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=def.noise.lp||300;
      const ng=c.createGain();ng.gain.value=def.noise.v||0.2;s.connect(fl);fl.connect(ng);ng.connect(g);s.start();src.push(s);
    }
    this.ambNodes={g,src};
  }
};
window.AU=AU;
try{if(localStorage.getItem('echo-sound')==='0')AU.on=false;}catch(e){}

/* ---------------- scene builder ---------------- */
class Builder{
  constructor(def){this.def=def;this.segs=[];this.ents=[];this.threads=[];this.exits=[];this.circles=[];this.r=mkRng(hashStr(def.id));}
  rnd(a,b){return a+(b-a)*this.r();}
  seg(x1,y1,x2,y2,o){
    o=o||{};const pad=2;
    const s={x1,y1,x2,y2,mx:(x1+x2)/2,my:(y1+y2)/2,hl:hyp(x2-x1,y2-y1)/2,lit:0,solid:!!o.solid,col:o.col||'line',base:o.base||0,
      a:o.a==null?1:o.a,echo:o.echo!==false,w:o.w||1,tag:o.tag||null,
      minx:Math.min(x1,x2)-pad,maxx:Math.max(x1,x2)+pad,miny:Math.min(y1,y2)-pad,maxy:Math.max(y1,y2)+pad};
    this.segs.push(s);return s;
  }
  wall(x1,y1,x2,y2,o){return this.seg(x1,y1,x2,y2,Object.assign({solid:true},o));}
  path(pts,o,closed){for(let i=0;i<pts.length-1;i++)this.seg(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],o);if(closed&&pts.length>2)this.seg(pts[pts.length-1][0],pts[pts.length-1][1],pts[0][0],pts[0][1],o);}
  poly(pts,o){this.path(pts,o,true);}
  rect(x,y,w,h,o){this.poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],o);}
  circ(x,y,r,o){
    o=o||{};const n=o.n||Math.max(8,Math.round(r/4.5)),pts=[],j=o.jit||0,a0=o.a0||0;
    for(let i=0;i<n;i++){const a=a0+i/n*TAU,rr=r*(1+(j?(this.r()-0.5)*j:0));pts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]);}
    this.path(pts,Object.assign({},o,{solid:false}),true);
    if(o.solid)this.circles.push({x,y,r:o.cr||r});
  }
  arc(x,y,r,a0,a1,o){const n=Math.max(3,Math.round(Math.abs(a1-a0)*r/10)),pts=[];for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;pts.push([x+Math.cos(a)*r,y+Math.sin(a)*r]);}this.path(pts,o);}
  solidCircle(x,y,r){this.circles.push({x,y,r});}
  border(o){const w=this.def.w,h=this.def.h;this.rect(1,1,w-2,h-2,Object.assign({solid:true,col:'dim'},o));}
  ent(o){const e=Object.assign({x:0,y:0,r:46,lit:0,base:0,solid:0,lr:22,label:'',t:Math.random()*10,pt:Math.random()},o);this.ents.push(e);return e;}
  thread(o){this.threads.push(o);return o;}
  exit(x,y,w,h,to,tx,ty,o){this.exits.push(Object.assign({x,y,w,h,to,tx,ty},o));}
}
G.Builder=Builder;
G.defScene=function(id,def){def.id=id;G.scenes[id]=def;};

/* ---------------- scene management ---------------- */
G.ent=id=>G.entById[id];
G.active=e=>!e.cond||e.cond();
G.usable=e=>!!e.use&&G.active(e)&&(!e.useCond||e.useCond());
G.loadScene=function(id,x,y){
  const def=G.scenes[id];if(!def)throw new Error('missing scene '+id);
  const prevPal=G.pal;
  G.def=def;G.sceneId=id;G.pal=PAL[typeof def.pal==='function'?def.pal():def.pal]||PAL.stone;
  const B=new Builder(def);def.build(B,G);
  G.segs=B.segs;G.ents=B.ents;G.threads=B.threads;G.exits=B.exits;G.circles=B.circles;
  G.pulses=[];G.rings=[];G.entById={};for(const e of G.ents)if(e.id)G.entById[e.id]=e;
  const P=G.player;P.x=x;P.y=y;P.vx=P.vy=0;P.kneel=0;P.hidden=false;P.alpha=1;initHair();
  G.target=null;G.walk=null;G.near=null;G.proxR=def.prox||74;
  G.cam.x=x;G.cam.y=y;clampCam(true);
  document.body.classList.toggle('light',!!G.pal.light);
  if(prevPal!==G.pal)G.vig=null;
  AU.amb((typeof def.ambient==='function'?def.ambient():def.ambient)||'stone');
  G.setLoc(def.name?(G.chapterName()+(def.name?'　·　'+def.name:'')):'');
  if(def.load)def.load();
};
G.rebuild=function(){
  const keep={};for(const e of G.ents)if(e.id)keep[e.id]=e.lit;
  const segLit=G.segs.map(s=>s.lit);
  const def=G.def,B=new Builder(def);def.build(B,G);
  G.segs=B.segs;G.ents=B.ents;G.threads=B.threads;G.exits=B.exits;G.circles=B.circles;G.entById={};
  for(const e of G.ents){if(e.id){G.entById[e.id]=e;if(keep[e.id]!=null)e.lit=keep[e.id];}}
  if(segLit.length===G.segs.length)G.segs.forEach((s,i)=>s.lit=segLit[i]);
};
G.chapterName=function(){return['序章','第一章','第二章','第三章','第四章','第五章','終章'][G.S.chapter]||'';};
G.setLoc=function(t){const el=$('loc');el.textContent=t||'';el.classList.toggle('show',!!t);};
G.gotoScene=async function(id,x,y,o){
  o=o||{};
  if(!o.instant)await G.fade(1,o.fade||0.45,o.color);
  G.loadScene(id,x,y);
  const first=!G.F('v:'+id);G.set('v:'+id);
  G.save();
  if(!o.instant)G.fade(0,o.fadeIn||0.7);
  if(G.def.enter)await G.run(()=>G.def.enter(first));
};
G.riftTo=async function(id,x,y){
  const P=G.player;G.ripple={t:0,x:P.x,y:P.y-14};AU.rift();
  G.lockMove=true;await G.wait(0.55);
  await G.fade(1,0.35,G.pal.light?'#fff':'#e8e2d4');
  G.ripple=null;G.lockMove=false;
  G.loadScene(id,x,y);G.set('v:'+id);G.save();
  G.pulse(x,y-10,{max:520,str:1});
  G.fade(0,0.9);
  if(G.def.enter)await G.def.enter(false);
};

/* ---------------- player ---------------- */
function initHair(){const P=G.player;P.hair=[];for(let s=0;s<7;s++){const pts=[];for(let i=0;i<8;i++)pts.push({x:P.x,y:P.y-22+i*3});P.hair.push({off:(s-3)*1.35,pts});}}
function updHair(dt){
  const P=G.player,hx=P.x,hy=P.y-24-(P.kneel?(-7*P.kneel):0);
  const k=Math.min(1,dt*16);
  for(const st of P.hair){const p=st.pts;p[0].x=hx+st.off*0.9;p[0].y=hy-3.5;
    for(let i=1;i<p.length;i++){
      const sway=Math.sin(G.t*1.1+i*0.7+st.off)*0.35;
      const tx=p[i-1].x-P.vx*0.0065*(1+i*0.25)+sway+st.off*0.08,ty=p[i-1].y+3.1-P.vy*0.005;
      p[i].x+=(tx-p[i].x)*k;p[i].y+=(ty-p[i].y)*k;}}
}

/* ---------------- pulses (echoes) ---------------- */
G.pulse=function(x,y,o){
  o=o||{};const p=G.pal;
  G.pulses.push({x,y,r:0,pr:0,max:o.max||300,spd:o.spd||p.pspd||360,str:o.str==null?1:o.str,ring:o.ring==null?0.22:o.ring,col:o.col||'acc',kaila:!!o.kaila,freeze:o.freeze});
};
G.listen=function(){
  const P=G.player;if(G.listenCd>0)return;G.listenCd=0.7;
  G.S.log.listens++;AU.listen();
  G.pulse(P.x,P.y-10,{max:G.def&&G.def.listenMax||560,str:1,ring:0.35,kaila:true,spd:(G.pal.pspd||360)*1.05});
  if(G.def&&G.def.onListen)G.def.onListen();
};
function updPulses(dt){
  const segs=G.segs,ents=G.ents,stasis=G.def&&G.def.stasis&&G.def.stasis();
  for(let i=G.pulses.length-1;i>=0;i--){
    const p=G.pulses[i];p.pr=p.r;p.r+=p.spd*dt;
    const lo=p.pr-6,hi=p.r+6,k=p.str*(1-0.6*Math.min(1,p.r/p.max));
    for(let j=0;j<segs.length;j++){const s=segs[j];if(!s.echo)continue;const d=hyp(s.mx-p.x,s.my-p.y);if(d+s.hl>=lo&&d-s.hl<=hi&&k>s.lit)s.lit=k;}
    for(let j=0;j<ents.length;j++){const e=ents[j];const d=hyp(e.x-p.x,e.y-p.y);if(d+e.lr>=lo&&d-e.lr<=hi&&k>e.lit)e.lit=k;}
    const fr=p.freeze||(stasis&&p.kaila?260:0);
    if(fr&&p.r>=fr){G.rings.push({x:p.x,y:p.y,r:p.r,a:p.ring*1.4,t:0});G.pulses.splice(i,1);continue;}
    if(p.r>=p.max)G.pulses.splice(i,1);
  }
  for(let i=G.rings.length-1;i>=0;i--){const r=G.rings[i];r.t+=dt;if(r.t>30)G.rings.splice(i,1);}
  const tau=stasis?45:(G.pal.tau||2.4),f=Math.exp(-dt/tau);
  for(let j=0;j<segs.length;j++)segs[j].lit*=f;
  for(let j=0;j<ents.length;j++){const e=ents[j];e.lit*=e.tau?Math.exp(-dt/e.tau):f;}
}

/* ---------------- collision ---------------- */
function collide(x,y,r){
  const segs=G.segs;
  for(let it=0;it<3;it++){
    for(let j=0;j<segs.length;j++){const s=segs[j];if(!s.solid)continue;
      if(x+r<s.minx||x-r>s.maxx||y+r<s.miny||y-r>s.maxy)continue;
      const dx=s.x2-s.x1,dy=s.y2-s.y1,L=dx*dx+dy*dy;let t=L?((x-s.x1)*dx+(y-s.y1)*dy)/L:0;t=clamp(t,0,1);
      const px=s.x1+dx*t,py=s.y1+dy*t,ex=x-px,ey=y-py,d=hyp(ex,ey);
      if(d<r){if(d>1e-4){x=px+ex/d*r;y=py+ey/d*r;}else{const l=Math.sqrt(L)||1;x+=-dy/l*r;y+=dx/l*r;}}}
    for(const c of G.circles){const dx=x-c.x,dy=y-c.y,d=hyp(dx,dy),m=r+c.r;if(d<m){if(d>1e-3){x=c.x+dx/d*m;y=c.y+dy/d*m;}else x+=m;}}
    for(const e of G.ents){if(!e.solid||!G.active(e))continue;const sr=e.solid===true?14:e.solid,dx=x-e.x,dy=y-(e.sy!=null?e.sy:e.y),d=hyp(dx,dy),m=r+sr;
      if(d<m){if(d>1e-3){x=e.x+dx/d*m;y=(e.sy!=null?e.sy:e.y)+dy/d*m;}else x+=m;}}
  }
  const d=G.def;x=clamp(x,r,d.w-r);y=clamp(y,r,d.h-r);
  return{x,y};
}
G.collide=collide;

/* ---------------- input ---------------- */
const MOVE={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],KeyW:[0,-1],KeyS:[0,1],KeyA:[-1,0],KeyD:[1,0]};
G.MOVE=MOVE;
function anyMoveHeld(){for(const k in MOVE)if(G.keys[k])return true;return false;}
function intent(kind){
  // Every attempt to steer Kaila is recorded; the log is read back at the Axis.
  if(G.closed){G.reject();return false;}
  if(G.griefKey){G.S.log.locked[G.griefKey]=(G.S.log.locked[G.griefKey]||0)+1;return false;}
  if(kind==='move'&&G.mode==='play'&&G.script===0)G.S.log.moves++;
  return true;
}
G.reject=function(){
  const box=$('rej');const d=document.createElement('div');
  const n=(G.S.axis.rejected=(G.S.axis.rejected||0)+1);
  d.textContent='介入請求 #'+String(n).padStart(3,'0')+'：拒絕（通道已關閉）';box.appendChild(d);
  while(box.children.length>6)box.removeChild(box.firstChild);
  setTimeout(()=>{d.style.opacity='0';},1600);setTimeout(()=>{d.remove();},4200);
  AU.tone(160,0.18,0.03,{type:'square',lp:500,wet:0.1});
};
addEventListener('keydown',e=>{
  AU.init();const k=e.code;
  if(['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(k))e.preventDefault();
  if(G.watchKey&&!G.dlg&&!e.repeat&&!G.closed)G.S.axis[G.watchKey]=(G.S.axis[G.watchKey]||0)+1;
  if(MOVE[k]){if(!e.repeat&&!anyMoveHeld())intent('move');G.keys[k]=true;}
  if(e.repeat)return;
  onKey(k,e);
});
addEventListener('keyup',e=>{G.keys[e.code]=false;});
addEventListener('blur',()=>{G.keys={};G.hold=false;});
function onKey(k){
  if(G.overlayOpen)return;
  if(G.closed){if(!MOVE[k])G.reject();return;}
  if(G.dlg){if(k==='Enter'||k==='Space'||k==='KeyZ'||k==='KeyF'||k==='NumpadEnter'){G.advance();}return;}
  if(G.griefKey)return;
  if(G.mode==='play'){
    if(k==='Escape'){G.pause&&G.pause();return;}
    if(G.script>0&&!G.allowMove)return;
    if(k==='Space')G.listen();
    else if(k==='KeyE'||k==='Tab')G.enterThreads();
    else if(k==='Enter'||k==='KeyF'||k==='KeyZ'||k==='NumpadEnter'){if(G.near&&G.usable(G.near))G.use(G.near);}
  }else if(G.mode==='threads'){
    if(k==='KeyE'||k==='Escape')G.exitThreads();
    else if(k==='Tab'||k==='ArrowRight'||k==='ArrowDown')cycleThread(1);
    else if(k==='ArrowLeft'||k==='ArrowUp')cycleThread(-1);
    else if(k==='Enter'||k==='Space'||k==='KeyF'){const th=G.visThreads[G.tsel];if(th&&th.act&&G.threadUsable(th))G.pullThread(th);}
  }else if(G.mode==='knot'){
    const K=G.knotState;if(!K)return;
    if(k==='ArrowRight'||k==='ArrowDown'||k==='Tab'){K.sel=(K.sel+1)%K.opts.length;K.hover=K.sel;showKnotInfo();}
    else if(k==='ArrowLeft'||k==='ArrowUp'){K.sel=(K.sel-1+K.opts.length)%K.opts.length;K.hover=K.sel;showKnotInfo();}
    else if(k==='Enter'||k==='Space'||k==='KeyF'){pickKnot(K.sel);}
    else if(k==='Escape'&&K.back){pickKnot(K.opts.length-1);}
  }
}
function setPtr(e){G.pointer.x=e.clientX;G.pointer.y=e.clientY;G.pointer.has=true;}
const cv=$('cv');
cv.addEventListener('pointerdown',e=>{
  AU.init();setPtr(e);G.pointer.down=true;
  if(G.overlayOpen)return;
  if(G.watchKey&&!G.dlg)G.S.axis[G.watchKey]=(G.S.axis[G.watchKey]||0)+1;
  if(G.closed){G.reject();return;}
  if(G.dlg){G.advance();return;}
  if(G.griefKey){intent('tap');return;}
  if(G.mode==='threads'){const th=hoverThread();if(th){const i=G.visThreads.indexOf(th);if(G.tsel===i&&th.act&&G.threadUsable(th))G.pullThread(th);else{G.tsel=i;showThreadInfo(th);}}else G.exitThreads();return;}
  if(G.mode==='knot'){const K=G.knotState;if(K&&K.hover>=0)pickKnot(K.hover);return;}
  if(G.mode!=='play'||(G.script>0&&!G.allowMove))return;
  const w=G.s2w(e.clientX,e.clientY);
  const hit=entAt(w.x,w.y);
  if(hit){intent('move');const P=G.player;if(hyp(hit.x-P.x,hit.y-P.y)<Math.max(26,hit.r*0.8))G.use(hit);else G.target=hit;return;}
  intent('move');G.hold=true;G.target=null;
});
addEventListener('pointermove',e=>{setPtr(e);});
addEventListener('pointerup',()=>{G.pointer.down=false;G.hold=false;});
addEventListener('pointercancel',()=>{G.pointer.down=false;G.hold=false;});
cv.addEventListener('contextmenu',e=>e.preventDefault());
function entAt(x,y){
  let best=null,bd=1e9;
  for(const e of G.ents){if(!G.usable(e)||e.hideLabel)continue;const d=hyp(e.x-x,(e.hy!=null?e.hy:e.y-12)-y);const lim=Math.max(22,(e.hit||e.lr||22));if(d<lim&&d<bd){bd=d;best=e;}}
  return best;
}
$('b-listen').addEventListener('click',()=>{AU.init();if(G.closed){G.reject();return;}if(G.griefKey){intent('key');return;}if(G.mode==='play'&&(G.script===0||G.allowMove))G.listen();});
$('b-thread').addEventListener('click',()=>{AU.init();if(G.closed){G.reject();return;}if(G.griefKey){intent('key');return;}if(G.mode==='threads')G.exitThreads();else if(G.mode==='play'&&(G.script===0||G.allowMove))G.enterThreads();});
$('b-act').addEventListener('click',()=>{AU.init();if(G.closed){G.reject();return;}if(G.dlg){G.advance();return;}if(G.griefKey){intent('key');return;}if(G.mode==='play'&&G.near&&G.usable(G.near)&&(G.script===0||G.allowMove))G.use(G.near);});
$('dlg').addEventListener('pointerdown',e=>{e.stopPropagation();AU.init();if(G.closed){G.reject();return;}if(G.dlg)G.advance();});

G.use=function(e){
  if(!G.usable(e))return;
  G.target=null;G.hold=false;
  G.run(()=>e.use(e));
};

/* ---------------- coordinates & camera ---------------- */
G.s2w=(sx,sy)=>({x:(sx-G.W/2)/G.zoom+G.cam.x,y:(sy-G.H/2)/G.zoom+G.cam.y});
G.w2s=(x,y)=>({x:(x-G.cam.x)*G.zoom+G.W/2,y:(y-G.cam.y)*G.zoom+G.H/2});
function clampCam(snap){
  const d=G.def;if(!d)return;const P=G.player;
  const hw=G.W/2/G.zoom,hh=G.H/2/G.zoom;
  let tx=P.x+(G.camOff?G.camOff.x:0),ty=P.y-10+(G.camOff?G.camOff.y:0);
  if(G.camFocus){tx=G.camFocus.x;ty=G.camFocus.y;}
  tx=d.w<2*hw?d.w/2:clamp(tx,hw,d.w-hw);ty=d.h<2*hh?d.h/2:clamp(ty,hh,d.h-hh);
  if(snap){G.cam.x=tx;G.cam.y=ty;}else{const k=Math.min(1,G.dt*(G.camFocus?1.6:4));G.cam.x+=(tx-G.cam.x)*k;G.cam.y+=(ty-G.cam.y)*k;}
}
function resize(){
  G.dpr=Math.min(2,window.devicePixelRatio||1);G.W=innerWidth;G.H=innerHeight;
  cv.width=Math.round(G.W*G.dpr);cv.height=Math.round(G.H*G.dpr);cv.style.width=G.W+'px';cv.style.height=G.H+'px';
  G.zoom=clamp(Math.min(G.W,G.H)/560,0.82,1.45);G.vig=null;G.touch=matchMedia('(hover:none)').matches;
}
addEventListener('resize',resize);resize();

/* ---------------- update ---------------- */
G.dt=0.016;
function update(dt){
  G.t+=dt;G.dt=dt;
  if(G.listenCd>0)G.listenCd-=dt;
  if(G.flash)G.flash.t+=dt;
  if(G.ripple)G.ripple.t+=dt;
  if(G.dlg)updDlg(dt);
  if(G.mode==='title'){G.titleUpdate&&G.titleUpdate(dt);return;}
  const d=G.def;if(!d)return;
  const P=G.player,still=G.mode==='threads'||G.mode==='knot';
  let mx=0,my=0;
  const canMove=G.mode==='play'&&(G.script===0||G.allowMove)&&!G.dlg&&!G.lockMove&&!G.griefKey&&!G.closed;
  let spd=(d.speed||120)*(G.carry&&G.carry.heavy?0.72:1);
  if(G.walk){
    const w=G.walk,dx=w.x-P.x,dy=w.y-P.y,dd=hyp(dx,dy);w.tt+=dt;
    if(dd<3||w.tt>w.max){G.walk=null;w.res();}else{mx=dx/dd;my=dy/dd;spd=w.spd;}
  }else if(canMove){
    for(const k in MOVE)if(G.keys[k]){mx+=MOVE[k][0];my+=MOVE[k][1];}
    if(!mx&&!my&&G.hold&&G.pointer.has){const w=G.s2w(G.pointer.x,G.pointer.y),dx=w.x-P.x,dy=w.y-(P.y-10),dd=hyp(dx,dy);if(dd>14){mx=dx/dd;my=dy/dd;}}
    if(mx||my)G.target=null;
    else if(G.target){const e=G.target;if(!G.usable(e)){G.target=null;}else{const dx=e.x-P.x,dy=e.y-P.y,dd=hyp(dx,dy);
      if(dd<Math.max(24,e.r*0.9)){G.target=null;G.use(e);}else{mx=dx/dd;my=dy/dd;}}}
  }
  const l=hyp(mx,my);if(l>0){mx/=l;my/=l;}
  const acc=Math.min(1,dt*11);P.vx=lerp(P.vx,mx*spd,acc);P.vy=lerp(P.vy,my*spd,acc);
  if(!still){
    const nx=P.x+P.vx*dt,ny=P.y+P.vy*dt,c=G.walk&&G.walk.ghost?{x:nx,y:ny}:collide(nx,ny,P.r);
    if((G.target||G.walk)&&hyp(c.x-nx,c.y-ny)>0.6){G.stuck=(G.stuck||0)+dt;if(G.stuck>1.4){G.stuck=0;if(G.target)G.target=null;if(G.walk){const w=G.walk;G.walk=null;w.res();}}}else G.stuck=0;
    P.x=c.x;P.y=c.y;
  }
  P.moving=hyp(P.vx,P.vy)>24;
  if(P.moving&&!still){P.step-=dt;if(P.step<=0){P.step=d.stepEvery||0.44;AU.step();G.pulse(P.x,P.y-4,{max:d.stepMax||92,str:0.5,ring:0.1,kaila:true,spd:260});}}
  if(G.carry&&G.carry.follow){const c=G.carry.follow,dx=c.x-P.x,dy=c.y-P.y,dd=hyp(dx,dy),want=G.carry.lag||34;if(dd>want){c.x=P.x+dx/dd*want;c.y=P.y+dy/dd*want;}}
  updHair(dt);updMotes(dt);
  if(!still){
    for(const e of G.ents){
      if(e.update)e.update(dt,e);
      if(e.pulse&&G.active(e)){e.pt-=dt;if(e.pt<=0){e.pt=e.pulse.every*(0.8+Math.random()*0.4);G.pulse(e.x,e.y-(e.pulse.dy||0),{max:e.pulse.max||140,str:e.pulse.str||0.7,ring:e.pulse.ring==null?0.12:e.pulse.ring,spd:e.pulse.spd});if(e.pulse.snd)e.pulse.snd(e);}}
    }
    updPulses(dt);
    if(d.update)d.update(dt);
  }
  // nearest usable entity
  let near=null,nd=1e9;
  if(G.mode==='play'&&G.script===0){for(const e of G.ents){if(!G.usable(e))continue;const dd=hyp(e.x-P.x,e.y-P.y);if(dd<e.r&&dd<nd){nd=dd;near=e;}}}
  G.near=near;updPrompt();
  // exits
  if(G.mode==='play'&&G.script===0&&!G.walk){
    for(const x of G.exits){
      if(P.x>x.x&&P.x<x.x+x.w&&P.y>x.y&&P.y<x.y+x.h){
        if(x.cond&&!x.cond()){P.x=G.lastX;P.y=G.lastY;P.vx=P.vy=0;G.hold=false;if(x.blocked&&!(G.blockCd>0)){G.blockCd=3;G.run(()=>x.blocked());}break;}
        G.hold=false;G.keys={};
        if(x.go)G.run(()=>x.go());else G.run(()=>G.gotoScene(x.to,x.tx,x.ty));
        break;
      }
    }
  }
  if(G.blockCd>0)G.blockCd-=dt;
  G.lastX=P.x;G.lastY=P.y;
  clampCam(false);
}
G.clampCam=clampCam;

/* ---------------- ambient motes ---------------- */
const MOTES={
  stone:{n:36,col:'dim',vx:0,vy:4,sw:3,a:0.35},past:{n:40,col:'warm',vx:3,vy:-5,sw:6,a:0.3},
  lim:{n:46,col:'line',vx:0,vy:-7,sw:8,a:0.28},future:{n:30,col:'line',vx:-4,vy:10,sw:2,a:0.3},
  cam:{n:80,col:'acc',vx:2,vy:-3,sw:4,a:0.32},inan:{n:18,col:'dim',vx:5,vy:0,sw:0.5,a:0.35},
  elba:{n:40,col:'dim',vx:0,vy:6,sw:4,a:0.45},elbaPast:{n:40,col:'dim',vx:0,vy:6,sw:4,a:0.45},
  har:{n:50,col:'warm',vx:0,vy:-26,sw:10,a:0.45,flick:1},axis:{n:90,col:'acc',vx:0,vy:-4,sw:6,a:0.35}
};
function palKey(){for(const k in PAL)if(PAL[k]===G.pal)return k;return'stone';}
function updMotes(dt){
  const d=G.def;if(!d){G.motes=null;return;}
  const key=G.sceneId,m=MOTES[palKey()];if(!m){G.motes=null;return;}
  const hw=G.W/2/G.zoom+40,hh=G.H/2/G.zoom+40,x0=G.cam.x-hw,y0=G.cam.y-hh,w=hw*2,h=hh*2;
  if(!G.motes||G.motes.key!==key){const r=mkRng(hashStr(key));G.motes={key,m,p:[]};for(let i=0;i<m.n;i++)G.motes.p.push({x:x0+r()*w,y:y0+r()*h,ph:r()*TAU,a:0.4+r()*0.6,s:0.8+r()*1.2});}
  const frozen=(d.stasis&&d.stasis())||G.mode==='threads'||G.mode==='knot';
  for(const p of G.motes.p){
    if(!frozen){p.x+=(m.vx+Math.sin(G.t*0.7+p.ph)*m.sw)*dt;p.y+=(m.vy+Math.cos(G.t*0.5+p.ph)*m.sw*0.4)*dt;}
    if(p.x<x0)p.x+=w;else if(p.x>x0+w)p.x-=w;if(p.y<y0)p.y+=h;else if(p.y>y0+h)p.y-=h;
  }
}
function drawMotes(){
  const M=G.motes;if(!M)return;const m=M.m,rgb=G.pal[m.col]||G.pal.line;
  for(const p of M.p){let a=m.a*p.a;if(m.flick)a*=0.5+0.5*Math.sin(G.t*6+p.ph*3);ctx.fillStyle='rgba('+rgb+','+a+')';ctx.fillRect(p.x,p.y,p.s,p.s);}
}

/* ---------------- rendering ---------------- */
const ctx=cv.getContext('2d');G.ctx=ctx;
G.rgba=(col,a)=>'rgba('+(G.pal[col]||col)+','+a+')';
function drawSegs(){
  const P=G.player,pal=G.pal,hw=G.W/2/G.zoom+20,hh=G.H/2/G.zoom+20;
  const vx0=G.cam.x-hw,vx1=G.cam.x+hw,vy0=G.cam.y-hh,vy1=G.cam.y+hh,pr=G.proxR;
  const buckets=new Map();
  for(const s of G.segs){
    if(s.maxx<vx0||s.minx>vx1||s.maxy<vy0||s.miny>vy1)continue;
    let a=s.lit;const dd=hyp(s.mx-P.x,s.my-P.y)-s.hl*0.6;
    if(dd<pr){const q=(1-Math.max(0,dd)/pr)*0.52;if(q>a)a=q;}
    if(s.base>a)a=s.base;a*=s.a;if(a<0.025)continue;
    const b=Math.min(9,Math.floor(a*10)),key=s.col+'|'+b+'|'+s.w;
    let arr=buckets.get(key);if(!arr){arr=[];buckets.set(key,arr);}arr.push(s);
  }
  ctx.lineCap='round';
  for(const [key,arr] of buckets){
    const parts=key.split('|'),rgb=pal[parts[0]]||pal.line,a=(+parts[1]+0.6)/10,w=+parts[2];
    ctx.beginPath();for(const s of arr){ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);}
    if(pal.glow){ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba('+rgb+','+(a*0.15)+')';ctx.lineWidth=w*3.6;ctx.stroke();ctx.globalCompositeOperation='source-over';}
    ctx.strokeStyle='rgba('+rgb+','+a+')';ctx.lineWidth=w*(pal.light?1.05:1.15);ctx.stroke();
  }
}
function drawRings(){
  const pal=G.pal;ctx.lineWidth=1;
  for(const p of G.pulses){if(p.ring<=0)continue;const a=p.ring*(1-p.r/p.max);if(a<0.01)continue;ctx.strokeStyle='rgba('+(pal[p.col]||pal.acc)+','+a+')';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,TAU);ctx.stroke();}
  for(const r of G.rings){const a=r.a*Math.max(0,1-r.t/30)*(0.75+0.25*Math.sin(G.t*0.8+r.x));ctx.strokeStyle='rgba('+pal.acc+','+a*0.5+')';ctx.setLineDash([2,5]);ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,TAU);ctx.stroke();ctx.setLineDash([]);}
}
G.entAlpha=function(e){
  if(e.always)return e.always===true?1:e.always;
  const P=G.player,dd=hyp(e.x-P.x,e.y-P.y);let a=Math.max(e.base||0,e.lit);
  if(dd<G.proxR+30){const q=(1-dd/(G.proxR+30))*0.6;if(q>a)a=q;}
  return Math.min(1,a);
};
function drawEnts(){
  const list=G.ents.filter(e=>G.active(e)&&(e.draw||e.fig)).sort((a,b)=>(a.z||0)-(b.z||0)||a.y-b.y);
  for(const e of list){const a=G.entAlpha(e);if(a<0.02&&!e.drawAlways)continue;ctx.save();if(e.draw)e.draw(ctx,e,a,G.t);else G.drawFig(ctx,e.fig,e.x,e.y,a,G.t,e);ctx.restore();}
}
function drawKaila(){
  const P=G.player;if(P.hidden)return;const pal=G.pal,light=!!pal.light,al=P.alpha;
  const col=light?'255,255,255':'255,255,255',edge=light?'60,60,70':'255,255,255';
  const x=P.x,kn=P.kneel,y=P.y,h=30-kn*9,hy=y-h+5.5,bob=P.moving?Math.sin(G.t*9)*0.6:Math.sin(G.t*1.6)*0.35;
  ctx.save();
  if(!light){const g=ctx.createRadialGradient(x,y-12,0,x,y-12,46);g.addColorStop(0,'rgba(255,255,255,'+0.1*al+')');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(x-50,y-62,100,100);}
  // hair
  ctx.lineCap='round';
  for(const st of P.hair){const p=st.pts;ctx.beginPath();ctx.moveTo(p[0].x,p[0].y+bob);for(let i=1;i<p.length-1;i++){const mx=(p[i].x+p[i+1].x)/2,my=(p[i].y+p[i+1].y)/2;ctx.quadraticCurveTo(p[i].x,p[i].y+bob,mx,my+bob);}
    ctx.strokeStyle=light?'rgba(120,120,130,'+0.55*al+')':'rgba(240,240,248,'+0.72*al+')';ctx.lineWidth=light?1:1.05;ctx.stroke();}
  // robe
  ctx.beginPath();ctx.moveTo(x-2.6,hy+5+bob);ctx.lineTo(x-6.5-kn*2,y);ctx.quadraticCurveTo(x,y+2.4,x+6.5+kn*2,y);ctx.lineTo(x+2.6,hy+5+bob);ctx.closePath();
  ctx.fillStyle=light?'rgba(255,255,255,'+0.95*al+')':'rgba(236,236,242,'+0.16*al+')';ctx.fill();
  ctx.strokeStyle='rgba('+edge+','+(light?0.75:0.92)*al+')';ctx.lineWidth=1.1;ctx.stroke();
  // head
  ctx.beginPath();ctx.arc(x,hy+bob,4.6,0,TAU);ctx.fillStyle=light?'rgba(255,255,255,'+al+')':'rgba(10,10,12,'+0.6*al+')';ctx.fill();ctx.strokeStyle='rgba('+edge+','+0.95*al+')';ctx.stroke();
  // blindfold band + ribbon tails
  ctx.beginPath();ctx.moveTo(x-4.9,hy+bob-0.6);ctx.lineTo(x+4.9,hy+bob-0.6);ctx.strokeStyle=light?'rgba(40,40,48,'+0.9*al+')':'rgba(255,255,255,'+al+')';ctx.lineWidth=2.3;ctx.stroke();
  const fl=Math.sin(G.t*2.3)*1.4-P.vx*0.02;
  ctx.lineWidth=0.9;ctx.beginPath();ctx.moveTo(x+4.4,hy+bob);ctx.quadraticCurveTo(x+8,hy+bob+2+fl,x+10.5-P.vx*0.03,hy+bob+6+fl);ctx.moveTo(x+4.4,hy+bob+0.6);ctx.quadraticCurveTo(x+7,hy+bob+4,x+8-P.vx*0.03,hy+bob+9+fl*0.6);ctx.stroke();
  ctx.restore();
  if(G.carry&&G.carry.draw&&!G.carry.follow){ctx.save();G.carry.draw(ctx,x+9,y-14,1);ctx.restore();}
}
/* the woven edge of the blindfold: a vignette made of faint cloth threads */
function buildVig(){
  const c=document.createElement('canvas');c.width=Math.max(1,Math.round(G.W/2));c.height=Math.max(1,Math.round(G.H/2));
  const x=c.getContext('2d'),w=c.width,h=c.height,pal=G.pal,bg=pal.bg;
  const r=Math.hypot(w,h)/2,gr=x.createRadialGradient(w/2,h/2,r*0.38,w/2,h/2,r*1.02);
  gr.addColorStop(0,hexA(bg,0));gr.addColorStop(0.7,hexA(bg,0.55));gr.addColorStop(1,hexA(bg,0.96));x.fillStyle=gr;x.fillRect(0,0,w,h);
  const rng=mkRng(99),tc=pal.light?'0,0,0':'255,255,255';
  for(let yy=0;yy<h;yy+=2){const e=Math.abs(yy-h/2)/(h/2);for(let k=0;k<3;k++){const x0=rng()*w,len=20+rng()*120;const ex=Math.abs(x0-w/2)/(w/2);const a=0.018*Math.pow(Math.max(e,ex),3)*(0.5+rng());if(a<0.002)continue;x.strokeStyle='rgba('+tc+','+a+')';x.beginPath();x.moveTo(x0,yy+rng());x.lineTo(x0+len,yy+rng());x.stroke();}}
  G.vig=c;
}
function hexA(hex,a){const n=parseInt(hex.slice(1),16);return'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+a+')';}
G.hexA=hexA;
function drawVig(){if(!G.vig)buildVig();ctx.drawImage(G.vig,0,0,G.W,G.H);}

function render(){
  const W=G.W,H=G.H,d=G.dpr,z=G.zoom,pal=G.pal||PAL.stone;
  ctx.setTransform(d,0,0,d,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  ctx.fillStyle=pal.bg;ctx.fillRect(0,0,W,H);
  if(G.mode==='title'){G.titleDraw&&G.titleDraw(ctx);drawVig();return;}
  if(!G.def)return;
  ctx.setTransform(d*z,0,0,d*z,d*(W/2-G.cam.x*z),d*(H/2-G.cam.y*z));
  if(G.def.drawBg)G.def.drawBg(ctx);
  drawMotes();drawSegs();drawRings();drawEnts();drawKaila();
  if(G.def.drawFg)G.def.drawFg(ctx);
  ctx.setTransform(d,0,0,d,0,0);
  if(G.mode==='threads'||G.mode==='knot'||(G.def.showThreads&&G.def.showThreads()))drawThreads();
  drawBubbles();drawMarkers();drawFlash();drawRipple();
  if(G.def.drawScreen)G.def.drawScreen(ctx);
  drawVig();
  if(G.closed)drawDeadCursor();
}
function drawMarkers(){
  if(G.mode!=='play')return;
  const e=G.near;if(e&&!e.hideLabel){const s=G.w2s(e.x,(e.hy!=null?e.hy:e.y-(e.lh||34)));ctx.fillStyle=G.rgba('th',0.85);ctx.beginPath();const k=3.2+Math.sin(G.t*4)*0.6;ctx.moveTo(s.x,s.y-k);ctx.lineTo(s.x+k,s.y);ctx.lineTo(s.x,s.y+k);ctx.lineTo(s.x-k,s.y);ctx.closePath();ctx.fill();}
  if(G.pointer.has&&matchMedia('(hover:hover)').matches&&G.script===0){const w=G.s2w(G.pointer.x,G.pointer.y),h=entAt(w.x,w.y);if(h&&h!==G.near&&h.label){ctx.font='13px "Noto Serif TC",serif';ctx.fillStyle=G.rgba('line',0.8);ctx.textAlign='center';ctx.fillText(h.label,G.pointer.x,G.pointer.y-16);}}
}
function drawDeadCursor(){if(!G.pointer.has)return;ctx.strokeStyle='rgba(200,215,230,0.35)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(G.pointer.x,G.pointer.y,6,0,TAU);ctx.stroke();}
function drawRipple(){const r=G.ripple;if(!r)return;const s=G.w2s(r.x,r.y);for(let i=0;i<3;i++){const t=r.t*1.4-i*0.15;if(t<0)continue;ctx.strokeStyle=G.rgba('acc',Math.max(0,0.6-t*0.6));ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(s.x,s.y,t*Math.max(G.W,G.H)*0.7,0,TAU);ctx.stroke();}}

/* ---------------- causal threads ---------------- */
G.cursorAnchor=function(){if(G.pointer.has&&matchMedia('(hover:hover)').matches)return{x:G.pointer.x,y:G.pointer.y};return{x:G.W*0.5,y:G.H+40};};
function anchor(a){
  const P=G.player;
  if(a==='kaila'){const s=G.w2s(P.x,P.y-17);return s;}
  if(a==='cursor')return G.cursorAnchor();
  if(a==='up'){const s=G.w2s(P.x,P.y);return{x:s.x+60,y:-60};}
  if(typeof a==='string'){const e=G.entById[a];if(!e)return null;return G.w2s(e.x+(e.ax||0),e.y+(e.ay!=null?e.ay:-12));}
  if(a.sx!=null)return{x:a.sx*G.W,y:a.sy*G.H};
  if(a.x!=null)return G.w2s(a.x,a.y);
  return null;
}
function thGeom(th){
  const A=anchor(th.a);if(!A)return null;let B;
  if(th.fray){B={x:A.x+th.fray[0]*G.zoom,y:A.y+th.fray[1]*G.zoom};}else{B=anchor(th.b);if(!B)return null;}
  const dx=B.x-A.x,dy=B.y-A.y,L=hyp(dx,dy)||1,nx=-dy/L,ny=dx/L,seed=hashStr(th.label||'')%100;
  const wob=Math.sin(G.t*(0.7+seed*0.004)+seed)*L*0.05,sag=(th.sag==null?0.1:th.sag)*L;
  return{A,B,c1:{x:A.x+dx*0.33+nx*wob,y:A.y+dy*0.33+ny*wob+sag},c2:{x:A.x+dx*0.66-nx*wob,y:A.y+dy*0.66-ny*wob+sag},L};
}
function bez(g,t){const u=1-t;return{x:u*u*u*g.A.x+3*u*u*t*g.c1.x+3*u*t*t*g.c2.x+t*t*t*g.B.x,y:u*u*u*g.A.y+3*u*u*t*g.c1.y+3*u*t*t*g.c2.y+t*t*t*g.B.y};}
G.threadVisible=th=>(!th.cond||th.cond());
G.threadUsable=th=>!th.actCond||th.actCond();
function strokeThread(g,col,a,w,fray,dash){
  ctx.lineCap='round';
  if(G.pal.glow){ctx.globalCompositeOperation='lighter';}
  const steps=fray?14:1;
  for(let i=0;i<steps;i++){
    const t0=i/steps,t1=(i+1)/steps,aa=fray?a*(1-t0)*(1-t0):a;
    ctx.beginPath();
    if(!fray){ctx.moveTo(g.A.x,g.A.y);ctx.bezierCurveTo(g.c1.x,g.c1.y,g.c2.x,g.c2.y,g.B.x,g.B.y);}
    else{const p0=bez(g,t0);ctx.moveTo(p0.x,p0.y);for(let k=1;k<=4;k++){const p=bez(g,t0+(t1-t0)*k/4);ctx.lineTo(p.x+(Math.random()-0.5)*t0*3,p.y+(Math.random()-0.5)*t0*3);}}
    if(dash)ctx.setLineDash(dash);
    if(G.pal.glow){ctx.strokeStyle='rgba('+col+','+aa*0.22+')';ctx.lineWidth=w*4;ctx.stroke();}
    ctx.strokeStyle='rgba('+col+','+aa+')';ctx.lineWidth=w;ctx.stroke();ctx.setLineDash([]);
  }
  ctx.globalCompositeOperation='source-over';
}
function hoverThread(){
  if(!G.pointer.has)return null;let best=null,bd=14;
  for(const th of G.visThreads||[]){const g=thGeom(th);if(!g)continue;for(let i=0;i<=24;i++){const p=bez(g,i/24);const d=hyp(p.x-G.pointer.x,p.y-G.pointer.y);if(d<bd){bd=d;best=th;}}}
  return best;
}
function drawThreads(){
  const pal=G.pal;
  if(G.mode==='threads'||G.mode==='knot'){ctx.fillStyle=hexA(pal.bg,pal.light?0.5:0.55);ctx.fillRect(0,0,G.W,G.H);}
  if(G.mode==='knot'){drawKnot();return;}
  const vis=G.visThreads||G.threads.filter(G.threadVisible);
  let hov=G.mode==='threads'?hoverThread():null;
  if(hov&&G.visThreads){const i=G.visThreads.indexOf(hov);if(i!==G.tsel){G.tsel=i;showThreadInfo(hov);}}
  const sel=G.visThreads?G.visThreads[G.tsel]:null;
  for(const th of vis){
    const g=thGeom(th);if(!g)continue;
    const on=th===sel,col=th.col?(pal[th.col]||th.col):pal.th;
    let a=th.faint?0.28:0.75,w=1.2;if(on){a=1;w=2.2;}
    if(G.mode!=='threads')a*=th.ambient||0.5;
    strokeThread(g,col,a,w,th.fray,th.dash);
    if(G.mode==='threads'){
      const lbl=on?(th.label||''):(th.tag||'');
      if(lbl){const m=bez(g,0.5);ctx.font=(on?'14px':'12px')+' "Noto Serif TC",serif';ctx.textAlign='center';ctx.fillStyle='rgba('+col+','+(on?0.95:0.55)+')';ctx.fillText(lbl,m.x,m.y-8);}
      if(th.act&&G.threadUsable(th)){const m=bez(g,0.5);ctx.fillStyle='rgba('+col+','+(0.6+0.4*Math.sin(G.t*4))+')';ctx.beginPath();ctx.arc(m.x,m.y,3,0,TAU);ctx.fill();}
    }
  }
}
G.enterThreads=function(){
  if(G.mode!=='play')return;
  G.visThreads=G.threads.filter(G.threadVisible).filter(th=>{const g=thGeom(th);if(!g)return false;const on=p=>p.x>-80&&p.x<G.W+80&&p.y>-80&&p.y<G.H+80;return on(g.A)||(!th.fray&&on(g.B))||th.b==='cursor'||th.b==='up'||th.a==='kaila';});
  G.mode='threads';G.S.log.threads++;AU.thread(true);G.tsel=-1;G.hold=false;G.target=null;
  const first=G.visThreads.find(t=>t.act&&G.threadUsable(t))||G.visThreads.find(t=>t.a!=='kaila')||G.visThreads[0];
  if(first){G.tsel=G.visThreads.indexOf(first);showThreadInfo(first);}else showThreadInfo({label:'這裡沒有看得見的線',desc:'也許要走近一點。'});
  $('b-thread').classList.add('hot');
  if(G.def.onThreads)G.def.onThreads();
};
G.exitThreads=function(){if(G.mode!=='threads')return;G.mode='play';AU.thread(false);$('tinfo').classList.remove('show');$('b-thread').classList.remove('hot');G.visThreads=null;if(G.def&&G.def.onThreadsExit)G.def.onThreadsExit();};
function cycleThread(d){const v=G.visThreads;if(!v||!v.length)return;G.tsel=((G.tsel<0?0:G.tsel+d)+v.length)%v.length;showThreadInfo(v[G.tsel]);AU.tone(2093,0.12,0.012,{wet:0.6});}
function showThreadInfo(th){
  if(th.onView)th.onView(th);
  const el=$('tinfo');el.querySelector('h4').textContent=th.label||'';el.querySelector('p').textContent=(typeof th.desc==='function'?th.desc():th.desc)||'';
  let k='';if(th.act&&G.threadUsable(th))k='Enter／再點一次：'+(th.actLabel||'牽引');else if(th.act&&th.actOff)k=th.actOff;
  el.querySelector('.k').textContent=k;el.classList.add('show');
}
G.pullThread=function(th){G.exitThreads();G.run(()=>th.act(th));};

/* knot: a decision made by pulling one of several threads */
G.knot=function(o){
  return new Promise(res=>{
    const opts=o.options.slice();if(o.back!==false)opts.push({key:null,label:'鬆開手',desc:o.backDesc||'先不牽動任何一條線。',back:true});
    G.knotState={o,opts,res,sel:0,hover:0,back:o.back!==false,t:0};G.mode='knot';G.hold=false;G.target=null;AU.thread(true);
    const ke=G.entById[o.ent];if(ke)G.camFocus={x:ke.x,y:ke.y+(ke.ay!=null?ke.ay:-12)-Math.min(G.H,G.W)*0.12/G.zoom};$('tinfo').classList.add('bottom');
    if(G.auto){const k=G.autoPick?G.autoPick(o):null;const idx=Math.max(0,opts.findIndex(x=>x.key===k&&x.ok!==false));setTimeout(()=>finishKnot(opts[idx]),5);return;}
    showKnotInfo();
  });
};
function knotGeom(i,n){
  const K=G.knotState,e=G.entById[K.o.ent],c=e?G.w2s(e.x,e.y+(e.ay!=null?e.ay:-12)):{x:G.W/2,y:G.H/2};
  const R=Math.min(G.W,G.H)*0.32,span=Math.min(Math.PI*1.15,0.6*n),a=-Math.PI/2-span/2+span*(n===1?0.5:i/(n-1));
  let bx=c.x+Math.cos(a)*R*1.35,by=c.y+Math.sin(a)*R;bx=clamp(bx,110,G.W-110);by=clamp(by,40,G.H-200);
  return{A:c,B:{x:bx,y:by}};
}
function drawKnot(){
  const K=G.knotState;if(!K)return;K.t+=G.dt;const n=K.opts.length,pal=G.pal;
  let hov=-1;
  for(let i=0;i<n;i++){const kg=knotGeom(i,n),o=K.opts[i];
    const dx=kg.B.x-kg.A.x,dy=kg.B.y-kg.A.y,L=hyp(dx,dy)||1,nx=-dy/L,ny=dx/L,wob=Math.sin(G.t*0.9+i*1.7)*L*0.06;
    const g={A:kg.A,B:kg.B,c1:{x:kg.A.x+dx*0.33+nx*wob,y:kg.A.y+dy*0.33+ny*wob},c2:{x:kg.A.x+dx*0.66-nx*wob,y:kg.A.y+dy*0.66-ny*wob}};o._g=g;
    if(G.pointer.has){for(let j=0;j<=20;j++){const p=bez(g,j/20);if(hyp(p.x-G.pointer.x,p.y-G.pointer.y)<16){hov=i;break;}}if(hyp(kg.B.x-G.pointer.x,kg.B.y-G.pointer.y)<60)hov=i;}
  }
  if(hov>=0&&hov!==K.hover&&G.pointer.has){K.hover=hov;K.sel=hov;showKnotInfo();}
  for(let i=0;i<n;i++){const o=K.opts[i],g=o._g,on=i===K.sel,off=o.ok===false;
    const col=o.back?pal.dim:(off?pal.dim:(o.col?pal[o.col]:pal.th));const grow=Math.min(1,K.t*1.6);
    const gg={A:g.A,B:{x:lerp(g.A.x,g.B.x,grow),y:lerp(g.A.y,g.B.y,grow)},c1:g.c1,c2:g.c2};
    strokeThread(gg,col,on?1:(off?0.35:0.62),on?2.4:1.2,false,off||o.back?[3,6]:null);
    ctx.font=(on?'600 15px':'14px')+' "Noto Serif TC",serif';ctx.textAlign='center';ctx.fillStyle='rgba('+col+','+(on?1:(off?0.45:0.75))+')';
    ctx.fillText(o.label,g.B.x,g.B.y-10);
  }
  const e=G.entById[K.o.ent];if(e){const c=G.w2s(e.x,e.y+(e.ay!=null?e.ay:-12));ctx.fillStyle='rgba('+pal.th+',0.9)';ctx.beginPath();ctx.arc(c.x,c.y,4+Math.sin(G.t*3),0,TAU);ctx.fill();}
}
function showKnotInfo(){
  const K=G.knotState,o=K.opts[K.sel],el=$('tinfo');
  el.querySelector('h4').textContent=(K.o.title?K.o.title+'　／　':'')+o.label;
  el.querySelector('p').textContent=(o.ok===false?(o.off||'這條線還接不上。'):(typeof o.desc==='function'?o.desc():o.desc))||'';
  el.querySelector('.k').textContent=o.ok===false?'':(o.back?'Enter：鬆開':'Enter／點擊：牽引這條線');
  el.classList.add('show');
}
function pickKnot(i){
  const K=G.knotState;if(!K||K.busy)return;const o=K.opts[i];if(!o)return;K.sel=i;showKnotInfo();
  if(o.ok===false){AU.tone(200,0.2,0.03,{type:'triangle',wet:0.3});return;}
  if(o.back){finishKnot(o);return;}
  K.busy=true;
  G.confirm('牽引這條線？',o.label,o.confirmText||'牽引','再想想').then(ok=>{K.busy=false;if(ok)finishKnot(o);});
}
function finishKnot(o){const K=G.knotState;if(!K)return;G.knotState=null;G.mode='play';G.camFocus=null;$('tinfo').classList.remove('show','bottom');AU.thread(false);K.res(o.key==null?null:o.key);}
G.confirm=function(title,body,yes,no){
  if(G.auto)return Promise.resolve(true);
  return new Promise(res=>{
    const el=$('confirm');G.overlayOpen=true;
    el.innerHTML='<div class="panel"><h3></h3><p class="b"></p><div class="row"><button type="button" class="y"></button><button type="button" class="n"></button></div></div>';
    el.querySelector('h3').textContent=title;el.querySelector('.b').textContent=body;el.querySelector('.y').textContent=yes||'確定';el.querySelector('.n').textContent=no||'取消';
    el.classList.add('show');
    const done=v=>{el.classList.remove('show');G.overlayOpen=false;document.removeEventListener('keydown',kh,true);res(v);};
    const kh=e=>{if(e.code==='Enter'||e.code==='NumpadEnter'){e.stopPropagation();e.preventDefault();done(true);}else if(e.code==='Escape'){e.stopPropagation();done(false);}};
    document.addEventListener('keydown',kh,true);
    el.querySelector('.y').onclick=()=>done(true);el.querySelector('.n').onclick=()=>done(false);
    setTimeout(()=>el.querySelector('.y').focus(),30);
  });
};

/* intention flash: a hairline that travels from the viewer to Kaila */
G.flashIntent=function(broken){G.flash={t:0,broken:!!broken};AU.tink();return G.wait(0.36);};
function drawFlash(){
  const f=G.flash;if(!f)return;if(f.t>0.9){G.flash=null;return;}
  const A=G.cursorAnchor(),B=anchor('kaila');const p=Math.min(1,f.t/0.28);
  const endT=f.broken?Math.min(p,0.58):p;const x=lerp(A.x,B.x,endT),y=lerp(A.y,B.y,endT);
  const a=f.t<0.3?1:Math.max(0,1-(f.t-0.3)/0.6);
  ctx.strokeStyle=(G.pal.light?'rgba(20,20,30,':'rgba(255,255,255,')+a*0.9+')';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(x,y);ctx.stroke();
  if(f.broken&&p>=0.58){for(let i=0;i<7;i++){const ang=i*0.9+f.t*2,rr=(f.t-0.16)*60;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(ang)*rr,y+Math.sin(ang)*rr);ctx.stroke();}}
  if(!f.broken&&p>=1){ctx.beginPath();ctx.arc(B.x,B.y,4+f.t*16,0,TAU);ctx.stroke();}
}

/* ---------------- dialogue & script primitives ---------------- */
G.run=async function(fn){G.script++;try{return await fn();}catch(err){console.error(err);G.lastError=err;}finally{G.script--;}};
/* run a script as soon as nothing else is running (for triggers fired from update loops) */
G.soon=function(fn){const tick=()=>{if(G.script===0&&!G.dlg&&G.mode==='play')G.run(fn);else setTimeout(tick,250);};tick();};
G.wait=function(sec){if(G.auto)return new Promise(r=>setTimeout(r,0));return new Promise(r=>setTimeout(r,sec*1000));};
function updDlg(dt){
  const D=G.dlg;
  if(D.done){if(G.autoAdv){D.hold=(D.hold||0)+dt;if(D.hold>1.3+D.chars.length*0.05)G.advance();}return;}
  D.acc+=dt*D.speed;const n=Math.min(D.chars.length,Math.floor(D.acc));
  if(n!==D.n){D.n=n;D.el.textContent=D.chars.slice(0,n).join('');}
  D.pt-=dt;if(D.pt<=0&&D.src){D.pt=0.32;
    if(D.src==='kaila'){const P=G.player;G.pulse(P.x,P.y-16,{max:150,str:0.6,ring:0.12,kaila:true});}
    else{const e=G.entById[D.src];if(e){G.pulse(e.x,e.y-(e.pdy||14),{max:e.voiceMax||170,str:0.75,ring:0.14});AU.talk(clamp((e.x-G.cam.x)/400,-1,1));}}}
  if(n>=D.chars.length){D.done=true;$(D.box).classList.add('done');}
}
function show(boxId,cls,name,text,src,speed){
  return new Promise(res=>{
    const box=$(boxId);
    if(boxId==='dlg'){box.className='show '+(cls||'');$('dlg-name').textContent=name||'';}
    else{box.className='show';box.innerHTML='<span class="glyph">◇</span><span class="tx"></span>';}
    const el=boxId==='dlg'?$('dlg-text'):box.querySelector('.tx');el.textContent='';
    const chars=Array.from(text);
    G.dlg={box:boxId,el,chars,n:0,acc:0,speed:speed||G.textSpeed,done:false,src,pt:0,kaila:src==='kaila'||cls==='think',res};
    if(G.auto){G.dlg.done=true;el.textContent=text;setTimeout(()=>G.advance(),0);}
  });
}
G.advance=function(){
  const D=G.dlg;if(!D)return;
  if(!D.done){D.done=true;D.el.textContent=D.chars.join('');$(D.box).classList.add('done');if(D.kaila&&!G.auto)G.S.log.skips++;return;}
  G.dlg=null;$(D.box).className='';if(D.box==='voice')$('voice').innerHTML='';
  D.res();
};
G.say=function(name,text,o){
  o=o||{};let src=o.src;
  if(!src){if(name==='凱拉')src='kaila';else{const e=G.ents.find(x=>x.name===name);if(e)src=e.id;}}
  return show('dlg',(name==='凱拉'?'kaila ':'')+(o.cls||''),name,text,src,o.speed);
};
G.think=text=>show('dlg','think','',text,null);
G.narr=text=>show('dlg','narr','',text,null,26);
G.voice=function(text){AU.voice();return show('voice','',null,text,null,30);};
G.bubble=function(e,text,sec){e.bubble={text,until:G.t+(sec||4)};};
function drawBubbles(){
  ctx.font='13px "Noto Serif TC",serif';ctx.textAlign='center';
  for(const e of G.ents){const b=e.bubble;if(!b||G.t>b.until||!G.active(e))continue;const s=G.w2s(e.x,e.y-(e.bh||48));const k=Math.min(1,(b.until-G.t)/0.6,1);
    ctx.fillStyle=G.rgba('line',0.85*k);ctx.fillText(b.text,s.x,s.y);}
}
G.hk=(desk,touch)=>G.touch?touch:desk;
G.hint=function(text,sec){const el=$('hint');el.innerHTML=text;el.classList.add('show');clearTimeout(G._ht);G._ht=setTimeout(()=>el.classList.remove('show'),(sec||7)*1000);};
G.card=async function(t,s,hold){
  const el=$('card');el.querySelector('.t').textContent=t;el.querySelector('.s').textContent=s||'';el.classList.add('show');
  await G.wait(hold||3.2);el.classList.remove('show');await G.wait(1.2);
};
G.fade=function(to,sec,color){
  const el=$('fade');if(color)el.style.background=color;else el.style.background=G.pal&&G.pal.light?'#f0eee7':'#000';
  if(G.auto||!sec){el.style.transition='none';el.style.opacity=to;return Promise.resolve();}
  el.style.transition='opacity '+sec+'s ease';void el.offsetWidth;el.style.opacity=to;
  return G.wait(sec);
};
G.walkTo=function(x,y,spd,o){return new Promise(res=>{if(G.auto){const P=G.player;P.x=x;P.y=y;res();return;}G.walk={x,y,spd:spd||80,res,tt:0,max:(o&&o.max)||10,ghost:o&&o.ghost};});};
G.moveEnt=function(e,x,y,spd){
  if(typeof e==='string')e=G.entById[e];if(!e)return Promise.resolve();
  if(G.auto){e.x=x;e.y=y;return Promise.resolve();}
  return new Promise(res=>{const prev=e.update;e.update=function(dt,self){const dx=x-self.x,dy=y-self.y,d=hyp(dx,dy);if(d<2){self.x=x;self.y=y;self.update=prev;res();return;}const s=Math.min(d,(spd||70)*dt);self.x+=dx/d*s;self.y+=dy/d*s;if(prev)prev(dt,self);};});
};
G.grief=function(key){const L=G.S.log;L.gt=L.gt||{};if(!L.gt[key])L.gt[key]=Date.now();G.griefKey=key;G.hold=false;G.keys={};G.target=null;};
G.endGrief=function(){G.griefKey=null;};

/* A decision reaches Kaila a fraction of a second before she is aware of it.
 * The delay is recorded and shown to the player at the Axis. */
const AFFIRM=['……我決定了。','就這樣做吧。','嗯。這是我要做的。','我知道該怎麼做了。'];
G.decide=async function(where,label,line){
  const ms=260+Math.floor(Math.random()*360);
  const said=line||AFFIRM[G.S.log.decisions.length%AFFIRM.length];
  G.S.log.decisions.push({ch:G.S.chapter,where,label,ms,line:said,t:Date.now()});
  await G.flashIntent(false);await G.wait(ms/1000);
  await G.say('凱拉',said);
  G.save();
};
G.refuse=async function(where,label,lines){
  G.S.log.refusals.push({ch:G.S.chapter,where,label,t:Date.now()});
  await G.flashIntent(true);await G.wait(0.3);
  for(const l of lines)await G.say('凱拉',l);
  G.save();
};

/* prompt */
function updPrompt(){
  const el=$('prompt'),b=$('b-act');const e=G.near;
  const show=e&&!G.dlg&&G.mode==='play'&&G.script===0&&!e.hideLabel;
  if(show){const lbl=e.label||'靠近';if(el.dataset.l!==lbl){el.dataset.l=lbl;el.innerHTML='<kbd>Enter</kbd>'+escapeHtml(lbl);}el.classList.add('show');b.disabled=false;b.classList.add('hot');}
  else{el.classList.remove('show');b.classList.remove('hot');b.disabled=!G.dlg;}
  $('btns').classList.toggle('show',G.mode==='play'||G.mode==='threads');
  $('btns').classList.toggle('busy',G.script>0&&!G.dlg);
  $('b-listen').disabled=!(G.mode==='play');
}
function escapeHtml(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
G.escapeHtml=escapeHtml;

/* ---------------- loop ---------------- */
let last=performance.now();
function frame(now){
  let dt=(now-last)/1000;last=now;if(dt>0.05)dt=0.05;if(dt<0)dt=0;
  try{update(dt);render();}catch(err){console.error(err);G.lastError=err;}
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
