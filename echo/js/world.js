/* 迴響維度 — shared drawing & building helpers */
(function(){
'use strict';
const {TAU,hyp,clamp}=G;
const W=G.W_=window.W={};

/* ---------- people ---------- */
G.drawFig=function(ctx,f,x,y,a,t,e){
  f=f||{};
  if(f.scale&&f.scale!==1){ctx.save();ctx.translate(x,y);ctx.scale(f.scale,f.scale);const g=Object.assign({},f,{scale:1,lw:(f.lw||1.1)/f.scale});G.drawFig(ctx,g,0,0,a,t,e);ctx.restore();return;}
  const pal=G.pal,col=pal[f.col||'line']||f.col;
  if(f.flicker)a*=0.55+0.45*Math.abs(Math.sin(t*2.1+(e?e.t:0)));
  const child=!!f.child,h=(f.h||30)*(child?0.66:1),hr=f.hr||(child?4:4.4);
  const bend=f.bent||0,bob=f.still?0:Math.sin(t*1.5+(e?e.t:0))*0.4;
  if(f.lying){drawLying(ctx,f,x,y,a,col);return;}
  const hx=x+bend*7,hy=y-h+hr+bob+bend*4,sw=f.sw||5,hem=(f.hem||13)*(child?0.8:1),shY=hy+hr+3;
  ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=f.lw||1.1;
  ctx.strokeStyle='rgba('+col+','+a+')';
  if(f.broken){ctx.setLineDash([5,3,1,4]);ctx.lineDashOffset=-t*6;}
  const glow=pal.glow&&a>0.2;
  const strokeIt=()=>{if(glow){ctx.globalCompositeOperation='lighter';const lw=ctx.lineWidth;ctx.strokeStyle='rgba('+col+','+a*0.14+')';ctx.lineWidth=lw*3.4;ctx.stroke();ctx.lineWidth=lw;ctx.globalCompositeOperation='source-over';}ctx.strokeStyle='rgba('+col+','+a+')';ctx.stroke();};
  // long hair behind (statue, the other Kaila)
  if(f.hair){ctx.beginPath();for(let i=-3;i<=3;i++){const sx=hx+i*1.2;ctx.moveTo(sx,hy-hr+1);ctx.quadraticCurveTo(sx+i*1.6+Math.sin(t*0.9+i)*0.8,hy+h*0.4,sx+i*2.2,hy+h*(f.hairLen||0.78));}
    ctx.save();ctx.strokeStyle='rgba('+(pal[f.hairCol||'acc']||col)+','+a*0.7+')';ctx.lineWidth=(f.lw||1.1)*0.8;ctx.stroke();ctx.restore();}
  // robe
  ctx.beginPath();ctx.moveTo(hx-sw/2,hy+hr+1);ctx.lineTo(x-hem/2,y);ctx.quadraticCurveTo(x,y+2.5,x+hem/2,y);ctx.lineTo(hx+sw/2,hy+hr+1);
  if(f.coat){ctx.moveTo(hx,hy+hr+2);ctx.lineTo(x,y+1);}
  strokeIt();
  // head
  ctx.beginPath();ctx.arc(hx,hy,hr,0,TAU);strokeIt();
  if(f.hood){ctx.beginPath();ctx.arc(hx,hy+0.6,hr+2.3,Math.PI*1.02,Math.PI*1.98);ctx.moveTo(hx+hr+2.2,hy+1);ctx.lineTo(hx+sw/2+2.2,shY+1);ctx.moveTo(hx-hr-2.2,hy+1);ctx.lineTo(hx-sw/2-2.2,shY+1);strokeIt();}
  if(f.hat==='wide'){ctx.beginPath();ctx.ellipse(hx,hy-hr+1,hr+5.5,1.9,0,0,TAU);ctx.moveTo(hx-hr+0.6,hy-hr+0.4);ctx.lineTo(hx-hr+1.6,hy-hr-4.2);ctx.lineTo(hx+hr-1.6,hy-hr-4.2);ctx.lineTo(hx+hr-0.6,hy-hr+0.4);strokeIt();}
  if(f.hat==='cap'){ctx.beginPath();ctx.arc(hx,hy-1,hr+0.6,Math.PI*1.05,Math.PI*1.95);ctx.lineTo(hx+hr+4,hy-1.5);strokeIt();}
  if(f.bun){ctx.beginPath();ctx.arc(hx-1,hy-hr-1.8,2,0,TAU);strokeIt();}
  if(f.beard){ctx.beginPath();ctx.moveTo(hx-2.5,hy+2);ctx.quadraticCurveTo(hx,hy+hr+5,hx+2.5,hy+2);strokeIt();}
  // arms
  ctx.beginPath();
  const ax=hx+sw/2,bx=hx-sw/2;
  switch(f.arm){
    case'up':ctx.moveTo(ax,shY);ctx.lineTo(ax+4,shY-10);ctx.moveTo(bx,shY);ctx.lineTo(bx-3,shY+8);break;
    case'bothup':ctx.moveTo(ax,shY);ctx.lineTo(ax+5,shY-9);ctx.moveTo(bx,shY);ctx.lineTo(bx-5,shY-9);break;
    case'out':ctx.moveTo(ax,shY);ctx.lineTo(ax+10,shY+2);ctx.moveTo(bx,shY);ctx.lineTo(bx-3,shY+8);break;
    case'reach':ctx.moveTo(ax,shY);ctx.lineTo(ax+11,shY-3);break;
    case'pray':ctx.moveTo(ax,shY);ctx.lineTo(hx+1,shY+5);ctx.lineTo(hx,shY+1);ctx.moveTo(bx,shY);ctx.lineTo(hx-1,shY+5);break;
    case'pull':ctx.moveTo(ax,shY);ctx.lineTo(ax+2,shY-11);ctx.moveTo(bx,shY);ctx.lineTo(ax+1,shY-8);break;
    case'chest':ctx.moveTo(ax,shY);ctx.lineTo(hx,shY+4);ctx.moveTo(bx,shY);ctx.lineTo(hx-1,shY+6);break;
    case'run':ctx.moveTo(ax,shY);ctx.lineTo(ax+7,shY-4);ctx.moveTo(bx,shY);ctx.lineTo(bx-7,shY+6);break;
    case'hold':ctx.moveTo(ax,shY);ctx.lineTo(ax+5,shY+7);ctx.moveTo(bx,shY);ctx.lineTo(bx-5,shY+7);break;
    case'none':break;
    default:ctx.moveTo(ax,shY);ctx.lineTo(ax+2.5,shY+9);ctx.moveTo(bx,shY);ctx.lineTo(bx-2.5,shY+9);
  }
  strokeIt();
  if(f.cane){ctx.beginPath();ctx.moveTo(x+hem/2+3,y);ctx.lineTo(x+hem/2+1,shY+3);ctx.lineTo(x+hem/2-1,shY+2);strokeIt();}
  if(f.basket){ctx.beginPath();ctx.rect(ax+1,shY+6,7,5);strokeIt();}
  if(f.rope){ // jump rope held from both hands, arcing overhead
    const ry=f.ropeY==null?-13:f.ropeY;ctx.beginPath();ctx.moveTo(bx-3,shY+7);ctx.quadraticCurveTo(hx,hy-hr+ry,ax+3,shY+7);
    ctx.save();ctx.strokeStyle='rgba('+(pal.warm)+','+a*0.9+')';ctx.stroke();ctx.restore();}
  if(f.halo){ctx.beginPath();const R=hr+5.5;for(let i=0;i<14;i++){const an=i/14*TAU+t*0.2,r1=i%2?R:R+1.8;const px=hx+Math.cos(an)*r1,py=hy+Math.sin(an)*r1;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);}ctx.closePath();ctx.save();ctx.strokeStyle='rgba('+pal.warm+','+a*0.6+')';ctx.lineWidth=0.8;ctx.stroke();ctx.restore();}
  if(f.blind){ctx.beginPath();ctx.moveTo(hx-hr-0.4,hy-0.6);ctx.lineTo(hx+hr+0.4,hy-0.6);ctx.save();ctx.strokeStyle='rgba('+(pal.acc)+','+a+')';ctx.lineWidth=(f.lw||1.1)*2;ctx.stroke();ctx.restore();}
  if(f.eyes){ctx.beginPath();ctx.moveTo(hx-2.2,hy-0.6);ctx.lineTo(hx-0.9,hy-0.6);ctx.moveTo(hx+0.9,hy-0.6);ctx.lineTo(hx+2.2,hy-0.6);strokeIt();}
  if(f.tube){ctx.beginPath();ctx.moveTo(hx+1,hy+2);ctx.quadraticCurveTo(hx+12,hy+10,f.tube[0]-x+x,f.tube[1]);ctx.save();ctx.strokeStyle='rgba('+pal.warm+','+a*0.8+')';ctx.lineWidth=0.9;ctx.stroke();ctx.restore();}
  ctx.setLineDash([]);
};
function drawLying(ctx,f,x,y,a,col){
  ctx.strokeStyle='rgba('+col+','+a+')';ctx.lineWidth=1.1;ctx.lineCap='round';
  ctx.beginPath();ctx.arc(x-13,y-3,4.2,0,TAU);ctx.moveTo(x-8,y-5);ctx.lineTo(x+12,y-6);ctx.quadraticCurveTo(x+15,y-2,x+12,y+1);ctx.lineTo(x-8,y);ctx.stroke();
}

/* ---------- animals (for the forest) ---------- */
G.drawAnimal=function(ctx,kind,x,y,a,s,rot,decay){
  const pal=G.pal,col=pal.line;s=s||1;decay=decay||0;
  ctx.save();ctx.translate(x,y+decay*4);ctx.rotate(rot||0);ctx.scale(s,s);
  ctx.lineWidth=1.05/s;ctx.lineCap='round';ctx.lineJoin='round';
  const aa=a*(1-decay*0.85);ctx.strokeStyle='rgba('+col+','+aa+')';
  if(decay>0){ctx.setLineDash([Math.max(0.5,6*(1-decay)),1+decay*7]);}
  ctx.beginPath();
  if(kind==='deer'){ctx.ellipse(0,0,17,7,0,0,TAU);ctx.moveTo(14,-3);ctx.quadraticCurveTo(20,-10,23,-12);ctx.moveTo(26,-12);ctx.arc(24,-12,3,0,TAU);ctx.moveTo(-8,5);ctx.lineTo(-2,8);ctx.lineTo(6,7);ctx.moveTo(4,5);ctx.lineTo(12,8);ctx.moveTo(-17,-1);ctx.lineTo(-20,-3);}
  else if(kind==='stag'){ctx.ellipse(0,0,18,7.5,0,0,TAU);ctx.moveTo(15,-3);ctx.quadraticCurveTo(21,-10,24,-12);ctx.moveTo(27,-12);ctx.arc(25,-12,3,0,TAU);ctx.moveTo(24,-15);ctx.lineTo(21,-23);ctx.lineTo(17,-26);ctx.moveTo(21,-23);ctx.lineTo(24,-28);ctx.moveTo(26,-15);ctx.lineTo(30,-22);ctx.lineTo(34,-24);ctx.moveTo(-8,5);ctx.lineTo(-2,8);ctx.lineTo(6,7);}
  else if(kind==='fox'){ctx.arc(0,0,9,Math.PI*0.1,Math.PI*1.9);ctx.moveTo(8,-4);ctx.lineTo(12,-10);ctx.lineTo(13,-4);ctx.moveTo(10,-4);ctx.lineTo(9,-10);ctx.moveTo(9,3);ctx.quadraticCurveTo(0,14,-12,8);ctx.quadraticCurveTo(-16,2,-9,-1);}
  else if(kind==='cub'){ctx.arc(0,0,4.2,0,TAU);ctx.moveTo(2,-3.5);ctx.lineTo(3.5,-7);ctx.lineTo(4.5,-3);ctx.moveTo(-4,1);ctx.quadraticCurveTo(-8,4,-6,6);}
  else if(kind==='bird'){ctx.ellipse(0,0,6,3.4,0,0,TAU);ctx.moveTo(6,-1);ctx.lineTo(9,0);ctx.lineTo(6,1);ctx.moveTo(-2,-2);ctx.lineTo(-5,-8);ctx.lineTo(1,-3);ctx.moveTo(-6,0);ctx.lineTo(-10,-1);ctx.moveTo(-6,1);ctx.lineTo(-10,2);}
  else if(kind==='rabbit'){ctx.ellipse(0,0,8,5,0,0,TAU);ctx.moveTo(7,-3);ctx.arc(9,-3,2.6,0,TAU);ctx.moveTo(9,-5);ctx.lineTo(8,-13);ctx.moveTo(10,-5);ctx.lineTo(12,-12);}
  else if(kind==='gull'){ctx.ellipse(0,0,7,3.4,0,0,TAU);ctx.moveTo(6,-2);ctx.arc(7.5,-3,2.2,0,TAU);ctx.moveTo(9.5,-3);ctx.lineTo(12.5,-2.4);ctx.moveTo(-1,-2);ctx.quadraticCurveTo(-4,-9,-9,-7);ctx.moveTo(-6,0);ctx.lineTo(-10,0);}
  ctx.stroke();ctx.setLineDash([]);
  if(decay>0.05){ctx.fillStyle='rgba('+pal.warm+','+a*decay*0.5+')';for(let i=0;i<10;i++){const px=Math.sin(i*12.9)*14,py=Math.cos(i*7.3)*6+decay*3;ctx.fillRect(px,py,1.3,1.3);}}
  ctx.restore();
};

/* ---------- geometry helpers ---------- */
W.distSeg=function(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy;let t=L?((px-ax)*dx+(py-ay)*dy)/L:0;t=clamp(t,0,1);return hyp(px-(ax+dx*t),py-(ay+dy*t));};
W.distPath=function(px,py,pts){let m=1e9;for(let i=0;i<pts.length-1;i++){const d=W.distSeg(px,py,pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1]);if(d<m)m=d;}return m;};

/* ---------- scenery ---------- */
W.tree=function(B,x,y,r,o){
  o=o||{};const trunk=Math.max(5,r*0.28);
  B.circ(x,y,trunk,{solid:true,cr:trunk+1,n:9,col:o.tcol||'line',jit:0.15});
  if(o.noCanopy)return;
  const n=Math.max(9,Math.round(r/3.5)),pts=[];
  for(let i=0;i<n;i++){const a=i/n*TAU,rr=r*(0.78+B.r()*0.3);pts.push([x+Math.cos(a)*rr,y-r*0.25+Math.sin(a)*rr*0.86]);}
  B.path(pts,{col:o.col||'line',a:o.ca==null?0.55:o.ca},true);
  for(let i=0;i<3;i++){const a=B.r()*TAU;B.seg(x,y,x+Math.cos(a)*r*0.6,y-r*0.25+Math.sin(a)*r*0.5,{col:o.col||'line',a:0.35});}
};
W.forest=function(B,x0,y0,x1,y1,n,avoid,rmin,rmax,o){
  const placed=[];let tries=0;
  while(placed.length<n&&tries<n*30){tries++;
    const r=rmin+(rmax-rmin)*B.r(),x=x0+(x1-x0)*B.r(),y=y0+(y1-y0)*B.r();
    if(avoid&&avoid(x,y,r))continue;
    let ok=true;for(const p of placed){if(hyp(p[0]-x,p[1]-y)<(p[2]+r)*0.62){ok=false;break;}}
    if(!ok)continue;placed.push([x,y,r]);W.tree(B,x,y,r,o);
  }
  return placed;
};
W.grass=function(B,x0,y0,x1,y1,n,o){
  o=o||{};for(let i=0;i<n;i++){const x=x0+(x1-x0)*B.r(),y=y0+(y1-y0)*B.r();if(o.avoid&&o.avoid(x,y))continue;const l=3+B.r()*6,a=-Math.PI/2+(B.r()-0.5)*0.8;B.seg(x,y,x+Math.cos(a)*l,y+Math.sin(a)*l,{col:o.col||'dim',a:o.a||0.7});}
};
W.house=function(B,x,y,w,h,o){
  o=o||{};B.rect(x,y,w,h,{solid:true,col:o.col||'line'});
  B.seg(x,y,x+w/2,y-h*0.22,{col:o.col||'line',a:0.6});B.seg(x+w/2,y-h*0.22,x+w,y,{col:o.col||'line',a:0.6});
  if(o.door!==false){const dx=x+w*(o.doorX==null?0.5:o.doorX);B.seg(dx-7,y+h,dx-7,y+h-14,{col:'dim'});B.seg(dx-7,y+h-14,dx+7,y+h-14,{col:'dim'});B.seg(dx+7,y+h-14,dx+7,y+h,{col:'dim'});}
  if(o.win!==false){for(let i=0;i<(o.wins||2);i++){const wx=x+w*(0.18+i*0.64/Math.max(1,(o.wins||2)-1))-5;B.rect(wx,y+h*0.3,10,8,{col:'dim',a:0.8});}}
};
W.pathEdge=function(B,pts,width,o){
  o=o||{};
  for(let i=0;i<pts.length-1;i++){const [ax,ay]=pts[i],[bx,by]=pts[i+1],dx=bx-ax,dy=by-ay,L=hyp(dx,dy)||1,nx=-dy/L*width,ny=dx/L*width;
    const steps=Math.max(1,Math.round(L/40));for(let k=0;k<steps;k++){if(B.r()<0.35)continue;const t0=k/steps,t1=(k+0.6)/steps;
      for(const s of [1,-1])B.seg(ax+dx*t0+nx*s,ay+dy*t0+ny*s,ax+dx*t1+nx*s,ay+dy*t1+ny*s,{col:o.col||'dim',a:o.a||0.5});}}
};
W.rock=function(B,x,y,r,o){B.circ(x,y,r,Object.assign({solid:true,n:7,jit:0.35,col:'dim'},o));};

/* ---------- rifts: places where the past or future can be touched ---------- */
W.rift=function(B,id,x,y,label,use,o){
  o=o||{};
  return B.ent(Object.assign({id,x,y,r:52,lr:30,label,use,always:0.5,hy:y-36,
    draw(ctx,e,a,t){
      const pal=G.pal,col=pal[o.col||'warm'];const k=0.55+0.45*Math.sin(t*2.2);
      ctx.lineCap='round';
      for(let j=0;j<3;j++){ctx.beginPath();let px=e.x,py=e.y+6;ctx.moveTo(px,py);
        for(let i=1;i<=9;i++){px=e.x+Math.sin(i*1.9+j*2.1+t*(0.6+j*0.3))*(3+i*0.5)*(j?0.6:1);py=e.y+6-i*5.2;ctx.lineTo(px,py);}
        if(pal.glow)ctx.globalCompositeOperation='lighter';
        ctx.strokeStyle='rgba('+col+','+(0.25+0.6*k)*(j?0.45:1)+')';ctx.lineWidth=j?0.8:1.4;ctx.stroke();ctx.globalCompositeOperation='source-over';}
      const g=ctx.createRadialGradient(e.x,e.y-18,0,e.x,e.y-18,34);g.addColorStop(0,'rgba('+col+','+0.16*k+')');g.addColorStop(1,'rgba('+col+',0)');ctx.fillStyle=g;ctx.fillRect(e.x-36,e.y-54,72,72);
    }},o));
};

/* ---------- generic item ---------- */
W.item=function(B,id,x,y,label,draw,use,o){return B.ent(Object.assign({id,x,y,r:40,label,draw(ctx,e,a,t){draw(ctx,e,a,t);},use},o));};

/* stroke helper used by custom draws */
W.st=function(ctx,col,a,w){ctx.strokeStyle='rgba('+(G.pal[col]||col)+','+a+')';ctx.lineWidth=w||1.1;ctx.lineCap='round';ctx.lineJoin='round';};
W.glowStroke=function(ctx,col,a,w){const rgb=G.pal[col]||col;if(G.pal.glow){ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba('+rgb+','+a*0.15+')';ctx.lineWidth=(w||1.1)*3.6;ctx.stroke();ctx.globalCompositeOperation='source-over';}ctx.strokeStyle='rgba('+rgb+','+a+')';ctx.lineWidth=w||1.1;ctx.stroke();};

/* The untraceable thread: from Kaila to wherever the viewer is. It is present in
 * every thread view; nobody comments on it until the Axis. */
W.selfThreads=function(B,o){
  o=o||{};
  B.thread({a:'kaila',b:'up',label:'聲音',tag:'',desc:o.voiceDesc||'一條很細、很直的線，向上延伸，看不見盡頭。聲音從那裡來。',sag:0.02});
  B.thread({a:'kaila',b:'cursor',label:'（無法追溯）',tag:'',faint:true,sag:0.18,desc:o.selfDesc||'這條線沒有另一端。——或者，另一端不在這裡。'});
};
})();
