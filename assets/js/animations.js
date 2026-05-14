/* ── Arc Nova — Visual Engine v2 ─────────────────────────────────────────── */
(function () {
'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   1.  INJECT CSS
═══════════════════════════════════════════════════════════════════════════ */
const BASE_CSS = `
@keyframes arcBlob1 {
  0%,100%{ transform:translate(0,0) scale(1); }
  33%    { transform:translate(70px,-50px) scale(1.10); }
  66%    { transform:translate(-40px,60px) scale(0.93); }
}
@keyframes arcBlob2 {
  0%,100%{ transform:translate(0,0) scale(1); }
  40%    { transform:translate(-60px,40px) scale(1.08); }
  80%    { transform:translate(50px,-70px) scale(0.96); }
}
@keyframes arcBlob3 {
  0%,100%{ transform:translate(0,0) scale(1); }
  25%    { transform:translate(50px,70px) scale(1.12); }
  60%    { transform:translate(-70px,-40px) scale(0.92); }
}
@keyframes arcBlob4 {
  0%,100%{ transform:translate(0,0) scale(1); }
  50%    { transform:translate(-50px,-60px) scale(1.06); }
}

.arc-aurora { position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
.arc-blob   { position:absolute; border-radius:50%; filter:blur(80px); will-change:transform; }
#arcCanvas  { position:fixed; inset:0; z-index:0; pointer-events:none; }

/* ── Scroll reveal ── */
.fade-up {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.78s cubic-bezier(.22,1,.36,1),
              transform 0.78s cubic-bezier(.22,1,.36,1);
}
.fade-up.in-view { opacity:1; transform:translateY(0); }
.d1{ transition-delay:0.05s !important; }
.d2{ transition-delay:0.14s !important; }
.d3{ transition-delay:0.23s !important; }
.d4{ transition-delay:0.32s !important; }
.d5{ transition-delay:0.41s !important; }

/* ── Animated gradient text ── */
@keyframes gradShift {
  0%  { background-position:0%   50%; }
  50% { background-position:100% 50%; }
  100%{ background-position:0%   50%; }
}
.grad-text {
  background: linear-gradient(135deg, #c084fc 0%, #818cf8 30%, #22d3ee 65%, #c084fc 100%);
  background-size: 260% 260%;
  animation: gradShift 5s ease infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── Badge dot pulse ── */
@keyframes pulseDot {
  0%,100%{ box-shadow:0 0 0 0 rgba(16,185,129,.7); }
  60%    { box-shadow:0 0 0 8px rgba(16,185,129,0); }
}
.badge-dot { animation:pulseDot 2s ease infinite !important; }

/* ── Nav scroll glass ── */
.nav.nav-scrolled {
  background: rgba(3,3,16,.97);
  box-shadow: 0 1px 0 rgba(139,92,246,.25), 0 8px 48px rgba(0,0,0,.55);
  border-bottom-color: rgba(139,92,246,.20);
}

/* ── Hero scan beam ── */
@keyframes scanBeam {
  0%     { transform:translateX(-120%); opacity:0; }
  8%,92% { opacity:1; }
  100%   { transform:translateX(260%);  opacity:0; }
}
.arc-scan-beam {
  position:absolute; top:0; left:0; width:35%; height:100%;
  background:linear-gradient(90deg,
    transparent,
    rgba(139,92,246,.06),
    rgba(34,211,238,.10),
    rgba(139,92,246,.06),
    transparent);
  pointer-events:none;
  animation:scanBeam 10s ease-in-out infinite;
  animation-delay:1.8s;
}

/* ── Floating symbols ── */
@keyframes floatSym {
  0%,100%{ transform:translateY(0) rotate(0deg);  }
  33%    { transform:translateY(-24px) rotate(7deg);  }
  66%    { transform:translateY(13px)  rotate(-5deg); }
}
.arc-float {
  position:absolute; pointer-events:none; user-select:none;
  font-size:2.4rem; opacity:0.11;
  animation:floatSym ease-in-out infinite;
  will-change:transform;
}

/* ── Card mouse-glow spotlight ── */
.card,.feat-card,.stat-card,.eco-card,.swap-card,
.launchpad-card,.launch-card,.chart-card,.earn-card,.pool-card {
  position:relative;
}
.card::after,.feat-card::after,.stat-card::after,.eco-card::after,
.swap-card::after,.launchpad-card::after,.launch-card::after,
.chart-card::after,.earn-card::after,.pool-card::after {
  content:'';
  position:absolute; inset:0; border-radius:inherit;
  background:radial-gradient(
    620px circle at var(--gx,50%) var(--gy,50%),
    rgba(139,92,246,.18), transparent 60%
  );
  opacity:0; transition:opacity .4s; pointer-events:none; z-index:0;
}
.card:hover::after,.feat-card:hover::after,.stat-card:hover::after,
.eco-card:hover::after,.swap-card:hover::after,.launchpad-card:hover::after,
.launch-card:hover::after,.chart-card:hover::after,
.earn-card:hover::after,.pool-card:hover::after { opacity:1; }
.card>*,.feat-card>*,.stat-card>*,.eco-card>*,
.swap-card>*,.launchpad-card>*,.launch-card>*,
.chart-card>*,.earn-card>*,.pool-card>* { position:relative; z-index:1; }

/* ── Button ripple ── */
@keyframes ripple { to{ transform:scale(4); opacity:0; } }
.btn { overflow:hidden; }
.btn .arc-ripple {
  position:absolute; border-radius:50%;
  background:rgba(255,255,255,.28);
  transform:scale(0);
  animation:ripple .55s linear;
  pointer-events:none;
}

/* ── Primary button shimmer ── */
@keyframes shimmer {
  from{ transform:translateX(-100%) skewX(-14deg); }
  to  { transform:translateX(220%)  skewX(-14deg); }
}
.btn-primary { position:relative; }
.btn-primary::before {
  content:'';
  position:absolute; top:0; left:0;
  width:55%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.20),transparent);
  animation:shimmer 3.8s ease infinite;
  animation-delay:1.2s;
  pointer-events:none;
}

/* ── Section label glow ── */
.section-label { box-shadow:0 0 22px rgba(139,92,246,.22); }

/* ── Ticker ── */
.tick-sym { color:var(--lavender) !important; font-weight:800 !important; }

/* ── Feat-card neon border ── */
.feat-card:hover {
  box-shadow:0 0 0 1px rgba(139,92,246,.48), 0 12px 48px rgba(124,58,237,.24);
}
.launch-card:hover {
  box-shadow:0 0 0 1px rgba(139,92,246,.42), 0 16px 56px rgba(124,58,237,.20);
}

/* ── Staking accent line ── */
.arc-accent-line {
  width:100%; height:2px;
  background:linear-gradient(90deg,#7c3aed,#22d3ee,#7c3aed);
  background-size:200% 100%;
  animation:gradShift 4s linear infinite;
  border-radius:2px; margin-bottom:20px;
}

/* ── Stat counter pop ── */
@keyframes statPop {
  0%  { transform:scale(0.82); opacity:0; }
  70% { transform:scale(1.04); }
  100%{ transform:scale(1);    opacity:1; }
}
[data-count].counted { animation:statPop 0.65s cubic-bezier(.22,1,.36,1) both; }

/* ── Mobile perf ── */
@media(max-width:600px){
  .arc-blob  { display:none; }
  .arc-float { display:none; }
  #arcCanvas { opacity:0.38; }
}
`;

const styleEl = document.createElement('style');
styleEl.textContent = BASE_CSS;
document.head.appendChild(styleEl);


/* ═══════════════════════════════════════════════════════════════════════════
   2.  AURORA BLOBS
═══════════════════════════════════════════════════════════════════════════ */
const BLOBS = [
  { w:950, h:850, top:'-22%', left:'44%',  anim:'arcBlob1 36s ease-in-out infinite',           color:'radial-gradient(ellipse,rgba(124,58,237,.92) 0%,transparent 70%)',  op:.22 },
  { w:720, h:720, top:'18%',  left:'-16%', anim:'arcBlob2 48s ease-in-out infinite',           color:'radial-gradient(ellipse,rgba(99,102,241,.88) 0%,transparent 70%)',  op:.18 },
  { w:620, h:620, top:'54%',  left:'64%',  anim:'arcBlob3 31s ease-in-out infinite',           color:'radial-gradient(ellipse,rgba(34,211,238,.82) 0%,transparent 70%)',  op:.15 },
  { w:460, h:460, top:'80%',  left:'24%',  anim:'arcBlob4 40s ease-in-out infinite alternate', color:'radial-gradient(ellipse,rgba(139,92,246,.82) 0%,transparent 70%)',  op:.14 },
  { w:390, h:390, top:'-6%',  left:'14%',  anim:'arcBlob2 55s ease-in-out infinite reverse',   color:'radial-gradient(ellipse,rgba(59,130,246,.78) 0%,transparent 70%)',  op:.13 },
];

const auroraDiv = document.createElement('div');
auroraDiv.className = 'arc-aurora';
BLOBS.forEach((b, i) => {
  const el = document.createElement('div');
  el.className = 'arc-blob';
  Object.assign(el.style, {
    width:b.w+'px', height:b.h+'px',
    top:b.top, left:b.left,
    background:b.color, opacity:b.op,
    animation:b.anim, animationDelay:-(i*7)+'s',
  });
  auroraDiv.appendChild(el);
});
document.body.appendChild(auroraDiv);


/* ═══════════════════════════════════════════════════════════════════════════
   3.  PARTICLE CONSTELLATION
═══════════════════════════════════════════════════════════════════════════ */
const canvas = document.createElement('canvas');
canvas.id = 'arcCanvas';
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');
let W, H, rafId;

const isMobile    = () => window.innerWidth < 768;
const N_PARTICLES = () => isMobile() ? 42 : 82;
const CONNECT_D   = () => isMobile() ? 112 : 142;

let particles = [], pulses = [];

const NODE_COLS = [
  'rgba(139,92,246,',
  'rgba(99,102,241,',
  'rgba(34,211,238,',
  'rgba(167,139,250,',
  'rgba(124,58,237,',
  'rgba(196,181,253,',
];

function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }

function makeParticle() {
  return {
    x:Math.random()*W, y:Math.random()*H,
    vx:(Math.random()-.5)*.35, vy:(Math.random()-.5)*.35,
    r:Math.random()*1.9+.6,
    col:NODE_COLS[Math.floor(Math.random()*NODE_COLS.length)],
    phase:Math.random()*Math.PI*2,
    freq:Math.random()*.02+.006,
  };
}
function resetParticles() { particles = Array.from({length:N_PARTICLES()}, makeParticle); }

function schedulePulse() {
  const cd = CONNECT_D();
  for (let t = 0; t < 22; t++) {
    const i = Math.floor(Math.random()*particles.length);
    const j = Math.floor(Math.random()*particles.length);
    if (i===j) continue;
    const p=particles[i], q=particles[j];
    if (Math.hypot(p.x-q.x, p.y-q.y) < cd) {
      pulses.push({from:i, to:j, t:0, speed:.013+Math.random()*.009});
      break;
    }
  }
  setTimeout(schedulePulse, 1500+Math.random()*2500);
}

function draw() {
  ctx.clearRect(0,0,W,H);
  const cd = CONNECT_D();
  for (const p of particles) {
    p.x+=p.vx; p.y+=p.vy;
    if (p.x<-40) p.x=W+40; if (p.x>W+40) p.x=-40;
    if (p.y<-40) p.y=H+40; if (p.y>H+40) p.y=-40;
    p.phase+=p.freq;
  }

  for (let i=0; i<particles.length; i++) {
    for (let j=i+1; j<particles.length; j++) {
      const a=particles[i], b=particles[j];
      const dist=Math.hypot(a.x-b.x, a.y-b.y);
      if (dist>cd) continue;
      const alpha=(1-dist/cd)*.33;
      const g=ctx.createLinearGradient(a.x,a.y,b.x,b.y);
      g.addColorStop(0,a.col+alpha+')'); g.addColorStop(1,b.col+alpha+')');
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
      ctx.strokeStyle=g; ctx.lineWidth=.72; ctx.stroke();
    }
  }

  for (let i=pulses.length-1; i>=0; i--) {
    const pu=pulses[i]; pu.t+=pu.speed;
    if (pu.t>=1){pulses.splice(i,1);continue;}
    const a=particles[pu.from], b=particles[pu.to];
    if(!a||!b){pulses.splice(i,1);continue;}
    const px=a.x+(b.x-a.x)*pu.t, py=a.y+(b.y-a.y)*pu.t;
    const fade=Math.sin(pu.t*Math.PI);
    const grd=ctx.createRadialGradient(px,py,0,px,py,13);
    grd.addColorStop(0,`rgba(34,211,238,${.92*fade})`);
    grd.addColorStop(.4,`rgba(139,92,246,${.52*fade})`);
    grd.addColorStop(1,'rgba(34,211,238,0)');
    ctx.beginPath(); ctx.arc(px,py,13,0,Math.PI*2);
    ctx.fillStyle=grd; ctx.fill();
  }

  for (const p of particles) {
    const alpha=.62+Math.sin(p.phase)*.34;
    const gR=p.r*(2.2+Math.sin(p.phase)*.8);
    const grd=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,gR*4);
    grd.addColorStop(0,p.col+(alpha*.55)+')'); grd.addColorStop(1,p.col+'0)');
    ctx.beginPath(); ctx.arc(p.x,p.y,gR*4,0,Math.PI*2);
    ctx.fillStyle=grd; ctx.fill();
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle=p.col+alpha+')'; ctx.fill();
  }

  rafId=requestAnimationFrame(draw);
}

window.addEventListener('resize',()=>{resize();resetParticles();},{passive:true});
document.addEventListener('visibilitychange',()=>{ if(document.hidden) cancelAnimationFrame(rafId); else draw(); });
resize(); resetParticles(); draw();
setTimeout(schedulePulse,1000);


/* ═══════════════════════════════════════════════════════════════════════════
   4.  NUMBER COUNTER
═══════════════════════════════════════════════════════════════════════════ */
function _countUp(el) {
  if (!el || el._counted) return;
  el._counted = true;
  el.classList.add('counted');
  const target   = parseFloat(el.dataset.count);
  const prefix   = el.dataset.prefix || '';
  const suffix   = el.dataset.suffix !== undefined ? el.dataset.suffix : '';
  const isInt    = Number.isInteger(target);
  const dur      = 1800;
  const t0       = performance.now();

  function tick(now) {
    const p    = Math.min((now-t0)/dur, 1);
    const ease = 1-Math.pow(1-p, 3);
    const val  = target*ease;
    el.textContent = prefix+(isInt ? Math.round(val).toLocaleString() : val.toFixed(1))+suffix;
    if (p<1) requestAnimationFrame(tick);
    else el.textContent = prefix+(isInt ? target.toLocaleString() : target.toFixed(1))+suffix;
  }
  requestAnimationFrame(tick);
}


/* ═══════════════════════════════════════════════════════════════════════════
   5.  SCROLL REVEAL  (IntersectionObserver)
═══════════════════════════════════════════════════════════════════════════ */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in-view');
    revealObs.unobserve(e.target);
    e.target.querySelectorAll('[data-count]').forEach(_countUp);
    if (e.target.dataset.count) _countUp(e.target);
  });
}, {threshold:.1, rootMargin:'0px 0px -36px 0px'});

const countObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    _countUp(e.target);
    countObs.unobserve(e.target);
  });
}, {threshold:.3});

function observeAll() {
  document.querySelectorAll('.fade-up').forEach(el => revealObs.observe(el));
  document.querySelectorAll('[data-count]').forEach(el => countObs.observe(el));
}


/* ═══════════════════════════════════════════════════════════════════════════
   6.  DOM-READY HOOKS
═══════════════════════════════════════════════════════════════════════════ */
function onReady() {
  observeAll();

  /* Immediately reveal hero elements */
  setTimeout(() => {
    document.querySelectorAll(
      '.hero .fade-up, .hero-badge, .hero-title, .hero-desc, .hero-cta, .hero-stats'
    ).forEach(el => {
      el.classList.add('in-view');
      if (el.dataset.count) _countUp(el);
      el.querySelectorAll('[data-count]').forEach(_countUp);
    });
  }, 55);

  /* Hero scan beam + floating symbols */
  const hero = document.querySelector('.hero');
  if (hero) {
    const beam = document.createElement('div');
    beam.className = 'arc-scan-beam';
    hero.appendChild(beam);

    const SYMS = ['◈','⬡','◎','⬢','◇','⬟','⬠','△'];
    [
      {top:'13%', right:'7%',  dur:'7.2s', delay:'0s'  },
      {top:'54%', right:'11%', dur:'9.4s', delay:'2.6s'},
      {top:'31%', right:'3%',  dur:'6.3s', delay:'4.9s'},
      {top:'72%', right:'21%', dur:'11s',  delay:'1.1s'},
      {top:'20%', right:'26%', dur:'8.1s', delay:'3.5s'},
    ].forEach((pos, i) => {
      const el = document.createElement('div');
      el.className = 'arc-float';
      el.textContent = SYMS[i%SYMS.length];
      Object.assign(el.style, {top:pos.top,right:pos.right,animationDuration:pos.dur,animationDelay:pos.delay});
      hero.appendChild(el);
    });
  }

  /* Nav glass on scroll */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('nav-scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }

  /* Mouse-following card glow */
  document.addEventListener('mousemove', e => {
    document.querySelectorAll(
      '.card,.feat-card,.stat-card,.eco-card,.swap-card,.launchpad-card,.launch-card,.chart-card,.earn-card,.pool-card'
    ).forEach(card => {
      const r = card.getBoundingClientRect();
      if (e.clientX < r.left-220 || e.clientX > r.right+220) return;
      card.style.setProperty('--gx', ((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
      card.style.setProperty('--gy', ((e.clientY-r.top)/r.height*100).toFixed(1)+'%');
    });
  }, {passive:true});

  /* 3D card tilt (only on non-overflow:hidden cards) */
  document.querySelectorAll('.feat-card,.stat-card,.earn-card,.eco-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX-r.left)/r.width  - .5;
      const y = (e.clientY-r.top) /r.height - .5;
      card.style.transform = `perspective(650px) rotateX(${-y*6}deg) rotateY(${x*6}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  /* Ripple on primary buttons */
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('click', e => {
      const r=btn.getBoundingClientRect();
      const rip=document.createElement('span');
      rip.className='arc-ripple';
      const sz=Math.max(r.width,r.height);
      Object.assign(rip.style,{
        width:sz+'px',height:sz+'px',
        left:(e.clientX-r.left-sz/2)+'px',
        top:(e.clientY-r.top-sz/2)+'px',
      });
      btn.appendChild(rip);
      setTimeout(()=>rip.remove(),620);
    });
  });

  /* Accent lines */
  document.querySelectorAll('.arc-accent-line-target').forEach(el => {
    el.insertAdjacentHTML('afterbegin','<div class="arc-accent-line"></div>');
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
else onReady();

})();
