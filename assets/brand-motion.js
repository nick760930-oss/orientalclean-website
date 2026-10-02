'use strict';
/* One WebGL surface: a stylised projection of light through rippled glass.
   Not a photograph, fluid simulation, image sequence or ray-traced scene. */
window.OCMotion = function (canvas, button) {
  if (!canvas || !button) return {pause(){},resume(){}};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let gl,program,raf=0,until=0,blocked=false,manual=false,userPaused=false,last=0,clock=1.8;
  let pointer=[.64,.55],aim=[.64,.55],resolution;
  const api={pause,resume};
  function label(active){button.textContent=active?'暫停光影':'播放光影';button.setAttribute('aria-pressed',String(active));}
  function fallback(){
    // A static Canvas2D rendering of the same field, used when WebGL is unavailable.
    // Static on purpose: do not run a CPU pixel shader continuously on phones.
    const replacement=document.createElement('canvas');replacement.id=canvas.id;
    canvas.replaceWith(replacement);canvas=replacement;
    const ctx=canvas.getContext('2d');button.hidden=true;
    if(!ctx){canvas.hidden=true;return;}
    canvas.parentElement.dataset.renderer='canvas2d-static';
    function paint(){
      const rect=canvas.getBoundingClientRect();if(rect.width<1||rect.height<1)return;
      const w=360,h=Math.max(120,Math.min(540,Math.round(w*rect.height/rect.width)));
      canvas.width=w;canvas.height=h;const image=ctx.createImageData(w,h),d=image.data;
      const aspect=rect.width/rect.height,t=1.8;
      const wave=(x,y)=>.44*Math.sin(x*4.2+y*1.6+t*.20)+.22*Math.sin(y*6.3-x*1.3-t*.16)+.12*Math.sin(x*9.5+y*5.6+t*.11)+.06*Math.sin(y*14+x*3.4-t*.12);
      for(let j=0;j<h;j++)for(let i=0;i<w;i++){
        const u=i/w,v=1-j/h;let x=u*aspect,y=v;
        const influence=Math.exp(-((x-.64*aspect)**2+(y-.55)**2)*2.7);x+=.035*influence;y-=.023*influence;
        const height=wave(x,y),sx=(wave(x+.009,y)-height)/.009,sy=(wave(x,y+.009)-height)/.009;
        const nx=-sx*.32,ny=-sy*.32,norm=Math.hypot(nx,ny,1),light=(-.65*nx+.8*ny+1.7)/(norm*Math.hypot(-.65,.8,1.7));
        const qx=x+sx*.09,qy=y+sy*.09,ribbon=qx*.65+qy*.48+.08*Math.sin(qy*3.2+t*.10);
        const beam=Math.exp(-(((ribbon-.74)*13)**2)),edge=Math.exp(-(((ribbon-.875)*38)**2)),ripple=(.5+.5*Math.sin(qx*14+qy*10+height*3))**10;
        const a=Math.max(0,Math.min(1,light*.75+v*.23)),b=Math.max(0,Math.min(.95,beam*.8+edge*.55+ripple*.085));
        const deep=[.23,.57,.64],blue=[.43,.74,.79],ice=[.88,.96,.96],index=(j*w+i)*4;
        for(let k=0;k<3;k++)d[index+k]=255*((deep[k]*(1-a)+blue[k]*a)*(1-b)+ice[k]*b);
        d[index+3]=255;
      }
      ctx.putImageData(image,0,0);canvas.dataset.frames=String(Number(canvas.dataset.frames||0)+1);
    }
    new ResizeObserver(paint).observe(canvas);paint();
  }
  try {
    gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false,powerPreference:'low-power'});
    if(!gl){fallback();return api;}
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
    const vert=shader(gl.VERTEX_SHADER,'attribute vec2 a; varying vec2 v; void main(){v=(a+1.)*.5;gl_Position=vec4(a,0.,1.);}');
    const frag=shader(gl.FRAGMENT_SHADER,`precision highp float;
      varying vec2 v; uniform vec2 res; uniform vec2 mouse; uniform float time;
      float wave(vec2 p){
        return .44*sin(p.x*4.2+p.y*1.6+time*.20)
             + .22*sin(p.y*6.3-p.x*1.3-time*.16)
             + .12*sin(p.x*9.5+p.y*5.6+time*.11)
             + .06*sin(p.y*14.0+p.x*3.4-time*.12);
      }
      float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){
        vec2 uv=v; float aspect=res.x/max(res.y,1.);
        vec2 p=vec2(uv.x*aspect,uv.y);
        vec2 m=vec2(mouse.x*aspect,mouse.y);
        float influence=exp(-dot(p-m,p-m)*2.7);
        p += vec2(.035,-.023)*influence;
        float h=wave(p),e=.009;
        vec2 slope=vec2(wave(p+vec2(e,0.))-h,wave(p+vec2(0.,e))-h)/e;
        vec3 n=normalize(vec3(-slope*.32,1.));
        float light=dot(n,normalize(vec3(-.65,.8,1.7)));
        vec2 q=p+slope*.09;
        float ribbon=q.x*.65+q.y*.48+.08*sin(q.y*3.2+time*.10);
        float rb=(ribbon-.74)*13.; float beam=exp(-rb*rb);
        float re=(ribbon-.875)*38.; float edge=exp(-re*re);
        float ripple=pow(.5+.5*sin(q.x*14.+q.y*10.+h*3.),10.);
        vec3 deep=vec3(.23,.57,.64);
        vec3 blue=vec3(.43,.74,.79);
        vec3 ice=vec3(.88,.96,.96);
        vec3 c=mix(deep,blue,clamp(light*.75+uv.y*.23,0.,1.));
        c=mix(c,ice,clamp(beam*.8+edge*.55+ripple*.085,0.,.95));
        c+=vec3(noise(gl_FragCoord.xy)-.5)*.006;
        c=mix(c,vec3(.967,.977,.972),smoothstep(.94,1.,uv.y)*.22);
        gl_FragColor=vec4(c,1.);
      }`);
    program=gl.createProgram();gl.attachShader(program,vert);gl.attachShader(program,frag);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
    gl.deleteShader(vert);gl.deleteShader(frag);gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
    resolution=gl.getUniformLocation(program,'res');
    api.timeUniform=gl.getUniformLocation(program,'time');api.mouseUniform=gl.getUniformLocation(program,'mouse');
    canvas.parentElement.dataset.renderer='webgl';
  } catch(error){fallback();return api;}
  function draw(){if(!gl||gl.isContextLost())return;gl.useProgram(program);gl.uniform2f(resolution,canvas.width,canvas.height);gl.uniform1f(api.timeUniform,clock);gl.uniform2f(api.mouseUniform,...pointer);gl.drawArrays(gl.TRIANGLES,0,3);canvas.dataset.frames=String(Number(canvas.dataset.frames||0)+1);}
  function resize(){const r=canvas.getBoundingClientRect();if(r.width<1||r.height<1)return;const ratio=Math.min(devicePixelRatio||1,1.5,Math.sqrt(1000000/(r.width*r.height)));canvas.width=Math.max(1,Math.round(r.width*ratio));canvas.height=Math.max(1,Math.round(r.height*ratio));gl.viewport(0,0,canvas.width,canvas.height);draw();}
  function stop(){cancelAnimationFrame(raf);raf=0;last=0;label(false);}
  function step(now){raf=0;if(blocked||document.hidden||userPaused||reduced.matches&&!manual||now>until){stop();return;}if(!last||now-last>=32){const dt=last?Math.min((now-last)/1000,.07):0;clock+=dt;last=now;pointer[0]+=(aim[0]-pointer[0])*.12;pointer[1]+=(aim[1]-pointer[1])*.12;draw();}raf=requestAnimationFrame(step);}
  function play(ms,isManual=false){if(blocked||document.hidden||userPaused||reduced.matches&&!isManual)return;manual=isManual;until=performance.now()+ms;label(true);if(!raf)raf=requestAnimationFrame(step);}
  function pause(){blocked=true;stop();}
  function resume(){blocked=false;draw();}
  button.addEventListener('click',()=>{if(raf){userPaused=true;stop();}else{userPaused=false;play(6000,true);}});
  canvas.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||reduced.matches||userPaused)return;const r=canvas.getBoundingClientRect();aim=[(e.clientX-r.left)/r.width,1-(e.clientY-r.top)/r.height];play(1100);},{passive:true});
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||reduced.matches||userPaused)return;const r=canvas.getBoundingClientRect();aim=[(e.clientX-r.left)/r.width,1-(e.clientY-r.top)/r.height];play(1400);},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else draw();});
  reduced.addEventListener('change',()=>{manual=false;stop();draw();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stop();fallback();});
  new ResizeObserver(resize).observe(canvas);
  resize();label(false);if(!reduced.matches)play(5500);
  return api;
};
