/* 第二章 — 坎帕納 */
(function(){
'use strict';
const {F,set,TAU,hyp,clamp}=G;
const say=(...a)=>G.say(...a),think=t=>G.think(t),voice=t=>G.voice(t),wait=s=>G.wait(s);
const C=()=>G.S.cam;
const frozen=()=>!F('cam.restarted');

/* ---------- 城門外 ---------- */
G.defScene('cam_gate',{
  name:'城門外',pal:'cam',w:1500,h:1100,ambient:()=>'cam',
  build(B){
    B.border();
    const road=[[20,700],[500,690],[900,620],[1300,560],[1490,560]];W.pathEdge(B,road,36);
    B.wall(1360,0,1360,480);B.wall(1360,640,1360,1100);B.rect(1340,470,40,20,{solid:true});B.rect(1340,630,40,20,{solid:true});
    for(let y=20;y<1100;y+=40){if(y>460&&y<660)continue;B.seg(1360,y,1380,y+10,{col:'dim',a:0.6});}
    W.house(B,800,780,150,100,{wins:1,doorX:0.25});
    // the tally wall: one stroke a day
    for(let r=0;r<6;r++)for(let c=0;c<26;c++){const x=958+c*5.2,y=786+r*14;if(c%5===4)B.seg(x-19,y+10,x+2,y,{col:'dim',a:0.8});else B.seg(x,y,x,y+10,{col:'dim',a:0.8});}
    W.grass(B,0,0,1340,1100,280,{avoid:(x,y)=>W.distPath(x,y,road)<30});
    for(let i=0;i<24;i++){const x=40+B.r()*1260,y=40+B.r()*1020;if(W.distPath(x,y,road)<90||(x>760&&x<1000&&y>740&&y<920))continue;W.tree(B,x,y,16+B.r()*20);}
    B.ent({id:'marga',name:'瑪嘉',x:760,y:740,r:60,label:'瑪嘉',fig:{bent:0.7,cane:true,hood:true},cond:()=>!F('cam.restarted'),use:margaTalk});
    B.ent({id:'tally',x:1025,y:820,r:60,lr:40,label:'牆上的刻痕',draw(){},use:async()=>{await think('刻痕。五道一組。');await think('……很多很多組。一天一道的話，這面牆上有八千多天。');}});
    B.ent({id:'veil',x:1360,y:560,lr:90,always:0.35,draw(ctx,e,a,t){if(!frozen())return;ctx.setLineDash([2,6]);ctx.lineDashOffset=t*4;W.st(ctx,'acc',0.35+0.2*Math.sin(t*1.3),1);ctx.beginPath();ctx.moveTo(e.x,e.y-90);ctx.lineTo(e.x,e.y+90);ctx.stroke();ctx.setLineDash([]);}});
    // just inside the gate: a cart driver who stopped mid-step
    B.ent({id:'driver',x:1440,y:600,r:0,lr:20,fig:{still:true,arm:'out',hat:'wide'},cond:frozen});
    W.selfThreads(B);
    B.thread({a:'marga',b:'veil',label:'瑪嘉 → 城門內',tag:'瑪嘉',desc:'一條繃得很緊的線，從她身上一直拉到門裡面。二十三年，沒有鬆過。',cond:frozen});
    B.exit(1460,480,40,160,'cam_square',1000,1400,{cond:()=>F('cam.metMarga')||F('cam.restarted'),blocked:async()=>{await think('城門裡面很安靜。安靜得不像城。');await think('門口有一間小屋，屋外有人。');}});
    B.exit(0,560,30,260,null,0,0,{cond:()=>F('cam.restarted'),blocked:async()=>{await think('來的路。現在不回頭。');},go:leaveCampana});
  },
  async enter(first){
    if(first){
      await G.card('第二章','坎 帕 納');
      await think('路走到一座城牆前面。');
      await think('城門開著。門裡面，什麼聲音都沒有——連風都停在門口。');
      return;
    }
  }
});
async function margaTalk(){
  if(F('cam.metMarga')){
    if(F('cam.sawLila')){await say('瑪嘉','妳看到她了？');await say('凱拉','她在跳。雙腳離地，繩子在她頭頂上。');await say('瑪嘉','……還在跳啊。');await say('瑪嘉','那就好。那就好。');}
    else await say('瑪嘉','廣場在門進去直走。她穿一件黃色的裙子……我是說，那時候是黃色的。');
    return;
  }
  set('cam.metMarga');
  await say('瑪嘉','……妳也要進去嗎？');
  await say('瑪嘉','別進去。進去的人，都停在門裡面了。');
  await say('凱拉','我聽見裡面很安靜。');
  await say('瑪嘉','二十三年了。');
  await say('瑪嘉','坎帕納的鐘，一天敲十三下。第十三下，是跟明天借來的一個鐘頭——麵包師傅多烤一爐，織布機多織一匹，市集多開一個時辰。');
  await say('瑪嘉','那天第十三下敲下去，就再也沒有下一下了。');
  await say('瑪嘉','我在城外採藥草。回來的時候，門裡的每個人，都停在那一刻。');
  await say('瑪嘉','我的女兒莉拉在廣場上跳繩。她說要跳到四十下給我看。');
  await wait(0.6);
  await say('瑪嘉','……她還在跳。');
  await say('凱拉','妳一直在這裡等。');
  await say('瑪嘉','我在門口蓋了屋子。每天在牆上刻一道。');
  await say('瑪嘉','如果妳進得去——幫我看看她。告訴我，她還好嗎。');
  await voice('區域：坎帕納。\n時間參數：停滯。修復者不受影響。');
  await say('凱拉','為什麼我不受影響？');
  await wait(0.8);
  await voice('不在任務範圍。');
  await think('……又是這句話。');
}

/* ---------- 市集廣場 ---------- */
const HAY_SPOT={x:660,y:800};
function drawCart(ctx,e,a){W.st(ctx,'line',Math.max(a,G.carry&&G.carry.follow===e?0.8:0),1.1);ctx.beginPath();ctx.rect(e.x-24,e.y-14,48,22);ctx.moveTo(e.x-16,e.y+10);ctx.arc(e.x-16,e.y+10,5,0,TAU);ctx.moveTo(e.x+21,e.y+10);ctx.arc(e.x+16,e.y+10,5,0,TAU);ctx.stroke();
  W.st(ctx,'warm',Math.max(a,0.3)*0.8,1);ctx.beginPath();for(let i=0;i<9;i++){const x=e.x-20+i*5;ctx.moveTo(x,e.y-14);ctx.lineTo(x+3,e.y-22-(i%3)*2);}ctx.stroke();}
function flames(ctx,x,y,a,t){W.st(ctx,'warm',a,1.2);ctx.beginPath();for(let i=0;i<7;i++){const fx=x-40+i*13,h=14+10*Math.sin(t*9+i*1.7);ctx.moveTo(fx,y);ctx.quadraticCurveTo(fx+5,y-h*0.6,fx+2,y-h);}ctx.stroke();}
G.defScene('cam_square',{
  name:'市集廣場',pal:'cam',w:2000,h:1500,listenMax:620,
  ambient:()=>frozen()?'camFrozen':'cam',
  stasis:frozen,
  build(B){
    B.border();
    const fr=frozen(),s=C();
    B.wall(0,1480,940,1480);B.wall(1060,1480,2000,1480);
    W.house(B,100,300,220,180);W.house(B,100,560,200,160);W.house(B,100,820,220,170);
    W.house(B,1680,280,220,180);W.house(B,1700,900,200,170);
    B.wall(1960,560,1960,700);B.wall(1960,800,1960,900);B.wall(1700,560,1960,560);
    // bell tower base
    B.rect(900,60,200,160,{solid:true});B.rect(930,90,140,100,{col:'dim',a:0.6});B.seg(970,220,970,200,{col:'dim'});B.seg(1030,220,1030,200,{col:'dim'});
    // fountain
    B.circ(1000,760,60,{solid:true,n:24});B.circ(1000,760,44,{n:20,a:0.6});
    B.ent({id:'fount',x:1000,y:760,lr:70,pulse:fr?null:{every:0.9,max:180,str:0.45,ring:0.04},
      draw(ctx,e,a,t){W.st(ctx,'acc',Math.max(a,0.15),1);ctx.beginPath();for(let k=0;k<6;k++){const an=k/6*TAU,ph=fr?0.55:((t*0.8+k*0.17)%1);const r=40*ph,hgt=Math.sin(ph*Math.PI)*28;ctx.moveTo(e.x,e.y-10);ctx.quadraticCurveTo(e.x+Math.cos(an)*r*0.6,e.y-10-hgt,e.x+Math.cos(an)*r,e.y+Math.sin(an)*r*0.5-10+hgt*0.2);}ctx.stroke();}});
    // grain stall
    B.rect(500,800,140,56,{solid:true});
    const burnt=!fr&&!s.lantern;
    B.ent({id:'awning',x:570,y:792,lr:70,draw(ctx,e,a,t){W.st(ctx,burnt?'dim':'line',a,1);ctx.beginPath();ctx.rect(e.x-80,e.y-16,160,26);for(let i=1;i<8;i++){ctx.moveTo(e.x-80+i*20,e.y-16);ctx.lineTo(e.x-80+i*20,e.y+10);}ctx.stroke();
      if(burnt){const fire=(Date.now()-(s.restartAt||0))<14000;if(fire)flames(ctx,e.x,e.y-14,Math.max(a,0.7),t);else{W.st(ctx,'dim',a,1);ctx.beginPath();for(let i=0;i<10;i++){ctx.moveTo(e.x-70+i*15,e.y-10);ctx.lineTo(e.x-64+i*15,e.y+8);}ctx.stroke();}}}});
    B.ent({id:'grain',x:600,y:780,lr:20,draw(ctx,e,a,t){ctx.fillStyle='rgba('+G.pal.warm+','+Math.max(a,0.2)+')';for(let i=0;i<12;i++){const yy=fr?e.y-24+i*3.4:e.y-24+((i*3.4+t*60)%40);ctx.fillRect(e.x+Math.sin(i)*1.5,yy,1.4,1.4);}}});
    B.ent({id:'greta',name:'葛蕾塔',x:560,y:890,r:60,label:fr?'倒麥子的女人':'葛蕾塔',fig:{still:fr,arm:'out',bun:true},use:gretaTalk});
    // Luke on the ladder, mid-fall
    B.seg(652,790,640,690,{col:'line'});B.seg(668,790,656,690,{col:'line'});for(let i=0;i<6;i++){const y=780-i*17;B.seg(650-i*2,y,666-i*2,y,{col:'line',a:0.7});}
    B.ent({id:'luke',name:'路克',x:fr?690:672,y:fr?700:(s.hay?796:806),r:62,label:fr?'梯子上的人':'路克',hy:fr?660:780,
      draw(ctx,e,a,t){if(fr){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(0.7);G.drawFig(ctx,{still:true,arm:'bothup',hat:'cap'},0,0,a,t,e);ctx.restore();}else G.drawFig(ctx,{lying:true},e.x,e.y,a,t,e);},
      use:lukeTalk});
    B.ent({id:'lantern',x:s.lantern?430:606,y:s.lantern?770:(fr?738:790),r:50,lr:16,label:s.lantern?'燈籠（放在地上）':'半空中的燈籠',cond:()=>fr||s.lantern,
      draw(ctx,e,a,t){const g=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,22);g.addColorStop(0,'rgba('+G.pal.warm+',0.35)');g.addColorStop(1,'rgba('+G.pal.warm+',0)');ctx.fillStyle=g;ctx.fillRect(e.x-22,e.y-22,44,44);W.st(ctx,'warm',Math.max(a,0.55),1.1);ctx.beginPath();ctx.rect(e.x-5,e.y-7,10,13);ctx.moveTo(e.x,e.y-7);ctx.lineTo(e.x,e.y-11);ctx.stroke();},
      use:async()=>{
        if(s.lantern){await think('燈籠在地上亮著。離布篷很遠。');return;}
        if(G.carry&&G.carry.id==='cart'){await think('雙手推著車。先放開推車。');return;}
        await think('一盞燈籠，從梯子上的人手裡滑出去，停在布篷上方。');
        await think('時間一走，它就會落在布篷上。布篷底下，是一整袋一整袋的麥子。');
        s.lantern=true;AU.drop();G.rebuild();
        await say('凱拉','……拿下來。');
        await think('我把燈籠放在石頭地上，離布篷很遠。它會在地上繼續亮著。');G.save();
      }});
    // the hay cart
    const cx=s.hay?HAY_SPOT.x:(s.cartX||380),cy=s.hay?HAY_SPOT.y+6:(s.cartY||1060);
    B.ent({id:'cart',x:cx,y:cy,r:56,lr:26,label:G.carry&&G.carry.id==='cart'?'放開推車':'乾草推車',solid:0,
      draw:drawCart,
      use:async(e)=>{
        if(!fr){await think('推車上的乾草，被壓出一個人的形狀。');return;}
        if(G.carry&&G.carry.id==='cart'){
          G.carry=null;e.label='乾草推車';s.cartX=Math.round(e.x);s.cartY=Math.round(e.y);AU.drop();
          if(hyp(e.x-HAY_SPOT.x,e.y-HAY_SPOT.y)<70){s.hay=true;e.x=HAY_SPOT.x;e.y=HAY_SPOT.y+6;await think('推車停在梯子底下。乾草堆得很高。');await think('他會落在這裡。會痛，但不會太痛。');}
          else await think('放在這裡。');
          G.save();return;
        }
        if(G.carry){await think('手上還拿著東西。');return;}
        s.hay=false;G.carry={id:'cart',follow:e,heavy:true,lag:30};e.label='放開推車';AU.clank(0);
        await think('一輛裝滿乾草的推車。推得動。');
      }});
    B.ent({id:'fallspot',x:HAY_SPOT.x,y:HAY_SPOT.y,lr:10,draw(ctx,e,a,t){if(!fr||s.hay||!(G.mode==='threads'||G.carry))return;ctx.setLineDash([3,5]);W.st(ctx,'warm',0.35+0.2*Math.sin(t*3),1);ctx.beginPath();ctx.ellipse(e.x,e.y,30,12,0,0,TAU);ctx.stroke();ctx.setLineDash([]);}});
    // Lila, mid-jump
    B.ent({id:'lila',name:'莉拉',x:1240,y:fr?912:930,r:60,label:'莉拉',
      draw(ctx,e,a,t){const air=fr?-10:(-Math.abs(Math.sin(t*3.4))*7);W.st(ctx,'dim',a*0.6,1);ctx.beginPath();ctx.ellipse(e.x,e.y+4,8,3,0,0,TAU);ctx.stroke();
        G.drawFig(ctx,{child:true,still:true,rope:true,ropeY:fr?-12:(Math.sin(t*6.8)*14-4),arm:'none'},e.x,e.y+air,a,t,e);},
      use:lilaTalk});
    // Tio, running with the warning
    B.ent({id:'tio',name:'提歐',x:fr?1320:1180,y:fr?560:520,r:58,label:fr?'奔跑的男孩':'提歐',fig:{still:fr,child:true,arm:fr?'run':'chest',hat:'cap'},use:tioTalk,
      draw(ctx,e,a,t){G.drawFig(ctx,e.fig,e.x,e.y,a,t,e);if(fr&&!F('cam.hasLetter')&&!s.letter){W.st(ctx,'acc',Math.max(a,0.4),1);ctx.beginPath();ctx.rect(e.x+7,e.y-22,7,5);ctx.stroke();}}});
    // juggler, pigeons, townsfolk
    B.ent({id:'jug',name:'雜耍的人',x:820,y:1090,r:54,label:'雜耍的人',fig:{still:fr,arm:'bothup',hat:'wide'},use:jugTalk,
      draw(ctx,e,a,t){G.drawFig(ctx,e.fig,e.x,e.y,a,t,e);W.st(ctx,'warm',Math.max(a,0.2),1);for(let i=0;i<3;i++){const ph=fr?i*0.33:((t*1.3+i*0.33)%1);const bx=e.x-10+ph*20,by=e.y-38-Math.sin(ph*Math.PI)*22;ctx.beginPath();ctx.arc(bx,by,2.4,0,TAU);ctx.stroke();}}});
    if(fr)[[1080,480,0.2],[1130,520,-0.3],[1170,470,0.5],[900,560,2.8],[940,610,3.1]].forEach(([x,y,r],i)=>B.ent({id:'pg'+i,x,y,lr:12,draw(ctx,e,a){G.drawAnimal(ctx,'bird',e.x,e.y,a,1,r);}}));
    const folk=[['f1',1450,780,{still:fr,arm:'reach'},'付錢的人'],['f2',1500,1150,{still:fr,hood:true,arm:'hold'},'抱著孩子的女人'],['f3',420,1250,{still:fr,beard:true,cane:true},'老人'],['f4',1380,1300,{still:fr,arm:'out',hat:'cap'},'麵包師傅']];
    folk.forEach(([id,x,y,fig,lbl])=>B.ent({id,name:lbl,x,y,r:50,label:lbl,fig,use:()=>folkTalk(id,lbl)}));
    for(let i=0;i<18;i++){const x=300+B.r()*1400,y=300+B.r()*1100;if(hyp(x-1000,y-760)<140)continue;B.seg(x,y,x+(B.r()-0.5)*22,y+(B.r()-0.5)*6,{col:'dim',a:0.4});}
    for(let x=60;x<1960;x+=48)for(let y=260;y<1460;y+=48){if(B.r()<0.12)B.seg(x,y,x+20,y,{col:'dim',a:0.25});}
    W.selfThreads(B);
    B.thread({a:'lila',fray:[0,40],label:'莉拉 ← 第三十八下',tag:'莉拉',desc:'她在數。三十八。她要跳到四十，給媽媽看。',cond:fr,
      act:async()=>{await G.refuse('莉拉','把她從半空中抱下來',['……不行。','她在跳。她要自己落地。','如果我把她抱下來，那一下就不是她跳完的了。']);},actLabel:'把她從半空中抱下來'});
    B.thread({a:'luke',b:'fallspot',label:'路克 → 石板地',tag:'路克',desc:'時間一走，他就會落下去。落在這片石板上。',cond:()=>fr&&!s.hay});
    B.thread({a:'lantern',b:'awning',label:'燈籠 → 布篷 → 麥子',tag:'燈籠',desc:'時間一走，燈籠會落在布篷上。布篷會燒起來。',cond:()=>fr&&!s.lantern});
    B.thread({a:'tio',b:{x:1000,y:150},label:'提歐 → 鐘樓：警告',tag:'警告',desc:'一封信，要送去鐘樓。它晚了二十三年。',cond:()=>fr&&!F('cam.hasLetter')&&!s.letter});
    B.thread({a:'fount',b:{x:1000,y:120},label:'整座城 ← 鐘',tag:'鐘',desc:'每一條線最後都通到北邊的鐘樓。鐘停了，所有東西都停在同一刻。',cond:fr});
    B.exit(940,1470,120,30,'cam_gate',1400,560,{cond:()=>!(G.carry&&G.carry.id==='cart'),blocked:async()=>{await think('推車推不出城門。');}});
    B.exit(965,222,70,26,'cam_tower',500,1430,{cond:()=>!(G.carry&&G.carry.id==='cart'),blocked:async()=>{await think('推車進不了鐘樓。');}});
    B.exit(1962,700,38,100,'cam_workshop',80,560,{cond:()=>!(G.carry&&G.carry.id==='cart'),blocked:async()=>{await think('先把推車放下。');}});
  },
  async enter(first){
    if(first&&frozen()){
      await wait(0.4);
      await think('一走進門，聲音就變了。');
      await think('我發出的聲音，只走到離我不遠的地方，就停住了——像一圈一圈的冰。');
      await think('停住的聲音不會消失。我走過的地方，會一直留著形狀。');
      G.hint('在停滯的城裡，聆聽只能傳到不遠的地方<br>但聽過的東西，會留下來',9);
    }
    if(F('cam.restarted')&&!C().reunion){G.player.x=1210;G.player.y=990;await reunion();}
  }
});
async function lilaTalk(){
  if(frozen()){
    if(!F('cam.sawLila')){set('cam.sawLila');await think('一個女孩。雙腳離地，繩子在她頭頂上，停成一道弧。');await think('她的嘴張著。她在數數。');await think('……三十八。');}
    else await think('她停在第三十八下。還差兩下。');
    return;
  }
  if(C().reunion){await say('莉拉','……媽媽說，我睡了很久。');await say('莉拉','我沒有睡。我只是在跳繩。');return;}
}
async function tioTalk(){
  const s=C();
  if(frozen()){
    if(s.letter||F('cam.hasLetter')){await think('他還在跑。手裡已經沒有信了。');return;}
    await think('一個男孩，正往鐘樓跑。手裡捏著一封信。');
    await think('信封上寫著：給鐘樓的歐班。');
    set('cam.hasLetter');AU.page();G.rebuild();
    await think('我把信從他手指間抽出來。紙很薄，字寫得很急。');
    await think('「別敲第十三響。齒輪裂了。——賽拉斯」');
    await think('他跑了二十三年，還沒有跑到。');
    G.hint('信在凱拉身上。把它送到鐘樓裡的人手上',7);G.save();
    return;
  }
  await say('提歐','我……我明明還沒跑到鐘樓。信呢？我的信呢？');
  await say('提歐','歐班叔叔說，他手裡突然就有那封信了。');
  await say('提歐','……是妳嗎？');
  await think('我沒有回答。他也沒有再問。');
}
async function lukeTalk(){
  const s=C();
  if(frozen()){
    if(s.hay){await think('他還在半空中。底下是乾草。');return;}
    await think('一個男人，從梯子上滑下來，停在半空。');
    await think('時間一走，他就會摔在石板上。');
    await think('我抱不動他。……也不應該把一個人當成東西搬走。');
    return;
  }
  if(s.hay){await say('路克','我……從梯子上掉下來了？');await say('路克','還好底下有乾草。誰把推車推過來的？');await say('路克','腳扭到了，沒事。——天空的顏色怎麼跟剛剛不一樣？');}
  else{await say('路克','……啊……我的腿……');await say('路克','別碰。讓我躺一下。');await think('他落在石板上。腿彎成不該彎的樣子。');await think('我本來可以讓他落在別的地方。');}
}
async function gretaTalk(){
  const s=C();
  if(frozen()){await think('一個女人，正把麥子倒進袋子裡。麥子停在半空，一粒一粒。');await think('二十三年前的麥子。');return;}
  if(!s.lantern){await say('葛蕾塔','我的攤子……');await say('葛蕾塔','燈籠掉下來，一下就燒起來了。大家幫忙潑水，可是……');await say('葛蕾塔','那是今年最後一批麥子。——我是說，二十三年前的最後一批。');}
  else{await say('葛蕾塔','麥子倒完了。我倒完了，對吧？');await say('葛蕾塔','……可是，要賣給誰？他們說外面已經過了二十三年，麥價都不一樣了。');}
}
async function jugTalk(){
  if(frozen()){await think('三顆球停在他頭上。他的手張開著，在等。');return;}
  await say('雜耍的人','接住了！——嗯？怎麼大家都在哭？');
}
async function folkTalk(id,lbl){
  if(frozen()){
    const m={f1:['一個男人，手伸向錢袋。','付錢的那一刻，停了二十三年。'],f2:['一個女人抱著嬰兒。','嬰兒張著嘴，要哭，還沒哭出來。'],f3:['一個老人，拄著拐杖，正要坐下。','他還沒坐到椅子上。'],f4:['麵包師傅在喊什麼。','他的聲音停在嘴邊。——第十三個鐘頭的麵包，還在爐子裡。']}[id];
    for(const l of m)await think(l);return;
  }
  const st=C().state;
  const clock={T:'第十三響又回來了。今天市集照常多開一個時辰。',S:'只有十二響。……那我們明天的麵包要怎麼烤得完？',W:'十二響，再加上半刻。河邊要蓋輪子了，說是賽拉斯的圖。'}[st]||'';
  const m={f1:['二十三年？我的船……我的貨……','——我的家人還在等我嗎？'],f2:['這孩子……他應該已經長大了才對。','可是他還這麼小。我到底，錯過了什麼？'],f3:['我年輕的時候，鐘只敲十二下。',clock],f4:['爐子裡的麵包，烤成了炭。',clock]}[id];
  for(const l of m)if(l)await say(lbl,l,{src:id});
}

/* ---------- 鐘樓 ---------- */
const GEARS=[[300,1160,125],[700,1010,145],[330,760,118],[730,580,105],[300,440,88]];
function gearDraw(B,x,y,r){B.circ(x,y,r,{solid:true,n:Math.round(r/5)});const n=Math.round(r/8);for(let i=0;i<n;i++){const a=i/n*TAU;B.seg(x+Math.cos(a)*r,y+Math.sin(a)*r,x+Math.cos(a)*(r+9),y+Math.sin(a)*(r+9),{col:'line',a:0.8});}B.circ(x,y,r*0.3,{n:10,a:0.6});for(let i=0;i<4;i++){const a=i/4*TAU;B.seg(x+Math.cos(a)*r*0.3,y+Math.sin(a)*r*0.3,x+Math.cos(a)*r*0.9,y+Math.sin(a)*r*0.9,{col:'dim'});}}
G.defScene('cam_tower',{
  name:'鐘樓',pal:'cam',w:1000,h:1500,listenMax:620,
  ambient:()=>frozen()?'camFrozen':'cam',stasis:frozen,
  build(B){
    B.border();const s=C();
    GEARS.forEach(([x,y,r])=>gearDraw(B,x,y,r));
    for(let i=0;i<14;i++){const y=1440-i*90;B.seg(880,y,940,y-40,{col:'dim',a:0.5});}
    B.wall(420,1500,420,1400);B.wall(580,1500,580,1400);
    // bell
    B.arc(500,120,70,Math.PI*1.05,Math.PI*1.95,{col:'acc'});B.seg(432,138,568,138,{col:'acc'});B.seg(500,50,500,20,{col:'line'});
    B.rect(380,150,240,20,{solid:true,col:'dim'});
    // counterweights at the foot of the tower
    B.ent({id:'weights',x:120,y:1340,r:70,lr:30,label:s.weights?'配重（已掛上）':'舊配重石',
      draw(ctx,e,a){W.st(ctx,'line',a,1.1);ctx.beginPath();for(let i=0;i<3;i++)ctx.rect(e.x-30+i*22,e.y-(s.weights?60+i*8:14),18,26);ctx.stroke();if(s.weights){ctx.beginPath();ctx.moveTo(e.x,e.y-64);ctx.lineTo(e.x,40);W.st(ctx,'dim',a*0.7,1);ctx.stroke();}},
      use:async()=>{
        if(s.weights){await think('配重掛回鍊子上了。它們在等，等鐘讓它們往下走。');return;}
        await think('三塊很重的石頭，上面有鐵環。旁邊的鍊子一路通到鐘的心臟。');
        await think('以前，鐘是靠這些石頭往下沉的重量走的。後來他們把它卸下來，改用借來的力氣。');
        G.lockMove=true;for(let i=0;i<3;i++){AU.clank(-0.6);await wait(0.5);}G.lockMove=false;
        s.weights=true;G.rebuild();
        await think('掛回去了。');G.save();
      }});
    B.ent({id:'ober',name:'歐班',x:500,y:268,r:64,label:(F('cam.hasLetter')||!frozen())?'歐班':'拉著鐘繩的人',fig:{still:frozen(),arm:'pull',beard:true},
      draw(ctx,e,a,t){G.drawFig(ctx,e.fig,e.x,e.y,a,t,e);W.st(ctx,'line',Math.max(a,0.25),1);ctx.beginPath();ctx.moveTo(e.x+4,e.y-34);ctx.lineTo(500,138);ctx.stroke();if(s.letter){W.st(ctx,'acc',Math.max(a,0.5),1);ctx.beginPath();ctx.rect(e.x+5,e.y-30,7,5);ctx.stroke();}},
      use:oberTalk});
    B.ent({id:'crack',x:830,y:300,lr:30,draw(ctx,e,a){W.st(ctx,'line',a,1.1);ctx.beginPath();ctx.arc(e.x,e.y,34,0,TAU);ctx.stroke();W.st(ctx,'warm',a,1.3);ctx.beginPath();ctx.moveTo(e.x-8,e.y-34);ctx.lineTo(e.x-2,e.y-16);ctx.lineTo(e.x-10,e.y-4);ctx.lineTo(e.x-3,e.y+6);ctx.stroke();}});
    B.solidCircle(830,300,34);
    B.ent({id:'clock',x:700,y:210,r:80,lr:40,label:'鐘的心臟',ay:-10,
      draw(ctx,e,a,t){W.st(ctx,'acc',Math.max(a,0.25),1.2);ctx.beginPath();ctx.arc(e.x,e.y,22,0,TAU);ctx.moveTo(e.x-22,e.y);ctx.lineTo(e.x+22,e.y);const sw=frozen()?0.3:Math.sin(t*3)*0.5;ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.sin(sw)*40,e.y+Math.cos(sw)*40);ctx.stroke();},
      use:clockKnot});
    W.selfThreads(B);
    B.thread({a:'ober',b:'crack',label:'歐班 → 下一響 → 裂開的齒輪',tag:'下一響',desc:'他握著繩子，正要再拉一次。時間一走，第十三響會再敲一次——裂開的齒輪撐不住。',cond:()=>frozen()&&!s.letter});
    B.thread({a:'clock',fray:[160,-120],label:'擒縱 ← 以後',tag:'以後',desc:'鐘的心臟，向以後借力氣推動第十三響。以後，沒有力氣可以借了。',cond:frozen});
    B.thread({a:'clock',b:'weights',label:'擒縱 ← 配重',tag:'配重',desc:()=>s.weights?'配重掛上了。只要放開，鐘就能靠自己的重量走。':'鍊子垂著，另一端什麼都沒有。以前，那裡掛著石頭。',cond:frozen});
    B.exit(420,1470,160,30,'cam_square',1000,270);
  },
  async enter(first){
    if(first&&frozen()){await wait(0.3);await think('鐘樓裡全是齒輪。每一個都停在同一刻。');await think('最上面，有人拉著繩子。');}
  }
});
async function oberTalk(){
  const s=C();
  if(!frozen()){await say('歐班','賽拉斯的信……我明明已經拉下去了，手裡卻突然有這封信。');await say('歐班','第十三響，我不敲了。');return;}
  if(s.letter){await think('信在他的手指之間。時間一走，他會先摸到它。');return;}
  if(!F('cam.hasLetter')){await think('一個男人，雙手拉著鐘繩，身體往下沉。');await think('他正要敲下一響。');return;}
  await think('我把信塞進他握著繩子的手指之間。');
  s.letter=true;AU.page();G.rebuild();
  await think('時間一走，他會先摸到信。然後，他會放開繩子。');G.save();
}
async function clockKnot(){
  const s=C();
  if(!frozen()){await think('鐘在走。我聽得見它的心跳。');return;}
  if(!s.letter){await think('如果現在讓鐘走，歐班會再拉一次繩子。那個裂開的齒輪會碎。');await think('碎片會掉進廣場——莉拉在廣場上。');return;}
  if(!F('cam.clockVoice')){
    set('cam.clockVoice');
    await voice('建議方案：以外部能源重啟擒縱。\n預估恢復時間：最短。');
    await say('凱拉','外部能源？你是說——以後的力氣。');
    await say('凱拉','在森林裡，你要我關上借來的力氣。在這裡，你要我再借一次。');
    await voice('各區修復目標：獨立評估。');
    await say('凱拉','可是它們是同一個世界。');
    await voice('……');
  }
  const pend=[];if(!s.lantern)pend.push('廣場上的燈籠，還懸在布篷上面。');if(!s.hay)pend.push('梯子上的人，底下還是石板。');
  if(pend.length&&!F('cam.pendWarn')){set('cam.pendWarn');await think('時間一走，所有停住的東西都會一起落下。');for(const p of pend)await think(p);}
  const key=await G.knot({ent:'clock',title:'鐘的心臟',options:[
    {key:'T',label:'向以後借力，讓鐘照原樣走',desc:'用以後的力氣重新推動擒縱，十三響都會回來。市集照舊多開一個時辰。以後會繼續被借走——停下來的那一刻，也許會再來一次。'},
    {key:'S',label:'放下配重，讓鐘只走十二響',ok:!!s.weights,off:'（鐘需要別的東西來推。塔底下，好像有很重的石頭。）',desc:'配重讓鐘用自己的重量走。第十三響不會再有了——那一個鐘頭，本來就是借來的。靠那一個鐘頭過活的人，得重新想辦法。'},
    {key:'W',label:'放下配重，再接上河輪，補上半刻',ok:!!s.weights&&F('cam.designFound'),off:'（配重之外，還缺一個不必向以後借的力氣。賽拉斯好像想過什麼——）',desc:'配重推動十二響；賽拉斯畫過的河輪，能從河水裡多轉出半刻。河輪蓋好之前，還需要向以後借一條很細的線。'}
  ],backDesc:'先不讓時間走。'});
  if(!key)return;
  s.state=key;
  await G.decide('鐘樓',{T:'向以後借力，讓鐘照原樣走',S:'放下配重，讓鐘只走十二響',W:'放下配重，接上河輪'}[key]);
  await restart(key);
}
async function restart(key){
  const s=C();
  G.lockMove=true;
  await think('……走吧。');
  if(key!=='T'){for(let i=0;i<3;i++){AU.clank(-0.4);await wait(0.35);}}
  AU.bell(key==='T'?174.6:196,0.14);if(key==='W')setTimeout(()=>AU.bell(392,0.05),900);
  G.pulse(500,120,{max:1400,str:1,ring:0.5,spd:500});
  set('cam.restarted');s.restartAt=Date.now();
  G.rings=[];G.AU.amb('cam');G.rebuild();
  await wait(2.2);
  await think('聲音走出去了。沒有停。');
  await think('我聽見整座城，同時開始動。');
  G.lockMove=false;G.save();
  await G.gotoScene('cam_square',1210,990,{fade:0.8});
}
async function reunion(){
  const s=C();
  G.grief('lila');
  const P=G.player;
  G.camFocus={x:1180,y:900};
  B_addMarga();
  await wait(0.8);
  await say('莉拉','三十九！四十！');
  await say('莉拉','媽媽！我跳到四十了！媽媽妳看——');
  await wait(1.2);
  await G.moveEnt('marga_in',1180,960,32);
  await say('莉拉','……媽媽？');
  await wait(1);
  await say('莉拉','……妳是誰？');
  await say('瑪嘉','莉拉。');
  await say('莉拉','媽媽的頭髮是黑的。');
  await wait(1.2);
  await say('瑪嘉','……以前是。');
  await say('莉拉','姊姊。現在是什麼時候？');
  await wait(1);
  await say('凱拉','……很晚了。');
  await say('凱拉','比妳以為的，晚很多。');
  await say('瑪嘉','妳跳到四十了。媽媽看到了。');
  await say('瑪嘉','……媽媽一直都在看。');
  await wait(1.5);
  await think('莉拉哭了。瑪嘉抱住她。');
  await think('我讓鐘走了。她跳完了那一下。');
  await think('那一下，用掉了她母親二十三年。');
  if(!F('named.grief')){set('named.grief');await think('胸口很重。我想，這就是人們說的「難過」。');}
  await think('我不知道該不該說對不起。我不知道該對誰說。');
  s.reunion=true;G.camFocus=null;G.endGrief();
  const m=G.ent('marga_in');if(m){m.update=null;m.hideLabel=false;m.r=56;m.label='瑪嘉';m.use=margaAfter;}
  await voice('區域時間流：恢復。\n世界偏差：下降 0.04。');
  await say('凱拉','……0.04。');
  await wait(0.6);
  await think('……賽拉斯。');
  G.save();
}
function B_addMarga(){
  const e={id:'marga_in',name:'瑪嘉',x:1060,y:1300,r:0,lr:22,lit:0,base:0,t:1,fig:{bent:0.7,cane:true,hood:true},hideLabel:true};
  G.ents.push(e);G.entById.marga_in=e;
}
async function margaAfter(){await say('瑪嘉','她還不肯放開我的手。');await say('瑪嘉','……我也不想放。');await say('瑪嘉','謝謝妳。——我不知道該不該謝妳。可是，謝謝妳。');}
G.scenes.cam_square.load=function(){
  if(C().reunion){const e={id:'marga_in',name:'瑪嘉',x:1180,y:960,r:56,lr:22,lit:0,base:0,t:2,label:'瑪嘉',fig:{bent:0.7,cane:true,hood:true},use:margaAfter};G.ents.push(e);G.entById.marga_in=e;}
};

/* ---------- 賽拉斯的工坊 ---------- */
G.defScene('cam_workshop',{
  name:'賽拉斯的工坊',pal:'cam',w:1100,h:800,listenMax:620,
  ambient:()=>frozen()?'camFrozen':'cam',stasis:frozen,
  build(B){
    B.border();const s=C();
    B.rect(470,330,180,60,{solid:true});
    for(let i=0;i<5;i++)B.rect(60,120+i*90,120,60,{solid:true,col:'dim'});
    B.rect(200,260,70,70,{solid:true});B.circ(235,295,20,{n:10,a:0.6});
    B.rect(820,260,80,56,{solid:true});
    for(let i=0;i<30;i++){const x=300+B.r()*700,y=500+B.r()*240;B.circ(x,y,4+B.r()*10,{n:8,a:0.4,col:'dim'});}
    const dead=s.silas;
    B.ent({id:'silas',name:'賽拉斯',x:560,y:440,r:70,label:'賽拉斯',
      draw(ctx,e,a,t){if(dead==='with'||dead==='alone'){G.drawFig(ctx,{lying:true},e.x,e.y+10,a*0.6,t,e);return;}G.drawFig(ctx,{still:frozen(),bent:0.9,arm:'chest',beard:true},e.x,e.y,a,t,e);},
      use:silasTalk});
    B.ent({id:'box',x:860,y:300,r:70,lr:20,label:'上鎖的小盒子',
      draw(ctx,e,a){W.st(ctx,'line',a,1.1);ctx.beginPath();ctx.rect(e.x-16,e.y-10,32,20);ctx.moveTo(e.x-16,e.y-3);ctx.lineTo(e.x+16,e.y-3);ctx.stroke();},
      use:async()=>{
        if(F('cam.designFound')){await think('河輪擒縱的草圖。紙很脆，線條還清楚。');return;}
        if(F('cam.design')){await think('盒子的扣子，一扳就開。');AU.page();await think('裡面有一張發黃的紙，被揉皺過，又被小心地攤平。');await think('一個輪子，一條河，一個擒縱的草圖。旁邊寫著：「半刻。」');set('cam.designFound');G.save();return;}
        await think('一個小盒子，扣得很緊。裡面空空的，只有灰塵的聲音。');
      }});
    W.rift(B,'rift',930,640,'裂隙（前一天）',async()=>{await G.riftTo('cam_workshop_past',900,620);});
    W.selfThreads(B);
    B.thread({a:'silas',fray:[0,70],label:'心臟：停在最後一拍之前',tag:'賽拉斯',desc:'他的心在停下來之前的最後一拍，被時間接住了。時間一走，這一拍就會落下。',cond:()=>frozen()});
    B.thread({a:'silas',b:'rift',label:'賽拉斯 ← 前一天',tag:'',desc:'前一天，他還能走動、說話，還在想別的辦法。',cond:()=>!F('cam.design')});
    B.exit(0,500,30,120,null,0,0,{go:async()=>{await G.gotoScene('cam_square',1930,750);}});
  },
  async enter(first){
    if(first&&frozen()){await wait(0.3);await think('工坊。滿屋子的齒輪，和一個趴在桌上的老人。');}
    if(!frozen()&&C().reunion&&!C().silas){await silasDeath();}
  }
});
async function silasTalk(){
  const s=C();
  if(s.silas){await think('他很安靜。');return;}
  if(frozen()){await think('一個老人，手按著胸口，倒在桌上。');await think('他的心，停在最後一拍之前。');await think('時間一走，這一拍就會落下。我沒有辦法讓它不落下。');return;}
}
async function silasDeath(){
  const s=C();s.silasAt=Date.now();
  G.grief('silas');
  await wait(0.6);
  await think('他還在呼吸。很淺，很慢。');
  await G.walkTo(610,470,50);
  await say('賽拉斯','……信……送到了嗎……');
  await say('凱拉','送到了。歐班沒有再拉繩子。');
  await say('賽拉斯','那就好……');
  await wait(1.2);
  await say('賽拉斯','……白色的……頭髮……');
  await say('賽拉斯','……又是妳啊。');
  await say('凱拉','我們見過嗎？');
  await say('賽拉斯','……這一次……妳要……拿走什麼……');
  await wait(1.6);
  await say('凱拉','我不是來拿東西的。');
  await wait(2.4);
  s.silas='with';G.rebuild();AU.tone(98,2.5,0.03,{wet:1});
  await think('他沒有回答。');
  await think('我不認識他。可是他好像認識我。');
  G.endGrief();G.save();
}

/* ---------- 工坊（前一天） ---------- */
G.defScene('cam_workshop_past',{
  name:'賽拉斯的工坊（前一天）',pal:'past',w:1100,h:800,ambient:'past',
  build(B){
    B.border();
    B.rect(470,330,180,60,{solid:true});
    for(let i=0;i<5;i++)B.rect(60,120+i*90,120,60,{solid:true,col:'dim'});
    B.rect(200,260,70,70,{solid:true});
    B.rect(820,260,80,56,{solid:true});
    const st={t0:G.t,lit:false,burnt:false};this._st=st;
    const S=B.ent({id:'silas',name:'賽拉斯',x:560,y:420,r:0,lr:24,hideLabel:true,fig:{col:'warm',flicker:true,beard:true},
      update(dt,e){const t=G.t-st.t0;
        const bub=(k,txt)=>{if(!e['b'+k]){e['b'+k]=1;G.bubble(e,txt,4.2);}};
        if(t<5){bub(0,'河輪可以從水裡轉出半刻……');if(t>2.6)bub(1,'……可是借來的一整刻，更方便。');}
        else if(t<6.2){bub(2,'算了。');e.x+=(300-e.x)*Math.min(1,dt*2);e.y+=(330-e.y)*Math.min(1,dt*2);if(t>5.8&&!st.thrown){st.thrown=true;}}
        else if(t<13){bub(3,'火柴……火柴放哪裡了……');const tx=200,ty=560;e.x+=Math.sign(tx-e.x)*Math.min(Math.abs(tx-e.x),48*dt);e.y+=Math.sign(ty-e.y)*Math.min(Math.abs(ty-e.y),48*dt);}
        else if(t<19.5){const tx=300,ty=340;e.x+=Math.sign(tx-e.x)*Math.min(Math.abs(tx-e.x),40*dt);e.y+=Math.sign(ty-e.y)*Math.min(Math.abs(ty-e.y),40*dt);}
        else if(!st.lit){st.lit=true;AU.noise(0.6,0.05,{f:800,q:0.5,wet:0.4});G.pulse(235,295,{max:220,str:0.8});if(st.thrown&&!F('cam.design')&&!(G.carry&&G.carry.id==='paper')){st.burnt=true;G.soon(async()=>{await think('……燒掉了。');await think('再回去一次。回到這一天的早一點。');});}bub(4,'咳……咳。');}
        else if(t<30){const tx=560,ty=420;e.x+=Math.sign(tx-e.x)*Math.min(Math.abs(tx-e.x),40*dt);e.y+=Math.sign(ty-e.y)*Math.min(Math.abs(ty-e.y),40*dt);if(t>24)bub(5,'第十三響的齒輪有裂痕……得告訴歐班。');}
      }});
    B.ent({id:'stove',x:235,y:295,lr:30,always:0,draw(ctx,e,a,t){if(st.lit){const g=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,30);g.addColorStop(0,'rgba('+G.pal.warm+',0.35)');g.addColorStop(1,'rgba('+G.pal.warm+',0)');ctx.fillStyle=g;ctx.fillRect(e.x-30,e.y-30,60,60);}}});
    B.ent({id:'paper',x:560,y:352,r:62,lr:14,label:'揉皺的紙',cond:()=>!F('cam.design')&&!st.burnt&&!(G.carry&&G.carry.id==='paper'),
      update(dt,e){if(st.thrown&&!e.inStove){e.x+=(238-e.x)*Math.min(1,dt*4);e.y+=(300-e.y)*Math.min(1,dt*4);if(hyp(e.x-238,e.y-300)<3)e.inStove=true;}},
      draw(ctx,e,a){W.st(ctx,'acc',Math.max(a,0.35),1);ctx.beginPath();ctx.moveTo(e.x-5,e.y-4);ctx.lineTo(e.x+4,e.y-5);ctx.lineTo(e.x+6,e.y+3);ctx.lineTo(e.x-2,e.y+5);ctx.lineTo(e.x-6,e.y+1);ctx.closePath();ctx.stroke();},
      use:async()=>{
        if(!st.thrown){await think('桌上的紙，畫著一個輪子。他還在看。');return;}
        G.carry={id:'paper',draw(ctx,x,y){W.st(ctx,'acc',0.9,1);ctx.beginPath();ctx.rect(x-3,y,7,6);ctx.stroke();}};AU.page();
        await think('我把紙從爐子裡拿出來。一個輪子，一條河。旁邊寫著：「半刻。」');
        await think('要找一個地方，讓它留到以後。');
      }});
    B.ent({id:'box',x:860,y:300,r:70,lr:20,label:'小盒子（開著）',
      draw(ctx,e,a){W.st(ctx,'line',a,1.1);ctx.beginPath();ctx.rect(e.x-16,e.y-10,32,20);ctx.moveTo(e.x-16,e.y-10);ctx.lineTo(e.x-12,e.y-24);ctx.lineTo(e.x+20,e.y-24);ctx.lineTo(e.x+16,e.y-10);ctx.stroke();},
      use:async()=>{
        if(F('cam.design')){await think('紙在盒子裡。扣子扣上了。');return;}
        if(!(G.carry&&G.carry.id==='paper')){await think('一個開著的小盒子。他放重要東西的地方。');return;}
        G.carry=null;set('cam.design');AU.page();
        await think('把紙攤平，放進盒子，扣上。');
        await think('他不會發現。明天之後，他也沒有機會再打開它了。');G.save();
      }});
    W.rift(B,'rift',930,640,'回到現在',async()=>{if(G.carry&&G.carry.id==='paper')G.carry=null;await G.riftTo('cam_workshop',900,620);},{col:'acc'});
    W.selfThreads(B);
    B.thread({a:'paper',b:'stove',label:'草圖 → 爐火',tag:'',desc:'他覺得借來的一整刻比較方便。這張紙，今天就會被燒掉。',cond:()=>!F('cam.design')});
  },
  async enter(){
    if(!F('cam.pastSeen')){set('cam.pastSeen');await think('前一天的工坊。老人在走動，在說話。');await think('他聽不見我。');}
  }
});
G.scenes.cam_workshop_past.load=function(){const st=this._st;if(st)st.t0=G.t;};

async function leaveCampana(){
  G.lockMove=true;
  if(!C().silas){C().silas='alone';C().silasAt=Date.now();}
  await voice('區域偏差：部分修正。\n下一座標：伊南。');
  await think('我讓時間重新走了。');
  await think('修復，也會傷人。——這件事，我現在知道了。');
  await G.fade(1,1.4);G.lockMove=false;
  G.S.chapter=3;
  await G.gotoScene('inan_shore',90,450,{instant:true});
}
})();
