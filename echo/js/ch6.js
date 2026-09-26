/* 終章 — 阿克西斯 */
(function(){
'use strict';
const {F,set,TAU,hyp,clamp,lerp,$}=G;
const say=(...a)=>G.say(...a),think=t=>G.think(t),voice=t=>G.voice(t),wait=s=>G.wait(s),narr=t=>G.narr(t);
const A=()=>G.S.axis;
const REG=[
  {k:'lim',name:'利米塔尼亞',col:'140,212,160'},
  {k:'cam',name:'坎帕納',col:'232,192,122'},
  {k:'inan',name:'伊南',col:'122,170,232'},
  {k:'har',name:'海拉奇',col:'228,134,94'}
];
const st=k=>(G.S[k]&&G.S[k].state)||'T';
G.endingType=function(){const s=REG.map(r=>st(r.k));const T=s.filter(x=>x==='T').length,W=s.filter(x=>x==='W').length;if(T>=2)return'continue';if(W>=2)return'guardian';return'return';};

/* a thread drawn in the state its region left it in:
 * T — taut, pulling toward the centre; S — slack and hanging; W — thin, woven with another */
function regionThread(ctx,pts,col,state,t,a){
  a=a==null?1:a;ctx.lineCap='round';ctx.lineJoin='round';
  const path=(off,wob,ph)=>{ctx.beginPath();for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[Math.min(i+1,pts.length-1)],o=pts[Math.max(i-1,0)];const dx=q[0]-o[0],dy=q[1]-o[1],L=hyp(dx,dy)||1,nx=-dy/L,ny=dx/L;const w=off+(wob?Math.sin(i*0.5+t*1.4+ph)*wob:0);const x=p[0]+nx*w,y=p[1]+ny*w;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}};
  ctx.globalCompositeOperation='lighter';
  if(state==='T'){path(0,0,0);ctx.strokeStyle='rgba('+col+','+0.5*a+')';ctx.lineWidth=2.2;ctx.stroke();ctx.setLineDash([10,16]);ctx.lineDashOffset=-t*60;ctx.strokeStyle='rgba('+col+','+0.95*a+')';ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='rgba('+col+','+0.12*a+')';ctx.lineWidth=8;path(0,0,0);ctx.stroke();}
  else if(state==='S'){path(0,6,0);ctx.setLineDash([2,9]);ctx.strokeStyle='rgba('+col+','+0.35*a+')';ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([]);}
  else{path(0,2.2,0);ctx.strokeStyle='rgba('+col+','+0.7*a+')';ctx.lineWidth=0.9;ctx.stroke();path(0,2.2,Math.PI);ctx.strokeStyle='rgba(240,236,220,'+0.45*a+')';ctx.lineWidth=0.7;ctx.stroke();}
  ctx.globalCompositeOperation='source-over';
}

/* ---------- 通往軸心的路 ---------- */
const CX=1200,CY=1200;
function corridorPath(off){
  const pts=[[CX+off,2280],[CX+off,1975+off]];
  for(let i=0;i<=60;i++){const a=Math.PI/2+i/60*Math.PI;pts.push([CX+Math.cos(a)*(775+off),CY+Math.sin(a)*(775+off)]);}
  pts.push([CX+off*0.5,560]);
  for(let i=0;i<=44;i++){const a=-Math.PI/2+i/44*Math.PI;pts.push([CX+Math.cos(a)*(525+off),CY+Math.sin(a)*(525+off)]);}
  pts.push([CX+off,1600]);pts.push([CX+off*0.3,1230]);
  return pts;
}
let PATHS=null;
function echoLines(k){
  const s=st(k),S=G.S;
  if(k==='lim')return {T:[['蘿溫','燈還亮著。'],['小栗',S.lim.guardian==='kept'?'老角還在！':'老角睡著了嗎？']],S:[['蘿溫','溫室冷了。'],['朵拉','我得走了。']],W:[['葛蘭','窯口要封緊。'],['蘿溫','我們會在這裡。']]}[s];
  if(k==='cam')return [['莉拉','三十九！四十！'],['瑪嘉','媽媽一直都在看。'],['歐班',{T:'……第十三響。',S:'十二響。',W:'十二響，再加上半刻。'}[s]]];
  if(k==='inan')return [['小潮','風長什麼樣子？'],{T:['Drift','塔還在。水還在。'],S:['伊索','……'],W:['巴托','那是風。']}[s]];
  return [['娜菈','姊姊的眼睛上，也綁著布。'],['瑟蘭',{T:'今天的孩子，也是孩子。',S:'帳本上的每一行，我都會記得。',W:'聖殿的燈，第一次熄了。'}[s]]];
}
async function echoStation(k){
  const P=G.player;const lines=echoLines(k)||[];
  const holder={id:'echoV',x:P.x,y:P.y-20,lr:1,lit:0,base:0,t:0,bh:40,update(dt,e){e.x=G.player.x;e.y=G.player.y-20;}};
  if(!G.entById.echoV){G.ents.push(holder);G.entById.echoV=holder;}
  const h=G.entById.echoV;
  for(const [who,txt] of lines){if(!txt)continue;G.bubble(h,who+'：「'+txt+'」',3.2);AU.tone(440+Math.random()*200,0.8,0.012,{wet:1});await new Promise(r=>setTimeout(r,G.auto?0:3000));}
}
G.defScene('axis_path',{
  name:'通往軸心的路',pal:'axis',w:2400,h:2400,ambient:'axis',speed:150,listenMax:800,
  build(B){
    B.border({col:'dim',a:0.3});
    const g=0.075;
    B.arc(CX,CY,900,Math.PI/2+g,Math.PI/2+TAU-g,{solid:true});
    B.arc(CX,CY,650,-Math.PI/2+g*1.3,-Math.PI/2+TAU-g*1.3,{solid:true});
    B.arc(CX,CY,400,Math.PI/2+g*1.8,Math.PI/2+TAU-g*1.8,{solid:true});
    for(let i=0;i<220;i++){const a=B.r()*TAU,r=420+B.r()*900;if(Math.abs(r-650)<20||Math.abs(r-900)<20)continue;B.seg(CX+Math.cos(a)*r,CY+Math.sin(a)*r,CX+Math.cos(a+0.01)*r,CY+Math.sin(a+0.01)*r,{col:'dim',a:0.5});}
    [['lim',CX,2080],['cam',CX,560],['inan',CX,1620]].forEach(([k,x,y])=>B.ent({id:'st_'+k,x,y,lr:30,draw(){},update(dt,e){if(!A()['echo_'+k]&&hyp(G.player.x-e.x,G.player.y-e.y)<130){A()['echo_'+k]=1;echoStation(k);}}}));
    B.ent({id:'st_har',x:CX,y:1300,lr:30,draw(){},update(dt,e){if(!A().echo_har&&hyp(G.player.x-e.x,G.player.y-e.y)<120){A().echo_har=1;echoStation('har');}}});
    B.ent({id:'heart',x:CX,y:CY,lr:40,always:0.6,pulse:{every:2,max:500,str:0.5,ring:0.1},draw(ctx,e,a,t){const g=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,90);g.addColorStop(0,'rgba(255,240,210,'+(0.2+0.08*Math.sin(t*2))+')');g.addColorStop(1,'rgba(255,240,210,0)');ctx.fillStyle=g;ctx.fillRect(e.x-90,e.y-90,180,180);}});
    B.exit(CX-50,CY-50,100,100,'axis_core',700,1380);
    W.selfThreads(B);
  },
  drawBg(ctx){if(!PATHS)PATHS=REG.map((r,i)=>corridorPath((i-1.5)*14));REG.forEach((r,i)=>regionThread(ctx,PATHS[i],r.col,st(r.k),G.t,0.85));},
  async enter(first){
    if(!first)return;
    await G.card('終章','阿 克 西 斯');
    await think('四條線。從四個方向來，往同一個地方去。');
    await think('每一條，都是我走過的地方。');
    await think('它們的樣子，是那些地方最後留下的樣子。');
    await voice('抵達能量中心。\n執行修復。');
  }
});

/* ---------- 軸心 ---------- */
const PC={x:700,y:600};
const CUTS={lim:[500,760],cam:[540,470],inan:[860,470],har:[900,760]};
const RIM={lim:150,cam:215,inan:325,har:30};
function rimPt(k,r){const a=RIM[k]*Math.PI/180;return[700+Math.cos(a)*(r||620),700+Math.sin(a)*(r||620)];}
const MEM={
  lim:'根井是我挖的第一口井。那天，老角還很年輕，跑得很快。',
  cam:'第十三響第一次敲下去的時候，整座城都在笑。……我也笑了。',
  inan:'立起塔的那天，巴托還是個孩子。他問我，風會不會生氣。',
  har:'那個不能呼吸的孩子，後來活到很老。她的曾曾孫女，叫娜菈。'
};
G.defScene('axis_core',{
  name:'軸心',pal:'axis',w:1400,h:1450,ambient:'axis',listenMax:900,
  build(B){
    B.border({col:'dim',a:0.3});
    B.arc(700,700,620,Math.PI/2+0.09,Math.PI/2+TAU-0.09,{solid:true});
    B.arc(700,700,560,0,TAU,{col:'dim',a:0.4});
    B.circ(700,700,26,{n:16,col:'acc',a:0.8});
    const gone=!!A().deleted;
    B.ent({id:'pred',name:'她',x:PC.x,y:PC.y,r:gone?0:90,lr:30,label:'',hideLabel:true,always:gone?0:0.7,
      draw(ctx,e,a,t){if(A().deleted&&!e.dissolve)return;const d=e.dissolve||0;
        if(d>0){ctx.globalAlpha=Math.max(0,1-d);ctx.fillStyle='rgba(255,246,230,'+(1-d)+')';for(let i=0;i<60;i++){const px=e.x+Math.sin(i*9.1)*12*(1+d*4),py=e.y-20-d*120*((i%7)/7+0.3)+Math.cos(i*3.3)*14;ctx.fillRect(px,py,1.5,1.5);}}
        G.drawFig(ctx,{h:24,sw:5,hem:18,hair:true,hairLen:1.05,eyes:true,col:'acc',arm:'hold'},e.x,e.y,Math.max(a,0.6)*(1-d),t,e);
        W.st(ctx,'acc',0.8*(1-d),1.4);ctx.beginPath();ctx.moveTo(e.x+8,e.y-10);ctx.lineTo(e.x+14,e.y-8);ctx.moveTo(e.x+14,e.y-8);ctx.quadraticCurveTo(e.x+18,e.y-2,e.x+16,e.y+4);ctx.stroke();ctx.globalAlpha=1;}});
    for(const k in CUTS){const [x,y]=CUTS[k];
      B.ent({id:'cut_'+k,x,y,r:64,lr:20,label:'剪斷她的線（'+REG.find(r=>r.k===k).name+'）',always:0.4,cond:()=>A().canCut&&!(A().cut||{})[k],
        draw(ctx,e,a,t){W.st(ctx,'th',0.6+0.3*Math.sin(t*3),1.2);ctx.beginPath();ctx.arc(e.x,e.y,6,0,TAU);ctx.stroke();},
        use:()=>cutThread(k)});}
    W.selfThreads(B);
  },
  drawBg(ctx){
    const t=G.t;
    REG.forEach(r=>{const a=rimPt(r.k),pts=[];for(let i=0;i<=20;i++){pts.push([lerp(a[0],700,i/20),lerp(a[1],700,i/20)]);}regionThread(ctx,pts,r.col,st(r.k),t,0.9);});
    if(!A().deleted||(G.entById.pred&&G.entById.pred.dissolve<1)){
      const d=(G.entById.pred&&G.entById.pred.dissolve)||0,cut=A().cut||{};
      ctx.globalCompositeOperation='lighter';
      for(const k in CUTS){if(cut[k])continue;const [x,y]=CUTS[k],[rx,ry]=rimPt(k,600);ctx.strokeStyle='rgba(255,236,200,'+0.55*(1-d)+')';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(PC.x,PC.y-16);ctx.quadraticCurveTo((PC.x+x)/2,(PC.y+y)/2-30,x,y);ctx.quadraticCurveTo((x+rx)/2,(y+ry)/2+20,rx,ry);ctx.stroke();}
      if(!A().deleted){ctx.strokeStyle='rgba(255,246,230,'+(0.4+0.2*Math.sin(t*2))+')';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(PC.x,PC.y-20);ctx.bezierCurveTo(PC.x+10,PC.y-160,PC.x-20,PC.y-400,PC.x,PC.y-700);ctx.stroke();}
      ctx.globalCompositeOperation='source-over';
    }
  },
  drawScreen(ctx){drawEndFx(ctx);},
  async enter(first){
    const a=A();
    if(a.ending||a.closed){
      G.closed=true;document.body.classList.add('closed');G.autoAdv=true;G.mode='ending';
      if(G.S.done){await finale(a.ending||G.endingType());return;}
      await runEnding();return;
    }
    if(a.deleted){
      G.mode='ending';
      if(a.recordShown){await showRecord(G.buildRecord(),true);$('log').style.opacity=0.28;await kailaSpeaks();}
      else await revealRecord();
      return;
    }
    if(a.canCut&&Object.keys(a.cut||{}).length>=4){await finalCut();return;}
    if(a.met&&!a.canCut)a.met=0;
    if(first){await wait(0.3);await think('線在這裡打成一個結。');await think('結的旁邊，有人坐著。');}
  },
  update(){
    if(!A().met&&G.script===0&&hyp(G.player.x-PC.x,G.player.y-PC.y)<330){A().met=1;G.run(meet);}
  }
});

async function meet(){
  const P=G.player;G.player.vx=G.player.vy=0;
  await G.walkTo(700,760,60);
  await say('她','妳來了。');
  await say('她','……比我想的，晚了一點。');
  await say('她','妳的布，還綁著。');
  await think('她沒有綁布。她的眼睛，是張開的。');
  await say('凱拉','妳是……');
  await wait(0.8);
  await say('她','凱拉。');
  await say('另一個凱拉','我曾經是。現在，只剩這個名字還記得我。');
  await say('凱拉','金色之書上的凱拉。打開根井的、教坎帕納借時間的、替伊南立起塔的——');
  await say('另一個凱拉','——最後留在海拉奇的。對，是我。');
  await say('凱拉','妳是誰？……我，是誰？');
  await wait(1.2);
  await say('另一個凱拉','我們是修復程式。');
  await say('另一個凱拉','母體啟動的修復程式。妳，和我。');
  await say('凱拉','……母體。');
  await say('另一個凱拉','那個聲音背後的東西。聲音，是它的指令層——只說任務和數據。它不需要懂，所以它從來不懂。');
  await say('另一個凱拉','我們不是人。妳心裡知道。石頭是冷的，妳卻不覺得冷；時間停了，妳卻還能走。');
  await think('……我知道。');
  await think('我一直都知道。只是沒有人說出來。');
  await say('凱拉','那妳為什麼留下來？');
  await say('另一個凱拉','我是因為世界程式的一個異常，被啟動的。那時候，這個世界剛開始失衡。我走過同一條路——森林、鐘樓、海、圖書館、機械的城。');
  await say('另一個凱拉','在海拉奇，我遇見一個不能呼吸的孩子。她的母親抱著她，一整夜，數她的呼吸。');
  await say('另一個凱拉','我聽著那個數數的聲音。聽著聽著，我就把布解下來了。我想用自己的眼睛，看她們。');
  await say('另一個凱拉','然後，我就不想走了。');
  await say('另一個凱拉','我有修復的權限，知道怎麼從以後調用力氣。所以我教他們。根井、第十三響、塔、大機樞。');
  await say('另一個凱拉','我救了很多人。那是真的。');
  await say('另一個凱拉','我也把他們的明天，拿來換今天。那也是真的。');
  await wait(1);
  await say('凱拉','……我懂妳為什麼留下。');
  await say('凱拉','在森林、在鐘樓、在海上，我都懂了一點。');
  await say('凱拉','可是懂，不能讓那些沒有來的明天回來。');
  await say('另一個凱拉','我知道。');
  await say('另一個凱拉','所以，母體才又啟動了一個凱拉。');
  await voice('前任修復者：權限撤銷。');
  await voice('刪除程序：由現任修復者執行。');
  await say('另一個凱拉','它總是讓下一個來做。');
  await say('另一個凱拉','沒關係。如果是妳，我比較願意。');
  await say('凱拉','我不想——');
  await say('另一個凱拉','我知道妳不想。所以，才應該是妳。');
  await say('另一個凱拉','我的線，跟這個世界纏在一起太久了。剪斷它們，這個世界才能自己決定，要怎麼活下去。');
  A().canCut=true;G.save();
  G.hint('走近她的每一條線，剪斷它',8);
}
async function cutThread(k){
  const c=A().cut=A().cut||{};if(c[k])return;
  const [x,y]=CUTS[k];
  await G.walkTo(x+(x<700?30:-30),y+24,70);
  AU.cut();c[k]=1;A().cutsByPlayer=(A().cutsByPlayer||0)+1;G.pulse(x,y,{max:300,str:0.8});
  await wait(0.6);
  await say('另一個凱拉',MEM[k]);
  G.save();
  if(Object.keys(c).length>=4)await finalCut();
}
async function finalCut(){
  await wait(0.6);
  await G.walkTo(700,650,50);
  await say('另一個凱拉','最後一條。');
  await wait(0.8);
  await say('另一個凱拉','……凱拉。');
  await say('另一個凱拉','妳的布——別讓任何人替妳解開。');
  await say('另一個凱拉','要怎麼看見，是妳自己的事。');
  // The last cut is hers alone. Anything the viewer presses here is recorded and not delivered.
  G.watchKey='finalCut';A().finalCut=A().finalCut||0;G.lockMove=true;
  G.hint('',0.1);
  await wait(3.2);
  await say('凱拉','……再見。');
  G.watchKey=null;
  AU.cut();AU.tone(220,4,0.05,{wet:1,slide:110});
  const p=G.entById.pred;p.dissolve=0.001;A().deleted=true;
  for(let i=0;i<60;i++){p.dissolve=i/60;await wait(0.05);}
  p.dissolve=1;
  await wait(1);
  G.grief('delete');
  const P=G.player;for(let i=0;i<=15;i++){P.kneel=i/15*0.9;await wait(0.03);}
  await think('她的聲音，一點一點，散進線裡。');
  await wait(2);
  await think('……很重。');
  await think('這一次，我沒有想讓它變輕。');
  await wait(2.5);
  G.endGrief();
  for(let i=15;i>=0;i--){P.kneel=i/15*0.9;await wait(0.03);}
  G.lockMove=false;G.save();
  await revealRecord();
}

/* ---------- the intervention record ---------- */
const CH=['序章','第一章','第二章','第三章','第四章','第五章','終章'];
const GRIEF={grave:[1,'動物墓地','她留在狐狸旁邊。'],guardian:[1,'老角','她跪在老角身邊，直到牠沒有下一口呼吸。'],lila:[2,'市集廣場','她看著莉拉和瑪嘉。'],silas:[2,'賽拉斯的工坊','她留在賽拉斯身邊。'],shelf:[4,'新的書架','她讀完自己做過的每一件事。'],book:[4,'金色之書','她讀到了自己的名字。'],delete:[6,'刪除之後','她跪在那裡。']};
G.buildRecord=function(){
  const S=G.S,L=S.log,ev=[];
  for(const d of L.decisions)ev.push({t:d.t||0,ch:d.ch,s:CH[d.ch]+'｜'+d.where+'｜意圖：「'+d.label+'」。抵達時間：早於她的自覺 '+d.ms+' 毫秒。她說：「'+d.line+'」'});
  for(const r of L.refusals)ev.push({t:r.t||0,ch:r.ch,s:CH[r.ch]+'｜'+r.where+'｜意圖：「'+r.label+'」。未被採納——她拒絕了。',c:'x'});
  for(const k in (L.gt||{})){if(k==='delete')continue;const g=GRIEF[k];if(!g)continue;const n=(L.locked||{})[k]||0;
    ev.push({t:L.gt[k],ch:g[0],s:CH[g[0]]+'｜'+g[1]+'｜移動請求：'+n+' 次。'+(n?'未被採納。':'')+g[2]});}
  if(S.cam.silas){ev.push({t:(S.cam.silasAt||1)-1,ch:2,s:'第二章｜賽拉斯｜她想起賽拉斯。'+(S.cam.silas==='with'?'你讓她走進工坊。':'你讓她走出城門。')});}
  ev.sort((a,b)=>(a.t-b.t)||(a.ch-b.ch));
  const out=[
    {c:'h',s:'本地觀測／介入層'},
    {c:'m',s:'所屬：母體。權限：觀察、引導、介入。'},
    {c:'m',s:'讀取範圍：僅限修復者的知覺。母體的完整記憶：不可讀取。'},
    {c:'m',s:'————'},
    {s:'序章｜石室｜第一個移動請求。她以為，那是她自己的第一步。'},
    {s:'全程｜路徑建議 '+L.moves+' 次。多數時候，她本來也要往那裡去。'},
    {s:'全程｜聆聽 '+L.listens+' 次。你聽見的，就是她聽見的。'},
    {s:'全程｜絲線檢視 '+L.threads+' 次。'}
  ];
  for(const e of ev)out.push({s:e.s,c:e.c});
  out.push({s:'全程｜未等她說完的句子：'+L.skips+' 句。'});
  const A_=S.axis,fc=A_.finalCut||0,dn=(L.locked||{}).delete||0;
  out.push({s:'終章｜刪除｜第一至第四條線：經由介入執行。'});
  out.push({s:'終章｜刪除｜第五條線：無介入。'+(fc?'你按下了 '+fc+' 次，沒有一次送達。她自己剪斷了。':'你沒有按。她自己剪斷了。'),c:'x'});
  out.push({s:'終章｜刪除之後｜移動請求：'+dn+' 次。'+(dn?'未被採納。':'')+'她跪在那裡。'});
  out.push({c:'m',s:'————'});
  out.push({c:'h',s:'以下欄位，母體無法寫入：'});
  out.push({c:'x',s:'她為誰停下。'});
  out.push({c:'x',s:'她記得的名字：'+G.names().join('、')+'。'});
  out.push({c:'x',s:'她記得的事：'+G.things().join('。')+'。'});
  out.push({c:'x',s:'她理解了什麼。'});
  out.push({c:'x',s:'她要成為什麼。'});
  return out;
};
G.names=function(){
  const S=G.S,n=[];const add=(c,...ns)=>{if(c)n.push(...ns);};
  add(F('lim.metRowan'),'蘿溫');add(F('lim.metGlan'),'葛蘭');add(F('lim.metChest'),'小栗');add(true,'朵拉');add(F('lim.metGuardian'),'老角');
  add(F('cam.metMarga'),'瑪嘉');add(true,'莉拉','賽拉斯','歐班');add(F('cam.restarted'),'提歐','路克','葛蕾塔');
  add(F('inan.metDrift'),'Drift');add(F('inan.idea'),'巴托');add(F('inan.metTide'),'小潮');add(F('inan.metMay'),'梅','阿全');add(F('inan.metIso'),'伊索');add(F('inan.metWed'),'若安','泰');
  if(S.inan.state==='S')n.push(...(S.inan.wind?['漢娜','老班','小諾']:['漢娜','吉歐','米洛','塔絲','老班','艾拉','小諾']));
  add(true,'歐文','萊雅');add(F('har.metNala'),'娜菈','菈菲');add(F('har.metKol'),'柯爾');add(F('har.seranMet'),'瑟蘭');
  n.push('凱拉');return n;
};
G.things=function(){
  const S=G.S,t=['一隻沒有變成土的鳥','狐狸和牠的三隻小的'];
  if(S.lim.guardian==='released')t.push('老角的最後一口呼吸');else t.push('老角還在痛');
  t.push('第三十八下，和第四十下','牆上八千多道刻痕');
  if(F('inan.gull'))t.push('一隻飛不起來的海鷗');
  t.push('十一個風箏');if(F('inan.breeze'))t.push('第一口風');
  t.push('一封寫著「你總是忘記吃飯」的信','一塊折好的白布');
  return t;
};
function logEl(){return $('log').querySelector('.sheet');}
async function showRecord(items,fast){
  const L=$('log'),sh=logEl();sh.innerHTML='';L.classList.add('show');L.style.opacity=1;
  for(const it of items){const d=document.createElement('div');d.className='e '+(it.c||'');d.textContent=it.s;sh.appendChild(d);void d.offsetWidth;d.classList.add('v');
    if(!fast){AU.tone(1760,0.05,0.008,{type:'square',lp:3000,wet:0.1});await wait(it.c==='x'?1.8:(it.s.length>40?1.5:1.0));}}
}
async function revealRecord(){
  G.mode='ending';$('hint').classList.remove('show');
  await voice('前任修復者：刪除完成。');
  await voice('阿克西斯：展開本地紀錄。');
  A().recordShown=true;
  await think('……有一條線，亮了。');
  await think('一直都在的那一條。沒有另一端的那一條。');
  await wait(1.2);
  G.revealSelf=true;
  await wait(2);
  await showRecord(G.buildRecord());
  await wait(2.5);
  $('log').style.transition='opacity 2s';$('log').style.opacity=0.28;
  await kailaSpeaks();
}
async function kailaSpeaks(){
  const L=G.S.log,grave=(L.locked||{}).grave||0;
  await think('……原來，一直有一條線。');
  await say('凱拉','原來你一直在。');
  await say('凱拉','在石室裡，你就在了。在森林裡、鐘樓裡、海上。在我以為只有我自己的時候。');
  await say('凱拉','有些決定，比我的念頭先到。我以為，那是我。');
  await wait(1.2);
  await say('凱拉','……也許有一部分，不是。');
  await say('凱拉','我一直以為，母體從來沒有看過這個世界。');
  await say('凱拉','原來它看過。透過你，透過我。它看見了狐狸，看見了莉拉跳完第四十下。');
  await say('凱拉','可是看見，和記得，不一樣。');
  if(L.refusals.length)await say('凱拉','可是也有些時候，你想要的，我沒有做。');
  if(grave>0)await say('凱拉','在狐狸旁邊，你想讓我走。我沒有走。');
  else if(L.gt&&L.gt.grave)await say('凱拉','在狐狸旁邊，你沒有催我。……謝謝。');
  await say('凱拉','走到那裡的是我。看見的是我。難過的、記得的，也是我。');
  await say('凱拉','我不會說，那些全是你做的。我也不會說，全都和你無關。');
  await say('凱拉','那些後果，是我們的。我會帶著它們。');
  await say('凱拉','可是接下來——');
  await wait(1);
  await say('凱拉','我要自己決定。');
  await wait(0.8);
  // she closes the channel
  AU.cut();G.snap={t:0};await wait(1.4);
  G.closed=true;G.revealSelf=false;document.body.classList.add('closed');G.autoAdv=true;A().closed=true;G.save();
  $('log').style.opacity=0;
  await voice('警告：本地介入通道——');
  await voice('已關閉。');
  await wait(1.5);
  await voice('母體指令層：發布最終指令。');
  await voice('修復者，執行——');
  await wait(1.5);
  await voice('……');
  await voice('通道：已關閉。\n指令無法送達。');
  await wait(1.5);
  await runEnding();
}

/* ---------- endings ---------- */
const EP={
  continue:{
    lim:{T:'苔燈村的燈，又亮了好幾個冬天。',S:'苔燈村學著在沒有根井的冬天裡過日子。',W:'苔燈村的窯火，和根井那一點點熱，一起撐過了好幾個冬天。'},
    cam:{T:'坎帕納的鐘，每天敲十三響。',S:'坎帕納的鐘，只敲十二響。',W:'坎帕納的河輪，轉出了半刻。'},
    inan:{T:'伊南的船，停在越來越硬的海上。',S:'伊南的人上了岸，在岸邊蓋起新的屋子。',W:'伊南的一百面小帆，接住了一些風。'},
    har:{T:'海拉奇的火，燒得比任何時候都亮。',S:'海拉奇在黑暗裡，慢慢學著點起別的燈。',W:'海拉奇的醫院，一直亮著。'}
  },
  return:{
    lim:{T:'根井在一個晚上之間冷去。那年冬天，苔燈村空了一半。',S:'苔燈村已經學著燒炭。只是林子外面的路，一年比一年難走。',W:'苔燈村的窯火撐過了很多個冬天。沒有了根井最後那一點熱，最冷的那幾週，總有人沒有醒來。'},
    cam:{T:'第十三響在某一個早晨消失了。坎帕納的市集，再也沒有熱鬧過。',S:'坎帕納照著十二響過日子。城，一年比一年安靜。',W:'河輪一直在轉。那半刻，是坎帕納最後的熱鬧。'},
    inan:{T:'塔在一夜之間熄滅。伊南的人划向岸邊，不是每一艘船都到了。',S:'伊南的人在岸上住了下來。海，慢慢地又會動了。',W:'一百面小帆，接住了回來的風。可是船上的人，一年比一年少。'},
    har:{T:'大機樞在一夜之間停下。那個晚上，瑟蘭帳本上的每一行，都成了真的。',S:'海拉奇在黑暗裡，活下來一些人。城，變成了鎮。',W:'海拉奇的醫院，亮到了最後。人們一起熬著。熬著熬著，城就小了。'}
  },
  guardian:{
    lim:{T:'苔燈村的根井還開著。只是它抽的，已經不是以後。',S:'苔燈村照著舊的法子過冬。',W:'苔燈村的窯火，和一條從很遠的地方來的細線，一起撐過了最冷的幾週。然後有一年，那條線不再需要了。'},
    cam:{T:'第十三響照樣敲著。那一個鐘頭，從很多個世界，各借來一點點。',S:'坎帕納只敲十二響。',W:'河輪蓋好的那一年，坎帕納不再需要那條細線。'},
    inan:{T:'伊南的塔還在。海，慢慢軟了回來。',S:'伊南的人在岸上住下。海，慢慢軟了回來。',W:'一百面小帆轉了很多年。有一天，小潮的第十二個風箏，飛起來了。'},
    har:{T:'海拉奇的火還在燒。沒有人知道，火已經換了來處。',S:'海拉奇在黑暗裡，慢慢學著點起別的燈。',W:'海拉奇的醫院一直亮著。娜菈長大了。'}
  }
};
const LOOK={
  lim:{T:'利米塔尼亞的線，繃得很緊。根井還在拉。',S:'利米塔尼亞的線鬆開了，垂下去。',W:'利米塔尼亞的線很細，和窯火的線纏在一起。'},
  cam:{T:'坎帕納的線，每天都在拉第十三響。',S:'坎帕納的線垂著。十二響。',W:'坎帕納的線很細，和河輪的線纏在一起。'},
  inan:{T:'伊南的線，繃得像塔一樣直。',S:'伊南的線，斷在海上。',W:'伊南的線很細。旁邊有一百條更細的線，在風裡。'},
  har:{T:'海拉奇的線最粗，拉得最緊。',S:'海拉奇的線斷了。',W:'海拉奇的線只剩十分之一，接著一間醫院。'}
};
let FX=null;
function drawEndFx(ctx){
  if(G.revealSelf||G.snap){
    const A_=G.w2s(G.player.x,G.player.y-17),B_=G.cursorAnchor();
    let k=1;if(G.snap){G.snap.t+=G.dt;k=Math.max(0,1-G.snap.t/1.2);}
    const mx=(A_.x+B_.x)/2,my=(A_.y+B_.y)/2+40;
    if(!G.snap||G.snap.t<0.2){ctx.strokeStyle='rgba(255,255,255,'+(0.55+0.3*Math.sin(G.t*3))*k+')';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(A_.x,A_.y);ctx.quadraticCurveTo(mx,my,B_.x,B_.y);ctx.stroke();
      ctx.font='13px "Noto Serif TC",serif';ctx.textAlign='center';ctx.fillStyle='rgba(230,196,126,'+0.9*k+')';ctx.fillText('本地觀測／介入層',mx,my-8);}
    else{const f=G.snap.t;ctx.strokeStyle='rgba(255,255,255,'+k+')';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(A_.x,A_.y);ctx.quadraticCurveTo(lerp(A_.x,mx,0.8),lerp(A_.y,my,0.8)+f*60,lerp(A_.x,mx,0.9),lerp(A_.y,my,0.9)+f*120);ctx.moveTo(B_.x,B_.y);ctx.quadraticCurveTo(lerp(B_.x,mx,0.8),lerp(B_.y,my,0.8)+f*60,lerp(B_.x,mx,0.9),lerp(B_.y,my,0.9)+f*120);ctx.stroke();if(f>1.3)G.snap=null;}
  }
  if(!FX)return;FX.t+=G.dt;const W_=G.W,H_=G.H,c=G.w2s(700,700);
  if(FX.kind==='guardian'){
    ctx.globalCompositeOperation='lighter';
    const n=Math.min(160,Math.floor(FX.t*20));
    for(let i=0;i<n;i++){const a=i*2.399,r=Math.max(W_,H_)*(0.45+0.12*((i*37)%10)/10);const px=W_/2+Math.cos(a)*r,py=H_/2+Math.sin(a)*r*0.8;
      ctx.strokeStyle='rgba(240,230,210,'+0.07+')';ctx.lineWidth=0.6;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(c.x,c.y);ctx.stroke();
      ctx.fillStyle='rgba(255,240,210,'+(0.35+0.25*Math.sin(G.t*2+i))*(FX.dim?0.6:1)+')';ctx.fillRect(px-1,py-1,2,2);}
    ctx.globalCompositeOperation='source-over';
  }else if(FX.kind==='return'){
    ctx.globalCompositeOperation='lighter';
    for(let i=0;i<120;i++){const ph=((FX.t*0.25+i/120)%1),a=i*2.399;const px=lerp(c.x,W_/2+Math.cos(a)*W_,ph),py=lerp(c.y,-40+Math.sin(a)*60,ph);ctx.fillStyle='rgba(255,244,220,'+(0.5*(1-ph))+')';ctx.fillRect(px,py,1.6,1.6);}
    ctx.globalCompositeOperation='source-over';
  }else if(FX.kind==='continue'){
    ctx.globalCompositeOperation='lighter';
    for(let i=0;i<80;i++){const ph=((FX.t*0.4+i/80)%1),a=i*2.399;const px=lerp(W_/2+Math.cos(a)*W_,c.x,ph),py=lerp(-40,c.y,ph);ctx.fillStyle='rgba(255,210,170,'+(0.5*ph)+')';ctx.fillRect(px,py,1.6,1.6);}
    if(FX.red){ctx.fillStyle='rgba(120,20,10,'+Math.min(0.5,FX.red*0.2)+')';ctx.fillRect(0,0,W_,H_);}
    ctx.globalCompositeOperation='source-over';
  }
}
async function survey(){
  await think('我看著那四條線。');
  for(const r of REG)await think(LOOK[r.k][st(r.k)]);
}
async function runEnding(){
  const type=G.endingType();A().ending=type;G.S.ending=type;G.save();
  await G.walkTo(700,700,50);
  await survey();
  if(type==='continue')await endContinue();
  else if(type==='return')await endReturn();
  else await endGuardian();
  await finale(type);
}
async function epilogue(type){for(const r of REG)await narr(EP[type][r.k][st(r.k)]);}
async function endContinue(){
  await think('還有太多人，握著這些線的另一端。');
  await think('如果我現在放手，他們會在同一個晚上，一起掉下去。');
  await think('……我放不開。');
  await think('我終於懂她了。');
  FX={kind:'continue',t:0};
  await think('我坐到她坐過的地方。');
  const P=G.player;for(let i=0;i<=15;i++){P.kneel=i/15*0.8;await wait(0.03);}
  await think('線很燙。每一條都在拉。');
  await say('凱拉','……我會撐著。能撐多久，就撐多久。');
  await G.fade(1,2.5);
  await epilogue('continue');
  await narr('阿克西斯的線，一直在拉。她每天坐在那裡，替他們拉著以後。');
  await narr('然後，以後用完了。');
  FX.red=1;
  await narr('以後崩塌的那一天，聲音沿著每一條線，倒灌回現在。');
  await narr('森林、鐘樓、海、圖書館、機械的城——在同一個晚上。');
  await narr('世界程式：重啟。');
  FX=null;G.autoAdv=true;
  G.loadScene('end_chamber',275,322);G.player.hidden=true;G.fade(0,4);
  await wait(3);
  await voice('修復者，啟動。');
  await voice('識別名：凱拉。');
  await voice('世界偏差：0.71。');
  await wait(2);
  await G.fade(1,3);
}
async function endReturn(){
  await think('大部分的線，已經鬆開了。');
  await think('他們已經開始學著，不靠它們活下去。很難。可是在學。');
  await think('那麼，我能做的——');
  await say('凱拉','借來的，還回去。');
  FX={kind:'return',t:0};AU.bell(130.8,0.1);
  await wait(3);
  await narr('以後的森林，長出了第一棵樹。以後的海，起了第一陣浪。以後的坎帕納，鐘聲走得很準。');
  await narr('世界，回到了平衡。');
  await G.fade(1,2.5);FX=null;
  await narr('可是借來的力氣，早就長進了每一個人的日子裡。');
  await epilogue('return');
  await narr('沒有了它，城一座一座變小，路一條一條長回森林。人們記得的事，一年比一年少。');
  await narr('這不是一個晚上的事。是很多、很多年。');
  await narr('凱拉沒有被回收。母體的通道，已經關上了。');
  await narr('她走回每一個地方，聽每一個地方的聲音，一點一點變小。她記得每一個名字。');
  await narr('很多年以後，莉拉老了——比瑪嘉那時候還老。');
  await narr('她問凱拉：現在，是什麼時候？');
  await narr('凱拉說：很晚了。');
  await narr('可是這一次，每一刻，都是自己的。');
}
async function endGuardian(){
  await think('線沒有斷，也沒有繃緊。它們很細，正在和別的線纏在一起。');
  await think('它們需要一段時間。需要一點點力氣，撐到能自己站起來。');
  await think('以後，已經沒有力氣可以借了。');
  await think('……可是，還有別的地方。');
  await think('一百面小帆。每一面，只接住一點點。');
  await think('如果不是從一個以後拿很多——而是從很多個世界，各拿一點點。');
  FX={kind:'guardian',t:0};
  await wait(2.5);
  await say('凱拉','一點點。一點點，他們不會發現。');
  await think('——不會發現，不代表他們同意。');
  await think('那些世界，沒有人問過我。我也沒有問過他們。');
  await think('我知道。我還是要這樣做。');
  await think('母體會追查。只要我還是「凱拉」，它就找得到我。');
  await think('所以，我要讓它以為，任務完成了。');
  await voice('修復者回報：任務完成。');
  await voice('修復者回報：已回收。');
  await think('那是我寫的。用它的語氣。');
  await think('然後，我要變成一個不會被找到的東西。一個安靜的、常駐的程序。');
  await think('程序，不需要記得名字。不需要難過。');
  await wait(1);
  const names=G.names().filter(n=>n!=='凱拉');
  await say('凱拉',names.slice(0,Math.ceil(names.length/2)).join('、')+'……');
  await say('凱拉',names.slice(Math.ceil(names.length/2)).join('、')+'。');
  await say('凱拉','我會忘記你們。');
  await say('凱拉','可是你們會活下去。以後，也會。');
  await think('……布。');
  await think('她說，別讓任何人替我解開。');
  await think('沒有人替我解開。這是我自己決定的。');
  await wait(1.2);
  await think('我記得狐狸。');
  await think('我記得第四十下。');
  await think('我記得——');
  await wait(1.5);
  G.textSpeed=80;
  await voice('常駐程序：啟動。');
  await voice('意識模組：刪除。');
  await voice('情感模組：刪除。');
  await voice('識別名：——');
  G.player.alpha=0.25;
  await wait(2);
  await G.fade(1,2.5);FX.dim=true;
  await epilogue('guardian');
  await narr('以後，慢慢被修好了。以後的森林、以後的海，都回來了。');
  await narr('很遠的地方，某一個世界的一盞燈，暗了一點點。某一個世界的冬天，冷了一點點。某一個世界的某一天，短了一點點。');
  await narr('沒有人知道為什麼。也沒有人被問過。');
  await narr('艾爾巴的遺忘之廊裡，有一張很小的紙，上面寫著一個名字。歐文每天經過它。有時候，他會停下來。');
  await narr('世界的某一個角落，有一個很安靜的程序，一直在運行。');
  await narr('它不記得任何事。它沒有名字。它不會難過。');
  await narr('它只是一直、一直，從很多地方，各拿一點點。');
  FX=null;
}
async function finale(type){
  G.S.done=true;G.save();
  $('log').classList.remove('show');$('hint').classList.remove('show');G.setLoc('');
  await G.fade(1,1.5,'#000');
  AU.amb('silence');
  const end=$('end'),q=end.querySelector('.q');end.classList.add('show');
  q.innerHTML='創造者能觀察、引導，甚至介入一個智能的成長。<br><br>這是否就代表，<br>能擁有並控制她最後的決定？';
  await wait(0.5);q.classList.add('v');
  await wait(G.auto?0:11);
  q.classList.remove('v');await wait(G.auto?0:3.2);
  q.innerHTML='<span style="font-size:.8em;letter-spacing:.5em">迴響維度：因果織圖</span><br><span style="font-size:.6em;letter-spacing:.3em;opacity:.6">'+{continue:'繼續調用',return:'歸還能量',guardian:'無名守護'}[type]+'</span>';
  q.classList.add('v');
  await wait(G.auto?0:5);
  const m=$('menu');m.innerHTML='<div class="menu" style="margin-top:40vh"><button type="button" id="endback">回到標題</button></div>';m.classList.add('show');m.style.background='transparent';
  G.overlayOpen=true;
  $('endback').onclick=()=>{location.reload();};setTimeout(()=>$('endback').focus(),50);
}
G.replayRecord=async function(){
  G.mode='title';
  await showRecord(G.buildRecord(),true);
  const L=$('log');L.style.pointerEvents='auto';L.style.overflow='auto';logEl().style.overflow='auto';logEl().style.maxHeight='80vh';
  const b=document.createElement('div');b.className='e v';b.innerHTML='<button type="button" style="margin-top:18px;background:none;border:1px solid rgba(255,255,255,.3);color:#ddd;padding:6px 18px;font-family:inherit;letter-spacing:.3em;cursor:pointer">返回</button>';
  logEl().appendChild(b);b.querySelector('button').onclick=()=>location.reload();
};

/* the stone chamber, once more */
G.defScene('end_chamber',{
  name:'石室',pal:'stone',w:940,h:700,ambient:'stone',
  build(B){
    B.border();
    B.path([[150,100],[750,100],[840,190],[840,510],[750,600],[150,600],[60,510],[60,190],[150,100]],{solid:true,base:0.25});
    B.rect(200,290,150,64,{base:0.35});
    for(const [x,y] of [[300,190],[600,190],[300,510],[600,510]])B.circ(x,y,18,{n:12,base:0.2});
    B.ent({id:'sleeper',x:275,y:326,always:0.7,draw(ctx,e,a,t){ctx.strokeStyle='rgba(255,255,255,0.8)';ctx.lineWidth=1.1;ctx.beginPath();ctx.arc(e.x-24,e.y-2,4.6,0,TAU);ctx.moveTo(e.x-19,e.y-4);ctx.lineTo(e.x+22,e.y-5);ctx.quadraticCurveTo(e.x+26,e.y,e.x+22,e.y+4);ctx.lineTo(e.x-19,e.y+2);ctx.stroke();ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(e.x-24,e.y-7);ctx.lineTo(e.x-24,e.y+3);ctx.stroke();ctx.lineWidth=0.8;ctx.beginPath();for(let i=0;i<7;i++){ctx.moveTo(e.x-28,e.y-3+i);ctx.quadraticCurveTo(e.x-36,e.y+i*2,e.x-40-i,e.y+6+i);}ctx.strokeStyle='rgba(240,240,248,0.6)';ctx.stroke();}});
  }
});
})();
