/* 第三章 — 伊南 */
(function(){
'use strict';
const {F,set,TAU,hyp,clamp}=G;
const say=(...a)=>G.say(...a),think=t=>G.think(t),voice=t=>G.voice(t),wait=s=>G.wait(s);
const N=()=>{const s=G.S.inan;if(!s.cloth)s.cloth={};return s;};
const CLOTH=['barto','may','tide','iso','wed'];
const clothCount=()=>CLOTH.filter(k=>N().cloth[k]).length;

function seaGrid(B,x0,x1,y0,y1,a){for(let y=y0;y<y1;y+=36){const pts=[];for(let x=x0;x<=x1;x+=60)pts.push([x,y+Math.sin(x*0.013+y)*2]);B.path(pts,{col:'dim',a:a||0.55});}}
function gullFollower(){
  if(!F('inan.gull'))return null;
  return {id:'gullF',x:G.player.x-30,y:G.player.y+6,lr:12,lit:0,base:0,t:0,
    update(dt,e){const P=G.player,dx=e.x-P.x,dy=e.y-P.y,d=hyp(dx,dy);if(d>36){e.x=P.x+dx/d*36;e.y=P.y+dy/d*36;}},
    draw(ctx,e,a,t){G.drawAnimal(ctx,'gull',e.x,e.y,Math.max(a,0.5),0.9,Math.sin(t*2)*0.1);}};
}

/* ---------- 岸 ---------- */
G.defScene('inan_shore',{
  name:'岸',pal:'inan',w:1400,h:900,ambient:'inan',
  build(B){
    B.border();
    B.path([[0,240],[200,200],[420,250],[640,190],[900,230],[1400,210]],{solid:true});
    B.path([[0,680],[240,720],[500,660],[760,730],[900,690],[1400,720]],{solid:true});
    W.pathEdge(B,[[20,450],[880,450]],34);
    W.house(B,300,540,120,80,{wins:1});
    seaGrid(B,900,1400,250,700);
    B.seg(900,230,900,690,{col:'line',a:0.7});
    B.ent({id:'boat1',x:1030,y:330,lr:40,draw(ctx,e,a){W.st(ctx,'line',a,1.1);ctx.beginPath();ctx.moveTo(e.x-40,e.y);ctx.quadraticCurveTo(e.x,e.y+22,e.x+40,e.y);ctx.lineTo(e.x-40,e.y);ctx.moveTo(e.x,e.y);ctx.lineTo(e.x,e.y-34);ctx.stroke();}});
    B.ent({id:'boat2',x:1120,y:610,lr:40,draw(ctx,e,a){W.st(ctx,'line',a,1.1);ctx.beginPath();ctx.moveTo(e.x-34,e.y);ctx.quadraticCurveTo(e.x,e.y+18,e.x+34,e.y);ctx.lineTo(e.x-34,e.y);ctx.stroke();}});
    for(let i=0;i<30;i++){const x=40+B.r()*820,y=270+B.r()*380;if(Math.abs(y-450)<50)continue;W.rock(B,x,y,4+B.r()*10);}
    B.ent({id:'sea',x:1000,y:450,r:90,lr:60,label:'海面',draw(){},use:async()=>{await think('我伸手碰了碰海。');await think('冷的、硬的。像一層還沒乾透的漆。');await think('……走得上去。');}});
    W.selfThreads(B);
    B.exit(1370,300,30,300,'inan_sea',80,450);
  },
  async enter(first){
    if(!first)return;
    await G.card('第三章','伊 南');
    await think('海的聲音……不對。');
    await think('海應該會動。這片海，只是躺在那裡。');
    await voice('區域：伊南。\n人口：297。能源帳目：負值。\n建議：撤離居民後，切斷供能。');
    await say('凱拉','297。');
    await think('聲音說的，是一個數字。');
  }
});

/* ---------- 凝固的海 ---------- */
const SOFT=[[420,300,70],[500,620,80],[760,460,90],[980,250,70],[1060,680,90],[1300,420,100],[1560,240,80],[1600,640,90],[1840,440,90],[2080,280,70],[2100,640,80]];
G.defScene('inan_sea',{
  name:'凝固的海',pal:'inan',w:2400,h:900,ambient:'inan',speed:100,stepMax:70,
  build(B){
    B.border({col:'dim',a:0.3});
    seaGrid(B,0,2400,40,880,0.5);
    SOFT.forEach(([x,y,r],i)=>{B.solidCircle(x,y,r*0.8);B.ent({id:'soft'+i,x,y,lr:r,pulse:{every:2.4+i%3,max:r+60,str:0.5,ring:0.08,snd:e=>{if(Math.random()<0.3)AU.tone(90+Math.random()*30,0.6,0.012,{wet:0.5});}},
      draw(ctx,e,a,t){W.st(ctx,'line',Math.max(a,0.1),1);for(let k=0;k<3;k++){const rr=r*(0.4+k*0.22)+Math.sin(t*1.2+k)*3;ctx.beginPath();ctx.ellipse(e.x,e.y,rr,rr*0.55,0,0,TAU);ctx.stroke();}}});});
    if(!F('inan.gull'))B.ent({id:'gull',x:700,y:420,r:56,lr:16,label:'海鷗',draw(ctx,e,a,t){G.drawAnimal(ctx,'gull',e.x,e.y,a,1.1,Math.sin(t*6)*0.08);W.st(ctx,'dim',a,1);ctx.beginPath();ctx.ellipse(e.x,e.y+5,9,3,0,0,TAU);ctx.stroke();},
      pulse:{every:3,max:90,str:0.5,ring:0.05,snd:()=>AU.tone(1100+Math.random()*200,0.12,0.012,{wet:0.3})},
      use:async()=>{
        await think('一隻海鷗。腳陷在海面裡，一直在拍翅膀。');
        await think('我把牠拉出來。');
        set('inan.gull');G.rebuild();const f=gullFollower();G.ents.push(f);G.entById.gullF=f;AU.tone(1300,0.2,0.02,{wet:0.4});
        await think('牠張開翅膀——沒有風。牠又把翅膀收起來。');
        await think('牠跟著我走。');
      }});
    B.ent({id:'lights',x:2380,y:450,lr:10,always:0,pulse:{every:1.6,max:420,str:0.45,ring:0.06},draw(){}});
    W.selfThreads(B);
    B.thread({a:'soft4',fray:[260,-260],label:'風 → 以後',tag:'',desc:'這片海本來有風。風被拉走了，拉向某個還沒到來的時間，被那裡的什麼東西用掉了。'});
    B.exit(0,380,30,140,'inan_shore',1340,450);
    B.exit(2370,360,30,180,'inan_drift',90,650);
  },
  load(){const f=gullFollower();if(f){G.ents.push(f);G.entById.gullF=f;}},
  async enter(first){
    if(first){await wait(0.3);await think('海面很平。聲音貼著它走，走得很慢、很遠，幾乎不回來。');await think('有些地方的海還是軟的，會發出很小的咕嚕聲。');await think('東邊很遠的地方，有燈的聲音。');}
  }
});

/* ---------- Drift ---------- */
const DECK=[[50,720],[120,1000],[400,1150],[900,1200],[1400,1160],[1700,1000],[1760,700],[1740,380],[1500,220],[1100,150],[700,140],[300,180],[60,300],[50,580]];
function sailsUp(){return N().state==='W';}
G.defScene('inan_drift',{
  name:'Drift',pal:'inan',w:1800,h:1300,ambient:'inan',
  build(B){
    B.border({col:'dim',a:0.2});
    B.path(DECK,{solid:true});B.seg(0,580,50,580,{solid:true,col:'dim'});B.seg(0,720,50,720,{solid:true,col:'dim'});
    for(const x of [500,1000,1400]){const pts=[];for(let y=160;y<1180;y+=60)pts.push([x+Math.sin(y)*6,y]);B.path(pts,{col:'dim',a:0.6});for(let y=200;y<1150;y+=90)B.seg(x-8,y,x+8,y+8,{col:'dim',a:0.8});}
    seaGrid(B,0,1800,0,140,0.3);seaGrid(B,0,1800,1200,1300,0.3);
    for(const [x,y] of [[400,400],[1300,480],[620,1000]]){B.circ(x,y,12,{solid:true,n:10});B.seg(x,y,x-120,y-160,{col:'dim',a:0.4});B.seg(x,y,x+140,y-150,{col:'dim',a:0.4});}
    for(const [x,y,w,h] of [[220,420,60,40],[260,470,50,36],[1500,560,60,50],[1180,280,70,40],[760,1080,60,40],[1550,860,50,40]])B.rect(x,y,w,h,{solid:true});
    for(const [x,y] of [[300,820],[345,860],[1480,760],[980,1060]])B.ent({id:'sl'+x,cond:()=>!F('inan.evac'),x,y,lr:18,fig:{lying:true},r:40,label:'睡在甲板上的人',use:async()=>{await think('一個人睡在甲板上，身上蓋著一件外套。');await think('下艙的床不夠。輪不到床的時候，就睡在這裡。');}});
    // pylon
    const st=N().state;
    B.solidCircle(900,560,44);
    B.ent({id:'pylon',x:900,y:560,r:96,lr:50,label:'塔',ay:-40,
      pulse:st==='S'?null:{every:st==='W'?2.2:1.1,max:st==='W'?160:260,str:0.55,ring:0.06,snd:()=>AU.tone(62,0.5,st==='W'?0.01:0.02,{wet:0.4})},
      draw(ctx,e,a,t){const dead=st==='S';W.st(ctx,dead?'dim':'warm',Math.max(a,0.3),1.2);ctx.beginPath();ctx.arc(e.x,e.y,44,0,TAU);ctx.stroke();
        for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(e.x,e.y-20-i*26,30-i*5,8-i,0,0,TAU);ctx.stroke();}
        ctx.beginPath();ctx.moveTo(e.x,e.y-110);ctx.lineTo(e.x,e.y-180);ctx.stroke();
        if(!dead){const k=0.5+0.5*Math.sin(t*(st==='W'?1.5:4));const g=ctx.createRadialGradient(e.x,e.y-60,0,e.x,e.y-60,st==='W'?40:90);g.addColorStop(0,'rgba('+G.pal.warm+','+0.2*k+')');g.addColorStop(1,'rgba('+G.pal.warm+',0)');ctx.fillStyle=g;ctx.fillRect(e.x-90,e.y-150,180,180);}},
      use:pylonKnot});
    if(sailsUp()){for(let i=0;i<48;i++){const k=i/48,p=DECK[Math.floor(k*(DECK.length-1))],q=DECK[Math.floor(k*(DECK.length-1))+1]||DECK[0],f=(k*(DECK.length-1))%1;const x=p[0]+(q[0]-p[0])*f,y=p[1]+(q[1]-p[1])*f,cx=x+(900-x)*0.08,cy=y+(640-y)*0.08;
      B.ent({id:'sail'+i,x:cx,y:cy,lr:14,ph:i*0.7,draw(ctx,e,a,t){const turn=F('inan.breeze')?Math.sin(t*2+e.ph)*4:0;W.st(ctx,'acc',Math.max(a,0.2),1);ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x,e.y-16);ctx.lineTo(e.x+8+turn,e.y-6);ctx.closePath();ctx.stroke();}});}}
    W.rift(B,'rift',970,650,'塔底下的裂隙（以後）',async()=>{await G.riftTo('inan_future',700,760);});
    B.ent({id:'hatch',x:520,y:900,r:56,lr:20,label:'下艙',draw(ctx,e,a){W.st(ctx,'line',a,1.1);ctx.beginPath();ctx.rect(e.x-20,e.y-20,40,40);ctx.moveTo(e.x-20,e.y-8);ctx.lineTo(e.x+20,e.y-8);ctx.moveTo(e.x-20,e.y+4);ctx.lineTo(e.x+20,e.y+4);ctx.stroke();},
      use:async()=>{if(!F('inan.metDrift')){await say('一個女人的聲音','喂！別亂下艙。',{src:'drift'});return;}await G.gotoScene('inan_below',150,540);}});
    B.ent({id:'drift',name:'Drift',x:680,y:700,r:64,label:'Drift',fig:{coat:true,arm:'hold'},use:driftTalk});
    B.ent({id:'barto',cond:()=>!F('inan.evac'),name:'巴托',x:1420,y:380,r:64,label:'巴托',fig:{bent:0.6,hat:'wide',beard:true},use:bartoTalk});
    B.ent({id:'tide',cond:()=>!F('inan.evac'),name:'小潮',x:1150,y:900,r:60,label:'小潮',fig:{child:true,arm:'up'},use:tideTalk,
      draw(ctx,e,a,t){G.drawFig(ctx,e.fig,e.x,e.y,a,t,e);if(N().cloth.tide&&!F('inan.breeze'))return;const fly=F('inan.breeze');const kx=e.x+(fly?60:22),ky=e.y-(fly?120+Math.sin(t*1.7)*10:6);W.st(ctx,'warm',Math.max(a,0.35),1);ctx.beginPath();ctx.moveTo(kx,ky-8);ctx.lineTo(kx+7,ky);ctx.lineTo(kx,ky+10);ctx.lineTo(kx-7,ky);ctx.closePath();ctx.moveTo(e.x+5,e.y-18);ctx.quadraticCurveTo((e.x+kx)/2,ky+(fly?40:6),kx,ky+10);ctx.stroke();}});
    W.selfThreads(B);
    B.thread({a:'pylon',fray:[220,-260],label:'塔 → 以後',tag:'以後',desc:'塔向以後要力氣。以後的風，被一點一點抽走。',cond:()=>st!=='S'});
    B.thread({a:'pylon',b:'hatch',label:'塔 → 淡化器、幫浦',tag:'下艙',desc:'塔的力氣一路往下，送到下艙：淡化器把海水變成能喝的水；幫浦把空氣打進醫務艙。',cond:()=>st!=='S'});
    B.thread({a:'barto',b:'pylon',label:'巴托 ← 風',tag:'',desc:'老人記得風。那條記憶的線，和塔纏在一起。',cond:()=>!F('inan.idea')});
    B.exit(0,580,36,140,'inan_sea',2330,450,{cond:()=>!N().state||F('inan.leaveOk'),blocked:async()=>{await think('還不能走。');},go:async()=>{if(N().state)return leaveInan();await G.gotoScene('inan_sea',2330,450);}});
  },
  load(){const f=gullFollower();if(f){G.ents.push(f);G.entById.gullF=f;}},
  async enter(first){
    if(first){await wait(0.3);await think('一整片船，用繩子綁在一起。燈、咳嗽聲、很多很多人的呼吸。');await think('中間有一座塔，一直在低低地響。');}
    if(N().state&&!F('inan.leaveOk')){if(N().state==='S')set('inan.evac');if(N().state==='W')set('inan.breeze');set('inan.leaveOk');G.rebuild();}
  }
});
async function driftTalk(){
  const s=N();
  if(!F('inan.metDrift')){
    set('inan.metDrift');
    await say('Drift','……妳是走在海上過來的？');
    await say('Drift','海硬到可以走人了。上個月，還只撐得住一隻鳥。');
    await say('凱拉','我叫凱拉。我來修東西。');
    await say('Drift','修東西的人，我見過。每一個都只看得見那座塔。');
    await say('Drift','他們說，塔在吸這片海的風。也許吧。可是塔也在替我們淡化海水、替下艙打氣。沒有它，底下的人三天就喘不過氣。');
    await say('Drift','妳要數字？好。二百九十七個人。二百一十二張床，三班輪著睡。糧食四十一天。醫務艙九個人，一口氣都離不開幫浦。');
    await say('凱拉','我不要數字。');
    await wait(0.6);
    await say('Drift','……那妳要什麼？');
    await say('凱拉','我想看看那些床。');
    await wait(0.8);
    await say('Drift','下艙在那邊。別吵醒睡覺的人——他們一天只輪得到八個鐘頭。');
    if(F('inan.gull')){await say('Drift','……還有，那隻鳥是妳帶來的？小潮會高興瘋的。');}
    return;
  }
  if(s.state)return driftAfter();
  if(F('inan.idea')&&clothCount()<5){await say('Drift','巴托又在說他的帆了。');await say('Drift','要是真的做得到……船上每一塊布，都是某個人晚上蓋著的東西。妳得自己去問。');return;}
  if(clothCount()>=5){await say('Drift','帆都縫好了。一百面。');await say('Drift','現在只差塔。——決定吧。妳走到這裡，總得決定點什麼。');return;}
  await say('Drift','去看過下艙了？');await say('Drift','那妳就知道，這不是一道算術題。');
}
async function driftAfter(){
  const s=N();
  if(s.state==='T'){await say('Drift','塔還在。水還在。');await say('Drift','謝謝妳。……不，我不知道該不該謝妳。');}
  else if(s.state==='S'){await say('Drift','……走吧。');await say('Drift','這艘船，我會記得它。');}
  else{await say('Drift','水要配給了。每人每天兩杯。');await say('Drift','會很難。可是我們在自己的船上。');}
}
async function bartoTalk(){
  const s=N();
  if(!F('inan.idea')){
    set('inan.idea');
    await say('巴托','年輕的，坐。這裡是船頭，以前風最大的地方。');
    await say('巴托','我年輕的時候，這片海是會唱歌的。風從西邊來，浪一排一排地推。');
    await say('巴托','後來塔立起來了。風一年比一年小。……也不能說是塔的錯，大家都要喝水。');
    await say('巴托','我一直在想一件事。');
    await say('巴托','一面大帆接不到的風，一百面小帆，也許接得到。');
    await say('巴托','風不會一下子全回來。它會先回來一點點——一口氣、一口氣。大帆太重，那一點點推不動它。小帆不一樣，一口氣，就夠一面小帆轉一圈。');
    await say('巴托','一百面小帆，每面只轉一點點。接起來，就夠淡化一桶水。');
    await say('凱拉','一百面小帆……');
    await think('每一面，都只接住一點點。可是加起來——');
    await think('也許，這個世界不必一直向以後要東西，也能活下去。');
    await say('巴托','只是，塔還在吸的話，那一點點風也不會回來。要塔停，風才會回來；風要回來，得先有帆等著。');
    await say('巴托','而帆，要用布做。船上的布，都睡在人身上。');
    await say('巴托','……我的舊帆先拿去。它等風，等得比我還久。');
    s.cloth.barto=true;AU.page();G.save();
    G.hint('收集到的帆布：'+clothCount()+'／5',6);
    return;
  }
  if(s.state==='W'&&F('inan.breeze')){await say('巴托','聽見了嗎？帆在響。');await say('巴托','……我等了四十年。');return;}
  await say('巴托','一百面小帆。每一面都是某個人的東西。');await say('巴托','所以風回來的時候，會認得每一個人。');
}
async function tideTalk(){
  const s=N();
  if(!F('inan.metTide')){
    set('inan.metTide');
    await say('小潮','妳看！這是我的風箏。');
    await say('小潮','我做了十一個。可是一個都飛不起來。');
    await say('小潮','巴托爺爺說，以前有一種東西叫風，會把風箏拉到很高很高的地方。');
    await say('小潮','風長什麼樣子？');
    await wait(0.8);
    await say('凱拉','……我也沒有見過。');
    if(F('inan.gull')){await say('小潮','那隻鳥！牠是真的鳥嗎？牠會飛嗎？');await say('凱拉','牠會。只是現在，沒有東西可以讓牠飛。');}
    return;
  }
  if(F('inan.idea')&&!s.cloth.tide&&!s.state){
    await say('凱拉','巴托爺爺要做帆。需要布。');
    await say('小潮','要做帆？……全部拿去！十一個都拿去！');
    await say('小潮','可是，如果風回來了——我想第一個知道。');
    s.cloth.tide=true;AU.page();G.save();G.hint('收集到的帆布：'+clothCount()+'／5',6);
    return;
  }
  if(F('inan.breeze')){await say('小潮','那個……那個一直推我的東西，就是風嗎？');await say('小潮','它好吵！好好玩！');return;}
  if(s.state==='T'){await say('小潮','風還是沒有來。');await say('小潮','……沒關係，我再做一個。第十二個。');return;}
  await say('小潮','風什麼時候來？');
}

/* ---------- 下艙 ---------- */
G.defScene('inan_below',{
  name:'Drift・下艙',pal:'inan',w:1800,h:1000,ambient:'inan',
  build(B){
    B.border();
    B.wall(1050,0,1050,420);B.wall(1050,520,1050,1000);B.wall(1050,480,1350,480);B.wall(1450,480,1800,480);
    // bunks
    for(let r=0;r<6;r++)for(let c=0;c<9;c++){const x=160+c*92,y=110+r*80;if(r>=4&&c>=5)continue;B.rect(x,y,62,24,{solid:true,col:'line',a:0.8});}
    const sleepers=[[222,122],[406,202],[590,122],[314,282],[682,362],[498,442],[222,442],[774,202]];
    sleepers.forEach(([x,y],i)=>B.ent({id:'zz'+i,cond:()=>!F('inan.evac'),x,y,lr:14,r:36,label:'睡著的人',fig:{lying:true},use:async()=>{const m=['一個人側睡著，手伸在床沿外，像怕被擠下去。','床還是溫的。上一個人剛起來，這一個人就躺下了。','有人在夢裡數數。數到一半，又從頭數。','一張床，睡過三個人的形狀。'];await think(m[i%m.length]);}}));
    // desalinator
    B.rect(720,700,220,150,{solid:true,col:'warm'});
    B.ent({id:'desal',x:830,y:775,r:130,lr:80,label:'淡化器',pulse:N().state==='S'?null:{every:1.3,max:200,str:0.5,ring:0.05},draw(){},use:async()=>{await think('淡化器。海水進去，能喝的水出來。一滴一滴，很慢。');await think('它的聲音，和甲板上的塔是同一種。');}});
    // galley
    for(const [x,y,w,h] of [[1120,80,80,50],[1220,80,80,50],[1120,150,80,50],[1600,100,120,80]])B.rect(x,y,w,h,{solid:true});
    B.rect(1300,260,160,60,{solid:true});
    B.ent({id:'food',x:1170,y:120,r:90,lr:40,label:'糧食箱',draw(){},use:async()=>{await think('箱子。很多是空的，敲起來聲音很高。');await think('Drift 說，四十一天。');}});
    B.ent({id:'ruan',cond:()=>!F('inan.evac'),name:'若安',x:1290,y:360,r:56,label:'若安',fig:{hood:true},use:weddingTalk});
    B.ent({id:'tai',cond:()=>!F('inan.evac'),name:'泰',x:1470,y:360,r:56,label:'泰',fig:{hat:'cap'},use:weddingTalk});
    // infirmary
    const beds=[[1110,560],[1210,560],[1310,560],[1560,560],[1660,560],[1110,860],[1210,860],[1560,860],[1660,860]];
    beds.forEach(([x,y],i)=>{B.rect(x-30,y-14,60,28,{solid:true,col:'line',a:0.8});B.ent({id:'p'+i,cond:()=>!F('inan.evac'),x,y,lr:16,fig:{lying:true},r:44,label:'病人',use:async()=>{const m=['她的呼吸很淺。每一口氣，都要靠幫浦推進去。','一個年輕人，醒著，看著天花板。他在聽幫浦的聲音。','一個孩子，手握著床邊的管子。','他問：「塔今天還在嗎？」'];await think(m[i%m.length]);}});
      B.ent({id:'pump'+i,x:x+40,y,lr:10,pulse:N().state==='S'?null:{every:1.5+i*0.07,max:70,str:0.4,ring:0.04},draw(ctx,e,a){W.st(ctx,'warm',Math.max(a,0.2),1);ctx.beginPath();ctx.rect(e.x-5,e.y-8,10,16);ctx.stroke();}});});
    B.ent({id:'iso',cond:()=>!F('inan.evac'),name:'伊索',x:1400,y:720,r:60,label:'伊索',fig:{coat:true,arm:'hold'},use:isoTalk});
    B.ent({id:'may',cond:()=>!F('inan.evac'),name:'梅',x:460,y:600,r:60,label:'梅',fig:{bun:true,arm:'hold'},use:mayTalk});
    B.ent({id:'ladder',x:80,y:470,r:60,lr:20,label:'上甲板',draw(ctx,e,a){W.st(ctx,'line',a,1.1);ctx.beginPath();ctx.moveTo(e.x-10,e.y+20);ctx.lineTo(e.x-10,e.y-30);ctx.moveTo(e.x+10,e.y+20);ctx.lineTo(e.x+10,e.y-30);for(let i=0;i<5;i++){ctx.moveTo(e.x-10,e.y+14-i*11);ctx.lineTo(e.x+10,e.y+14-i*11);}ctx.stroke();},use:async()=>{await G.gotoScene('inan_drift',560,950);}});
    W.selfThreads(B);
    B.thread({a:'pump4',b:'desal',label:'幫浦 ← 塔',tag:'幫浦',desc:'醫務艙的空氣，是塔打下來的。塔一停，這條線就斷。',cond:()=>N().state!=='S'});
    B.thread({a:'may',b:'zz3',label:'梅 — 空的半張床',tag:'梅',desc:'她和另一個人共用一張床。另一個人的線，斷在醫務艙裡。'});
  },
  async enter(first){
    if(first){await wait(0.3);await think('下艙很擠。很多人睡著，很多人醒著等著睡。');await think('空氣很稠，每一口氣都有別人的味道。');}
    if(F('inan.evac')&&!F('inan.emptySeen')){set('inan.emptySeen');await wait(0.3);await think('下艙空了。');await think('床上還留著人的形狀。');}
  }
});
async function mayTalk(){
  const s=N();
  if(!F('inan.metMay')){
    set('inan.metMay');
    await say('梅','……輪到妳睡了嗎？不是？那小聲點。');
    await say('梅','我跟阿全共用這張床。他睡白天，我睡晚上。……以前是這樣。');
    await say('梅','阿全上個月在醫務艙走了。現在這張床只有我一個人睡，大家還說我運氣好。');
    return;
  }
  if(F('inan.idea')&&!s.cloth.may&&!s.state){
    await say('凱拉','巴托爺爺要做很多面小帆。需要布。');
    await wait(0.8);
    await say('梅','……拿去吧。這張吊床。');
    await say('梅','我睡地板就好。反正也沒人跟我換班了。');
    s.cloth.may=true;AU.page();G.save();G.hint('收集到的帆布：'+clothCount()+'／5',6);
    return;
  }
  await say('梅','睡吧。能睡的時候就睡。');
}
async function isoTalk(){
  const s=N();
  if(!F('inan.metIso')){
    set('inan.metIso');
    await say('伊索','別靠太近，這裡的空氣已經夠少了。');
    await say('伊索','九個人。幫浦停一個小時，最弱的那兩個就撐不住。');
    await say('伊索','撤離？划船到岸邊。海面這麼硬，平常三天的路要划五天。我這九個人，能活著上岸的，大概只有兩三個。');
    await say('伊索','妳知道最糟的是什麼嗎？他們都知道。他們每天問我，塔今天還在不在。');
    return;
  }
  if(F('inan.idea')&&!s.cloth.iso&&!s.state){
    await say('凱拉','巴托爺爺要做帆。需要布。');
    await say('伊索','隔簾？……那是病人的隱私。');
    await wait(1);
    await say('伊索','算了。活著比較重要。拿去。');
    await say('伊索','但是幫浦那條線，別動。至少，先別動。');
    s.cloth.iso=true;AU.page();G.save();G.hint('收集到的帆布：'+clothCount()+'／5',6);
    return;
  }
  if(s.state==='S'){await say('伊索','……');return;}
  await say('伊索','九個人。我每天數一次。');
}
async function weddingTalk(){
  const s=N();
  if(!F('inan.metWed')){
    set('inan.metWed');
    await say('若安','我們本來要在有風的那天結婚。');
    await say('泰','巴托爺爺說，有風的日子，海會把祝福吹到很遠的地方。');
    await say('若安','我們等了兩年。');
    return;
  }
  if(F('inan.idea')&&!s.cloth.wed&&!s.state){
    await say('若安','……巴托爺爺的帆？');
    await say('若安','這塊布，是要在婚禮上掛起來的。');
    await wait(0.8);
    await say('泰','拿去做帆吧。');
    await say('若安','如果風真的回來——那一天，就是我們的婚禮。帆，就是我們的布。');
    s.cloth.wed=true;AU.page();G.save();G.hint('收集到的帆布：'+clothCount()+'／5',6);
    return;
  }
  if(F('inan.breeze')){await say('泰','今天有風。');await say('若安','所以今天，是我們的婚禮。');return;}
  await say('泰','還在等。');
}

/* ---------- 以後的伊南 ---------- */
G.defScene('inan_future',{
  name:'以後的伊南',pal:'future',w:1400,h:900,ambient:'future',
  build(B){
    B.border();
    for(let i=0;i<60;i++){let x=B.r()*1400,y=B.r()*900;const pts=[[x,y]];for(let k=0;k<5;k++){x+=(B.r()-0.5)*80;y+=(B.r()-0.5)*30;pts.push([x,y]);}B.path(pts,{col:'dim',a:0.6});}
    B.path([[200,500],[400,360],[800,330],[1150,420],[1250,560]],{solid:true});B.path([[260,540],[500,470],[900,460],[1180,540]],{col:'line',a:0.6});
    B.circ(700,380,30,{n:10,col:'line'});B.seg(700,350,760,200,{col:'line'});B.seg(760,200,800,120,{col:'dim'});
    B.ent({id:'kite',x:980,y:640,r:70,lr:20,label:'石頭裡的東西',draw(ctx,e,a){W.st(ctx,'warm',Math.max(a,0.3),1);ctx.beginPath();ctx.moveTo(e.x,e.y-12);ctx.lineTo(e.x+9,e.y);ctx.lineTo(e.x,e.y+14);ctx.lineTo(e.x-9,e.y);ctx.closePath();ctx.moveTo(e.x,e.y-12);ctx.lineTo(e.x,e.y+14);ctx.stroke();},
      use:async()=>{await think('一個菱形的木框，半截埋在石頭裡。');await think('……小潮的風箏。');await think('它一直沒有飛起來。');set('inan.sawKite');}});
    W.rift(B,'rift',700,820,'回到現在',async()=>{await G.riftTo('inan_drift',970,700);},{col:'acc'});
    W.selfThreads(B);
  },
  async enter(){
    if(F('inan.futureTalk'))return;set('inan.futureTalk');
    await wait(0.5);
    await think('以後的伊南。');
    await think('海已經不是海了。是石頭。');
    await think('船還在——一半埋在石頭裡。塔倒在船中間。');
    await think('這裡沒有人。沒有床、沒有咳嗽聲、沒有在夢裡數數的人。');
  }
});

/* ---------- the pylon ---------- */
async function pylonKnot(){
  const s=N();
  if(s.state){const m={T:'塔還在響。',S:'塔安靜了。',W:'塔只剩一條很細的線，接到醫務艙。'};await think(m[s.state]);return;}
  if(!F('inan.metDrift')||!F('inan.metIso')){await think('塔一直在響。它連著很多東西——我還不知道是誰在靠它活著。');if(!F('inan.metIso'))await think('下艙。我應該先去下艙看看。');return;}
  if(!F('inan.questioned')){
    set('inan.questioned');
    await voice('建議方案：撤離居民。切斷供能。\n預估損失：7。');
    await say('凱拉','預估損失。');
    await say('凱拉','你說的，是伊索醫務艙裡的哪七個？');
    await voice('個體資料：不在任務範圍。');
    await say('凱拉','那你怎麼知道是七？');
    await voice('統計。');
    await wait(0.6);
    await say('凱拉','……你沒有下來過。你沒有聽過那些床。');
    const lines=[];
    if(F('inan.metMay'))lines.push('梅一個人，睡一張三個人輪流睡的床。');
    if(F('inan.metTide'))lines.push('小潮做了十一個飛不起來的風箏。');
    if(F('inan.metWed'))lines.push('若安和泰，在等一個有風的日子結婚。');
    for(const l of lines)await say('凱拉',l);
    await voice('修復者的任務：恢復因果平衡。');
    await say('凱拉','我知道我的任務。');
    await say('凱拉','我只是開始懷疑——把任務交給我的那一方，有沒有真的看過這個世界。');
    await voice('……');
    await think('聲音沒有回答。它從來不回答這種問題。');
  }
  const cc=clothCount();
  const key=await G.knot({ent:'pylon',title:'塔',options:[
    {key:'T',label:'讓塔繼續運轉',desc:'水和空氣會繼續供應，二百九十七個人都能留在船上。海會繼續變硬——你看過以後的它。'},
    {key:'S',label:'撤離所有人，然後切斷塔',desc:'所有人划船上岸，塔會停，風會慢慢回來。醫務艙的九個人，撐不過五天海路的，大概有七個。船會被留在海上。'},
    {key:'W',label:'降下塔，升起百帆',ok:cc>=5,off:'（帆還不夠。巴托說要一百面小帆——布，都睡在人身上。目前：'+cc+'／5）',desc:'塔收成一條很細的線，只留給醫務艙的幫浦。一百面小帆等著接住回來的第一口風，一點一點轉動淡化器。會很難，水要配給。但大家可以留下來。'}
  ],backDesc:'先不牽動塔。'});
  if(!key)return;
  s.state=key;
  await G.decide('塔',{T:'讓塔繼續運轉',S:'撤離，然後切斷塔',W:'降下塔，升起百帆'}[key]);
  if(key!=='T'){
    const k2=await G.knot({ent:'pylon',title:'還有一條線',back:false,options:[
      {key:'borrow',label:'向以後借一陣風',desc:key==='S'?'讓撤離的船第一天就有風推著走。醫務艙的人，也許能多活下來幾個。那陣風，是以後某一天的風。':'讓一百面帆第一天就轉起來，淡化器不必停。那陣風，是以後某一天的風。'},
      {key:'none',label:'不借，讓風自己回來',desc:'風會慢慢回來。第一段日子，會比較難。'}
    ]});
    if(k2==='borrow'){s.wind=true;await G.decide('借風','向以後借一陣風','……借一陣就好。');await think('我向以後借了一陣風。');await think('那陣風，原本屬於某一天——某一個還沒出生的人的某一天。');}
    else{s.wind=false;await G.decide('借風','不借風','不借。讓它自己回來。');}
  }
  await pylonAftermath(key);
}
async function pylonAftermath(key){
  const s=N();
  G.lockMove=true;
  if(key==='T'){
    await think('塔繼續響。');
    await think('我讓他們留下來了。也讓以後的海，繼續變成石頭。');
    await voice('偏差源：未處理。\n記錄。');
  }else if(key==='S'){
    await think('船一艘一艘放下去。醫務艙的人，被抬上最大的那一艘。');
    await think('伊索握著一個孩子的手，沒有說話。');
    AU.crack();G.rebuild();G.pulse(900,560,{max:900,str:1,ring:0.4});
    await wait(1.2);
    await think('塔停了。');
    if(s.wind){AU.noise(3,0.05,{type:'lowpass',f:500,wet:0.8});await think('風來了。是我借來的那一陣。船被推著走，走得很快。');}
    else await think('海面很安靜。船划得很慢。');
    await voice('偏差源：已切斷。\n預估損失：'+(s.wind?'3':'7')+'。');
    await think('三。七。那是誰，聲音不知道。');
    await think('我知道。');
    set('inan.evac');
  }else{
    G.rebuild();G.pulse(900,560,{max:500,str:0.8});
    await think('一百面小帆，沿著船緣立起來。');
    await think('塔的聲音變小了。只剩一條很細的線，往下接到醫務艙。');
    if(s.wind){AU.noise(3,0.05,{type:'lowpass',f:600,wet:0.8});set('inan.breeze');G.rebuild();await think('借來的風到了。一百面帆同時轉起來。');}
    else{await wait(2.5);await think('……什麼都沒有。');await wait(2.5);AU.noise(2.5,0.03,{type:'lowpass',f:400,wet:0.8});set('inan.breeze');G.rebuild();await think('然後——很小很小的一口氣。一面帆，轉了半圈。');}
    await say('小潮','……那是什麼？');
    await say('巴托','那是風。');
    await think('每一面帆，只接住一點點。');
    await think('加起來，就夠了。');
    await voice('偏差源：未完全處理。\n記錄。');
  }
  set('inan.leaveOk');G.lockMove=false;G.save();
}
async function leaveInan(){
  G.lockMove=true;
  await voice('下一座標：艾爾巴。\n此區資料：不完整。');
  await think('資料不完整。');
  await think('聲音也有不知道的事。');
  await G.fade(1,1.4);G.lockMove=false;
  G.S.chapter=4;
  await G.gotoScene('elba_steps',600,930,{instant:true});
}
})();
