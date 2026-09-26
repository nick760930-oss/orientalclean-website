/* 第五章 — 海拉奇 */
(function(){
'use strict';
const {F,set,TAU,hyp,clamp}=G;
const say=(...a)=>G.say(...a),think=t=>G.think(t),voice=t=>G.voice(t),wait=s=>G.wait(s);
const H=()=>{const s=G.S.har;if(!s.rot)s.rot=[0,1,1,0,2,1,0,3,1];return s;};
const cityOn=()=>H().state!=='S';

function heartbeat(B,x,y){B.ent({id:'beat'+x,x,y,lr:10,always:0,pulse:cityOn()?{every:0.75,max:520,str:0.35,ring:0.05,snd:()=>{if(Math.random()<0.5)AU.clank((x-G.cam.x)/600);}}:null,draw(){}});}
function whisperers(B,list){
  list.forEach(([x,y,fig,txt],i)=>B.ent({id:'pil'+i,x,y,r:0,lr:18,hideLabel:true,fig:Object.assign({arm:'pray'},fig),
    update(dt,e){if(!e.said&&G.script===0&&hyp(G.player.x-e.x,G.player.y-e.y)<110){e.said=1;G.bubble(e,txt,3.6);}}}));
}

/* ---------- 城門 ---------- */
G.defScene('har_gate',{
  name:'城門',pal:'har',w:1800,h:1100,ambient:()=>cityOn()?'har':'silence',
  build(B){
    B.border();
    const road=[[20,560],[700,560],[1300,560],[1790,560]];W.pathEdge(B,road,40);
    B.wall(1500,0,1500,480);B.wall(1500,640,1500,1100);
    for(let y=0;y<1100;y+=24){if(y>470&&y<650)continue;B.seg(1500,y,1530,y+12,{col:'dim',a:0.6});}
    for(const [x,y] of [[300,340],[420,760],[620,300],[1080,320],[1180,820],[760,860],[1300,380]]){B.path([[x-30,y+22],[x,y-26],[x+30,y+22],[x-30,y+22]],{solid:true});B.seg(x,y-26,x,y+22,{col:'dim',a:0.5});}
    W.grass(B,0,0,1500,1100,120,{avoid:(x,y)=>Math.abs(y-560)<50});
    heartbeat(B,1760,560);
    whisperers(B,[[520,620,{},'……白色的頭髮。'],[980,500,{hood:true},'她蒙著眼……'],[1280,640,{bent:0.3},'聖女……？'],[1380,480,{hat:'wide'},'聖女回來了。']]);
    B.ent({id:'nala',name:'娜菈',x:900,y:700,r:64,label:'娜菈',
      pulse:cityOn()?{every:1.4,max:90,str:0.45,ring:0.05,snd:()=>AU.tone(420,0.3,0.006,{wet:0.3})}:null,
      draw(ctx,e,a,t){W.st(ctx,'line',a,1);ctx.beginPath();ctx.rect(e.x-22,e.y-8,44,14);ctx.stroke();G.drawFig(ctx,{lying:true},e.x+2,e.y-2,a,t,e);
        W.st(ctx,'warm',Math.max(a,0.3),1);ctx.beginPath();ctx.rect(e.x+26,e.y-16,12,16);ctx.moveTo(e.x-10,e.y-6);ctx.quadraticCurveTo(e.x+10,e.y-26,e.x+30,e.y-14);ctx.stroke();},
      use:nalaTalk,cond:()=>!(H().state==='S')});
    B.ent({id:'rafi',name:'菈菲',x:840,y:690,r:56,label:'菈菲',fig:{hood:true,arm:'hold'},use:nalaTalk});
    W.selfThreads(B);
    B.thread({a:'nala',b:{x:1780,y:560},label:'娜菈的呼吸 ← 大機樞 ← 以後',tag:'娜菈',desc:'她的每一口氣，都經過城裡的大機樞。大機樞的火，是從以後借來的。',cond:cityOn});
    B.exit(0,480,30,160,null,0,0,{cond:()=>false,blocked:async()=>{await think('艾爾巴在身後。現在不回頭。');}});
    B.exit(1760,480,40,160,'har_street',80,700);
  },
  async enter(first){
    if(!first)return;
    await G.card('第五章','海 拉 奇');
    await think('聲音很多。齒輪、蒸氣、腳步、禱告。整座城，都在響。');
    await think('什麼都看得見——因為什麼都在響。');
    await voice('區域：海拉奇。\n能源調用量：全區最大。');
  }
});
async function nalaTalk(){
  if(H().state==='S'){await say('菈菲','……');await think('她抱著一個很安靜的孩子。');return;}
  if(!F('har.metNala')){
    set('har.metNala');
    await say('菈菲','別碰她的管子，拜託。');
    await say('菈菲','……妳是……');
    await wait(0.8);
    await say('菈菲','不，對不起。妳長得很像……算了。');
    await say('菈菲','娜菈生下來肺就不好。城裡的呼吸器，是靠大機樞的火在推。沒有它，她一個晚上都撐不過去。');
    await say('娜菈','姊姊的眼睛上，也綁著布。跟聖女一樣。');
    await say('凱拉','聖女？');
    await say('娜菈','聖殿裡的那個。她替我們向明天借火。媽媽說，是聖女讓我可以呼吸的。');
    await think('向明天借火。');
    return;
  }
  if(H().state==='W'){await say('娜菈','呼吸器還在響。');await say('娜菈','媽媽說，以後要換一種比較小的火。');return;}
  await say('娜菈','聖殿很漂亮喔。聖女好高好高。');
}

/* ---------- 街區與舊水渠 ---------- */
G.defScene('har_street',{
  name:'下城',pal:'har',w:2000,h:1400,ambient:()=>cityOn()?'har':'silence',
  build(B){
    B.border();const s=H();
    B.seg(100,150,1000,150,{solid:true});B.seg(100,178,1000,178,{solid:true});B.seg(100,150,100,178,{solid:true});B.seg(1000,150,1000,178,{solid:true});
    for(let x=110;x<1000;x+=26)B.seg(x,152,x+12,176,{col:'dim',a:0.4});
    for(const [x,y,w,h] of [[160,320,240,160],[500,330,200,150],[160,620,220,180],[520,600,160,140],[160,950,260,200],[560,960,200,180],[900,960,160,200],[820,320,200,160],[1150,280,220,160]])W.house(B,x,y,w,h,{col:'line'});
    B.rect(1450,250,350,220,{solid:true});B.seg(1450,250,1625,200,{col:'line',a:0.6});B.seg(1625,200,1800,250,{col:'line',a:0.6});
    B.rect(1150,850,300,200,{solid:true,col:'warm'});for(let i=1;i<6;i++)B.seg(1150+i*50,850,1150+i*50,1050,{col:'warm',a:0.4});
    for(const [x,y] of [[500,860],[1100,560],[1600,1050]]){B.circ(x,y,22,{solid:true,n:12,col:'warm'});B.ent({id:'pump'+x,x,y,lr:30,pulse:cityOn()&&!(s.state==='W'&&x!==1600)?{every:1.1,max:180,str:0.5,ring:0.05}:null,draw(ctx,e,a){W.st(ctx,'warm',Math.max(a,0.2),1);ctx.beginPath();ctx.moveTo(e.x,e.y-22);ctx.lineTo(e.x,e.y-58);ctx.stroke();}});}
    heartbeat(B,1980,700);
    B.ent({id:'hospital',x:1625,y:480,r:80,lr:40,label:'醫院',draw(){},
      pulse:cityOn()?{every:0.5,max:60,str:0.35,ring:0.03}:null,
      use:async()=>{if(H().state==='S'){await think('醫院很安靜。安靜得不對。');return;}await think('暖箱的聲音。三十一個。每一個裡面，都有一顆很小、很快的心跳。');await think('呼吸器的聲音。五十八個。');}});
    B.ent({id:'grow',x:1300,y:950,r:170,lr:80,label:'糧廳',draw(){},pulse:cityOn()&&s.state!=='W'?{every:1.6,max:220,str:0.4,ring:0.04}:null,
      use:async()=>{await think('一整座廳，種滿了作物。燈是熱的。');await think('外面的土，種不出這麼多東西。');}});
    // aqueduct flow once reopened
    if(s.aqueduct&&s.state==='W')B.ent({id:'flow',x:550,y:164,lr:460,pulse:{every:0.9,max:200,str:0.45,ring:0.03},draw(ctx,e,a,t){W.st(ctx,'acc',0.5,1);ctx.beginPath();for(let i=0;i<14;i++){const x=110+((t*50+i*64)%890);ctx.moveTo(x,160);ctx.lineTo(x+18,168);}ctx.stroke();}});
    B.ent({id:'sluice',x:620,y:196,r:70,lr:26,label:'水閘',ay:-30,draw(ctx,e,a){W.st(ctx,'line',a,1.2);ctx.beginPath();ctx.rect(e.x-24,e.y-44,48,34);if(!s.aqueduct){ctx.moveTo(e.x-24,e.y-44);ctx.lineTo(e.x+24,e.y-10);}ctx.stroke();},use:sluiceUse});
    W.rift(B,'rift',720,260,'水閘旁的裂隙（契約之前）',async()=>{await G.riftTo('har_aqueduct_past',700,420);});
    B.ent({id:'kol',name:'柯爾',x:520,y:260,r:60,label:'柯爾',fig:{hat:'cap',arm:'hold',coat:true},use:kolTalk});
    whisperers(B,[[860,560,{},'聖女……'],[1320,700,{hood:true},'她是來取火的嗎？'],[400,540,{bent:0.4},'白色的……']]);
    W.selfThreads(B);
    B.thread({a:'pump1100',b:{x:1980,y:700},label:'水泵 ← 大機樞',tag:'水',desc:'下城的水，是大機樞的火抽上來的。十二座水泵，四萬人。',cond:cityOn});
    B.thread({a:'sluice',b:'rift',label:'水閘 ← 契約之前',tag:'水閘',desc:'這條渠以前會流水。線往回連，連到它被封起來的那一天。',cond:()=>!s.aqueduct});
    B.thread({a:'hospital',b:{x:1980,y:700},label:'醫院 ← 大機樞',tag:'醫院',desc:'暖箱、呼吸器。每一條線都很細，很急。',cond:cityOn});
    B.exit(0,620,30,160,'har_gate',1720,560);
    B.exit(1970,600,30,200,'har_sanctum',90,700);
  },
  async enter(first){if(first){await wait(0.3);await think('城裡的每一樣東西，都在響。水泵、燈、醫院、門。');await think('每一個聲音底下，都有同一個心跳。從東邊來。');}}
});
async function kolTalk(){
  const s=H();
  if(!F('har.metKol')){
    set('har.metKol');
    await say('柯爾','妳在看那條乾掉的渠？沒人看它了。');
    await say('柯爾','契約之前，城裡的水是從山上流下來的。靠重力，不用火。');
    await say('柯爾','後來大機樞的水泵更方便、水更多，渠就封了。聽說水閘被砸了。');
    await say('柯爾','我是技師。砸掉的東西，我修不回來。');
    if(F('elba.readSluice'))await think('遺忘之廊裡寫著：舊水渠自山上引水，不必用火。');
    return;
  }
  if(s.aqueduct){await say('柯爾','閘門是完整的。石板一搬開，水就會下來。');await say('柯爾','下城十二座水泵，至少有一半，可以不用火。');await say('柯爾','——如果有人決定要這樣做的話。');return;}
  await say('柯爾','那塊石板底下，是碎掉的閘門。我敲過，聲音是碎的。');
}
async function sluiceUse(){
  const s=H();
  if(s.aqueduct){await think('石板搬開了一角。閘門在後面，完整的。');return;}
  if(!F('har.hammerHidden')){await think('一塊石板，封著水閘。');await think('我聽石板後面——聲音是碎的。閘門碎了。碎了很久。');await think('旁邊有一道裂隙。');return;}
  await think('石板還在。可是石板後面的聲音，變了。');
  await think('閘門是完整的。');
  G.lockMove=true;await G.moveEnt('kol',600,250,80);G.lockMove=false;
  await say('柯爾','……沒有砸？怎麼可能？');
  await say('柯爾','我敲過好多次——算了。');
  await say('柯爾','如果把石板搬開，山上的水還會下來。下城的十二座水泵，至少有一半可以不用火。');
  s.aqueduct=true;G.rebuild();G.save();
}

/* ---------- 契約之前的水渠 ---------- */
G.defScene('har_aqueduct_past',{
  name:'舊水渠（契約之前）',pal:'past',w:1200,h:700,ambient:'past',
  build(B){
    B.border();
    B.seg(40,150,1160,150,{solid:true});B.seg(40,178,1160,178,{solid:true});
    B.ent({id:'water',x:600,y:164,lr:560,pulse:{every:0.8,max:200,str:0.5,ring:0.03},draw(ctx,e,a,t){W.st(ctx,'acc',0.55,1);ctx.beginPath();for(let i=0;i<18;i++){const x=50+((t*70+i*64)%1100);ctx.moveTo(x,160);ctx.lineTo(x+18,168);}ctx.stroke();}});
    B.ent({id:'gate',x:620,y:196,lr:26,draw(ctx,e,a){W.st(ctx,'line',Math.max(a,0.3),1.2);ctx.beginPath();ctx.rect(e.x-24,e.y-44,48,34);ctx.stroke();}});
    B.ent({id:'slab',x:780,y:300,lr:30,draw(ctx,e,a){W.st(ctx,'line',a,1.1);ctx.beginPath();ctx.rect(e.x-40,e.y-10,80,20);ctx.stroke();}});
    const hidden=F('har.hammerHidden');
    B.ent({id:'hammer',x:660,y:250,r:50,lr:16,label:'大鎚',cond:()=>!F('har.hammerHidden'),
      draw(ctx,e,a){W.st(ctx,'line',Math.max(a,0.3),1.3);ctx.beginPath();ctx.moveTo(e.x-14,e.y+12);ctx.lineTo(e.x+8,e.y-10);ctx.rect(e.x+4,e.y-18,14,10);ctx.stroke();},
      use:async()=>{
        await think('一把大鎚，靠在閘門旁邊。');
        await think('他們要用它，把閘門砸碎。');
        set('har.hammerHidden');AU.drop();G.pulse(620,164,{max:260,str:0.8});
        await think('我把鎚子推進渠裡。水把它帶走了。');
        const w=G.ent('w1');if(w)G.bubble(w,'鎚子呢？……算了，用石板封起來就好。',5);
        G.save();
      }});
    B.ent({id:'w1',name:'工人',x:820,y:360,r:60,label:'工人',fig:{col:'warm',flicker:true,arm:'hold',hat:'cap'},use:async()=>{await say('工人',F('har.hammerHidden')?'鎚子不見了。……反正以後也用不到這條渠。封起來就好。':'契約簽好了。舊渠用不到了，閘門砸了吧，免得有人偷水。',{src:'w1'});}});
    B.ent({id:'w2',name:'工人',x:980,y:320,r:60,label:'工人',fig:{col:'warm',flicker:true,beard:true},use:async()=>{await say('工人','聽說聖女要留下來了。有她在，火不會熄。',{src:'w2'});await think('……聖女。');}});
    W.rift(B,'rift',700,480,'回到現在',async()=>{await G.riftTo('har_street',720,300);},{col:'acc'});
    W.selfThreads(B);
    B.thread({a:'hammer',b:'gate',label:'鎚 → 閘門',tag:'',desc:'鎚子落下，閘門就碎了。碎了，就一直是碎的。',cond:()=>!F('har.hammerHidden')});
  },
  async enter(){if(!F('har.pastSeen')){set('har.pastSeen');await think('水在流。');await think('渠裡有水的聲音，一路從山上下來。這是契約之前的海拉奇。');}}
});

/* ---------- 聖殿 ---------- */
G.defScene('har_sanctum',{
  name:'聖殿',pal:'har',w:1600,h:1400,ambient:()=>cityOn()?'har':'silence',
  build(B){
    B.border();const s=H();
    for(const x of [480,1120])for(let y=380;y<=1180;y+=160)B.circ(x,y,20,{solid:true,n:12});
    B.rect(700,250,200,60,{solid:true});
    B.ent({id:'statue',x:800,y:250,r:110,lr:110,label:'聖女像',ay:-110,hy:110,always:s.state==='S'?0:0.2,
      draw(ctx,e,a,t){G.drawFig(ctx,{scale:4.2,blind:true,hair:true,hairLen:0.9,still:true,arm:'reach',col:'acc'},e.x,e.y,Math.max(a,0.25),t,e);
        if(s.state!=='S'){W.st(ctx,'th',0.5+0.2*Math.sin(t),1.2);ctx.beginPath();ctx.moveTo(e.x+30,e.y-80);ctx.quadraticCurveTo(e.x+90,e.y-160,e.x+60,e.y-240);ctx.stroke();}},
      use:async()=>{
        await think('一座很高的像。一個女孩，長頭髮，眼睛上綁著布。');
        await think('手裡握著一條線。');
        await think('……她和我，長得很像。');
        await think('底座刻著字：「初焰聖女。她為我們向明日借火，然後留下來，與我們同在。」');
        set('har.statue');
      }});
    B.ent({id:'pulpit',x:800,y:420,r:70,lr:26,label:'講壇',draw(ctx,e,a){W.st(ctx,'line',a,1.1);ctx.beginPath();ctx.rect(e.x-20,e.y-12,40,24);ctx.stroke();},use:pulpit});
    B.ent({id:'seran',name:'瑟蘭',x:880,y:470,r:70,label:'大祭司',fig:{h:34,halo:true,hood:true,arm:'hold'},use:seranTalk});
    const crowd=[];for(let r=0;r<5;r++)for(let c=0;c<7;c++)crowd.push([620+c*60+(r%2)*20,640+r*90]);
    crowd.forEach(([x,y],i)=>B.ent({id:'cr'+i,x,y,r:0,lr:14,hideLabel:true,fig:{arm:s.truth?'hold':'pray',hood:i%3===0,bent:i%4===0?0.3:0,still:false}}));
    for(const [x,y] of [[200,500],[200,900],[1400,500],[1400,900]]){B.ent({id:'vp'+x+y,x,y,r:0,lr:16,hideLabel:true,fig:{halo:true,arm:'out'},pulse:cityOn()?{every:1.5,max:160,str:0.45,ring:0.04,snd:e=>AU.clank((e.x-G.cam.x)/600)}:null});B.circ(x+26,y-16,8,{n:8,col:'warm'});}
    whisperers(B,[[640,1240,{},'聖女……'],[960,1240,{hood:true},'不，聖女的布，早就解下來了。']]);
    W.selfThreads(B);
    B.thread({a:'statue',b:'up',label:'聖女像 → ？',tag:'聖女',desc:'像手裡的線，一直往上。和我身上那條「聲音」的線，往同一個方向。',cond:()=>s.state!=='S'});
    B.thread({a:'cr10',b:'seran',label:'禱告 — 大祭司',tag:'禱告',desc:'他們在禱告。禱告的時候，旁邊的人在轉閥門——禱告，就是替大機樞加壓。'});
    B.exit(0,650,30,100,'har_street',1920,700);
    B.exit(1570,650,30,100,'har_archive',90,450);
    B.exit(760,1370,80,30,'har_engine',800,130,{cond:()=>F('har.seranMet'),blocked:async()=>{await think('往下的樓梯。有人守著。');await think('也許要先見過這裡的大祭司。');}});
  },
  async enter(first){if(first){await wait(0.3);await think('聖殿。很多人在禱告。禱告的聲音，和機械的聲音，是同一個節奏。');await think('最裡面，有一座很高的像。');}}
});
async function seranTalk(){
  if(!F('har.seranMet')){
    set('har.seranMet');
    await say('瑟蘭','……聖女。');
    await wait(1);
    await say('瑟蘭','不。妳不是她。她的布，很久以前就解下來了。');
    await say('凱拉','你認識她？');
    await say('瑟蘭','我老師的老師的老師，認識她。聖殿的每一任大祭司，都會讀到同一份交接。');
    await say('瑟蘭','妳是來關掉火的。對吧？修東西的人，總是先看見要關掉的東西。');
    await say('凱拉','我是來修這個世界的。');
    await say('瑟蘭','那我讓妳看看，這個世界。');
    await say('瑟蘭','今晚，如果大機樞停下——醫院的暖箱，三十一具。呼吸器，五十八具。下城的水泵十二座：四萬人，明天早上沒有水。糧廳的燈一熄，種子三天內凍死。');
    await say('瑟蘭','我知道，我們在吃掉孩子們的明天。');
    await say('瑟蘭','可是今天的孩子，也是孩子。');
    await say('凱拉','他們知道嗎？城裡的人，知道火是從哪裡來的嗎？');
    await say('瑟蘭','他們知道火是聖女借來的。他們以為，借來的東西，總有人會替他們還。');
    await say('瑟蘭','如果我說出真相，明天的禱告會變成暴動。如果我切斷火，後天的醫院會變成墓地。');
    await say('瑟蘭','妳要我選哪一個？');
    await wait(1);
    await think('他不是在說謊。他是在撐著。');
    await say('瑟蘭','大機樞在聖殿底下。去看吧。我不攔妳——我也攔不住。');
    G.save();return;
  }
  const s=H();
  if(s.state==='W'){await say('瑟蘭','聖殿的燈，第一次熄了。');await say('瑟蘭','奇怪。我以為我會害怕。');return;}
  if(s.state==='T'){await say('瑟蘭','謝謝妳。——或者，我該說對不起。');return;}
  if(s.state==='S'){await say('瑟蘭','……');await say('瑟蘭','帳本上的每一行，我都會記得。這是我唯一還能做的事。');return;}
  if(s.truth){await say('瑟蘭','我說出來了。');await say('瑟蘭','說出來，水不會從管子裡流出來。可是至少，他們知道自己在喝什麼。');return;}
  await say('瑟蘭','聖女的房間在契約庫裡面。她留下了一些東西。');
}
async function pulpit(){
  const s=H();
  if(s.truth){await think('講壇上還留著我說話的聲音。');return;}
  if(!F('har.seranMet')){await think('一座講壇。站上去說話，整座聖殿都會聽見。');return;}
  const key=await G.knot({ent:'pulpit',title:'講壇',options:[
    {key:'truth',label:'說出火從哪裡來',desc:'告訴他們：借來的火，不是聖女的恩典，是從以後——從他們孩子的明天——拿來的。說出來，火不會因此熄滅，水也不會因此多一滴。'},
    {key:'saint',label:'以聖女之名安撫他們',desc:'她和聖女長得很像。只要她開口，他們會相信——相信一切都會好起來。'}
  ],backDesc:'先不說話。'});
  if(key==='saint'){await G.refuse('講壇','以聖女之名安撫群眾',['……不。','我不會假裝成她。','如果我用她的臉說話，他們只會換一個人，繼續借。']);return;}
  if(key!=='truth')return;
  await G.decide('講壇','說出火從哪裡來');
  G.lockMove=true;
  await G.walkTo(800,452,60);
  await say('凱拉','你們向明日借的火，不是聖女的恩典。');
  await say('凱拉','是從以後拿來的。從利米塔尼亞的森林、坎帕納的時間、伊南的風。從你們孩子的明天。');
  for(let i=0;i<6;i++){const e=G.ent('cr'+(i*5));if(e)G.bubble(e,['她在說什麼？','聖女不會這樣說……','那我們的水呢？','騙人。','……我早就覺得不對。','孩子的明天？'][i],4);}
  await wait(2);
  await G.moveEnt('seran',840,440,60);
  await say('瑟蘭','她說的是真的。');
  await say('瑟蘭','我一直都知道。');
  await wait(1.2);
  await say('一個女人','……那我們該怎麼辦？',{src:'cr17'});
  await say('凱拉','我不知道全部的答案。');
  await say('凱拉','可是你們應該知道問題是什麼。');
  s.truth=true;G.lockMove=false;G.rebuild();G.save();
  await think('說出來了。火還在燒。什麼都還沒有改變——除了，他們知道了。');
}

/* ---------- 契約庫 ---------- */
G.defScene('har_archive',{
  name:'契約庫',pal:'har',w:1200,h:900,ambient:()=>cityOn()?'har':'silence',
  build(B){
    B.border();
    for(let i=0;i<5;i++)B.rect(120+i*150,600,90,200,{solid:true,col:'dim'});
    B.wall(880,420,880,560);B.wall(880,660,880,880);B.wall(880,420,1200,420);
    B.rect(960,640,170,60,{solid:true});
    const ind=[];for(let i=0;i<16;i++){const a=i/16*TAU;ind.push([1045+Math.cos(a)*58,670+Math.sin(a)*17]);}B.path(ind,{col:'dim',a:0.6},true);
    B.ent({id:'cloth',x:1090,y:666,r:66,lr:16,label:'折好的布',draw(ctx,e,a){W.st(ctx,'acc',Math.max(a,0.3),1.2);ctx.beginPath();ctx.rect(e.x-9,e.y-4,18,7);ctx.moveTo(e.x-9,e.y-1);ctx.lineTo(e.x+9,e.y-1);ctx.stroke();},
      use:async()=>{
        await think('一張石床。石床上的凹痕……');
        await think('和石室裡那張，一樣寬。');
        await think('床上放著一塊折好的布。');
        await think('白色的布。和我眼前的，是同一種。');
        await think('她把它解下來了。然後，留下來。');
        set('har.clothSeen');
      }});
    B.ent({id:'covenant',x:560,y:300,r:80,lr:40,label:'契約',ay:-30,
      draw(ctx,e,a,t){W.st(ctx,'warm',Math.max(a,0.35),1.2);ctx.beginPath();ctx.rect(e.x-60,e.y-40,120,70);ctx.stroke();ctx.beginPath();for(let i=0;i<5;i++){ctx.moveTo(e.x-48,e.y-28+i*10);ctx.lineTo(e.x+(i===4?10:48),e.y-28+i*10);}W.st(ctx,'warm',Math.max(a,0.25)*0.7,1);ctx.stroke();
        W.st(ctx,'acc',Math.max(a,0.5),1.2);ctx.beginPath();ctx.moveTo(e.x+30,e.y+12);ctx.lineTo(e.x+38,e.y+4);ctx.lineTo(e.x+46,e.y+12);ctx.lineTo(e.x+38,e.y+20);ctx.closePath();ctx.stroke();},
      use:async()=>{
        await think('一塊金屬板，刻著字。');
        await think('「海拉奇與明日之約：城向明日借火，以供今日之需。」');
        await think('底下，有一個印記。');
        await think('……這個形狀。');
        await think('聲音說話的時候，我感覺得到的，就是這個形狀。');
        set('har.sigil');G.hint(G.hk('按 <b>E</b>，看看契約的線通到哪裡','按「絲線」，看看契約的線通到哪裡'),7);
      }});
    W.selfThreads(B,{voiceDesc:'聲音的線。一直往上。'});
    B.thread({a:'covenant',b:'up',label:'契約的授權 → ◇',tag:'授權',sag:0.02,desc:'契約上的線往上走——走到很高的地方，和「聲音」的線接在一起。',
      onView:()=>{if(F('har.sigil'))set('har.rootViewed');}});
    B.exit(0,400,30,100,'har_sanctum',1510,700);
  },
  onThreadsExit(){if(F('har.rootViewed')&&!F('har.sameRoot')){set('har.sameRoot');G.run(sameRoot);}},
  async enter(first){if(first){await wait(0.3);await think('一間很安靜的房間。這裡的機械聲，比外面小。');await think('裡面還有一個更小的房間。');}}
});
async function sameRoot(){
  await think('契約的線往上走。聲音的線，也往上走。');
  await think('它們在很高的地方，接在一起。');
  await say('凱拉','……同一個根。');
  await say('凱拉','送我來修復的，和允許他們借用的——是同一個來源？');
  await voice('……');
  await wait(1);
  await voice('授權結構：不在任務範圍。');
  await say('凱拉','又是不在範圍。');
  await think('可是這一次，我聽得出來。它不是不知道。');
  G.save();
}

/* ---------- 大機樞 ---------- */
const TILE_T=['elbow','straight','straight','tee','tee','straight','elbow','elbow','straight'];
const BASE={straight:5,elbow:6,tee:11};
function mask(i){const t=TILE_T[i],r=H().rot[i]%4;let m=BASE[t];for(let k=0;k<r;k++)m=((m<<1)|(m>>3))&15;return m;}
function flow(){
  const seen=new Set(),q=[];const start=3;if(mask(start)&8){q.push(start);seen.add(start);}
  const out={h:false,w:false,g:false};
  while(q.length){const i=q.shift(),r=Math.floor(i/3),c=i%3,m=mask(i);
    const nb=[[1,r-1,c,4],[2,r,c+1,8],[4,r+1,c,1],[8,r,c-1,2]];
    for(const [bit,rr,cc,opp] of nb){if(!(m&bit))continue;if(cc>2){if(r===0)out.h=true;if(r===1)out.w=true;if(r===2)out.g=true;continue;}if(rr<0||rr>2||cc<0)continue;const j=rr*3+cc;if(mask(j)&opp&&!seen.has(j)){seen.add(j);q.push(j);}}}
  out.lit=seen;return out;
}
function routed(){const f=flow();return f.h&&!f.w&&!f.g;}
G.defScene('har_engine',{
  name:'大機樞',pal:'har',w:1600,h:1200,ambient:()=>cityOn()?'har':'silence',
  build(B){
    B.border();const s=H();
    B.wall(760,0,760,60);B.wall(840,0,840,60);
    B.solidCircle(800,440,150);
    B.ent({id:'engine',x:800,y:440,r:200,lr:150,label:'大機樞',ay:-160,hy:280,
      pulse:cityOn()?{every:s.state==='W'?2.4:0.75,max:s.state==='W'?300:620,str:0.55,ring:0.05,snd:()=>AU.clank(0)}:null,
      draw(ctx,e,a,t){const on=cityOn(),sp=s.state==='W'?0.1:1;W.st(ctx,on?'warm':'dim',Math.max(a,0.3),1.3);ctx.beginPath();ctx.arc(e.x,e.y,150,0,TAU);ctx.stroke();ctx.beginPath();ctx.arc(e.x,e.y,40,0,TAU);ctx.stroke();
        const rot=on?t*0.6*sp:0.3;ctx.beginPath();for(let i=0;i<12;i++){const an=rot+i/12*TAU;ctx.moveTo(e.x+Math.cos(an)*40,e.y+Math.sin(an)*40);ctx.lineTo(e.x+Math.cos(an)*150,e.y+Math.sin(an)*150);}ctx.stroke();
        if(on){const g=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,180);g.addColorStop(0,'rgba('+G.pal.warm+','+(s.state==='W'?0.06:0.16)+')');g.addColorStop(1,'rgba('+G.pal.warm+',0)');ctx.fillStyle=g;ctx.fillRect(e.x-180,e.y-180,360,360);}},
      use:engineKnot});
    // routing board
    const ox=650,oy=780,sz=100;
    B.rect(ox-10,oy-10,sz*3+20,sz*3+20,{col:'dim',a:0.6});
    B.seg(ox-80,oy+150,ox-10,oy+150,{col:'warm'});
    [['醫院',0],['水泵',1],['糧廳・聖殿',2]].forEach(([n,r])=>B.ent({id:'out'+r,x:ox+sz*3+60,y:oy+sz*r+50,lr:20,label:'',
      draw(ctx,e,a){const f=flow();const on=[f.h,f.w,f.g][r];W.st(ctx,on?'warm':'dim',on?0.9:0.5,1);ctx.beginPath();ctx.arc(e.x,e.y,10,0,TAU);ctx.moveTo(e.x-50,e.y);ctx.lineTo(e.x-10,e.y);ctx.stroke();ctx.font='13px "Noto Serif TC",serif';ctx.textAlign='left';ctx.fillStyle='rgba('+G.pal[on?'warm':'dim']+','+(on?0.9:0.6)+')';ctx.fillText(n,e.x+16,e.y+4);}}));
    for(let i=0;i<9;i++){const r=Math.floor(i/3),c=i%3,cx=ox+c*sz+50,cy=oy+r*sz+50;
      B.ent({id:'tile'+i,x:cx,y:cy,r:56,lr:30,label:'轉動接頭',hit:40,always:0.25,
        draw(ctx,e,a){const m=mask(i),f=flow(),on=f.lit.has(i);W.st(ctx,'dim',0.5,1);ctx.strokeRect(e.x-46,e.y-46,92,92);W.st(ctx,on?'warm':'line',on?0.95:Math.max(a,0.4),on?2.2:1.4);ctx.beginPath();
          if(m&1){ctx.moveTo(e.x,e.y);ctx.lineTo(e.x,e.y-46);}if(m&2){ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+46,e.y);}if(m&4){ctx.moveTo(e.x,e.y);ctx.lineTo(e.x,e.y+46);}if(m&8){ctx.moveTo(e.x,e.y);ctx.lineTo(e.x-46,e.y);}ctx.stroke();ctx.beginPath();ctx.arc(e.x,e.y,4,0,TAU);ctx.stroke();},
        use:async()=>{if(s.state){await think('線路已經定了。');return;}if(!F('har.kolEngine')){await think('一塊配電板。九個接頭，每一個都能轉。');await think('火從左邊進來，往右邊分出去——醫院、水泵、糧廳和聖殿。');}H().rot[i]=(H().rot[i]+1)%4;AU.clank(0.2);G.pulse(cx,cy,{max:80,str:0.5});
          if(routed()&&!F('har.routedOnce')){set('har.routedOnce');await think('只剩醫院的線是亮的。');if(F('har.metKol'))await think('柯爾說過：如果只接醫院，火可以收到十分之一。');}}});}
    B.ent({id:'kolE',name:'柯爾',x:520,y:900,r:60,label:'柯爾',fig:{hat:'cap',arm:'hold',coat:true},cond:()=>F('har.metKol'),use:async()=>{
      set('har.kolEngine');
      if(!H().aqueduct){await say('柯爾','這塊配電板決定火往哪裡去。');await say('柯爾','可是水泵拿掉火，四萬人就沒水。除非，有別的水。');return;}
      await say('柯爾','如果只接醫院——暖箱和呼吸器——大機樞可以收到十分之一。');
      await say('柯爾','水交給舊渠。糧廳和聖殿的燈，就得熄了。');
      await say('柯爾','轉接頭，讓火只流到醫院那一條。其他的，斷開。');}});
    W.selfThreads(B);
    B.thread({a:'engine',fray:[-240,-300],label:'大機樞 ← 以後',tag:'以後',desc:'這座城向以後借的火，比其他所有地方加起來還多。',cond:cityOn});
    B.thread({a:'engine',b:'tile3',label:'大機樞 → 配電',tag:'配電',desc:'火從這裡分出去，流到城裡的每一個地方。',cond:cityOn});
    B.exit(760,0,80,40,'har_sanctum',800,1320);
    B.exit(1560,380,40,140,null,0,0,{cond:()=>!!s.state&&F('har.sameRoot'),blocked:async()=>{if(!s.state){await think('更深處還有路。');await think('可是這裡的事，還沒有結束。');}else{await think('……還不能走。');await think('契約庫裡那塊契約，我還沒有看清楚它通到哪裡。');}},go:leaveHaraki});
  },
  async enter(first){if(first){await wait(0.3);await think('大機樞。整座城的心跳，從這裡來。');await think('它的聲音太大了，大到我不必聆聽，也看得見周圍的一切。');}}
});
async function engineKnot(){
  const s=H();
  if(s.state){const m={T:'大機樞照舊轉著。',S:'大機樞停了。整座城，都停了。',W:'大機樞轉得很慢。十分之一。'};await think(m[s.state]);return;}
  if(!F('har.seranMet')){await think('先去見這座城的人。');return;}
  if(!F('har.engineVoice')){
    set('har.engineVoice');
    await voice('此區偏差：全區最大。\n建議：立即停止調用。');
    await say('凱拉','今晚就停？');
    await voice('是。');
    await say('凱拉','娜菈的呼吸器會停。醫院的暖箱會冷。');
    await voice('個體資料：不在任務範圍。');
    await say('凱拉','……我已經不需要你回答了。');
  }
  const miss=[];if(!s.truth)miss.push('讓城裡的人知道真相');if(!s.aqueduct)miss.push('另一條不用火的水');if(!routed())miss.push('只接醫院的線路');
  const key=await G.knot({ent:'engine',title:'大機樞',options:[
    {key:'T',label:'維持契約，讓大機樞照舊運轉',desc:'醫院、水、糧廳、聖殿的燈，一切照舊。'+(s.truth?'城裡的人會知道火從哪裡來，卻仍然用著它。':'城裡的人，不會知道火從哪裡來。')+'以後，會繼續被借走。'},
    {key:'S',label:'停下大機樞',desc:'不再向以後借火。今晚，醫院的暖箱和呼吸器會停；明天早上，下城沒有水。瑟蘭的帳本上，每一行都是一個人。'},
    {key:'W',label:'改接：只留醫院的線，打開舊水渠',ok:miss.length===0,off:'（還差：'+miss.join('、')+'。）',desc:'大機樞收到十分之一，只推動醫院的暖箱與呼吸器。水交給舊渠。聖殿的燈會熄，糧廳要改種耐寒的作物。所有人都知道，這是一段得一起熬過去的日子。'}
  ],backDesc:'先不牽動大機樞。'});
  if(!key)return;
  s.state=key;
  await G.decide('大機樞',{T:'維持契約',S:'停下大機樞',W:'改接：只留醫院的線'}[key]);
  G.lockMove=true;
  if(key==='T'){await think('火還在燒。');await think('聖女留下的火。我沒有把它熄掉。');}
  else if(key==='S'){
    AU.crack();G.rebuild();AU.amb('silence');
    for(const p of G.pulses)p.str=0;
    await wait(1.6);
    await think('整座城，一下子安靜了。');
    await think('安靜到我聽得見，很遠的地方，有一個呼吸器停下來的聲音。');
    await wait(1.5);
    await think('……娜菈。');
  }else{
    G.rebuild();G.pulse(800,440,{max:700,str:0.8,ring:0.3});
    await think('大機樞慢下來了。很慢。');
    await think('遠處，舊水渠的石板被搬開。水的聲音，從山上一路下來。');
    await think('聖殿的燈熄了。醫院的燈還亮著。');
  }
  G.lockMove=false;G.save();
  if(!F('har.sameRoot'))await think('……契約庫。那塊契約的線，我還沒有看清楚。');
  else await think('東邊還有路。往更深的地方。');
}
async function leaveHaraki(){
  G.lockMove=true;
  await voice('最終座標：阿克西斯。');
  await say('凱拉','送我來修復的，和允許他們借用的，是同一個來源。');
  await say('凱拉','我要去問它。');
  await G.fade(1,1.6);G.lockMove=false;
  G.S.chapter=6;
  await G.gotoScene('axis_path',1200,2280,{instant:true});
}
})();
