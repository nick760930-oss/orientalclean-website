/* 第一章 — 利米塔尼亞 */
(function(){
'use strict';
const {F,set,TAU,hyp,clamp}=G;
const say=(...a)=>G.say(...a),think=t=>G.think(t),voice=t=>G.voice(t),wait=s=>G.wait(s);
const L=()=>G.S.lim;

/* ---------- shared drawings ---------- */
function antler(ctx,x,y,ang,len,depth){
  if(depth<=0||len<3)return;const x2=x+Math.cos(ang)*len,y2=y+Math.sin(ang)*len;
  ctx.moveTo(x,y);ctx.lineTo(x2,y2);antler(ctx,x2,y2,ang-0.45,len*0.66,depth-1);antler(ctx,x2,y2,ang+0.32,len*0.6,depth-1);
}
function drawGuardian(ctx,e,a,t){
  const d=e.decay||0,br=Math.sin(t*0.55)*1.6*(1-d);
  ctx.save();ctx.translate(e.x,e.y+d*10);
  const aa=a*(1-d*0.9);W.st(ctx,'line',aa,1.3);
  if(d>0)ctx.setLineDash([Math.max(0.6,9*(1-d)),1+d*10]);
  ctx.beginPath();ctx.ellipse(0,0,80,30+br,0,0,TAU);
  ctx.moveTo(-40,24);ctx.lineTo(-18,38);ctx.lineTo(12,35);ctx.moveTo(22,27);ctx.lineTo(46,38);ctx.lineTo(62,30);
  ctx.moveTo(-62,-12);ctx.quadraticCurveTo(-86,-38,-96,-50);ctx.moveTo(-72,6);ctx.quadraticCurveTo(-94,-18,-106,-38);
  W.glowStroke(ctx,'line',aa,1.3);
  ctx.beginPath();ctx.ellipse(-106,-50,15,9,-0.5,0,TAU);W.glowStroke(ctx,'line',aa,1.3);
  ctx.beginPath();antler(ctx,-104,-58,-2.0,20,4);antler(ctx,-98,-58,-1.2,20,4);W.glowStroke(ctx,'acc',aa*0.8,1);
  ctx.setLineDash([]);
  ctx.fillStyle='rgba('+G.pal.line+','+aa*0.5+')';
  for(let i=0;i<46;i++){const px=Math.sin(i*7.7)*72,py=Math.cos(i*3.1)*24;ctx.fillRect(px,py,1.4,1.4);}
  if(!e.released){ctx.fillStyle='rgba('+G.pal.warm+','+aa*0.4+')';for(let i=0;i<14;i++){const px=-104+Math.sin(i*5.3)*10,py=-50+Math.cos(i*2.9)*6;ctx.fillRect(px,py,1.2,1.2);}}
  if(d>0.3){ctx.fillStyle='rgba('+G.pal.line+','+a*(d-0.3)+')';for(let i=0;i<24;i++){const px=Math.sin(i*9.1)*70,py=18+Math.cos(i*4.7)*10;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+1,py-4*(d-0.3)*3);ctx.strokeStyle=ctx.fillStyle;ctx.stroke();}}
  ctx.restore();
}
function lampEnt(B,id,x,y,on){
  return B.ent({id,x,y,lr:14,always:0,base:on()?0.45:0,
    pulse:{every:2.2,max:70,str:0.35,ring:0.05},
    cond:()=>true,
    draw(ctx,e,a){W.st(ctx,'dim',Math.max(a,0.3),1);ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x,e.y-22);ctx.stroke();
      if(on()){const g=ctx.createRadialGradient(e.x,e.y-24,0,e.x,e.y-24,16);g.addColorStop(0,'rgba('+G.pal.warm+',0.5)');g.addColorStop(1,'rgba('+G.pal.warm+',0)');ctx.fillStyle=g;ctx.fillRect(e.x-16,e.y-40,32,32);}
      W.st(ctx,on()?'warm':'dim',on()?0.9:0.4,1);ctx.beginPath();ctx.arc(e.x,e.y-24,3,0,TAU);ctx.stroke();}});
}
const lampsOn=()=>L().state!=='S';

function limCheck(){if(!F('lim.done')&&F('lim.decayPast')&&L().guardian&&L().state){set('lim.done');G.save();return true;}return false;}

/* ---------- 林緣 ---------- */
G.defScene('lim_edge',{
  name:'林緣',pal:'lim',w:1800,h:1300,ambient:'lim',
  build(B){
    B.border();
    const main=[[40,700],[500,690],[900,640],[1300,560],[1790,520]],north=[[900,640],[860,380],[820,20]];
    W.pathEdge(B,main,34);W.pathEdge(B,north,30);
    W.forest(B,20,20,1780,1280,125,(x,y,r)=>W.distPath(x,y,main)<60+r||W.distPath(x,y,north)<52+r,18,46);
    W.grass(B,0,0,1800,1300,380,{avoid:(x,y)=>W.distPath(x,y,main)<28||W.distPath(x,y,north)<24});
    B.ent({id:'bird',x:520,y:708,r:50,lr:16,label:'一隻鳥',draw(ctx,e,a){G.drawAnimal(ctx,'bird',e.x,e.y,a,1.2,0.3);},
      update(dt,e){if(!F('lim.bird')&&G.script===0&&hyp(G.player.x-e.x,G.player.y-e.y)<70){set('lim.bird');G.run(birdScene);}},
      use:async()=>{await think('牠還在那裡。羽毛一根都沒有少。');}});
    B.ent({id:'sign',x:880,y:600,r:44,lr:14,label:'路標',draw(ctx,e,a){W.st(ctx,'line',a,1.1);ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x,e.y-26);ctx.moveTo(e.x-12,e.y-24);ctx.lineTo(e.x+14,e.y-24);ctx.lineTo(e.x+18,e.y-20);ctx.lineTo(e.x+14,e.y-16);ctx.lineTo(e.x-12,e.y-16);ctx.stroke();},
      use:async()=>{await think('路標上刻著字。指尖摸得出來。');await think('北：苔燈村。東：……字被青苔蓋住了。');await think('青苔摸起來很新，卻已經很厚。');}});
    W.selfThreads(B);
    B.thread({a:'bird',fray:[30,60],label:'分解：未發生',tag:'',desc:'牠死了很久。該把牠帶回土裡的東西，一直沒有來。'});
    B.exit(790,0,70,40,'lim_village',800,1130);
    B.exit(1760,440,40,150,'lim_rift',70,450);
  },
  async enter(first){
    if(!first)return;
    await G.card('第一章','利 米 塔 尼 亞');
    await voice('區域：利米塔尼亞。\n偏差源：未定位。');
    await think('樹很多。每一棵都在長，我聽得見樹皮撐開的聲音。');
    await think('可是聽不見蟲。聽不見落葉底下有東西在動。');
    G.hint(G.hk('走近人或物，按 <b>Enter</b> 或點擊它<br>在任何地方按 <b>E</b> 都能看見絲線','點擊人或物來靠近<br>隨時都能按「絲線」'),9);
  }
});
async function birdScene(){
  G.lockMove=true;G.player.vx=G.player.vy=0;
  await wait(0.4);
  await think('……一隻鳥。');
  await think('牠死了。死了很久——可是沒有變成土。');
  await think('羽毛、骨頭、爪子，都還在原來的地方。像一個被放下之後就沒有人來收的東西。');
  G.lockMove=false;
}

/* ---------- 苔燈村 ---------- */
G.defScene('lim_village',{
  name:'苔燈村',pal:'lim',w:1600,h:1200,ambient:'lim',
  build(B){
    B.border();
    W.house(B,380,330,150,110);W.house(B,1000,290,160,110);W.house(B,300,730,140,120);W.house(B,560,870,150,110,{doorX:0.3});W.house(B,1060,800,150,110);
    W.house(B,620,300,120,90,{wins:1});
    // greenhouse
    B.rect(1180,460,280,190,{solid:true});
    for(let i=1;i<7;i++)B.seg(1180+i*40,460,1180+i*40,650,{col:lampsOn()?'warm':'dim',a:0.5});
    for(let j=1;j<4;j++)B.seg(1180,460+j*47,1460,460+j*47,{col:lampsOn()?'warm':'dim',a:0.4});
    B.ent({id:'gh',x:1320,y:555,lr:120,always:0,pulse:lampsOn()?{every:1.8,max:210,str:0.45,ring:0.04}:null,draw(){}});
    // root-well pipes
    B.path([[800,0],[800,470],[1180,555]],{col:'warm',a:0.35});B.path([[800,470],[700,540]],{col:'warm',a:0.3});B.path([[800,470],[900,540]],{col:'warm',a:0.3});
    // kiln ruin
    B.arc(220,520,34,0.3,5.4,{col:'dim',solid:true});B.arc(220,520,24,0.9,4.2,{col:'dim',a:0.6});
    if(F('lim.cellarSaved')){
      B.ent({id:'lid',x:285,y:585,r:52,lr:18,label:F('lim.canWeave')?'地窖':'地窖的蓋子',draw(ctx,e,a){W.st(ctx,'line',a,1.1);ctx.beginPath();ctx.rect(e.x-18,e.y-10,36,20);ctx.moveTo(e.x-18,e.y);ctx.lineTo(e.x+18,e.y);ctx.stroke();if(F('lim.canWeave')){W.st(ctx,'warm',a*0.8,1);ctx.beginPath();ctx.arc(e.x,e.y-26,7,0,TAU);ctx.stroke();}},use:cellarScene});
    }
    W.rift(B,'rift',150,430,'窯邊的裂隙',async()=>{await G.riftTo('lim_village_past',150,480);});
    lampEnt(B,'l1',700,540,lampsOn);lampEnt(B,'l2',900,540,lampsOn);lampEnt(B,'l3',700,700,lampsOn);lampEnt(B,'l4',900,700,lampsOn);
    W.grass(B,0,0,1600,1200,260,{avoid:(x,y)=>hyp(x-800,y-620)<150});
    W.forest(B,0,0,1600,1200,30,(x,y,r)=>!(x<90||x>1510||y<90||y>1110)||(x<90&&y>520&&y<700)||(y<90&&x>700&&x<900)||(y>1110&&x>700&&x<900),16,34);
    // people
    B.ent({id:'rowan',name:'蘿溫',x:1150,y:710,r:60,label:'蘿溫',fig:{hood:true,basket:true},use:rowanTalk});
    B.ent({id:'glan',name:'葛蘭',x:290,y:640,r:60,label:'葛蘭',fig:{bent:0.5,cane:true,beard:true},use:glanTalk});
    B.ent({id:'chest',name:'小栗',x:830,y:640,r:56,label:'小栗',fig:{child:true,arm:'reach'},use:chestTalk,
      draw(ctx,e,a,t){G.drawFig(ctx,e.fig,e.x,e.y,a,t,e);W.st(ctx,'dim',a*0.8,1);ctx.beginPath();ctx.ellipse(e.x+22,e.y+4,14,5,0,0,TAU);antler(ctx,e.x+14,e.y,-2.2,6,2);ctx.stroke();}});
    B.ent({id:'dora',name:'朵拉',x:650,y:1010,r:56,label:'朵拉',fig:{arm:'hold',bun:true},use:doraTalk,cond:()=>!(L().state==='S'&&F('lim.doraGone'))});
    B.ent({id:'cart',x:700,y:1030,lr:20,draw(ctx,e,a){W.st(ctx,'line',a,1);ctx.beginPath();ctx.rect(e.x,e.y-14,40,16);ctx.moveTo(e.x+8,e.y+6);ctx.arc(e.x+8,e.y+6,5,0,TAU);ctx.moveTo(e.x+37,e.y+6);ctx.arc(e.x+32,e.y+6,5,0,TAU);ctx.stroke();},cond:()=>!(L().state==='S'&&F('lim.doraGone'))});
    W.selfThreads(B);
    B.thread({a:'l2',b:{x:800,y:40},label:'燈 ← 根井',tag:'根井',desc:'燈的光從北邊來——從老槲底下那口井。',cond:lampsOn});
    B.thread({a:'gh',b:{x:800,y:40},label:'溫室 ← 根井',tag:'',desc:'溫室的土是暖的。熱從很深的地方爬上來，那不是現在的熱。',cond:lampsOn});
    B.thread({a:'glan',b:'rift',label:'葛蘭 ← 舊窯',tag:'舊窯',desc:'老人的記憶，和窯邊那道裂隙連在一起。那道裂隙通往六十年前。',cond:()=>F('lim.metGlan')&&!F('lim.cellarSaved')});
    B.exit(760,1160,80,40,'lim_edge',830,90);
    B.exit(760,0,80,40,'lim_oak',750,1110);
    B.exit(0,560,40,120,null,0,0,{cond:()=>F('lim.done'),blocked:async()=>{await think('西邊是出林的路。');await think('還不能走。森林的事，還沒有結束。');},go:leaveLimitania});
  },
  async enter(first){
    if(first){await wait(0.3);await think('人的聲音。燈的嗡嗡聲。還有一種很低的、從地底下來的熱。');}
    limCheck();
    if(F('lim.done')&&!F('lim.aftermath')){set('lim.aftermath');await aftermath();}
  }
});

async function rowanTalk(){
  if(!F('lim.metRowan')){
    set('lim.metRowan');
    await say('蘿溫','……妳走路幾乎沒有聲音。從林子裡來的？');
    await say('凱拉','從石室來。我叫凱拉。我來修這座森林。');
    await say('蘿溫','修？');
    await say('蘿溫','森林沒有壞。妳聽——它每天都在長。');
    await say('蘿溫','長得太快了。去年種的樺樹，今年已經比屋頂高。可是落葉不爛，死掉的東西也不會變成土。');
    await say('凱拉','東西不會回去。');
    await say('蘿溫','對。只會一直來。');
    await say('蘿溫','溫室是靠根井的熱撐著的。冬天林子裡什麼都沒有的時候，村子就吃這裡長出來的東西。');
    await say('凱拉','根井。');
    await say('蘿溫','老槲底下那口井。祖父那一輩，有人教大家挖的。它把「以後」的力氣引到根裡——土就是暖的，燈就是亮的。');
    await think('以後的力氣。和石室那扇門一樣，向還沒到來的時間要東西。');
    await say('蘿溫','妳要修森林，好。');
    await say('蘿溫','修好之後，冬天我們吃什麼？');
    G.player.vx=0;await wait(0.8);
    await think('我不知道。');
    return;
  }
  if(F('lim.done'))return rowanAfter();
  if(F('lim.canWeave')){await say('蘿溫','葛蘭爺爺已經在量窯口了。');await say('蘿溫','如果真的做得到……根井只要在最冷的那幾週，給溫室一點點就夠。');return;}
  if(!F('lim.metGuardian')){await say('蘿溫','老角在老槲那邊。牠本來早就該倒下了……可是根井不讓。');return;}
  await say('蘿溫','妳去看過老角了。');await say('蘿溫','小栗每天都問我，牠是不是生病了。我不知道要怎麼跟她說。');
}
async function rowanAfter(){
  const s=L().state;
  if(s==='T'){await say('蘿溫','燈還亮著。');await say('蘿溫','謝謝。——我知道妳本來是來關掉它的。');await say('凱拉','我還不知道該怎麼修，才不會讓你們餓著。');await say('蘿溫','那就等妳知道了再回來。森林會等的。……大概吧。');}
  else if(s==='S'){await say('蘿溫','……溫室冷了。');await say('蘿溫','妳修好了森林。我聽得見，落葉底下又有東西在動了。');await say('蘿溫','朵拉家今天早上走了。後面還有幾戶在收東西。');await say('凱拉','……對不起。');await say('蘿溫','別道歉。妳只是比我們早一點看見以後。');}
  else{await say('蘿溫','葛蘭爺爺在教大家怎麼封窯口。他說他記得——他說他其實一直都記得，只是沒有人問。');await say('蘿溫','冬天還是會很難。最冷的那幾週，還是得靠根井那一點點。');await say('蘿溫','但我們會在這裡。');}
}
async function glanTalk(){
  if(!F('lim.metGlan')){
    set('lim.metGlan');
    await say('葛蘭','……有人來了。妳身上，聽不出年紀。');
    await say('葛蘭','我小時候，村子冬天燒炭。入冬前大家把枯木堆進窯裡，地窖存滿根莖和乾果。');
    await say('葛蘭','後來有了根井。窯就封了，地窖也填了。大家說，再也用不到了。');
    await say('葛蘭','我那時候大概跟小栗一樣大。記得爺爺把風箱扛出來，說：明天起就不燒了。');
    await say('凱拉','風箱後來呢？');
    await say('葛蘭','誰知道。大概跟地窖一起埋了吧。');
    await think('窯邊有一道裂隙。它的聲音，比這個村子舊。');
    return;
  }
  if(F('lim.canWeave')){await say('葛蘭','爺爺的風箱……六十年了。皮都硬了，骨架還是好的。');await say('葛蘭','炭怎麼燒，我的手還記得。只是這雙手，很久沒有人要它了。');return;}
  if(F('lim.cellarSaved')){await say('葛蘭','窯邊那塊地，今天踩起來聲音不一樣。空空的。');return;}
  if(F('lim.done')){await say('葛蘭','我老了，冬天熬不熬得過，本來就難說。');await say('葛蘭','倒是孩子們……孩子們要學會的東西，比我們那時候多。');return;}
  await say('葛蘭','窯就在那邊，只剩一圈石頭。妳要是想看，就去看吧。');
}
async function chestTalk(){
  if(F('lim.done')){
    if(L().guardian==='released'){await say('小栗','老角……睡著了嗎？');await say('凱拉','牠回到土裡去了。');await say('小栗','那明年春天，土會記得牠嗎？');await wait(0.5);await say('凱拉','……會。');}
    else{await say('小栗','老角還在！媽媽說牠還在。');await think('牠還在。牠也還在痛。');}
    return;
  }
  if(!F('lim.metChest')){
    set('lim.metChest');
    await say('小栗','妳看，我畫的。這是老角。');
    await say('小栗','牠以前會走到村口，看我們有沒有乖乖回家。現在牠都躺著。');
    await say('小栗','媽媽說牠生病了。可是牠不會死。');
    await say('小栗','……不會死是好事，對吧？');
    await wait(0.8);
    await think('我不知道怎麼回答一個孩子。');
    return;
  }
  await say('小栗','老角的角比我們家的屋頂還寬喔。');
}
async function doraTalk(){
  if(F('lim.done')){
    const s=L().state;
    if(s==='S'){set('lim.doraGone');await say('朵拉','根井封了，溫室就冷了。走的不只我一家。');await say('朵拉','別那樣看我——我是說，別那樣「聽」我。我不怪妳。只是，我得走了。');}
    else if(s==='W'){await say('朵拉','葛蘭說窯真的能再燒。');await say('朵拉','……那我晚一年再走。就一年。');}
    else await say('朵拉','燈還亮著。那我……再想想。');
    return;
  }
  await say('朵拉','別看我，我在收東西。');
  await say('朵拉','林子長得太快，路每個月都要重開。聽說海拉奇的燈永遠不會熄，醫生也多。我帶孩子去那裡。');
}
async function cellarScene(){
  if(F('lim.canWeave')){await think('地窖打開了。裡面有六十年前的空氣。');return;}
  await think('地窖的蓋子。上面壓著六十年的土。');
  await think('蓋子底下是空的——因為六十年前，有人在填土之前把它蓋上了。');
  await say('凱拉','葛蘭爺爺，蘿溫。這裡。');
  G.lockMove=true;
  const g=G.ent('glan'),r=G.ent('rowan');
  await Promise.all([G.moveEnt(g,250,610,40),G.moveEnt(r,320,620,110)]);
  G.pulse(285,585,{max:300,str:0.9});AU.crack();
  await say('蘿溫','……真的有地窖。');
  await say('葛蘭','這是……爺爺的風箱。');
  await wait(0.6);
  await say('葛蘭','他那時候說，明天起就不燒了。可是他把風箱收在這裡，沒有丟掉。');
  await think('他沒有丟掉。是我在很久以前把它推進去的。');
  await think('兩件事都是真的。');
  await say('蘿溫','如果窯能再燒，地窖能存東西……冬天大部分的日子，我們也許撐得過去。');
  await say('蘿溫','只有最冷的那幾週，溫室還需要一點點根井的熱。一點點就好。');
  set('lim.canWeave');G.lockMove=false;G.rebuild();G.save();
  await think('根井不一定只能開著，或關上。');
}

/* ---------- 苔燈村（六十年前） ---------- */
G.defScene('lim_village_past',{
  name:'苔燈村（六十年前）',pal:'past',w:1600,h:1200,ambient:'past',
  build(B){
    B.border();
    W.house(B,380,330,150,110);W.house(B,1000,290,160,110);W.house(B,300,730,140,120);W.house(B,560,870,150,110,{doorX:0.3});
    for(let i=0;i<8;i++)B.seg(1180+i*40,470,1180+i*40,640,{col:'dim',a:0.4});
    B.circ(220,520,34,{solid:true,n:14});B.circ(220,520,24,{n:12,col:'warm',a:0.7});
    B.ent({id:'kiln',x:220,y:520,lr:40,always:0,pulse:{every:1.4,max:160,str:0.6,ring:0.06},draw(ctx,e,a,t){W.st(ctx,'warm',Math.max(a,0.3)*0.7,1);ctx.beginPath();for(let i=0;i<3;i++){const yy=e.y-40-i*14-((t*10)%14);ctx.moveTo(e.x-6+i*4,yy);ctx.quadraticCurveTo(e.x+6,yy-6,e.x-2+i*3,yy-12);}ctx.stroke();}});
    // cellar
    const saved=F('lim.cellarSaved');
    B.rect(262,570,46,32,{col:'line'});
    B.ent({id:'dirt',x:350,y:590,lr:20,draw(ctx,e,a){W.st(ctx,'dim',a,1);ctx.beginPath();ctx.ellipse(e.x,e.y,26,12,0,Math.PI,TAU);ctx.stroke();}});
    B.ent({id:'bellows',x:saved?285:300,y:saved?586:505,r:48,lr:18,label:saved?'地窖（已蓋上）':'風箱',
      draw(ctx,e,a){W.st(ctx,'line',a,1.1);ctx.beginPath();if(saved){ctx.rect(e.x-23,e.y-16,46,32);ctx.moveTo(e.x-23,e.y);ctx.lineTo(e.x+23,e.y);}else{ctx.moveTo(e.x-12,e.y);ctx.lineTo(e.x+8,e.y-8);ctx.lineTo(e.x+8,e.y+8);ctx.closePath();ctx.moveTo(e.x-12,e.y);ctx.lineTo(e.x-20,e.y);}ctx.stroke();},
      use:async()=>{
        if(saved){await think('蓋子蓋好了。他們填土的時候，會填在蓋子上面。');return;}
        await think('一個風箱。皮是新的，把手被磨得很亮。');
        await think('旁邊的地窖開著，一堆土等著倒進去。');
        G.lockMove=true;AU.drop();set('lim.cellarSaved');G.rebuild();G.pulse(285,586,{max:240,str:0.8});
        await wait(0.6);
        await say('凱拉','……放進去。蓋上。');
        await think('他們填土的時候，會填在蓋子上。蓋子底下，會一直是空的。');
        G.lockMove=false;G.save();
      }});
    // people of sixty years ago: they cannot perceive her
    B.ent({id:'gpa',x:640,y:470,r:70,label:'扛著管子的人',fig:{col:'warm',flicker:true,arm:'up',beard:true},use:async()=>{await think('他看不見我。');await say('扛著管子的人','管子埋深一點，別讓根纏上去。——明天起，就不用燒炭了！',{src:'gpa'});}});
    B.ent({id:'kid',name:'孩子',x:250,y:660,r:60,label:'孩子',fig:{col:'warm',flicker:true,child:true},use:async()=>{await say('孩子','爺爺說，明天起就不用燒炭了。',{src:'kid'});await say('孩子','……可是我喜歡看火。',{src:'kid'});await think('這個孩子，是葛蘭。');}});
    B.path([[800,0],[800,470]],{col:'warm',a:0.5});B.seg(790,470,810,470,{col:'warm'});
    W.rift(B,'rift',150,430,'回到現在',async()=>{await G.riftTo('lim_village',150,480);},{col:'acc'});
    W.grass(B,0,0,1600,1200,200,{col:'dim'});
    W.selfThreads(B);
    B.thread({a:'bellows',b:'rift',label:'往後的時間',tag:'',desc:()=>saved?'地窖被蓋起來了。蓋子底下的空間，會被留到六十年後。':'地窖馬上就要被填滿。如果裡面放了什麼、蓋上了蓋子，那個東西會被留下來。'});
    B.thread({a:'kiln',fray:[20,-120],label:'窯火',tag:'',desc:'這個村子的冬天，本來是靠這口窯撐過去的。'});
  },
  async enter(){
    if(!F('lim.pastSeen')){set('lim.pastSeen');await wait(0.4);await think('……窯在燒。有炭的味道。');await think('這是六十年前的苔燈村。根井還沒有挖好。');}
  }
});

/* ---------- 裂隙林 ---------- */
function growTree(B,id,x,y,phase){
  return B.ent({id,x,y,lr:40,phase,gr:0,solid:0,tau:1.2,
    update(dt,e){
      const p=((G.t/6+e.phase)%1+1)%1;let r;
      if(p<0.45)r=32*p/0.45;else if(p<0.62)r=32;else if(p<0.84)r=32*(1-(p-0.62)/0.22);else r=0;
      e.gr=r;e.dying=p>=0.62;e.solid=r>8?r*0.8:0;
      if(p<0.03&&!e.cr){e.cr=1;G.pulse(e.x,e.y,{max:110,str:0.6,ring:0.06});if(Math.random()<0.4)AU.creak((e.x-G.cam.x)/500);}if(p>0.3)e.cr=0;
    },
    pulse:{every:1.7,max:100,str:0.55,ring:0.04},
    draw(ctx,e,a,t){if(e.gr<1)return;const n=12;ctx.beginPath();for(let i=0;i<=n;i++){const an=i/n*TAU,rr=e.gr*(0.82+0.18*Math.sin(i*2.7+e.phase*20));const px=e.x+Math.cos(an)*rr,py=e.y+Math.sin(an)*rr;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);}
      W.glowStroke(ctx,e.dying?'warm':'line',Math.max(a,0.25),1.1);ctx.beginPath();ctx.arc(e.x,e.y,Math.max(2,e.gr*0.25),0,TAU);W.glowStroke(ctx,e.dying?'warm':'line',Math.max(a,0.25)*0.8,1);}
  });
}
G.defScene('lim_rift',{
  name:'裂隙林',pal:'lim',w:1800,h:900,ambient:'lim',
  build(B){
    B.border();
    for(const yy of [290,610]){B.wall(300,yy,1500,yy,{col:'dim'});for(let x=310;x<1500;x+=18)B.seg(x,yy,x+6,yy+(yy<400?-8:8),{col:'dim',a:0.6});}
    B.path([[300,290],[200,230],[40,240]],{solid:true,col:'dim'});B.path([[300,610],[200,680],[40,670]],{solid:true,col:'dim'});
    B.path([[1500,290],[1600,230],[1790,250]],{solid:true,col:'dim'});B.path([[1500,610],[1600,680],[1790,660]],{solid:true,col:'dim'});
    W.forest(B,0,0,1800,900,70,(x,y,r)=>y>210-r&&y<690+r,20,44);
    [520,900,1280].forEach((wx,k)=>{for(let i=0;i<5;i++)growTree(B,'g'+k+i,wx,322+i*64,(i*0.17+k*0.37)%1);});
    for(let i=0;i<60;i++){const x=320+B.r()*1160,y=310+B.r()*280;B.seg(x,y,x+(B.r()-0.5)*14,y+(B.r()-0.5)*14,{col:'warm',a:0.35});}
    W.rift(B,'rift',1090,450,'裂隙（以後）',async()=>{await G.riftTo('lim_future',600,760);},{update(dt,e){if(!F('lim.futureSeen')&&G.script===0&&Math.abs(G.player.x-e.x)<60){set('lim.futureSeen');G.run(async()=>{G.player.vx=G.player.vy=0;await think('這裡的聲音是反過來的。');await think('不是從過去傳來——是從前面，從以後。');await G.riftTo('lim_future',600,760);});}}});
    W.selfThreads(B);
    B.thread({a:'g11',b:'rift',label:'生長 ← 以後',tag:'以後',desc:'這些樹把好幾年的生長，擠進幾秒鐘裡。那些年，是從以後拿來的。'});
    B.exit(0,380,40,140,'lim_edge',1740,520);
    B.exit(1760,330,40,240,'lim_grave',70,500);
  },
  async enter(first){
    if(first){await wait(0.3);await think('樹在長，又在死。一呼一吸之間，就是好幾個季節。');await think('要等它們倒下的那一刻，才走得過去。');}
  }
});

/* ---------- 以後的利米塔尼亞 ---------- */
G.defScene('lim_future',{
  name:'以後的利米塔尼亞',pal:'future',w:1200,h:900,ambient:'future',listenMax:720,
  build(B){
    B.border();
    for(let i=0;i<40;i++){const x=60+B.r()*1080,y=60+B.r()*780;if(hyp(x-600,y-450)<120)continue;B.circ(x,y,5+B.r()*8,{n:7,jit:0.5,col:'line',a:0.6,solid:true});}
    for(let i=0;i<70;i++){let x=B.r()*1200,y=B.r()*900;const pts=[[x,y]];for(let k=0;k<4;k++){x+=(B.r()-0.5)*50;y+=(B.r()-0.5)*50;pts.push([x,y]);}B.path(pts,{col:'dim',a:0.6});}
    B.ent({id:'unborn',x:600,y:430,r:80,lr:30,label:'一團很小的光',always:0.35,pulse:{every:3.6,max:160,str:0.4,ring:0.08},
      draw(ctx,e,a,t){const k=0.5+0.5*Math.sin(t*0.9);const g=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,40);g.addColorStop(0,'rgba('+G.pal.warm+','+0.25*k+')');g.addColorStop(1,'rgba('+G.pal.warm+',0)');ctx.fillStyle=g;ctx.fillRect(e.x-40,e.y-40,80,80);G.drawAnimal(ctx,'deer',e.x,e.y,Math.max(a,0.45),0.75,0);},
      use:async()=>{
        await think('一團很小的光，蜷著，在呼吸。');
        await think('牠還沒有出生。要在很久以後才會醒來，成為這片林子的守林者——如果到那時候，還有林子。');
        await think('牠在睡。我不叫醒牠。');
        set('lim.sawUnborn');
      }});
    W.rift(B,'rift',600,810,'回到現在',async()=>{await G.riftTo('lim_rift',1090,500);},{col:'acc'});
    W.selfThreads(B);
    B.thread({a:'unborn',b:'rift',label:'以後 → 現在',tag:'',desc:'這裡的力氣，一直被往回拉，拉到現在的森林裡。所以這裡什麼都不剩。'});
  },
  async enter(){
    if(F('lim.futureTalk'))return;set('lim.futureTalk');
    await wait(0.6);
    await think('……這是以後的利米塔尼亞。');
    await think('沒有樹，沒有葉子。連回聲都很少回來。');
    await voice('時間座標：未來。\n此區能量存量：接近零。');
    await think('森林先把以後的力氣用掉了。所以以後，什麼都沒有。');
    await think('我是來修這件事的。');
  }
});

/* ---------- 動物墓地 ---------- */
const BODIES=[['deer',380,380,1.1,0.2],['stag',520,760,1.2,-0.3],['bird',300,640,1.1,1],['rabbit',460,560,1,0.4],['bird',820,300,1,-0.6],['deer',1120,420,1,2.9],['rabbit',1060,760,1,0.1],['bird',640,860,1,2],['stag',1180,640,1.1,3.3],['rabbit',250,470,1,-0.2],['bird',860,700,0.9,0.7]];
function bodyDecay(){const t=L().decayAt;if(!t)return 0;return clamp((Date.now()-t)/16000,0,1);}
G.defScene('lim_grave',{
  name:'動物墓地',pal:'lim',w:1400,h:1000,ambient:'lim',
  build(B){
    B.border();
    W.forest(B,0,0,1400,1000,70,(x,y,r)=>((x-700)*(x-700))/(560*560)+((y-520)*(y-520))/(400*400)<1.15||(x<120&&y>420&&y<580)||(y<110&&x>620&&x<780),20,46);
    B.path([[940,0],[940,1000]],{col:'warm',a:0.3});
    W.grass(B,150,150,1250,880,160,{a:0.5});
    BODIES.forEach((b,i)=>B.ent({id:'b'+i,x:b[1],y:b[2],lr:18,draw(ctx,e,a){G.drawAnimal(ctx,b[0],e.x,e.y,a,b[3],b[4],bodyDecay());}}));
    B.ent({id:'fox',x:700,y:560,r:70,lr:24,label:'狐狸',
      draw(ctx,e,a){const d=bodyDecay();G.drawAnimal(ctx,'fox',e.x,e.y,a,1.5,0,d);G.drawAnimal(ctx,'cub',e.x+2,e.y-2,a,1.3,0.3,d);G.drawAnimal(ctx,'cub',e.x-6,e.y+3,a,1.2,-0.6,d);G.drawAnimal(ctx,'cub',e.x+7,e.y+4,a,1.1,1.8,d);
        if(d>=1){W.st(ctx,'line',a*0.8,1);ctx.beginPath();for(let i=0;i<5;i++){const px=e.x-12+i*6;ctx.moveTo(px,e.y+6);ctx.quadraticCurveTo(px-2,e.y-2,px+(i%2?3:-3),e.y-6-i%3*2);}ctx.stroke();}},
      update(dt,e){if(!F('lim.grief')&&G.script===0&&hyp(G.player.x-e.x,G.player.y-e.y)<150){set('lim.grief');G.run(griefScene);}},
      use:async()=>{if(!L().decayAt){await think('牠們還在這裡。停在最後一個姿勢裡。');}else if(bodyDecay()<1){await think('牠們正在回去。很慢，很安靜。');}else{await think('土的顏色，在這裡深了一點。有草從那裡長出來。');}}});
    B.ent({id:'pipe',x:940,y:520,lr:12,draw(){}});
    W.rift(B,'rift',1040,300,'裂隙（過去）',async()=>{await G.riftTo('lim_grave_past',1040,350);});
    W.selfThreads(B);
    B.thread({a:'fox',fray:[0,90],label:'分解：中斷',tag:'分解',desc:'該來的東西沒有來。菌絲、甲蟲、雨水——把牠們帶回土裡的那些，都斷在半路。',cond:()=>!F('lim.decayPast')});
    B.thread({a:'fox',b:'pipe',label:'斷開的菌絲 ← 管線',tag:'管線',desc:'地底下原本有一張網，連著整片空地。一條埋在地下的管線把它切成兩半。',cond:()=>!F('lim.decayPast')});
    B.thread({a:'pipe',b:'rift',label:'管線 ← 過去',tag:'過去',desc:'管線是很久以前埋下去的。線往回連，連到它剛被埋下去的那一天。',cond:()=>!F('lim.decayPast')});
    B.exit(0,420,40,160,'lim_rift',1740,450);
    B.exit(620,0,160,40,'lim_oak',1440,640);
  },
  async enter(){
    if(F('lim.decayPast')&&!F('lim.decaySeen')){
      set('lim.decaySeen');L().decayAt=Date.now();G.save();
      await wait(0.8);
      await think('……聽得見了。很小、很小的聲音。');
      await think('菌絲在走，甲蟲在走。雨水滲進去的聲音。');
      await voice('分解循環：恢復。\n區域生態循環恢復率：34%。');
      await say('凱拉','34%。');
      await think('聲音只聽得見比率。');
      await G.walkTo(700,610,60);
      await think('狐狸的輪廓在變淡。一點一點，沉進土裡。');
      await wait(2.5);
      await think('……現在牠們可以回去了。');
      if(!F('named.grief')){set('named.grief');await think('胸口那個很重的地方，變輕了一點。可是沒有消失。');await think('我想，它有名字。人們叫它「難過」。');}
    }
  }
});
async function griefScene(){
  G.grief('grave');
  const P=G.player;P.vx=P.vy=0;
  await wait(0.5);
  await G.walkTo(700,612,55);
  for(let i=0;i<=15;i++){P.kneel=i/15*0.9;await wait(0.03);}
  await think('一隻狐狸。牠把三隻小的圍在肚子底下。');
  await think('牠們都死了。死了很久。');
  await think('可是沒有變成土。沒有蟲，沒有菌，什麼都沒有來帶走牠們。');
  await think('牠們就一直這樣——停在最後一個姿勢裡。');
  await wait(2.2);
  await say('凱拉','……對不起。');
  await think('我不知道自己為什麼要道歉。');
  await think('胸口有一個地方，很重。我沒有名字可以叫它。');
  await wait(3);
  await voice('停留時間：超出預估。\n此區修復項目：分解循環。');
  await say('凱拉','我知道。——再一下。');
  await wait(3.2);
  for(let i=15;i>=0;i--){P.kneel=i/15*0.9;await wait(0.03);}
  G.endGrief();
  await think('要讓牠們回去。回到土裡。');
  set('lim.griefDone');G.save();
}

/* ---------- 動物墓地（六十年前） ---------- */
const GAPS=[[940,330],[940,520],[940,720]],STONES=[[300,260],[420,820],[1200,700]];
G.defScene('lim_grave_past',{
  name:'空地（六十年前）',pal:'past',w:1400,h:1000,ambient:'past',
  build(B){
    B.border();
    W.forest(B,0,0,1400,1000,60,(x,y,r)=>((x-700)*(x-700))/(560*560)+((y-520)*(y-520))/(400*400)<1.15,20,44,{col:'line'});
    B.seg(930,0,930,1000,{col:'dim',a:0.8});B.seg(950,0,950,1000,{col:'dim',a:0.8});
    // mycelium network
    const R=G.mkRng(4242);
    const grow=(x,y,ang,len,dep)=>{if(dep<=0)return;const x2=x+Math.cos(ang)*len,y2=y+Math.sin(ang)*len;if(!(x<930&&x2>930||x>950&&x2<950))B.seg(x,y,x2,y2,{col:'warm',a:0.75,base:0.12});grow(x2,y2,ang+(R()-0.5)*1.2,len*0.85,dep-1);if(R()<0.5)grow(x2,y2,ang+(R()-0.5)*2,len*0.7,dep-1);};
    for(const [x,y] of [[400,360],[500,640],[650,480],[1150,380],[1200,600],[1060,800]])for(let k=0;k<4;k++)grow(x,y,R()*TAU,46,6);
    GAPS.forEach(([x,y],i)=>{B.path([[820,y+(i-1)*14],[930,y]],{col:'warm',a:0.8,base:0.15});B.path([[950,y],[1060,y-(i-1)*18]],{col:'warm',a:0.8,base:0.15});});
    GAPS.forEach(([x,y],i)=>{const k='lim.gap'+i;
      B.ent({id:'gap'+i,x,y,r:48,lr:16,label:F(k)?'石頭（已放好）':'菌絲斷開的地方',always:F(k)?0.6:0,
        draw(ctx,e,a){if(F(k)){W.st(ctx,'line',Math.max(a,0.5),1.2);ctx.beginPath();ctx.ellipse(e.x,e.y,16,8,0,0,TAU);ctx.stroke();W.st(ctx,'warm',Math.max(a,0.5),1);ctx.beginPath();ctx.moveTo(e.x-20,e.y);ctx.quadraticCurveTo(e.x,e.y-10,e.x+20,e.y);ctx.stroke();}else{W.st(ctx,'warm',a*0.6,1);ctx.setLineDash([2,4]);ctx.beginPath();ctx.moveTo(e.x-12,e.y);ctx.lineTo(e.x+12,e.y);ctx.stroke();ctx.setLineDash([]);}},
        use:async()=>{
          if(F(k)){await think('菌絲會從石頭上爬過去。');return;}
          if(!G.carry||!G.carry.stone){await think('管溝把菌絲切斷了。兩邊的線，碰不到彼此。');await think('需要一個可以讓它們爬過去的東西。');return;}
          G.carry=null;set(k);AU.drop();G.rebuild();G.pulse(x,y,{max:200,str:0.8});
          await think('放在這裡。等他們把管子埋好，石頭會被一起埋進去。');
          if(F('lim.gap0')&&F('lim.gap1')&&F('lim.gap2'))await allPlaced();
        }});});
    STONES.forEach(([x,y],i)=>{const k='lim.stone'+i;
      B.ent({id:'stone'+i,x,y,r:44,lr:14,label:'扁平的石頭',cond:()=>!F(k)&&!(G.carry&&G.carry.id==='stone'+i),
        draw(ctx,e,a){W.st(ctx,'line',a,1.1);ctx.beginPath();ctx.ellipse(e.x,e.y,15,7,0.2,0,TAU);ctx.stroke();},
        use:async()=>{if(G.carry){await think('手上已經有一塊了。');return;}set(k);G.carry={id:'stone'+i,stone:true,heavy:true,draw(ctx,x,y){W.st(ctx,'line',0.9,1.1);ctx.beginPath();ctx.ellipse(x,y+6,9,4,0,0,TAU);ctx.stroke();}};AU.drop();await think('扁平的石頭，表面有青苔。菌絲喜歡這種石頭。');}});});
    B.ent({id:'worker1',x:990,y:200,r:70,label:'挖溝的人',fig:{col:'warm',flicker:true,arm:'hold'},use:async()=>{await say('挖溝的人','管子埋深一點。空地這一片，以後就不用管了。',{src:'worker1'});}});
    B.ent({id:'worker2',x:880,y:860,r:70,label:'挖溝的人',fig:{col:'warm',flicker:true,arm:'hold',hat:'cap'},use:async()=>{await say('挖溝的人','這些白白的根是什麼？……算了，一起剷掉。',{src:'worker2'});await think('他看不見我，也看不見他剷掉的是什麼。');}});
    W.rift(B,'rift',1040,300,'回到現在',async()=>{if(G.carry){G.carry=null;}await G.riftTo('lim_grave',1040,350);},{col:'acc'});
    W.selfThreads(B);
    B.thread({a:'gap1',b:'rift',label:'菌絲的網',tag:'',desc:'這張網曾經連著整片空地。死去的東西落在網上，網就把它們帶回土裡。'});
  },
  async enter(){
    if(F('lim.gravePastSeen'))return;set('lim.gravePastSeen');
    await wait(0.4);
    await think('六十年前的空地。');
    await think('地底下有光——很細、很密的白線，像一張網。是菌絲。');
    await think('他們在挖溝，要把根井的管子埋進去。溝一挖開，網就斷了。');
    G.hint('把附近扁平的石頭，放到菌絲斷開的地方',8);
  }
});
async function allPlaced(){
  await wait(0.5);
  set('lim.decayPast');G.save();
  await think('三塊石頭都放好了。');
  await think('菌絲會從石頭上爬過去。慢慢地。用六十年。');
  await think('到了現在，網就會是連著的。');
  limCheck();
}

/* ---------- 老槲與根井 ---------- */
G.defScene('lim_oak',{
  name:'老槲',pal:'lim',w:1500,h:1200,ambient:'lim',
  build(B){
    B.border();
    B.circ(750,420,92,{solid:true,n:30,jit:0.08});B.circ(750,420,64,{n:22,a:0.5,jit:0.1});
    for(let i=0;i<22;i++){const a=i/22*TAU;let x=750+Math.cos(a)*92,y=420+Math.sin(a)*92;const pts=[[x,y]];for(let k=0;k<5;k++){x+=Math.cos(a+(B.r()-0.5)*0.6)*34;y+=Math.sin(a+(B.r()-0.5)*0.6)*30;pts.push([x,y]);}B.path(pts,{col:'line',a:0.55});}
    const can=[];for(let i=0;i<48;i++){const a=i/48*TAU,r=300*(0.85+B.r()*0.2);can.push([750+Math.cos(a)*r,420+Math.sin(a)*r*0.82]);}B.path(can,{col:'line',a:0.35},true);
    W.forest(B,0,0,1500,1200,50,(x,y,r)=>hyp(x-750,y-460)<440+r||(x>620-r&&x<880+r&&y>760)||(x>1060&&y>500-r&&y<780+r),20,42);
    // the root-well
    const wellOn=L().state!=='S';
    B.rect(705,600,90,64,{solid:true,col:'warm'});B.rect(720,612,60,40,{col:'warm',a:0.6});
    B.path([[750,664],[750,1200]],{col:'warm',a:wellOn?0.5:0.25});B.path([[795,640],[1100,650],[1500,650]],{col:'warm',a:wellOn?0.45:0.2});
    B.ent({id:'well',x:750,y:632,r:84,lr:40,label:'根井',ay:-30,pulse:wellOn?{every:1.2,max:180,str:0.5,ring:0.05,snd:()=>AU.tone(55,0.6,0.02,{type:'sine',wet:0.4})}:null,
      draw(ctx,e,a,t){if(!wellOn)return;const k=0.5+0.5*Math.sin(t*3);const g=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,50);g.addColorStop(0,'rgba('+G.pal.warm+','+(L().state==='W'?0.08:0.18)*k+')');g.addColorStop(1,'rgba('+G.pal.warm+',0)');ctx.fillStyle=g;ctx.fillRect(e.x-50,e.y-50,100,100);},
      use:wellKnot});
    const rel=L().guardian==='released';
    B.ent({id:'guardian',name:'老角',x:1130,y:470,r:130,lr:90,label:rel?'老角歸土的地方':'老角',solid:rel?0:62,hy:400,ay:-50,ax:-100,
      decay:rel?1:0,released:rel,
      update(dt,e){if(L().gDecayAt){e.decay=clamp((Date.now()-L().gDecayAt)/7000,0,1);}},
      pulse:rel?null:{every:4.2,max:260,str:0.6,ring:0.06,dy:10,snd:e=>AU.creak((e.x-G.cam.x)/500)},
      draw:drawGuardian,use:guardianTalk});
    W.selfThreads(B);
    B.thread({a:'well',fray:[160,-220],label:'供能：以後',tag:'以後',desc:'根井向以後要力氣。以後的森林，就是你看過的那片空地。',cond:()=>L().state!=='S'});
    B.thread({a:'well',b:{x:750,y:1190},label:'根井 → 苔燈村',tag:'村子',desc:'往南，一路通到村子的燈和溫室。',cond:()=>L().state!=='S'});
    B.thread({a:'guardian',b:{x:760,y:360},label:'老角 ← 老槲 ← 以後',tag:'老角',desc:'老角的命被釘在老槲的根上。老槲從根井分到以後的力氣，再分一點給牠。',cond:()=>L().guardian!=='released'});
    B.exit(700,1160,100,40,'lim_village',800,80);
    B.exit(1460,560,40,160,'lim_grave',700,70);
  },
  async enter(first){
    if(first){await wait(0.3);await think('一棵很大的樹。樹根底下有東西在抽——很深，很用力。');await think('樹的另一邊，有一個很大的呼吸聲。');}
    if(limCheck()){await think('森林的事，做完了。——做完了嗎？');await think('我該回村子去。');}
  }
});
async function guardianTalk(){
  const s=L();
  if(s.guardian==='released'){await think('這裡的土，比別處鬆軟。');return;}
  if(!F('lim.metGuardian')){
    set('lim.metGuardian');
    await say('老角','……白色的……孩子。');
    await say('老角','妳聽得見我。很久，沒有人聽得見了。');
    await say('凱拉','你在痛。');
    await say('老角','三十個冬天以前，我就該倒下了。那時候我的角已經變輕，腿已經不想走。');
    await say('老角','可是根不讓我走。以後的力氣從根裡爬上來，把我釘在這裡。苔長得比季節快，一直長到我的眼睛上。');
    await say('凱拉','你想走嗎？');
    await wait(0.8);
    await say('老角','……想。');
    await say('老角','可是我走了，誰看著林子？林子長得這麼快，孩子們一轉身，就找不到回家的路。');
    await think('牠想休息。牠也放不下。兩件事都是真的。');
    return;
  }
  if(s.guardian==='kept'){await say('老角','我還在這裡，白色的孩子。……還在。');return;}
  const key=await G.knot({ent:'guardian',title:'老角的線',options:[
    {key:'release',label:'剪斷老角的線',ok:F('lim.decayPast'),off:'（分解還沒有恢復。現在剪斷，牠會像那隻狐狸一樣，停在最後的姿勢裡，回不了土。）',desc:'老角會死。牠的身體會回到剛剛恢復分解的土裡。林子會少一個看著孩子們的守林者。'},
    {key:'keep',label:'不碰老角的線',desc:'老角會繼續活著，也繼續痛。牠會繼續看著林子——直到以後的力氣真的用完。'},
    {key:'replace',label:'從以後取來未生的守林者，換下老角',ok:F('lim.sawUnborn'),off:'（還沒有什麼可以拿來替換。）',desc:'讓以後那團熟睡的光提早醒來，代替老角守林。老角可以休息，林子也不會沒有守林者。'}
  ],backDesc:'先不決定老角的事。'});
  if(key==='replace'){
    await G.refuse('老角','以未來的守林者替換老角',['……不。','那團光還沒有醒。牠有牠自己的以後，不是可以拿來換的零件。','老角也不是壞掉的零件。我不能把一個生命拿走，再塞一個進去，然後說——這樣就修好了。']);
    return;
  }
  if(key==='keep'){
    s.guardian='kept';
    await G.decide('老角','不碰老角的線','……還不是現在。');
    await say('老角','……我知道。我會再看一陣子。');
    await think('牠還會痛。這也是我決定的。');
    if(limCheck())await think('我該回村子去。');
    return;
  }
  if(key==='release'){
    s.guardian='released';
    await G.decide('老角','剪斷老角的線','……好。');
    G.grief('guardian');
    await G.walkTo(1030,528,50);
    const P=G.player;for(let i=0;i<=15;i++){P.kneel=i/15*0.9;await wait(0.03);}
    await say('凱拉','要剪了。');
    await say('老角','白色的孩子。謝謝妳聽見。');
    await say('老角','……替我告訴那些孩子。回家的路，要自己記得。');
    AU.cut();s.gDecayAt=Date.now();const g=G.ent('guardian');g.released=true;g.pulse=null;
    await wait(2.5);
    await think('牠的呼吸，一下，一下。然後，沒有下一下。');
    await wait(2.5);
    if(!F('named.grief')){set('named.grief');await think('胸口那個很重的地方，又來了。');await think('這一次，我知道它叫什麼。——難過。');}
    else await think('又是那個很重的地方。這一次，我沒有想讓它走。');
    for(let i=15;i>=0;i--){P.kneel=i/15*0.9;await wait(0.03);}
    G.endGrief();G.rebuild();G.save();
    if(limCheck())await think('我該回村子去。');
  }
}
async function wellKnot(){
  const s=L();
  if(s.state){const m={T:'根井還在抽。以後還在變空。',S:'根井安靜了。石頭是冷的。',W:'根井只剩一條很細的線。像一條溪。'};await think(m[s.state]);return;}
  if(!F('lim.metRowan')){await think('一口井，一直在往上抽什麼。它連到很多地方——我還不知道是誰在用它。');return;}
  if(!F('lim.wellVoice')){set('lim.wellVoice');await voice('偏差源：根井。\n建議：封閉。');await say('凱拉','封閉之後，村子的冬天呢？');await voice('不在任務範圍。');}
  const key=await G.knot({ent:'well',title:'根井',options:[
    {key:'T',label:'讓根井繼續開著',desc:'村子的燈和溫室會亮著，冬天有東西吃。以後的森林會繼續被掏空——你已經聽過它的樣子。'},
    {key:'S',label:'封閉根井',desc:'根井不再向以後索取。溫室會冷，今年冬天會很難熬，有些人家會離開。以後的森林，會慢慢留下來。'},
    {key:'W',label:'把根井收細，只留最冷的幾週',ok:F('lim.canWeave'),off:'（還沒有東西可以接住村子的冬天。也許村子以前，不是這樣過冬的——）',desc:'炭窯和地窖撐起冬天的大部分。根井只剩一條很細的線，在最冷的幾週替溫室保溫，等村子重新學會自己過冬。'}
  ],backDesc:'先不牽動根井。'});
  if(!key)return;
  s.state=key;
  const lbl={T:'讓根井繼續開著',S:'封閉根井',W:'把根井收細'}[key];
  await G.decide('根井',lbl);
  if(key==='T'){await think('燈會亮著。以後會繼續變空。');await voice('偏差源：未處理。\n記錄。');}
  else if(key==='S'){AU.crack();G.rebuild();G.pulse(750,632,{max:600,str:0.9});await wait(0.6);await think('根井安靜下來了。遠處，村子的燈，一盞一盞暗下去。');await voice('偏差源：已封閉。');}
  else{G.rebuild();G.pulse(750,632,{max:400,str:0.7});await think('我沒有把它關上。我把它收細了——像把一條河，收成一條溪。');await voice('偏差源：未完全封閉。\n記錄。');}
  if(limCheck())await think('我該回村子去。');
  else if(!s.guardian&&F('lim.metGuardian'))await think('還有老角。');
  else if(!F('lim.decayPast'))await think('還有那些回不去的動物。');
}
async function aftermath(){
  await wait(0.3);
  await think('村子聽起來和之前不一樣了。');
}
async function leaveLimitania(){
  G.lockMove=true;
  await voice('區域偏差：部分修正。\n下一座標：坎帕納。');
  await think('我修好了一些東西。也留下了一些東西沒修。');
  await think('我可以碰這個世界。可是活著的東西，不是可以隨手替換的零件。');
  await think('——這件事，聲音沒有告訴我。是我自己知道的。');
  await G.fade(1,1.4);G.lockMove=false;
  G.S.chapter=2;
  await G.gotoScene('cam_gate',90,700,{instant:true});
}
})();
