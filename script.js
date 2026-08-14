
const $ = (q, root=document) => root.querySelector(q);
const $$ = (q, root=document) => [...root.querySelectorAll(q)];

const menuButton = $('#menuButton');
const menuPanel = $('#menuPanel');
menuButton.addEventListener('click', () => {
  const open = !menuPanel.classList.contains('open');
  menuPanel.classList.toggle('open', open);
  menuPanel.setAttribute('aria-hidden', String(!open));
  menuButton.setAttribute('aria-expanded', String(open));
});
$$('.menu-panel a').forEach(a => a.addEventListener('click', () => {
  menuPanel.classList.remove('open');
  menuPanel.setAttribute('aria-hidden','true');
  menuButton.setAttribute('aria-expanded','false');
}));
$('#year').textContent = new Date().getFullYear();


class ScrollMorphParticles {
  constructor(canvas, count=1500, hero=false){
    this.canvas=canvas;
    this.ctx=canvas.getContext('2d');
    this.count=count;
    this.hero=hero;
    this.points=[];
    this.t=0;
    this.progress=0;
    this.resize();
    this.init();
    addEventListener('resize',()=>this.resize(),{passive:true});
    this.loop();
  }
  resize(){
    const dpr=Math.min(devicePixelRatio||1,2);
    this.w=this.canvas.clientWidth||innerWidth;
    this.h=this.canvas.clientHeight||innerHeight;
    this.canvas.width=this.w*dpr;
    this.canvas.height=this.h*dpr;
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  init(){
    this.points=Array.from({length:this.count},(_,i)=>({
      u:Math.random(),
      v:Math.random(),
      z:Math.random(),
      seed:Math.random()*1000,
      size:.42+Math.random()*.88
    }));
  }
  setProgress(v){this.progress=Math.max(0,Math.min(1,v))}
  smooth(t){return t*t*(3-2*t)}
  mix(a,b,t){return a+(b-a)*t}

  heroPos(p){
    const x=p.u*this.w;
    const env=Math.sin(Math.PI*p.u);
    const band=(p.v-.5)*this.h*.23;
    const y=this.h*.56+band+
      Math.sin(p.u*8.8-this.t*.32+p.seed*.018)*this.h*.065*env+
      Math.sin(p.u*3.3+this.t*.13+p.seed*.031)*this.h*.021;
    return [x,y];
  }

  // BUILD: obvious dense inward spiral / orbital structure.
  buildPos(p){
    const a=p.u*Math.PI*5.2 + p.seed*.012 + this.t*.035;
    const radial=Math.min(this.w,this.h) * (.055 + .24*Math.pow(p.v,.72));
    const pinch=.72+.28*Math.sin(Math.PI*p.u);
    return [
      this.w*.50 + Math.cos(a)*radial*pinch,
      this.h*.50 + Math.sin(a)*radial*.52
    ];
  }

  // OPERATE: unmistakable left-to-right directional lanes.
  operatePos(p){
    const x=-this.w*.05 + p.u*this.w*1.10;
    const laneIndex=Math.floor(p.v*7);
    const laneCenter=this.h*(.34+laneIndex*.055);
    const laneNoise=(p.v*7-laneIndex-.5)*this.h*.028;
    const travel=this.t*1.65;
    const y=laneCenter+laneNoise+
      Math.sin(p.u*13-travel+p.seed*.02+laneIndex)*this.h*.012;
    return [x,y];
  }

  // ALLOCATE: broad radial distribution, far wider than Build.
  allocatePos(p){
    const a=p.u*Math.PI*2+p.seed*.02+this.t*.018;
    const r=Math.pow(p.v,.60)*Math.min(this.w,this.h)*.62;
    const stretchX=1.12, stretchY=.68;
    return [
      this.w*.50+Math.cos(a)*r*stretchX,
      this.h*.50+Math.sin(a)*r*stretchY
    ];
  }

  // ABOUT: settle into a sparse low horizon.
  aboutPos(p){
    return [
      p.u*this.w,
      this.h*.66+(p.v-.5)*this.h*.16+
      Math.sin(p.u*7+this.t*.15+p.seed*.02)*this.h*.015
    ];
  }

  getStoryPos(p){
    const p0=this.progress;
    // Allocate generous transition windows to make morphing visible.
    if(p0<.30){
      const t=this.smooth(p0/.30);
      const a=this.buildPos(p), b=this.operatePos(p);
      // First 35% stays mostly build before visibly opening.
      const tt=Math.max(0,(t-.34)/.66);
      return [this.mix(a[0],b[0],tt),this.mix(a[1],b[1],tt)];
    }
    if(p0<.63){
      const t=this.smooth((p0-.30)/.33);
      const a=this.operatePos(p), b=this.allocatePos(p);
      return [this.mix(a[0],b[0],t),this.mix(a[1],b[1],t)];
    }
    const t=this.smooth((p0-.63)/.37);
    const a=this.allocatePos(p), b=this.aboutPos(p);
    return [this.mix(a[0],b[0],t),this.mix(a[1],b[1],t)];
  }

  drawOperateTrails(strength){
    const c=this.ctx,w=this.w,h=this.h;
    c.save();
    c.lineWidth=.55;
    for(let lane=0;lane<7;lane++){
      c.beginPath();
      for(let x=-20;x<w+30;x+=18){
        const y=h*(.34+lane*.055)+Math.sin(x/w*13-this.t*1.65+lane)*h*.012;
        if(x===-20)c.moveTo(x,y);else c.lineTo(x,y);
      }
      c.strokeStyle=`rgba(192,151,98,${.085*strength})`;
      c.stroke();
    }
    c.restore();
  }

  drawAllocateRays(strength){
    const c=this.ctx,w=this.w,h=this.h;
    c.save();
    c.lineWidth=.5;
    for(let i=0;i<34;i++){
      const a=i/34*Math.PI*2+this.t*.018;
      c.beginPath();
      c.moveTo(w*.5,h*.5);
      c.lineTo(
        w*.5+Math.cos(a)*Math.min(w,h)*.63,
        h*.5+Math.sin(a)*Math.min(w,h)*.42
      );
      c.strokeStyle=`rgba(192,151,98,${.060*strength})`;
      c.stroke();
    }
    c.restore();
  }

  draw(){
    const c=this.ctx,w=this.w,h=this.h;
    c.clearRect(0,0,w,h);
    c.fillStyle='#050505';
    c.fillRect(0,0,w,h);

    // Determine phase emphasis for secondary directional traces.
    let operateStrength=0, allocateStrength=0;
    if(!this.hero){
      operateStrength=Math.max(0,1-Math.abs(this.progress-.34)/.20);
      allocateStrength=Math.max(0,1-Math.abs(this.progress-.64)/.22);
      if(operateStrength>0)this.drawOperateTrails(operateStrength);
      if(allocateStrength>0)this.drawAllocateRays(allocateStrength);
    }

    for(const p of this.points){
      const [x,y]=this.hero?this.heroPos(p):this.getStoryPos(p);
      const shimmer=.52+.48*Math.sin(this.t*.7+p.seed);
      let alpha=(.11+.43*shimmer)*(.58+.42*p.z);

      // Stronger phase-specific visual cue without becoming flashy.
      if(!this.hero){
        if(this.progress<.20) alpha*=1.18;       // denser Build
        if(this.progress>.70) alpha*=.82;        // calmer transition toward About
      }

      c.beginPath();
      c.arc(x,y,p.size*(.92+.50*p.z),0,Math.PI*2);
      c.fillStyle=`rgba(216,174,116,${alpha})`;
      c.fill();
    }

    this.t+=.012;
  }
  loop(){this.draw();requestAnimationFrame(()=>this.loop())}
}

const heroField=new ScrollMorphParticles($('#heroCanvas'),1450,true);
const storyField=new ScrollMorphParticles($('#storyCanvas'),1650,false);

// Keep the existing KOINEX background independent from the story morph.
const networkCanvas=$('#networkCanvas');
const networkCtx=networkCanvas.getContext('2d');
let nt=0;
function resizeNetwork(){
  const dpr=Math.min(devicePixelRatio||1,2);
  const w=networkCanvas.clientWidth||innerWidth,h=networkCanvas.clientHeight||innerHeight;
  networkCanvas.width=w*dpr; networkCanvas.height=h*dpr;
  networkCtx.setTransform(dpr,0,0,dpr,0,0);
}
resizeNetwork();
addEventListener('resize',resizeNetwork,{passive:true});
function drawNetwork(){
  const w=networkCanvas.clientWidth,h=networkCanvas.clientHeight;
  networkCtx.clearRect(0,0,w,h);
  for(let i=0;i<240;i++){
    const a=i*.61803398875*Math.PI*2+nt*.014;
    const r=Math.sqrt(i/240)*Math.min(w,h)*.41;
    const x=w*.61+Math.cos(a)*r;
    const y=h*.50+Math.sin(a)*r*.72;
    networkCtx.beginPath();
    networkCtx.arc(x,y,.55+(i%4)*.08,0,Math.PI*2);
    networkCtx.fillStyle='rgba(190,151,98,.21)';
    networkCtx.fill();
  }
  nt+=.01;
  requestAnimationFrame(drawNetwork);
}
drawNetwork();

const story=$('#story');
const states=$$('.story-state');
const dots=$$('.story-progress span');
let current=-1;
function updateStory(){
  const rect=story.getBoundingClientRect();
  const scrollable=Math.max(1,story.offsetHeight-innerHeight);
  const p=Math.min(1,Math.max(0,-rect.top/scrollable));

  // Continuous, reversible morph directly driven by scroll.
  storyField.setProgress(p);

  let step=0;
  if(p>=.28)step=1;
  if(p>=.58)step=2;
  if(p>=.84)step=3;
  if(step!==current){
    current=step;
    states.forEach((s,i)=>s.classList.toggle('is-active',i===step));
    dots.forEach((d,i)=>d.classList.toggle('active',i===step));
  }
}
addEventListener('scroll',updateStory,{passive:true});
updateStory();

const principleCopy = $('#principleCopy');
$$('.principle').forEach(btn=>{
  btn.addEventListener('mouseenter',()=>{
    $$('.principle').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    principleCopy.textContent = btn.dataset.copy;
  });
  btn.addEventListener('focus',()=>{
    $$('.principle').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    principleCopy.textContent = btn.dataset.copy;
  });
});
