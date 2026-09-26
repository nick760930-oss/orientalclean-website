/* 第四章 — 艾爾巴 */
(function(){
'use strict';
const {F,set,TAU,hyp,clamp}=G;
const say=(...a)=>G.say(...a),think=t=>G.think(t),voice=t=>G.voice(t),wait=s=>G.wait(s),narr=t=>G.narr(t);
const E=()=>{const s=G.S.elba;if(!s.cl)s.cl={};return s;};
const owenName=()=>F('elba.owen');

function owenFig(){return{broken:!owenName(),h:36,sw:6,hem:15,coat:true,beard:true};}
function shelfRow(B,x0,x1,y,o){B.rect(x0,y,x1-x0,26,Object.assign({solid:true},o));for(let x=x0+14;x<x1;x+=16)B.seg(x,y+4,x,y+22,{col:'dim',a:0.55});}
function record(B,id,x,y,label,use,o){
  return B.ent(Object.assign({id,x,y,r:52,lr:18,label,hy:y-16,
    draw(ctx,e,a){W.st(ctx,e.rew?'line':'warm',Math.max(a,0.15),1);ctx.beginPath();ctx.rect(e.x-8,e.y-12,16,22);ctx.stroke();if(e.rew){ctx.beginPath();ctx.moveTo(e.x-6,e.y-4);ctx.lineTo(e.x+6,e.y-4);ctx.moveTo(e.x-6,e.y-1);ctx.lineTo(e.x+6,e.y-1);ctx.stroke();}},
    use},o));
}

/* ---------- 白階 ---------- */
G.defScene('elba_steps',{
  name:'白階',pal:'elba',w:1200,h:1000,ambient:'elba',
  build(B){
    B.border();
    for(let y=250;y<960;y+=30)B.seg(300,y,900,y,{col:'dim',a:0.55});
    B.wall(300,200,300,1000);B.wall(900,200,900,1000);
    B.wall(300,200,520,200);B.wall(680,200,900,200);B.arc(600,200,80,Math.PI,TAU,{col:'line'});
    B.wall(520,200,520,0,{col:'dim'});B.wall(680,200,680,0,{col:'dim'});
    B.ent({id:'owen',name:'守書人',x:600,y:260,r:70,label:'守書人',fig:owenFig(),cond:()=>F('elba.owenMet')||G.player.y<520,use:owenTalk,
      update(dt,e){if(!F('elba.owenMet')&&G.script===0&&G.player.y<520){set('elba.owenMet');G.run(owenTalk);}}});
    W.selfThreads(B);
    B.exit(520,0,160,40,'elba_hall',800,1320,{cond:()=>F('elba.owenMet')});
    B.exit(300,970,600,30,null,0,0,{cond:()=>F('elba.done'),blocked:async()=>{await think('下面什麼都沒有。只有來的路。');},go:leaveElba});
  },
  async enter(first){
    if(!first)return;
    await G.card('第四章','艾 爾 巴');
    await think('白色。');
    await think('回來的聲音，像墨水滴在紙上。每一道形狀，都是黑的。');
    await think('這裡很安靜。不是停住的安靜，是沒有人說話的安靜。');
  }
});
async function owenTalk(){
  if(F('elba.owenTalked')){await say('守書人','三條廊道。改寫、刪除、遺忘。書不會跑，但妳要自己去找。');return;}
  set('elba.owenTalked');
  await say('守書人','……訪客。');
  await say('守書人','已經很久沒有訪客了。久到我忘了該怎麼說歡迎。');
  await say('凱拉','這裡是哪裡？');
  await say('守書人','艾爾巴。被改寫的、被刪掉的、被遺忘的，都放在這裡。');
  await say('守書人','我是這裡的守書人。我的名字……');
  await wait(1);
  await say('守書人','我的名字，被刪掉了。');
  await say('守書人','不是忘了。忘掉的東西，還在某個地方；刪掉的東西，只剩下一個洞。');
  await say('凱拉','我在找一件事的來由。這個世界，為什麼開始向以後要東西。');
  await say('守書人','那妳要找的，不在一本書裡。在三條廊道裡。');
  await say('守書人','改寫之廊，放著被改過的。刪除之廊，放著被刪掉的。遺忘之廊，放著沒有人記得的。');
  await say('守書人','……如果妳在那裡，剛好看見一個名字——一個守書人的名字——請告訴我。');
  await voice('區域：艾爾巴。\n此區記錄與索引：不一致。\n建議：略過。');
  await say('凱拉','略過？');
  await say('凱拉','你不想讓我看？');
  await voice('此區資料：不在任務範圍。');
  await think('這一次，我不打算照做。');
}

/* ---------- 中廳 ---------- */
G.defScene('elba_hall',{
  name:'中廳',pal:'elba',w:1600,h:1400,ambient:'elba',
  build(B){
    B.border();
    const ring=(R,gap,o)=>{for(let k=0;k<16;k++){const a0=k/16*TAU+0.06,a1=(k+1)/16*TAU-0.06;const mid=(a0+a1)/2;let skip=false;for(const g of [0,Math.PI/2,Math.PI,Math.PI*1.5])if(Math.abs(Math.atan2(Math.sin(mid-g),Math.cos(mid-g)))<gap)skip=true;if(skip)continue;B.arc(800,700,R,a0,a1,o);}};
    ring(560,0.2,{solid:true});ring(520,0.2,{col:'dim',a:0.5});ring(380,0.25,{col:'dim',a:0.6});
    for(let k=0;k<32;k++){const a=k/32*TAU;let skip=false;for(const g of [0,Math.PI/2,Math.PI,Math.PI*1.5])if(Math.abs(Math.atan2(Math.sin(a-g),Math.cos(a-g)))<0.3)skip=true;if(skip)continue;B.seg(800+Math.cos(a)*525,700+Math.sin(a)*525,800+Math.cos(a)*555,700+Math.sin(a)*555,{col:'dim',a:0.5});}
    // corridors to the edges
    B.wall(760,0,760,140);B.wall(840,0,840,140);B.wall(0,660,240,660);B.wall(0,740,240,740);B.wall(1360,660,1600,660);B.wall(1360,740,1600,740);B.wall(760,1260,760,1400);B.wall(840,1260,840,1400);
    B.circ(800,640,26,{solid:true,n:14});
    B.ent({id:'book',x:800,y:640,r:80,lr:30,label:'金色之書',ay:-26,always:0.4,
      draw(ctx,e,a,t){const g=ctx.createRadialGradient(e.x,e.y-20,0,e.x,e.y-20,50);g.addColorStop(0,'rgba('+G.pal.warm+','+(0.18+0.06*Math.sin(t*1.4))+')');g.addColorStop(1,'rgba('+G.pal.warm+',0)');ctx.fillStyle=g;ctx.fillRect(e.x-50,e.y-70,100,100);
        W.st(ctx,'warm',Math.max(a,0.6),1.3);ctx.beginPath();ctx.moveTo(e.x-16,e.y-28);ctx.lineTo(e.x,e.y-24);ctx.lineTo(e.x+16,e.y-28);ctx.lineTo(e.x+16,e.y-12);ctx.lineTo(e.x,e.y-8);ctx.lineTo(e.x-16,e.y-12);ctx.closePath();ctx.moveTo(e.x,e.y-24);ctx.lineTo(e.x,e.y-8);ctx.stroke();},
      use:goldenBook});
    B.rect(700,880,200,28,{solid:true});
    B.ent({id:'shelf',x:800,y:900,r:90,lr:40,label:'新的書架',hy:870,
      draw(ctx,e,a,t){ctx.fillStyle='rgba('+G.pal.line+','+Math.max(a,0.2)*0.8+')';for(let i=0;i<14;i++){const h=10+(i*7%9);ctx.fillRect(e.x-94+i*13.5,e.y-h-2,2,h);}},
      use:newShelf});
    B.ent({id:'owen',name:owenName()?'歐文':'守書人',x:900,y:720,r:70,label:owenName()?'歐文':'守書人',fig:owenFig(),use:owenHall});
    W.selfThreads(B);
    B.thread({a:'shelf',b:'kaila',label:'新的書架 — 凱拉',tag:'新的書架',desc:'書架上的線，一條一條都連到我身上。'});
    B.thread({a:'book',b:'shelf',label:'金色之書 — 新的書架',tag:'金色之書',desc:'兩者之間有一條很舊的線。舊到它好像比這座圖書館還早。'});
    B.exit(760,0,80,40,'elba_forgotten',700,840);
    B.exit(0,660,40,80,'elba_rewritten',1340,450);
    B.exit(1560,660,40,80,'elba_deleted',60,450);
    B.exit(760,1360,80,40,'elba_steps',600,300);
  },
  async enter(first){if(first){await wait(0.3);await think('一座圓形的大廳。中間有什麼在發光——不是光，是一種很暖的聲音。');}}
});
async function owenHall(){
  if(owenName()){
    if(!F('elba.shelfRead')){await say('歐文','新的書架，是妳來的那天出現的。它自己在寫。');await say('歐文','我想，妳應該先讀它。');return;}
    if(!F('elba.bookRead')){await say('歐文','然後，是金色之書。');return;}
    await say('歐文','去吧。記得的人，會記得。');return;
  }
  if(F('elba.letter')){
    await say('凱拉','你的名字，是歐文。');
    await wait(1);
    set('elba.owen');G.rebuild();G.pulse(900,700,{max:300,str:0.9});AU.tone(523,1.8,0.04,{wet:1});
    await say('歐文','……歐文。');
    await say('歐文','對。有人這樣叫過我。在吃飯的時候。');
    await say('歐文','刪掉的是記錄。記得的人，沒有被刪掉。');
    await think('他的線條，一道一道接回去了。');
    await say('歐文','新的書架，是妳來的那天出現的。它自己在寫。');
    await say('歐文','我想，妳應該先讀它。然後，是金色之書。');
    G.save();return;
  }
  const n=['elba.trace1','elba.card','elba.letterSeen'].filter(F).length;
  await say('守書人',n?'找到什麼了嗎？——不用急。這裡最多的，就是時間。':'三條廊道。改寫、刪除、遺忘。');
}

/* ---------- 改寫之廊 ---------- */
function rewrittenHall(B,past){
  B.border();
  for(const y of [180,330,480,630])shelfRow(B,160,1240,y);
  const R=[
    ['r1',400,236,'「利米塔尼亞的根井」','利米塔尼亞的根井，由村民自行掘出。','利米塔尼亞的根井，是一名旅人教村民掘的。'],
    ['r2',760,386,'「坎帕納的第十三響」','坎帕納的第十三響，是鐘匠們的發明。','坎帕納的第十三響，是一名旅人教鐘匠們向明天借的。'],
    ['r3',520,536,'「伊南的塔」','伊南的塔，由海上的議會決議建造。','伊南的塔，是一名旅人替海上的人們立起來的。'],
    ['first',1100,386,'「第一次調用」','海拉奇的先知們，在祈禱中，得到了向以後調用能量的方法。','海拉奇的工匠們，在一名旅人的協助下，第一次向以後調用了能量。\n旅人的名字是——凱拉。']
  ];
  R.forEach(([id,x,y,lbl,now,orig])=>record(B,id,x,y,lbl,async()=>{
    if(!past){await think(now);await think('這一頁的字底下，還有別的字。被刮掉，又寫過一次。');return;}
    if(id==='first'){
      await think('刮掉以前的字，還在。');
      for(const l of orig.split('\n'))await think(l);
      if(!F('elba.trace1')){set('elba.trace1');await wait(0.6);await say('凱拉','……凱拉？');await think('旅人的名字，是凱拉。');await think('和我一樣的名字。');G.save();}
      return;
    }
    await think(orig);
  },{rew:!past}));
}
G.defScene('elba_rewritten',{
  name:'改寫之廊',pal:'elba',w:1400,h:900,ambient:'elba',
  build(B){
    rewrittenHall(B,false);
    W.rift(B,'rift',260,790,'裂隙（改寫之前）',async()=>{await G.riftTo('elba_rewritten_past',260,740);});
    W.selfThreads(B);
    B.thread({a:'first',b:'rift',label:'改寫 ← 原本的字',tag:'原本的字',desc:'每一本被改過的書，都有一條線往回連，連到它被改寫以前。'});
    B.exit(1360,400,40,100,'elba_hall',100,700);
  },
  async enter(first){if(first){await wait(0.3);await think('這裡的每一本書，聲音都是雙的。像兩個人同時在念，一個大聲，一個小聲。');}}
});
G.defScene('elba_rewritten_past',{
  name:'改寫之廊（改寫以前）',pal:'elbaPast',w:1400,h:900,ambient:'past',
  build(B){
    rewrittenHall(B,true);
    B.ent({id:'scribe',x:880,y:700,r:70,label:'抄寫的人',fig:{col:'warm',flicker:true,arm:'hold',hood:true},use:async()=>{await say('抄寫的人','改成「先知」。旅人的事，不要留下來。',{src:'scribe'});await say('抄寫的人','……是誰說的？上面說的。',{src:'scribe'});await think('他聽不見我。他一直在寫。');}});
    W.rift(B,'rift',260,790,'回到現在',async()=>{await G.riftTo('elba_rewritten',260,740);},{col:'acc'});
    W.selfThreads(B);
  },
  async enter(){if(!F('elba.pastSeen')){set('elba.pastSeen');await think('改寫以前的走廊。書的聲音，只有一個。');}}
});

/* ---------- 刪除之廊 ---------- */
const HOLES=[['h1',420,236,'f1','借閱卡'],['h2',820,386,'f2','燒掉一半的紙'],['h3',1060,536,'f3','撕下來的一角']];
G.defScene('elba_deleted',{
  name:'刪除之廊',pal:'elba',w:1400,h:900,ambient:'elba',
  build(B){
    B.border();
    for(const y of [180,330,480,630])shelfRow(B,160,1240,y);
    HOLES.forEach(([id,x,y,fid])=>{
      B.ent({id,x,y,r:52,lr:20,label:'一個洞',hy:y-16,
        draw(ctx,e,a,t){ctx.fillStyle=G.pal.bg;ctx.fillRect(e.x-26,e.y-16,52,28);if(G.mode==='threads'||a>0.3){ctx.setLineDash([2,4]);W.st(ctx,'dim',Math.max(0.25,a*0.6),1);ctx.strokeRect(e.x-26,e.y-16,52,28);ctx.setLineDash([]);}},
        use:async()=>{await think('一個洞。書架上，一本書該在的地方，只有空白。');await think('回聲碰到這裡，什麼都沒有帶回來。');if(!F('elba.holeHint')){set('elba.holeHint');await think('……可是洞上，還連著一條線。');G.hint(G.hk('按 <b>E</b> 看看洞上連著什麼','按「絲線」，看看洞上連著什麼'),6);}}});
    });
    const FR={
      f1:[250,760,'借閱卡',async()=>{await think('一張卡片，卡在書架背後。');await think('「借閱紀錄——守書人。遺忘之廊，第七架。一封信。」');await think('借書的人名那一欄，被刮掉了。');set('elba.card');G.save();}],
      f2:[1270,120,'燒掉一半的紙',async()=>{await think('一張燒掉一半的紙。');await think('「……第十三響……由……凱……教授……」');await think('只剩一個字。凱。');set('elba.trace2');}],
      f3:[640,780,'撕下來的一角',async()=>{await think('一張撕下來的紙角。');await think('「……塔的圖樣，出自……」');await think('剩下的，被撕走了。');}]
    };
    for(const k in FR){const [x,y,lbl,fn]=FR[k];B.ent({id:k,x,y,r:48,lr:14,label:lbl,cond:()=>F('elba.view.'+k),draw(ctx,e,a){W.st(ctx,'warm',Math.max(a,0.4),1);ctx.beginPath();ctx.rect(e.x-7,e.y-5,14,10);ctx.stroke();},use:fn});}
    HOLES.forEach(([id,x,y,fid,lbl])=>{const [fx,fy]=FR[fid];B.thread({a:id,b:{x:fx,y:fy},label:'洞 → '+lbl,tag:'洞',sag:0.35,desc:'書被刪掉了，可是它和別的東西之間的線，還在。線的另一端，落在書架背後。',onView:()=>{if(!F('elba.view.'+fid)){set('elba.view.'+fid);}}});});
    B.thread({a:'h1',b:'h2',label:'洞 — 洞',tag:'',sag:-0.2,faint:true,desc:'兩個洞之間，也有線。被刪掉的東西，彼此還記得。'});
    B.thread({a:'h2',b:'h3',label:'洞 — 洞',tag:'',sag:0.25,faint:true,desc:'刪掉的不只一件事。它們是一起被刪的。'});
    W.selfThreads(B);
    B.exit(0,400,40,100,'elba_hall',1500,700);
  },
  async enter(first){if(first){await wait(0.3);await think('這條走廊的回聲，有很多缺口。');await think('不是黑暗。是什麼都沒有。');}}
});

/* ---------- 遺忘之廊 ---------- */
const FORGOT=[
  ['g1',300,236,'「燒炭與窖藏」','利米塔尼亞：入冬前堆木入窯，封口悶燒七日。地窖深三尺，根莖以沙覆之。'],
  ['g2',640,236,'「河輪擒縱（副本）」','坎帕納：以河水推動副輪，可自水中轉出半刻。——賽拉斯'],
  ['g3',980,386,'「風歌」','伊南：西風來時唱第一段，浪起時唱第二段。第三段，是給等風的人唱的。'],
  ['g4',420,536,'「舊水渠的水閘」','海拉奇：舊水渠自山上引水，不必用火。水閘在城西。契約之後停用。'],
  ['letter',1100,236,'第七架：一封信','給父親歐文：\n你總是忘記吃飯。書不會跑掉，你會。\n——你的女兒，萊雅']
];
G.defScene('elba_forgotten',{
  name:'遺忘之廊',pal:'elba',w:1400,h:900,ambient:'elba',
  build(B){
    B.border();
    for(const y of [180,330,480,630])shelfRow(B,160,1240,y,{a:0.5});
    for(let i=1;i<=8;i++)B.seg(160+i*135,170,160+i*135,176,{col:'dim',a:0.4});
    FORGOT.forEach(([id,x,y,lbl,txt])=>B.ent({id,x,y,r:54,lr:18,hy:y-16,label:(id==='letter'&&!F('elba.card'))?'很淡的一張紙':lbl,
      draw(ctx,e,a){const c=Math.min(1,0.12+(E().cl[id]||0)*0.3);W.st(ctx,'line',Math.max(a,0.1)*c,1);ctx.beginPath();ctx.rect(e.x-8,e.y-12,16,22);ctx.stroke();},
      use:async()=>{
        const c=E().cl[id]||0;
        if(c<2){await think('字太淡了。像是寫字的人自己也快忘了。');await think('……再聽一次。聲音也許能把它找回來。');return;}
        for(const l of txt.split('\n'))await think(l);
        if(id==='letter'){if(!F('elba.letter')){set('elba.letter');await wait(0.5);await think('歐文。');await think('守書人的名字，是歐文。');G.save();}}
        if(id==='g4')set('elba.readSluice');
      }}));
    W.selfThreads(B);
    B.thread({a:'letter',b:{x:700,y:880},label:'信 → 中廳',tag:'信',desc:'這封信的線，一直通到中廳。有人在那裡，等著被叫一個名字。',cond:()=>F('elba.card')});
    B.exit(640,860,120,40,'elba_hall',800,120);
  },
  onListen(){const P=G.player;for(const [id,x,y] of FORGOT){if(hyp(x-P.x,y-P.y)<300){E().cl[id]=(E().cl[id]||0)+1;}}},
  async enter(first){if(first){await wait(0.3);await think('這裡的書，聲音都很淡。');await think('要仔細聽，很多次，它們才會想起自己寫了什麼。');G.hint('在遺忘之廊，靠近書架多聽幾次',7);}}
});

/* ---------- 新的書架：她做過的事 ---------- */
G.journey=function(){
  const S=G.S,L=S.lim,C=S.cam,N=S.inan,out=[];
  const inanLost=N.state==='S'?(N.wind?['漢娜','老班','小諾']:['漢娜','吉歐','米洛','塔絲','老班','艾拉','小諾']):[];
  out.push({h:'利米塔尼亞'});
  out.push({t:'動物墓地的分解循環恢復。狐狸與牠的三隻幼獸，回到土裡。'});
  if(S.log.refusals.some(r=>r.where==='老角'))out.push({t:'她拒絕以未來的守林者替換老角。'});
  out.push({t:L.guardian==='released'?'守林者老角歸土。那片地，第二年長出了蕨。':'守林者老角仍活著，仍被釘在老槲的根上。',k:L.guardian==='kept'});
  out.push({t:{T:'根井保持開啟。苔燈村的燈沒有熄。以後的森林，繼續變空。——未完成。',S:'根井封閉。溫室冷去。朵拉一家，與其後的四戶人家，在入冬前離開了村子。',W:'根井收細。舊窯重燃，地窖重開。最冷的三週，溫室仍向以後借一點熱。'}[L.state],k:L.state==='T'});
  out.push({h:'坎帕納'});
  out.push({t:C.hay?'路克從梯子上跌落，落在乾草上，扭傷了腳踝。':'路克從梯子上跌落，摔斷了腿。那時候，乾草推車在廣場的另一頭。',k:!C.hay});
  out.push({t:C.lantern?'燈籠在石頭地上，亮到天明。':'燈籠落在布篷上。葛蕾塔的攤子燒毀了。',k:!C.lantern});
  out.push({t:'莉拉跳完了第四十下。她的母親，比她記得的老了二十三歲。'});
  out.push({t:C.silas==='with'?'鐘匠賽拉斯，死於時間重新走動後的第十一分鐘。她在那裡。':'鐘匠賽拉斯，死於時間重新走動後的第十一分鐘。她不在那裡。',k:C.silas!=='with'});
  out.push({t:{T:'第十三響回來了。坎帕納繼續向明天借一個鐘頭。——未完成。',S:'第十三響沒有再回來。',W:'十二響，加上河輪的半刻。河輪蓋好之前，還借著一條很細的線。'}[C.state],k:C.state==='T'});
  out.push({h:'伊南'});
  if(F('inan.gull'))out.push({t:'一隻海鷗，被拉出了海面。'});
  if(N.state==='T')out.push({t:'塔繼續運轉。二百九十七人留在船上。海面繼續變硬。——未完成。',k:true});
  if(N.state==='S'){out.push({t:'撤離。塔停止。醫務艙的九個人中，有'+inanLost.length+'人沒有抵達岸邊。',k:true});out.push({t:'他們的名字是：'+inanLost.join('、')+'。',k:true,names:true});}
  if(N.state==='W')out.push({t:'塔收細。一百面小帆升起。梅的吊床、小潮的風箏、伊索的隔簾、若安與泰的婚布，和巴托的舊帆。'});
  if(N.wind)out.push({t:'她向以後借了一陣風。那陣風，原本屬於一個尚未出生的人。',k:true});
  out.push({h:'艾爾巴'});
  out.push({t:'修復者抵達艾爾巴。讀到了自己做過的事。'});
  return out;
};
async function newShelf(){
  if(!owenName()){await think('一個新的書架。上面的書，墨還沒乾。');await think('……我還不敢讀它。');return;}
  if(F('elba.shelfRead')){await think('書架上的字還在寫。最後一行，墨永遠是濕的。');return;}
  G.grief('shelf');
  await think('書脊上沒有名字。翻開，第一行是：');
  await think('「修復者，抵達利米塔尼亞。」');
  await think('……這是我。');
  const rec=G.journey();let names=false;
  for(const r of rec){
    if(r.h){AU.page();await narr('——'+r.h+'——');continue;}
    await narr(r.t);
    if(r.names){names=true;await wait(0.8);await think('我沒有問過他們的名字。');}
    else if(r.k)await wait(0.6);
  }
  await wait(1);
  await think('我記得。每一件，我都記得。');
  if(names)await think('聲音說過「預估損失：'+(G.S.inan.wind?'3':'7')+'」。書上寫的，不是數字。');
  const undone=[G.S.lim.state,G.S.cam.state,G.S.inan.state].filter(x=>x==='T').length;
  if(undone)await think('有些事，我沒有做完。那些也是我做的。');
  await think('書上沒有寫我為什麼停下來，沒有寫我在狐狸旁邊跪了多久。');
  await think('那些，只在我這裡。');
  G.endGrief();set('elba.shelfRead');G.save();
}
async function goldenBook(){
  if(!owenName()){await think('一本金色的書，闔著。很重，打不開。');await think('像在等守書人。');return;}
  if(!F('elba.shelfRead')){await say('歐文','先讀新的書架。');return;}
  if(F('elba.bookRead')){await think('金色之書還在寫。');await think('「凱拉，抵達艾爾巴。凱拉，讀到了自己的名字。」');return;}
  G.grief('book');
  await say('歐文','這本書不是我們寫的。它一直在那裡，自己寫。');
  AU.page();
  await think('書頁很舊。字跡……');
  await think('和新的書架上的字跡，一模一樣。');
  const lines=['凱拉，抵達利米塔尼亞。','凱拉，在老槲下停留三日。凱拉，教他們掘井。','凱拉，抵達坎帕納。凱拉，教他們向明天借一個鐘頭。','凱拉，抵達伊南。凱拉，替他們立起了塔。','凱拉，抵達艾爾巴。','凱拉，抵達海拉奇。','凱拉，留下了。'];
  for(const l of lines)await narr('「'+l+'」');
  await wait(1.2);
  AU.page();
  await think('再往後翻。空了很多頁。然後——');
  await narr('「凱拉，抵達利米塔尼亞。」');
  await narr('「凱拉，抵達坎帕納。」');
  await narr('「凱拉，抵達伊南。」');
  await narr('「凱拉，抵達艾爾巴。凱拉，讀到了自己的名字。」');
  await wait(1);
  await think('同樣的字跡。同樣的名字。');
  await think('這個名字，不是第一次走過這條路。');
  await say('凱拉','她打開了根井。她教坎帕納借時間。她替伊南立起了塔。');
  await say('凱拉','……那是誰？');
  await wait(1.2);
  await think('還是說——那是我？');
  G.endGrief();
  await say('歐文','我只知道一件事。書裡的第一個凱拉，最後一行寫的是「留下了」。');
  await voice('此區資料：不在任務範圍。\n前往下一座標：海拉奇。');
  await say('凱拉','你知道這本書。');
  await wait(1.2);
  await voice('……前往下一座標。');
  await say('凱拉','你不回答的時候，我開始聽得出來了。');
  await say('歐文','凱拉。');
  await say('歐文','如果哪一天，妳的記錄也被刪掉了——至少遺忘之廊裡，會有一張紙，寫著有人記得妳。');
  await think('他把我的名字，寫在一張很小的紙上。');
  set('elba.bookRead');set('elba.done');G.save();
}
async function leaveElba(){
  G.lockMove=true;
  await think('海拉奇。書裡的第一個凱拉，最後留下來的地方。');
  await G.fade(1,1.4);G.lockMove=false;
  G.S.chapter=5;
  await G.gotoScene('har_gate',90,560,{instant:true});
}
})();
