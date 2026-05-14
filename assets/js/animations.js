/* ── Arc Nova — Visual Animation Engine ─────────────────────────────────── */
/* Particle constellation · Aurora orbs · Card glow · Scroll reveals        */
(function () {
'use strict';

/* ════════════════════════════════════════════════════════════════════════
   1.  INJECT BASE CSS
════════════════════════════════════════════════════════════════════════ */
const BASE_CSS = `
/* ── Aurora blob keyframes ── */
@keyframes arcBlob1 {
  0%,100% { transform: translate(0,0)    scale(1);    }
  30%     { transform: translate(60px,-40px) scale(1.08); }
  70%     { transform: translate(-30px,50px) scale(0.95); }
}
@keyframes arcBlob2 {
  0%,100% { transform: translate(0,0)    scale(1);    }
  40%     { transform: translate(-50px,30px) scale(1.06); }
  80%     { transform: translate(40px,-60px) scale(0.97); }
}
@keyframes arcBlob3 {
  0%,100% { transform: translate(0,0)    scale(1);    }
  25%     { transform: translate(40px,60px) scale(1.10); }
  60%     { transform: translate(-60px,-30px) scale(0.94); }
}
@keyframes arcBlob4 {
  0%,100% { transform: translate(0,0)    scale(1);    }
  50%     { transform: translate(-40px,-50px) scale(1.05); }
}

/* ── Aurora container ── */
.arc-aurora {
  position: fixed; inset: 0;
  z-index: 0; pointer-events: none;
  overflow: hidden;
}
.arc-blob {
  position: absolute; border-radius: 50%;
  filter: blur(90px);
  will-change: transform;
}

/* ── Particle canvas ── */
#arcCanvas {
  position: fixed; inset: 0;
  z-index: 0; pointer-events: none;
}

/* ── Scroll reveal ── */
.fade-up {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.7s cubic-bezier(.22,1,.36,1),
              transform 0.7s cubic-bezier(.22,1,.36,1);
}
.fade-up.in-view { opacity: 1; transform: translateY(0); }
.d1 { transition-delay: 0.05s !important; }
.d2 { transition-delay: 0.13s !important; }
.d3 { transition-delay: 0.21s !important; }
.d4 { transition-delay: 0.29s !important; }
.d5 { transition-delay: 0.37s !important; }

/* ── Animated gradient text ── */
@keyframes gradShift {
  0%   { background-position: 0%   50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0%   50%; }
}
.grad-text {
  background: linear-gradient(135deg,#a78bfa 0%,#818cf8 25%,#22d3ee 55%,#a78bfa 100%);
  background-size: 250% 250%;
  animation: gradShift 6s ease infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── Badge dot pulse ── */
@keyframes pulseDot {
  0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,.55); }
  60%     { box-shadow: 0 0 0 6px rgba(16,185,129,0);  }
}
.badge-dot { animation: pulseDot 2.2s ease infinite; }

/* ── Nav scroll glass ── */
.nav.nav-scrolled {
  background: rgba(4,4,14,.94);
  box-shadow: 0 1px 0 rgba(139,92,246,.18), 0 8px 40px rgba(0,0,0,.45);
}

/* ── Hero scan beam ── */
@keyframes scanBeam {
  0%        { transform: translateX(-120%); opacity:0; }
  5%,95%    { opacity: 1; }
  100%      { transform: translateX(220%);  opacity:0; }
}
.arc-scan-beam {
  position: absolute; top:0; left:0; width:38%; height:100%;
  background: linear-gradient(90deg,
    transparent,
    rgba(139,92,246,.035),
    rgba(34,211,238,.055),
    rgba(139,92,246,.035),
    transparent);
  pointer-events: none;
  animation: scanBeam 9s ease-in-out infinite;
  animation-delay: 1.5s;
}

/* ── Floating symbols ── */
@keyframes floatSym {
  0%,100% { transform: translateY(0)    rotate(0deg);  }
  33%     { transform: translateY(-20px) rotate(6deg);  }
  66%     { transform: translateY(10px)  rotate(-4deg); }
}
.arc-float {
  position: absolute; pointer-events: none;
  user-select: none; font-size: 2rem;
  opacity: 0.065;
  animation: floatSym ease-in-out infinite;
  will-change: transform;
}

/* ── Card mouse-glow ── */
.card,
.feat-card,
.stat-card,
.eco-card,
.swap-card,
.launchpad-card {
  position: relative;
}
.card::after,
.feat-card::after,
.stat-card::after,
.eco-card::after,
.swap-card::after,
.launchpad-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    500px circle at var(--gx,50%) var(--gy,50%),
    rgba(139,92,246,.13),
    transparent 60%
  );
  opacity: 0;
  transition: opacity .35s;
  pointer-events: none;
  z-index: 0;
}
.card:hover::after,
.feat-card:hover::after,
.stat-card:hover::after,
.eco-card:hover::after,
.swap-card:hover::after,
.launchpad-card:hover::after { opacity: 1; }

/* ensure children stay above glow */
.card > *,
.feat-card > *,
.stat-card > *,
.eco-card > *,
.swap-card > *,
.launchpad-card > * { position: relative; z-index: 1; }

/* ── Btn ripple ── */
@keyframes ripple {
  to { transform: scale(3.5); opacity: 0; }
}
.btn { overflow: hidden; }
.btn .arc-ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,.22);
  transform: scale(0);
  animation: ripple .5s linear;
  pointer-events: none;
}

/* ── Section label glow ── */
.section-label {
  box-shadow: 0 0 18px rgba(139,92,246,.18);
}

/* ── Ticker ── */
.tick-sym { color: var(--lavender) !important; font-weight: 800 !important; }

/* ── Neon border on hover (feat-card) ── */
.feat-card:hover {
  box-shadow: 0 0 0 1px rgba(139,92,246,.4), 0 8px 40px rgba(124,58,237,.18);
}

/* ── Staking card accent line ── */
.arc-accent-line {
  width: 100%; height: 2px;
  background: linear-gradient(90deg, #7c3aed, #22d3ee, #7c3aed);
  background-size: 200% 100%;
  animation: gradShift 4s linear infinite;
  border-radius: 2px;
  margin-bottom: 20px;
}
`;

const styleEl = document.createElement('style');
styleEl.textContent = BASE_CSS;
document.head.appendChild(styleEl);


/* ════════════════════════════════════════════════════════════════════════
   2.  AURORA BLOBS  (5 large, slowly drifting gradient orbs)
════════════════════════════════════════════════════════════════════════ */
const BLOBS = [
  { w:800, h:700, top:'-18%', left:'48%',  anim:'arcBlob1 34s ease-in-out infinite',          color:'radial-gradient(ellipse,rgba(124,58,237,.85) 0%,transparent 68%)',  op:.16 },
  { w:650, h:650, top:'22%',  left:'-12%', anim:'arcBlob2 44s ease-in-out infinite',          color:'radial-gradient(ellipse,rgba(99,102,241,.8) 0%,transparent 68%)',   op:.13 },
  { w:550, h:550, top:'58%',  left:'68%',  anim:'arcBlob3 29s ease-in-out infinite',          color:'radial-gradient(ellipse,rgba(34,211,238,.7) 0%,transparent 68%)',   op:.11 },
  { w:420, h:420, top:'82%',  left:'28%',  anim:'arcBlob4 38s ease-in-out infinite alternate',color:'radial-gradient(ellipse,rgba(139,92,246,.75) 0%,transparent 68%)',  op:.10 },
  { w:360, h:360, top:'-6%',  left:'18%',  anim:'arcBlob2 51s ease-in-out infinite reverse',  color:'radial-gradient(ellipse,rgba(59,130,246,.7) 0%,transparent 68%)',   op:.09 },
];

const auroraDiv = document.createElement('div');
auroraDiv.className = 'arc-aurora';

BLOBS.forEach((b, i) => {
  const el = document.createElement('div');
  el.className = 'arc-blob';
  Object.assign(el.style, {
    width: b.w + 'px', height: b.h + 'px',
    top: b.top, left: b.left,
    background: b.color,
    opacity: b.op,
    animation: b.anim,
    animationDelay: -(i * 7) + 's',
  });
  auroraDiv.appendChild(el);
});
document.body.appendChild(auroraDiv);


/* ════════════════════════════════════════════════════════════════════════
   3.  PARTICLE CONSTELLATION  (canvas — nodes + edges + data pulses)
════════════════════════════════════════════════════════════════════════ */
const canvas = document.createElement('canvas');
canvas.id = 'arcCanvas';
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');
let W, H, rafId;

const isMobile = () => window.innerWidth < 768;
const PARTICLE_N  = () => isMobile() ? 38 : 72;
const CONNECT_D   = () => isMobile() ? 100 : 135;

let particles = [];
let pulses    = [];   // data-flow pulses

const NODE_COLS = [
  'rgba(139,92,246,',   // violet
  'rgba(99,102,241,',   // indigo
  'rgba(34,211,238,',   // cyan
  'rgba(167,139,250,',  // lavender
  'rgba(124,58,237,',   // purple
];

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

function makeParticle() {
  return {
    x:  Math.random() * W,
    y:  Math.random() * H,
    vx: (Math.random() - .5) * .3,
    vy: (Math.random() - .5) * .3,
    r:  Math.random() * 1.6 + .7,
    col: NODE_COLS[Math.floor(Math.random() * NODE_COLS.length)],
    phase: Math.random() * Math.PI * 2,
    freq:  Math.random() * .018 + .006,
  };
}

function resetParticles() {
  particles = Array.from({ length: PARTICLE_N() }, makeParticle);
}

/* schedule a data-flow pulse */
function schedulePulse() {
  const cd = CONNECT_D();
  for (let attempt = 0; attempt < 15; attempt++) {
    const i = Math.floor(Math.random() * particles.length);
    const j = Math.floor(Math.random() * particles.length);
    if (i === j) continue;
    const p = particles[i], q = particles[j];
    const dx = p.x - q.x, dy = p.y - q.y;
    if (Math.sqrt(dx*dx + dy*dy) < cd) {
      pulses.push({ from: i, to: j, t: 0, speed: .012 + Math.random() * .008 });
      break;
    }
  }
  setTimeout(schedulePulse, 1800 + Math.random() * 2800);
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  const cd = CONNECT_D();

  /* update particles */
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < -30) p.x = W + 30;
    if (p.x > W + 30) p.x = -30;
    if (p.y < -30) p.y = H + 30;
    if (p.y > H + 30) p.y = -30;
    p.phase += p.freq;
  }

  /* draw edges */
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i], b = particles[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const dist = Math.hypot(dx, dy);
      if (dist > cd) continue;
      const alpha = (1 - dist / cd) * .28;
      const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      g.addColorStop(0, a.col + alpha + ')');
      g.addColorStop(1, b.col + alpha + ')');
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = g;
      ctx.lineWidth = .65;
      ctx.stroke();
    }
  }

  /* draw data-flow pulses */
  for (let i = pulses.length - 1; i >= 0; i--) {
    const pu = pulses[i];
    pu.t += pu.speed;
    if (pu.t >= 1) { pulses.splice(i, 1); continue; }
    const a = particles[pu.from], b = particles[pu.to];
    if (!a || !b) { pulses.splice(i, 1); continue; }
    const px = a.x + (b.x - a.x) * pu.t;
    const py = a.y + (b.y - a.y) * pu.t;
    const fadeEdge = Math.sin(pu.t * Math.PI); // fade in+out
    const grd = ctx.createRadialGradient(px, py, 0, px, py, 10);
    grd.addColorStop(0, `rgba(34,211,238,${.85 * fadeEdge})`);
    grd.addColorStop(.4, `rgba(139,92,246,${.45 * fadeEdge})`);
    grd.addColorStop(1, 'rgba(34,211,238,0)');
    ctx.beginPath();
    ctx.arc(px, py, 10, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
  }

  /* draw nodes */
  for (const p of particles) {
    const alpha = .55 + Math.sin(p.phase) * .35;
    const glowR = p.r * (2 + Math.sin(p.phase) * .9);

    const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR * 4);
    grd.addColorStop(0, p.col + alpha * .55 + ')');
    grd.addColorStop(1, p.col + '0)');
    ctx.beginPath();
    ctx.arc(p.x, p.y, glowR * 4, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.col + alpha + ')';
    ctx.fill();
  }

  rafId = requestAnimationFrame(draw);
}

window.addEventListener('resize', () => { resize(); resetParticles(); }, { passive: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) cancelAnimationFrame(rafId);
  else draw();
});

resize();
resetParticles();
draw();
setTimeout(schedulePulse, 1200);


/* ════════════════════════════════════════════════════════════════════════
   4.  SCROLL REVEAL  (IntersectionObserver)
════════════════════════════════════════════════════════════════════════ */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in-view');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: .1, rootMargin: '0px 0px -40px 0px' });

function observeFadeUps() {
  document.querySelectorAll('.fade-up').forEach(el => revealObs.observe(el));
}


/* ════════════════════════════════════════════════════════════════════════
   5.  DOM-READY HOOKS
════════════════════════════════════════════════════════════════════════ */
function onReady() {

  /* Scroll reveals */
  observeFadeUps();

  /* Immediately reveal hero elements */
  setTimeout(() => {
    document.querySelectorAll('.hero .fade-up, .hero-badge, .hero-title, .hero-desc, .hero-cta').forEach(el => {
      el.classList.add('in-view');
    });
  }, 80);

  /* Hero scan beam + floating symbols */
  const hero = document.querySelector('.hero');
  if (hero) {
    const beam = document.createElement('div');
    beam.className = 'arc-scan-beam';
    hero.appendChild(beam);

    const SYMS = ['◈','⬡','◎','⬢','◇','⬟','⬠'];
    const FP   = [
      { top:'14%', right:'7%',  dur:'7.5s',  delay:'0s'   },
      { top:'55%', right:'11%', dur:'9.5s',  delay:'2.8s' },
      { top:'32%', right:'3%',  dur:'6.2s',  delay:'5.1s' },
      { top:'73%', right:'22%', dur:'11s',   delay:'1.3s' },
      { top:'20%', right:'27%', dur:'8.3s',  delay:'3.7s' },
    ];
    FP.forEach((pos, i) => {
      const el = document.createElement('div');
      el.className = 'arc-float';
      el.textContent = SYMS[i % SYMS.length];
      Object.assign(el.style, {
        top: pos.top, right: pos.right,
        animationDuration: pos.dur,
        animationDelay: pos.delay,
      });
      hero.appendChild(el);
    });
  }

  /* Nav glass on scroll */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('nav-scrolled', window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Mouse-following card glow */
  document.addEventListener('mousemove', e => {
    document.querySelectorAll('.card,.feat-card,.stat-card,.eco-card,.swap-card,.launchpad-card').forEach(card => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width  * 100).toFixed(1);
      const y = ((e.clientY - r.top)  / r.height * 100).toFixed(1);
      card.style.setProperty('--gx', x + '%');
      card.style.setProperty('--gy', y + '%');
    });
  }, { passive: true });

  /* Ripple on primary buttons */
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('click', e => {
      const r   = btn.getBoundingClientRect();
      const rip = document.createElement('span');
      rip.className = 'arc-ripple';
      const size = Math.max(r.width, r.height);
      Object.assign(rip.style, {
        width: size + 'px', height: size + 'px',
        left: (e.clientX - r.left - size / 2) + 'px',
        top:  (e.clientY - r.top  - size / 2) + 'px',
      });
      btn.appendChild(rip);
      setTimeout(() => rip.remove(), 600);
    });
  });

  /* Accent line at top of first card on defi/staking pages */
  document.querySelectorAll('.arc-accent-line-target').forEach(el => {
    el.insertAdjacentHTML('afterbegin', '<div class="arc-accent-line"></div>');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onReady);
} else {
  onReady();
}

})();
