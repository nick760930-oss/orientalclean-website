/* Concept C｜玻璃水膜：在現場照片上刮除水膜
 * WebGL：折射、流動水痕與水珠；刮除區域顯示清晰照片。
 * 降級：低效能裝置改用 Canvas 2D 霧面；無法載入時保留原始照片。
 * Reduced Motion：水膜不流動，只有使用者操作時更新畫面。
 */
const VERT = `attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}`;
const FRAG = `precision mediump float;
varying vec2 v;
uniform sampler2D u_photo, u_mask;
uniform vec2 u_scale, u_res;
uniform float u_time, u_flow, u_aspect;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}
vec2 img(vec2 uv){return (uv-.5)*u_scale+.5;}
void main(){
 vec2 uv=v;
 float wiped=texture2D(u_mask,vec2(uv.x,1.-uv.y)).a;
 float film=1.-wiped;
 float t=u_time*u_flow;
 vec2 p=vec2(uv.x*u_aspect,uv.y);
 float n1=noise(p*4.5+vec2(0.,t*.22));
 float n2=noise(p*12.+vec2(3.1,t*.55));
 vec2 refr=(vec2(n1,n2)-.5)*.024;
 float cx=floor(uv.x*64.);
 float r=hash(vec2(cx,7.));
 float lane=step(.8,r);
 float yy=fract(uv.y*.9+t*(.04+.1*r)+r);
 float head=smoothstep(0.,.02,yy)*(1.-smoothstep(.02,.4,yy));
 float xw=1.-smoothstep(0.,.3,abs(fract(uv.x*64.)-.5));
 float streak=lane*head*xw;
 refr+=vec2(0.,streak*.018);
 vec2 g=p*vec2(26.,17.);vec2 gi=floor(g);vec2 gf=fract(g)-.5;
 float h=hash(gi);vec2 off=(vec2(hash(gi+1.3),hash(gi+2.7))-.5)*.5;
 float d=length(gf-off);
 float drop=step(.7,h)*smoothstep(.24,.0,d);
 refr+=(gf-off)*drop*.035;
 vec2 duv=uv+refr*film;
 vec2 px=vec2(3.5/u_res.x,3.5/u_res.y)*film;
 vec3 c=texture2D(u_photo,img(duv)).rgb*.36;
 c+=texture2D(u_photo,img(duv+vec2(px.x,0.))).rgb*.16;
 c+=texture2D(u_photo,img(duv-vec2(px.x,0.))).rgb*.16;
 c+=texture2D(u_photo,img(duv+vec2(0.,px.y))).rgb*.16;
 c+=texture2D(u_photo,img(duv-vec2(0.,px.y))).rgb*.16;
 vec3 clear=texture2D(u_photo,img(uv)).rgb;
 vec3 haze=mix(c,vec3(.80,.88,.90),.27)+drop*.1+streak*.07;
 float edge=smoothstep(.2,.5,wiped)*(1.-smoothstep(.5,.9,wiped));
 gl_FragColor=vec4(mix(haze,clear,wiped)+edge*.16,1.);
}`;

async function loadPhoto(src, onProgress) {
  const res = await fetch(src);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const total = +res.headers.get('content-length') || 0;
  let blob;
  if (res.body && res.body.getReader && total) {
    const reader = res.body.getReader();
    const chunks = [];
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value); got += value.length;
      onProgress(got / total);
    }
    blob = new Blob(chunks, { type: res.headers.get('content-type') || 'image/webp' });
  } else {
    blob = await res.blob();
  }
  onProgress(1);
  const url = URL.createObjectURL(blob);
  const im = new Image();
  im.decoding = 'async';
  im.src = url;
  await im.decode();
  return im;
}

export async function init(root, opts) {
  const { reduced, low, track, onState } = opts;
  const canvas = root.querySelector('canvas');
  const loadBox = root.querySelector('[data-film-load]');
  const bar = root.querySelector('[data-film-bar]');
  const pct = root.querySelector('[data-film-pct]');
  let img;
  loadBox.hidden = false;
  try {
    img = await loadPhoto(root.dataset.src, (p) => {
      bar.style.width = (p * 100).toFixed(0) + '%';
      pct.textContent = (p * 100).toFixed(0) + '%';
    });
  } catch (err) {
    loadBox.hidden = true;
    onState('error');
    return null;
  }
  loadBox.hidden = true;

  /* 刮除遮罩：低解析度透明 Canvas，不透明處代表已刮除 */
  const mask = document.createElement('canvas');
  const mctx = mask.getContext('2d', { willReadFrequently: true });
  let W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, low ? 1 : 1.5);
  const sizeMask = () => {
    mask.width = 320; mask.height = Math.max(120, Math.round(320 * H / Math.max(W, 1)));
    mctx.clearRect(0, 0, mask.width, mask.height);
  };

  const gl = !low && canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
  let draw, uploadMask, dirty = true;

  if (gl) {
    const sh = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = (unit) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return t;
    };
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    tex(0); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    const mtex = tex(1);
    const U = (n) => gl.getUniformLocation(prog, n);
    gl.uniform1i(U('u_photo'), 0); gl.uniform1i(U('u_mask'), 1);
    gl.uniform1f(U('u_flow'), reduced ? 0 : 1);
    const uScale = U('u_scale'), uRes = U('u_res'), uTime = U('u_time'), uAspect = U('u_aspect');
    uploadMask = () => {
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, mtex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
    };
    draw = (time) => {
      if (dirty) { uploadMask(); dirty = false; }
      gl.viewport(0, 0, canvas.width, canvas.height);
      const ca = W / H, ia = img.naturalWidth / img.naturalHeight;
      gl.uniform2f(uScale, ca > ia ? 1 : ca / ia, ca > ia ? ia / ca : 1);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time / 1000);
      gl.uniform1f(uAspect, ca);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    canvas.addEventListener('webglcontextlost', (ev) => { ev.preventDefault(); stop(); canvas.remove(); onState('error'); });
  } else {
    /* Canvas 2D 降級：縮小再放大形成霧面，刮除時直接挖空 */
    const ctx = canvas.getContext('2d');
    if (!ctx) { onState('error'); return null; }
    const small = document.createElement('canvas');
    const paintHaze = () => {
      const ca = W / H, ia = img.naturalWidth / img.naturalHeight;
      let sw = img.naturalWidth, sh2 = img.naturalHeight, sx = 0, sy = 0;
      if (ca > ia) { sh2 = sw / ca; sy = (img.naturalHeight - sh2) / 2; } else { sw = sh2 * ca; sx = (img.naturalWidth - sw) / 2; }
      small.width = Math.max(8, Math.round(canvas.width / 14)); small.height = Math.max(8, Math.round(canvas.height / 14));
      small.getContext('2d').drawImage(img, sx, sy, sw, sh2, 0, 0, small.width, small.height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(205, 225, 230, .3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    let painted = false;
    draw = () => {
      if (!painted) { paintHaze(); painted = true; }
      if (!dirty) return;
      dirty = false;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(mask, 0, 0, canvas.width, canvas.height);
    };
    uploadMask = () => { painted = false; };
  }

  const resize = () => {
    W = root.clientWidth; H = root.clientHeight;
    if (!W || !H) return;
    const prev = mask.width ? mctx.getImageData(0, 0, mask.width, mask.height) : null;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const oldW = mask.width, oldH = mask.height;
    sizeMask();
    if (prev && oldW) { const tmp = document.createElement('canvas'); tmp.width = oldW; tmp.height = oldH; tmp.getContext('2d').putImageData(prev, 0, 0); mctx.drawImage(tmp, 0, 0, mask.width, mask.height); }
    dirty = true; uploadMask(); requestDraw();
  };

  /* 刮刀：與移動方向垂直的刀片 */
  let last = null, interacted = false, strokes = 0;
  const blade = (x, y, ang) => {
    const bw = mask.height * 0.26, th = Math.max(6, mask.height * 0.035);
    mctx.save(); mctx.translate(x, y); mctx.rotate(ang + Math.PI / 2);
    mctx.fillStyle = '#fff'; mctx.fillRect(-bw / 2, -th / 2, bw, th);
    mctx.restore();
  };
  const wipeTo = (px, py) => {
    const x = px / W * mask.width, y = py / H * mask.height;
    if (last) {
      const dx = x - last.x, dy = y - last.y, dist = Math.hypot(dx, dy);
      if (dist < 0.5) return;
      const ang = Math.atan2(dy, dx);
      const steps = Math.ceil(dist / 2);
      for (let i = 1; i <= steps; i++) blade(last.x + dx * i / steps, last.y + dy * i / steps, ang);
    }
    last = { x, y };
    dirty = true; requestDraw();
  };
  const local = (ev) => { const r = root.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };
  let active = false;
  root.addEventListener('pointerdown', (ev) => {
    if (ev.target.closest('a, button')) return;
    active = true; last = null;
    if (ev.pointerType === 'mouse') root.setPointerCapture(ev.pointerId);
    if (!interacted) { interacted = true; track('film_wipe'); onState('wiping'); }
    wipeTo(...local(ev));
  });
  root.addEventListener('pointermove', (ev) => { if (active) wipeTo(...local(ev)); });
  const end = () => { if (active) { active = false; last = null; strokes++; checkCleared(); } };
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', end);
  root.addEventListener('dragstart', (ev) => ev.preventDefault());

  const checkCleared = () => {
    const d = mctx.getImageData(0, 0, mask.width, mask.height).data;
    let on = 0, n = 0;
    for (let i = 3; i < d.length; i += 32) { n++; if (d[i] > 128) on++; }
    const ratio = on / n;
    onState(ratio > 0.55 ? 'cleared' : 'wiping', ratio);
  };
  const reset = () => { sizeMask(); dirty = true; uploadMask(); requestDraw(); onState('reset'); };

  /* 繪製迴圈：只在可見時執行；Reduced Motion 只在操作時繪製 */
  let raf = 0, visible = true, lastFrame = 0;
  const loop = (t) => {
    raf = 0;
    if (!visible || document.hidden) return;
    if (t - lastFrame > 32) { draw(t); lastFrame = t; }
    if (!reduced && gl) raf = requestAnimationFrame(loop);
  };
  const requestDraw = () => { if (!raf) raf = requestAnimationFrame(loop); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  new IntersectionObserver((en) => { visible = en.some((x) => x.isIntersecting); if (visible) requestDraw(); }).observe(root);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) requestDraw(); });
  new ResizeObserver(resize).observe(root);
  resize();
  root.classList.add('is-live');
  onState('ready');

  /* 首次示範：一次斜向刮除（Reduced Motion 不執行） */
  if (!reduced) {
    setTimeout(() => {
      if (interacted) return;
      const pts = 26; let i = 0;
      const sx = W * 0.5, sy = H * 0.3, ex = W * 0.97, ey = H * 0.3;
      const demo = () => {
        if (interacted || i > pts) { last = null; return; }
        wipeTo(sx + (ex - sx) * i / pts, sy + (ey - sy) * i / pts); i++;
        setTimeout(demo, 22);
      };
      last = null; demo();
    }, 1600);
  }
  return { reset };
}
