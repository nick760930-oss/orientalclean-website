/* 序章 — 石室 */
(function(){
'use strict';
const {F,set}=G;
const say=(...a)=>G.say(...a),think=t=>G.think(t),voice=t=>G.voice(t),wait=s=>G.wait(s);

function chamber(B,past){
  const oct=[[150,100],[750,100],[840,190],[840,300]];
  B.path(oct,{solid:true});
  B.path([[840,400],[840,510],[750,600],[150,600],[60,510],[60,190],[150,100]],{solid:true});
  // door frame
  B.seg(840,300,860,300,{solid:true});B.seg(840,400,860,400,{solid:true});
  B.wall(860,300,940,300,{col:'dim'});B.wall(860,400,940,400,{col:'dim'});
  const open=past?false:F('pro.door');
  if(!open){B.wall(846,300,846,400,{col:'acc'});B.seg(852,305,852,395,{col:'line',a:0.5});}
  else{B.seg(846,300,905,318,{col:'acc'});}
  // stone bed with an indent a little wider than her
  B.rect(200,290,150,64,{solid:true});
  const ind=[];for(let i=0;i<16;i++){const a=i/16*G.TAU;ind.push([275+Math.cos(a)*(past?60:58),322+Math.sin(a)*(past?19:17)]);}
  B.path(ind,{col:past?'warm':'dim',a:past?0.9:0.6},true);
  // pillars
  for(const [x,y] of [[300,190],[600,190],[300,510],[600,510]])B.circ(x,y,18,{solid:true,n:12});
  // worn carvings
  for(let i=0;i<14;i++){const x=180+i*40;B.seg(x,112,x+14,122,{col:'dim',a:0.5});}
  for(let i=0;i<12;i++){const y=210+i*25;B.seg(72,y,86,y+9,{col:'dim',a:0.45});}
}
function selfThreads(B){W.selfThreads(B);}

G.defScene('pro_chamber',{
  name:'石室',pal:'stone',w:940,h:700,ambient:'stone',prox:80,listenMax:620,
  build(B){
    B.border();chamber(B,false);
    B.ent({id:'bed',x:275,y:322,r:70,hy:290,label:'石床',use:async()=>{
      await think('石床的凹痕比我的身體寬一點。');
      if(!F('pro.bed2')){set('pro.bed2');await think('凹痕很舊，邊緣被磨得很圓。像被躺過很多次。');}
    }});
    B.ent({id:'door',x:840,y:350,r:70,hy:300,label:'石門',ay:-4,cond:()=>!F('pro.door'),use:async()=>{
      if(!F('pro.boltOpen')){
        await say('凱拉','……門不動。');
        if(!F('pro.doorTried')){set('pro.doorTried');await think('它在等。等著被推開，卻沒有力氣。');G.hint(G.hk('<b>E</b>／「絲線」：看見事物之間的因果絲線<br>在絲線中移動游標或按方向鍵，可以讀取每一條線','「絲線」：看見事物之間的因果絲線<br>點一條線讀取它'),10);}
      }else{
        await think('門栓已經退開了，只剩鏽把它固定在那裡。');
        await say('凱拉','……推得動。');
        G.lockMove=true;AU.crack();set('pro.door');G.rebuild();G.pulse(840,350,{max:520,str:1});
        await wait(0.8);G.lockMove=false;
        await think('過去被推動過，現在就留著那個樣子。');
        await voice('路徑確認。');
      }
    }});
    B.ent({id:'bolt',x:822,y:352,r:40,lr:14,label:'門栓',ay:-6,
      draw(ctx,e,a){W.st(ctx,'warm',a*0.9,2);ctx.beginPath();const open=F('pro.boltOpen');ctx.moveTo(e.x-(open?26:6),e.y);ctx.lineTo(e.x+(open?-10:22),e.y);ctx.stroke();W.st(ctx,'dim',a*0.7,1);ctx.beginPath();ctx.rect(e.x-30,e.y-4,8,8);ctx.stroke();},
      use:async()=>{
        if(F('pro.boltOpen')){await think('門栓鏽在拉開的位置。很久以前有人把它推開了。');await think('——是我。');return;}
        await say('凱拉','鏽死了。');await think('拉不動。鏽把它和門長在一起。');
      }});
    W.rift(B,'rift',740,210,'牆角的裂隙',async()=>{
      if(!F('pro.riftSeen')){set('pro.riftSeen');await think('這道裂縫的聲音比較舊。像是從很久以前傳過來的。');await think('……我碰得到它。');}
      await G.riftTo('pro_chamber_past',735,250);
    });
    B.thread({a:'door',fray:[140,-170],label:'供能：尚未到來的時間',tag:'供能',desc:'門在向某個還沒到來的時間要力氣。線的另一端空空的，沒有回答。',cond:()=>!F('pro.door')});
    B.thread({a:'door',b:'bolt',label:'門栓',tag:'門栓',desc:()=>F('pro.boltOpen')?'門栓已經退開。門只需要被推。':'門被一根門栓鎖住。門栓鏽死在關上的位置。',cond:()=>!F('pro.door')});
    B.thread({a:'bolt',b:'rift',label:'鏽',tag:'鏽',desc:'鏽是時間留下的。線往回連——連到很久以前，牆角那道裂隙裡。',cond:()=>!F('pro.boltOpen')});
    selfThreads(B);
    B.exit(880,300,60,100,'pro_passage',60,260,{cond:()=>F('pro.door')});
  },
  onListen(){if(!F('pro.firstListen')){set('pro.firstListen');G.run(async()=>{await wait(0.6);await think('八道牆。四根柱子。一張石床。一扇門。');});}},
  onThreadsExit(){if(F('pro.doorTried')&&!F('pro.threadsSeen')){set('pro.threadsSeen');G.run(async()=>{
    await think('東西之間有線。一件事，拉著另一件事。');
    await think('門在向某個還沒到來的時間要力氣。那個時間沒有回答。');
    await voice('門的供能來源：無回應。\n建議：尋找替代路徑。');
    G.hint(G.hk('走近發光的裂隙，按 <b>Enter</b> 或點擊它','點擊牆角發光的裂隙'),8);
  });}},
  async enter(first){
    if(F('pro.woke'))return;
    const P=G.player;P.x=275;P.y=330;P.kneel=1;G.fade(1,0);
    await wait(1.4);
    await voice('修復者，啟動。');
    await voice('識別名：凱拉。');
    await voice('世界偏差：0.71。持續上升中。');
    await voice('任務：前往能量中心，修復因果平衡。');
    G.fade(0,3);await wait(0.6);
    await think('……凱拉。');
    await think('我知道那是我的名字，就像知道石頭是冷的。');
    await think('眼前綁著一塊布。我沒有想把它拿下來。');
    G.pulse(P.x,P.y-14,{max:130,str:0.7,kaila:true});
    await think('聲音碰到東西，會帶著形狀回來。');
    for(let i=0;i<=20;i++){P.kneel=1-i/20;await wait(0.03);}
    await G.walkTo(275,395,50,{ghost:true});
    set('pro.woke');G.save();
    G.hint(G.hk('<b>方向鍵／WASD</b>，或按住畫面：移動<br><b>空白鍵</b>／「聆聽」：發出聲音，聽見形狀<br><b>Enter</b>／點擊：靠近、觸碰','按住畫面：移動<br>「聆聽」：發出聲音，聽見形狀<br>點擊人或物：靠近、觸碰'),12);
  }
});

G.defScene('pro_chamber_past',{
  name:'石室（過去）',pal:'past',w:940,h:700,ambient:'past',prox:80,listenMax:620,
  build(B){
    B.border();chamber(B,true);
    B.ent({id:'bed',x:275,y:322,r:70,hy:290,label:'石床',use:async()=>{await think('凹痕是新的。石頭還是溫的。');await think('像是有人剛剛才從這裡起身。');}});
    B.ent({id:'bolt',x:822,y:352,r:44,lr:14,label:'門栓（新的）',ay:-6,
      draw(ctx,e,a){W.st(ctx,'acc',a,2);ctx.beginPath();const open=F('pro.boltOpen');ctx.moveTo(e.x-(open?26:6),e.y);ctx.lineTo(e.x+(open?-10:22),e.y);ctx.stroke();W.st(ctx,'dim',a*0.7,1);ctx.beginPath();ctx.rect(e.x-30,e.y-4,8,8);ctx.stroke();},
      use:async()=>{
        if(F('pro.boltOpen')){await think('已經推開了。');return;}
        await think('門栓是亮的，還沒有生鏽。');
        AU.clank(0.4);set('pro.boltOpen');G.pulse(822,352,{max:200,str:0.8});
        await say('凱拉','……開了。');
        await think('我把它推開了——在很久以前。');
        G.save();
      }});
    W.rift(B,'rift',740,210,'回到現在',async()=>{await G.riftTo('pro_chamber',735,250);},{col:'acc'});
    B.thread({a:'bolt',b:'rift',label:'往後的時間',tag:'',desc:()=>F('pro.boltOpen')?'門栓被推開了。這個樣子會一直留到現在。':'如果門栓在這裡被推開，它就會以那個樣子鏽下去。'});
    selfThreads(B);
  },
  async enter(){
    if(!F('pro.pastSeen')){set('pro.pastSeen');await wait(0.5);await think('……同一間石室。可是比較新。');await think('聲音回來得比較快，像石頭還沒學會沉默。');}
  }
});

function glyph(B,kind,x,y){
  const o={col:'warm',a:0.8};
  if(kind==='tree'){B.seg(x,y+16,x,y+2,o);B.circ(x,y-4,9,Object.assign({n:9},o));}
  if(kind==='bell'){B.path([[x-9,y+14],[x-7,y],[x-4,y-8],[x+4,y-8],[x+7,y],[x+9,y+14],[x-9,y+14]],o);B.seg(x,y+14,x,y+18,o);}
  if(kind==='wave'){for(let k=0;k<2;k++){const yy=y+k*9;B.path([[x-12,yy],[x-6,yy-5],[x,yy],[x+6,yy-5],[x+12,yy]],o);}}
  if(kind==='book'){B.rect(x-11,y-8,22,18,o);B.seg(x,y-8,x,y+10,o);}
  if(kind==='gear'){B.circ(x,y,8,Object.assign({n:10},o));for(let i=0;i<8;i++){const a=i/8*G.TAU;B.seg(x+Math.cos(a)*8,y+Math.sin(a)*8,x+Math.cos(a)*12,y+Math.sin(a)*12,o);}}
  if(kind==='ring'){B.circ(x,y,11,Object.assign({n:16},o));B.circ(x,y,3,Object.assign({n:6},o));}
}
G.defScene('pro_passage',{
  name:'石室外的通道',pal:'stone',w:1900,h:520,ambient:'stone',listenMax:700,
  build(B){
    B.border();
    const top=[[0,150],[300,140],[600,160],[900,135],[1200,155],[1500,140],[1780,170],[1900,200]],bot=[[0,380],[320,395],[640,370],[980,390],[1300,372],[1600,386],[1780,350],[1900,320]];
    B.path(top,{solid:true});B.path(bot,{solid:true});
    for(const [x,y,r] of [[430,230,26],[520,320,22],[760,300,30],[860,200,24],[1060,250,34],[1230,330,26],[1330,200,22],[1480,280,30],[1640,220,20]])W.rock(B,x,y,r);
    const icons=['tree','bell','wave','book','gear','ring'];
    icons.forEach((k,i)=>glyph(B,k,560+i*190,185));
    B.ent({id:'carve',x:1030,y:205,r:120,hy:170,label:'壁上的刻痕',use:async()=>{
      await think('牆上刻著東西。一棵樹、一口鐘、兩道浪、一本書、一個齒輪。');
      await think('最後是一個圓。圓心還有一個小圓。');
      if(!F('pro.carve')){set('pro.carve');await think('刻痕很淺，像是用指甲一點一點劃出來的。');}
    }});
    for(let i=0;i<40;i++){const x=1700+B.r()*200,y=180+B.r()*160;B.seg(x,y,x+3,y-6,{col:'dim',a:0.4});}
    B.ent({id:'leaves',x:1880,y:260,always:0,lr:60,pulse:{every:1.3,max:260,str:0.5,ring:0.05},draw(){}});
    W.selfThreads(B);
    B.exit(1860,190,40,150,null,0,0,{go:async()=>{
      G.lockMove=true;await G.walkTo(1900,262,60,{ghost:true});
      await think('葉子的聲音。很多、很密。');
      await think('……綠得太整齊了。');
      await G.fade(1,1.2);G.lockMove=false;
      G.S.chapter=1;
      await G.gotoScene('lim_edge',110,700,{instant:true});
    }});
  },
  async enter(first){
    if(first){await wait(0.4);await voice('前方：利米塔尼亞邊境林。\n能量流向：異常。');await think('我聽見前面有風吹過葉子。');}
  }
});
})();
