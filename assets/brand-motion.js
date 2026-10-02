/* One procedural woven surface; not a pre-rendered film or an engineering model. */
window.OCMotion = function(canvas, toggle) {
  const ctx = canvas.getContext('2d', {alpha:true});
  if (!ctx) return {pause(){}, resume(){}};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width=0,height=0,raf=0,time=0,last=0,deadline=0,paused=false,hidden=false;
  let pointer={x:0,y:0},smooth={x:0,y:0};
  const frames=[];
  const lerp=(a,b,t)=>a+(b-a)*t;
  const norm=(v)=>{let l=Math.hypot(...v)||1;return v.map(x=>x/l)};
  const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
  const light=norm([-0.7,-.35,1]);
  const half=norm([light[0],light[1],light[2]+1]);
  function point(u,v,t){
    const twist = u*1.28 + .72 + smooth.x*.15 + Math.sin(t*.35+u)*.045;
    const cx=.32*Math.sin(u*1.62+.32) + .10*Math.sin(t*.3+u);
    const taper=Math.max(.001,Math.min(1,(u+1.55)/.42));
    const w=.45*(.90+.10*Math.cos(u*1.5))*taper*taper*(3-2*taper);
    let x=cx+v*w*Math.cos(twist), y=u*1.2;
    let z=.35*Math.cos(u*1.15)+v*w*Math.sin(twist);
    // Small regular folds provide material, without adding particles or decoration.
    z+=.001*Math.cos(v*55+u*8)*(1-v*v);
    const rz=-.30, ry=-.40+smooth.x*.05;
    const x1=x*Math.cos(ry)+z*Math.sin(ry), z1=-x*Math.sin(ry)+z*Math.cos(ry);
    const x2=x1*Math.cos(rz)-y*Math.sin(rz), y2=x1*Math.sin(rz)+y*Math.cos(rz);
    return [x2,y2,z1];
  }
  function project(p){
    const mobile=width<760;
    const scale=Math.min(height*(mobile?.18:.272),width*(mobile?.51:.40));
    const k=4.6/(4.6-p[2]);
    return [width*(mobile?.65:.715)+p[0]*scale*k+smooth.x*6,
            height*(mobile?.76:.44)+p[1]*scale*k+smooth.y*5,p[2]];
  }
  function draw(){
    if(width<1||height<1)return;
    const start=performance.now();
    ctx.clearRect(0,0,width,height);
    const rows=88, cols=width<900?42:64;
    const strips=[];
    function colorAt(u,v){
      const a=point(u-.005,v,time),b=point(u+.005,v,time),c=point(u,v-.005,time),d=point(u,v+.005,time);
      const U=b.map((x,k)=>x-a[k]),V=d.map((x,k)=>x-c[k]);
      let n=norm([U[1]*V[2]-U[2]*V[1],U[2]*V[0]-U[0]*V[2],U[0]*V[1]-U[1]*V[0]]);
      if(n[2]<0)n=n.map(x=>-x);
      const diffuse=Math.max(0,dot(n,light)),spec=Math.pow(Math.max(0,dot(n,half)),30),face=.48+diffuse*.53;
      return 'rgb('+[60,183,201].map((x,k)=>Math.round(Math.min(255,x*face+spec*(k===0?135:60)+12))).join(',')+')';
    }
    for(let j=0;j<cols;j++){
      const v0=-1+2*j/cols,v1=-1+2*(j+1)/cols;
      const a=[],b=[];let depth=0;
      for(let i=0;i<=rows;i++){
        const u=-1.55+3.1*i/rows;
        const p0=point(u,v0,time),p1=point(u,v1,time);
        a.push(project(p0));b.push(project(p1));depth+=p0[2]+p1[2];
      }
      strips.push({a,b,depth,v:(v0+v1)/2});
    }
    strips.sort((a,b)=>a.depth-b.depth);
    for(const strip of strips){
      const a=strip.a,b=strip.b;
      const y0=Math.min(a[0][1],b[0][1]),y1=Math.max(a[rows][1],b[rows][1]);
      const gradient=ctx.createLinearGradient(0,y0,0,y1);
      for(let i=0;i<=22;i++){
        const u=-1.55+3.1*i/22;
        const y=project(point(u,strip.v,time))[1];
        gradient.addColorStop(Math.min(1,Math.max(0,(y-y0)/(y1-y0))),colorAt(u,strip.v));
      }
      ctx.beginPath();a.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
      for(let i=b.length-1;i>=0;i--)ctx.lineTo(b[i][0],b[i][1]);
      ctx.closePath();ctx.fillStyle=gradient;ctx.fill();ctx.strokeStyle=gradient;ctx.lineWidth=.9;ctx.stroke();
    }
    // Longitudinal filaments; no wireframe grid.
    for(let j=0;j<=30;j++){
      ctx.beginPath();for(let i=0;i<=rows;i++){const p=project(point(-1.55+3.1*i/rows,-1+2*j/30,time));i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])}
      ctx.strokeStyle='rgba(225,250,253,.085)';ctx.lineWidth=.5;ctx.stroke();
    }
    frames.push(performance.now()-start);if(frames.length>120)frames.shift();
    canvas.dataset.rendered='true';canvas.dataset.frames=String(Number(canvas.dataset.frames||0)+1);canvas.dataset.frameMs=(frames.reduce((s,x)=>s+x,0)/frames.length).toFixed(2);
  }
  function tick(now){
    raf=0;if(paused||hidden||document.hidden)return;
    if(last&&now-last<33){raf=requestAnimationFrame(tick);return}
    time+=Math.min(.07,(now-(last||now))/1000);last=now;
    smooth.x=lerp(smooth.x,pointer.x,.09);smooth.y=lerp(smooth.y,pointer.y,.09);
    draw();
    if(now<deadline&&!reduced.matches)raf=requestAnimationFrame(tick);
    else {toggle.setAttribute('aria-pressed','false');toggle.textContent='播放動態'}
  }
  function wake(ms=1400){if(paused||hidden||reduced.matches)return;deadline=performance.now()+ms;if(!raf){last=0;raf=requestAnimationFrame(tick)}toggle.setAttribute('aria-pressed','true');toggle.textContent='暫停動態'}
  function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const ratio=Math.min(devicePixelRatio||1,1.6);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);draw()}
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  canvas.parentElement.addEventListener('pointermove',(e)=>{if(e.pointerType==='touch')return;const r=canvas.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width-.5;pointer.y=(e.clientY-r.top)/r.height-.5;wake()},{passive:true});
  toggle.addEventListener('click',()=>{if(raf){paused=true;cancelAnimationFrame(raf);raf=0;toggle.textContent='播放動態';toggle.setAttribute('aria-pressed','false')}else{paused=false;wake(8000)}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0}else if(!document.hidden&&!hidden)draw()});
  reduced.addEventListener('change',()=>{if(raf)cancelAnimationFrame(raf);raf=0;draw();toggle.hidden=reduced.matches});
  toggle.hidden=reduced.matches;
  wake(6500);
  return {pause(){hidden=true;if(raf)cancelAnimationFrame(raf);raf=0},resume(){hidden=false;draw()}};
};
