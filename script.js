
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

class ParticleField {
  constructor(canvas, kind='wave', count=900) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.kind = kind;
    this.count = count;
    this.points = [];
    this.t = 0;
    this.targetMode = kind;
    this.modeMix = 1;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.init();
    this.animate();
  }
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = this.canvas.clientWidth || innerWidth;
    this.h = this.canvas.clientHeight || innerHeight;
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  init() {
    this.points = Array.from({length:this.count}, (_,i)=>({
      u: Math.random(),
      v: Math.random(),
      seed: Math.random()*1000,
      r: .35 + Math.random()*1.1
    }));
  }
  setMode(mode){ this.targetMode = mode; }
  project(p, mode){
    const w=this.w,h=this.h,t=this.t;
    if(mode==='wave' || mode==='operate'){
      const x = p.u*w;
      const base = h*(.57 + (p.v-.5)*.30);
      const amp = mode==='operate' ? h*.09 : h*.12;
      const y = base + Math.sin(p.u*9 + t*.35 + p.seed)*amp*(.25+.75*(1-Math.abs(p.v-.5)*2))
                    + Math.sin(p.u*3.4 - t*.22 + p.seed*.2)*amp*.4;
      return [x,y];
    }
    if(mode==='build'){
      const a = p.u*Math.PI*2 + t*.12 + p.seed*.02;
      const ring = Math.min(w,h)*(.17 + p.v*.15);
      const x = w*.5 + Math.cos(a)*ring*(1+.20*Math.sin(t*.2+p.seed));
      const y = h*.5 + Math.sin(a)*ring*.55 + Math.sin(a*3+p.seed)*12;
      return [x,y];
    }
    if(mode==='allocate'){
      const a = p.u*Math.PI*2 + p.seed*.015;
      const rr = Math.pow(p.v,.72)*Math.min(w,h)*.34;
      const x = w*.5 + Math.cos(a+t*.08)*rr;
      const y = h*.5 + Math.sin(a+t*.08)*rr;
      return [x,y];
    }
    if(mode==='about'){
      const x = p.u*w;
      const y = h*.62 + Math.sin(p.u*6+t*.16+p.seed)*h*.035 + (p.v-.5)*h*.16;
      return [x,y];
    }
    if(mode==='network'){
      const a=p.u*Math.PI*2, rr=Math.pow(p.v,.8)*Math.min(w,h)*.42;
      return [w*.62+Math.cos(a)*rr, h*.52+Math.sin(a)*rr*.72];
    }
    return [p.u*w,p.v*h];
  }
  draw(){
    const c=this.ctx,w=this.w,h=this.h;
    c.clearRect(0,0,w,h);
    c.fillStyle='#050505';
    if(this.kind!=='network') c.fillRect(0,0,w,h);

    for(const p of this.points){
      const [x,y] = this.project(p,this.targetMode);
      let alpha = .10 + .42*Math.pow(Math.sin((p.u+p.seed)*5 + this.t*.25)*.5+.5,2);
      if(this.targetMode==='about') alpha*=.42;
      if(this.kind==='network') alpha*=.72;
      const warm = 175 + Math.floor(45*((Math.sin(p.seed)+1)/2));
      c.beginPath();
      c.arc(x,y,p.r,0,Math.PI*2);
      c.fillStyle=`rgba(${warm+20},${Math.floor(warm*.82)},${Math.floor(warm*.57)},${alpha})`;
      c.fill();
    }

    if(this.targetMode==='allocate' || this.kind==='network'){
      c.save();
      c.strokeStyle='rgba(197,160,107,.09)';
      c.lineWidth=.6;
      for(let i=0;i<22;i++){
        const a=i/22*Math.PI*2+this.t*.025;
        c.beginPath();
        c.moveTo(w*.5,h*.5);
        c.lineTo(w*.5+Math.cos(a)*Math.min(w,h)*.38,h*.5+Math.sin(a)*Math.min(w,h)*.28);
        c.stroke();
      }
      c.restore();
    }
    this.t += .012;
  }
  animate(){ this.draw(); requestAnimationFrame(()=>this.animate()); }
}

const heroField = new ParticleField($('#heroCanvas'),'wave',1050);
const storyField = new ParticleField($('#storyCanvas'),'build',780);
const networkField = new ParticleField($('#networkCanvas'),'network',650);
networkField.setMode('network');

const story = $('#story');
const states = $$('.story-state');
const dots = $$('.story-progress span');
let current = -1;
function updateStory(){
  const rect = story.getBoundingClientRect();
  const scrollable = story.offsetHeight - innerHeight;
  const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
  const step = Math.min(3, Math.floor(progress * 4));
  if(step !== current){
    current = step;
    states.forEach((s,i)=>s.classList.toggle('is-active',i===step));
    dots.forEach((d,i)=>d.classList.toggle('active',i===step));
    storyField.setMode(['build','operate','allocate','about'][step]);
  }
}
addEventListener('scroll', updateStory, {passive:true});
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
