
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


class MorphParticleField {
  constructor(canvas, count=1050, hero=false){
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.count = count;
    this.hero = hero;
    this.t = 0;
    this.progress = 0;
    this.points = [];
    this.resize();
    this.init();
    addEventListener('resize',()=>this.resize(),{passive:true});
    this.animate();
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
      u:Math.random(), v:Math.random(), seed:Math.random()*1000,
      size:.28+Math.random()*.85,
      depth:.35+Math.random()*.65
    }));
  }
  setProgress(p){ this.progress=Math.max(0,Math.min(1,p)); }
  ease(x){ return x*x*(3-2*x); }
  mix(a,b,t){ return a+(b-a)*t; }

  heroPos(p){
    const x=p.u*this.w;
    const center=.55*this.h;
    const envelope=Math.sin(Math.PI*p.u);
    const y=center+(p.v-.5)*this.h*.27
      +Math.sin(p.u*8.0+this.t*.34+p.seed*.035)*this.h*.075*envelope
      +Math.sin(p.u*2.8-this.t*.16+p.seed*.08)*this.h*.025;
    return [x,y];
  }

  buildPos(p){
    const a=p.u*Math.PI*2 + p.seed*.006;
    const rr=Math.min(this.w,this.h)*(.17+p.v*.13);
    const wobble=1+.06*Math.sin(a*3+this.t*.18+p.seed);
    return [
      this.w*.50+Math.cos(a+this.t*.025)*rr*wobble,
      this.h*.50+Math.sin(a+this.t*.025)*rr*.54*wobble
    ];
  }

  operatePos(p){
    const x=p.u*this.w;
    const lane=(p.v-.5)*this.h*.25;
    const envelope=.35+.65*Math.sin(Math.PI*p.u);
    const y=this.h*.51+lane
      +Math.sin(p.u*10-this.t*.9+p.seed*.035)*this.h*.052*envelope
      +Math.sin(p.u*4-this.t*.48+p.seed*.09)*this.h*.024;
    return [x,y];
  }

  allocatePos(p){
    const a=p.u*Math.PI*2+p.seed*.009;
    const rr=Math.pow(p.v,.68)*Math.min(this.w,this.h)*.47;
    const pulse=1+.035*Math.sin(this.t*.35+p.seed);
    return [
      this.w*.50+Math.cos(a+this.t*.035)*rr*pulse,
      this.h*.50+Math.sin(a+this.t*.035)*rr*.78*pulse
    ];
  }

  aboutPos(p){
    const x=p.u*this.w;
    const y=this.h*.63+(p.v-.5)*this.h*.18+
      Math.sin(p.u*6+this.t*.18+p.seed*.05)*this.h*.022;
    return [x,y];
  }

  storyPos(p){
    // 0 build -> .33 operate -> .66 allocate -> 1 about
    const q=this.progress*3;
    let a,b,t;
    if(q<1){a=this.buildPos(p);b=this.operatePos(p);t=this.ease(q);}
    else if(q<2){a=this.operatePos(p);b=this.allocatePos(p);t=this.ease(q-1);}
    else {a=this.allocatePos(p);b=this.aboutPos(p);t=this.ease(q-2);}
    return [this.mix(a[0],b[0],t),this.mix(a[1],b[1],t)];
  }

  drawConnections(pos, alphaScale){
    const c=this.ctx;
    c.save();
    c.lineWidth=.45;
    for(let i=0;i<pos.length-1;i+=12){
      const a=pos[i], b=pos[(i+7)%pos.length];
      const dx=a[0]-b[0],dy=a[1]-b[1],d=Math.hypot(dx,dy);
      if(d<95){
        c.strokeStyle=`rgba(188,148,94,${(1-d/95)*.07*alphaScale})`;
        c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();
      }
    }
    c.restore();
  }

  draw(){
    const c=this.ctx,w=this.w,h=this.h;
    c.clearRect(0,0,w,h);
    c.fillStyle='#050505'; c.fillRect(0,0,w,h);

    const positions=[];
    for(const p of this.points){
      const xy=this.hero?this.heroPos(p):this.storyPos(p);
      positions.push(xy);
      const shimmer=.5+.5*Math.sin(this.t*.65+p.seed);
      let alpha=(.07+.26*shimmer)*p.depth;
      if(!this.hero && this.progress>.84) alpha*=1-(this.progress-.84)/.16*.55;
      const r=p.size*(.72+.38*p.depth);
      c.beginPath();c.arc(xy[0],xy[1],r,0,Math.PI*2);
      c.fillStyle=`rgba(202,164,111,${alpha})`;c.fill();
    }

    this.drawConnections(positions,this.hero?1:.7);

    // Directional hairlines during operate.
    if(!this.hero){
      const op=1-Math.min(1,Math.abs(this.progress-.34)/.19);
      if(op>0){
        c.save();
        c.lineWidth=.5;
        for(let j=0;j<7;j++){
          const yy=h*(.40+j*.035);
          c.beginPath();
          for(let x=0;x<=w;x+=24){
            const y=yy+Math.sin(x/w*8-this.t*.75+j)*h*.013;
            if(x===0)c.moveTo(x,y);else c.lineTo(x,y);
          }
          c.strokeStyle=`rgba(188,148,94,${.035*op})`;c.stroke();
        }
        c.restore();
      }

      // Radial traces during allocate.
      const al=1-Math.min(1,Math.abs(this.progress-.67)/.20);
      if(al>0){
        c.save();c.lineWidth=.45;
        for(let j=0;j<26;j++){
          const a=j/26*Math.PI*2+this.t*.02;
          c.beginPath();c.moveTo(w*.5,h*.5);
          c.lineTo(w*.5+Math.cos(a)*Math.min(w,h)*.46,
                   h*.5+Math.sin(a)*Math.min(w,h)*.35);
          c.strokeStyle=`rgba(188,148,94,${.028*al})`;c.stroke();
        }
        c.restore();
      }
    }
    this.t+=.012;
  }
  animate(){this.draw();requestAnimationFrame(()=>this.animate());}
}

const heroField = new MorphParticleField($('#heroCanvas'),1250,true);
const storyField = new MorphParticleField($('#storyCanvas'),1050,false);

// Koinex network stays separate/simple.
const networkCanvas=$('#networkCanvas');
const networkCtx=networkCanvas.getContext('2d');
let nt=0;
function resizeNetwork(){
  const dpr=Math.min(devicePixelRatio||1,2),w=networkCanvas.clientWidth||innerWidth,h=networkCanvas.clientHeight||innerHeight;
  networkCanvas.width=w*dpr;networkCanvas.height=h*dpr;networkCtx.setTransform(dpr,0,0,dpr,0,0);
}
resizeNetwork();addEventListener('resize',resizeNetwork,{passive:true});
function drawNetwork(){
  const w=networkCanvas.clientWidth,h=networkCanvas.clientHeight;
  networkCtx.clearRect(0,0,w,h);
  for(let i=0;i<220;i++){
    const a=i*.618*Math.PI*2+nt*.015, r=Math.sqrt(i/220)*Math.min(w,h)*.40;
    const x=w*.60+Math.cos(a)*r,y=h*.50+Math.sin(a)*r*.72;
    networkCtx.beginPath();networkCtx.arc(x,y,.6+(i%5)*.08,0,Math.PI*2);
    networkCtx.fillStyle='rgba(190,151,98,.22)';networkCtx.fill();
  }
  nt+=.01;requestAnimationFrame(drawNetwork);
}
drawNetwork();

const story = $('#story');
const states = $$('.story-state');
const dots = $$('.story-progress span');
let current=-1;
function updateStory(){
  const rect=story.getBoundingClientRect();
  const scrollable=Math.max(1,story.offsetHeight-innerHeight);
  const p=Math.min(1,Math.max(0,-rect.top/scrollable));
  storyField.setProgress(p);

  // Text states change near the centers of the four morph phases,
  // while particles remain continuously scroll-linked and reversible.
  let step=0;
  if(p>=.25) step=1;
  if(p>=.50) step=2;
  if(p>=.76) step=3;
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
