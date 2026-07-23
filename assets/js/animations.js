/* ── Arc Nova — Visual Engine v3 ─────────────────────────────────────────── */
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

/* gradShift keyframe and .grad-text are defined in styles.css */

/* ── Badge dot pulse ── */
@keyframes pulseDot {
  0%,100%{ box-shadow:0 0 0 0 rgba(16,185,129,.7); }
  60%    { box-shadow:0 0 0 8px rgba(16,185,129,0); }
}
.badge-dot { animation:pulseDot 2s ease infinite !important; }

/* ── Nav scroll glass ── */
.nav.nav-scrolled {
  background: rgba(13,14,15,.97);
  box-shadow: 0 1px 0 rgba(139,92,246,.18), 0 4px 24px rgba(0,0,0,.45);
  border-bottom-color: rgba(139,92,246,.16);
}

/* ── Card mouse-glow spotlight ── */
.card,.feat-card,.stat-card,.eco-card,.swap-card,
.launchpad-card,.launch-card,.chart-card,.earn-card,.pool-card,.glass-panel {
  position:relative;
}
.card::after,.feat-card::after,.stat-card::after,.eco-card::after,
.swap-card::after,.launchpad-card::after,.launch-card::after,
.chart-card::after,.earn-card::after,.pool-card::after,.glass-panel::after {
  content:'';
  position:absolute; inset:0; border-radius:inherit;
  background:radial-gradient(
    580px circle at var(--gx,50%) var(--gy,50%),
    rgba(139,92,246,.14), transparent 60%
  );
  opacity:0; transition:opacity .35s; pointer-events:none; z-index:0;
}
.card:hover::after,.feat-card:hover::after,.stat-card:hover::after,
.eco-card:hover::after,.swap-card:hover::after,.launchpad-card:hover::after,
.launch-card:hover::after,.chart-card:hover::after,
.earn-card:hover::after,.pool-card:hover::after,.glass-panel:hover::after { opacity:1; }
.card>*,.feat-card>*,.stat-card>*,.eco-card>*,
.swap-card>*,.launchpad-card>*,.launch-card>*,
.chart-card>*,.earn-card>*,.pool-card>*,.glass-panel>* { position:relative; z-index:1; }

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
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);
  animation:shimmer 3.8s ease infinite;
  animation-delay:1.2s;
  pointer-events:none;
}

/* ── Section label glow ── */
.section-label { box-shadow:0 0 22px rgba(139,92,246,.22); }

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
  .arc-blob { display:none; }
}
`;

const styleEl = document.createElement('style');
styleEl.textContent = BASE_CSS;
document.head.appendChild(styleEl);


/* ═══════════════════════════════════════════════════════════════════════════
   2.  AURORA BLOBS
═══════════════════════════════════════════════════════════════════════════ */
const BLOBS = [
  { w:950, h:850, top:'-22%', left:'44%',  anim:'arcBlob1 36s ease-in-out infinite',           color:'radial-gradient(ellipse,rgba(124,58,237,.92) 0%,transparent 70%)',  op:.09 },
  { w:720, h:720, top:'18%',  left:'-16%', anim:'arcBlob2 48s ease-in-out infinite',           color:'radial-gradient(ellipse,rgba(99,102,241,.88) 0%,transparent 70%)',  op:.07 },
  { w:620, h:620, top:'54%',  left:'64%',  anim:'arcBlob3 31s ease-in-out infinite',           color:'radial-gradient(ellipse,rgba(34,211,238,.82) 0%,transparent 70%)',  op:.05 },
  { w:460, h:460, top:'80%',  left:'24%',  anim:'arcBlob4 40s ease-in-out infinite alternate', color:'radial-gradient(ellipse,rgba(139,92,246,.82) 0%,transparent 70%)',  op:.05 },
  { w:390, h:390, top:'-6%',  left:'14%',  anim:'arcBlob2 55s ease-in-out infinite reverse',   color:'radial-gradient(ellipse,rgba(59,130,246,.78) 0%,transparent 70%)',  op:.04 },
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
   3.  NUMBER COUNTER
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
   4.  SCROLL REVEAL  (IntersectionObserver)
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
   5.  DOM-READY HOOKS
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

  /* Nav glass on scroll */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('nav-scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }

  /* Mouse-following card glow (throttled to rAF to avoid per-pixel repaints) */
  let _rafPending = false;
  let _lastMx = 0, _lastMy = 0;
  document.addEventListener('mousemove', e => {
    _lastMx = e.clientX; _lastMy = e.clientY;
    if (_rafPending) return;
    _rafPending = true;
    requestAnimationFrame(() => {
      _rafPending = false;
      document.querySelectorAll(
        '.card,.feat-card,.stat-card,.eco-card,.swap-card,.launchpad-card,.launch-card,.chart-card,.earn-card,.pool-card,.glass-panel'
      ).forEach(card => {
        const r = card.getBoundingClientRect();
        if (_lastMx < r.left-220 || _lastMx > r.right+220) return;
        card.style.setProperty('--gx', ((_lastMx-r.left)/r.width*100).toFixed(1)+'%');
        card.style.setProperty('--gy', ((_lastMy-r.top)/r.height*100).toFixed(1)+'%');
      });
    });
  }, {passive:true});

  /* 3D card tilt */
  document.querySelectorAll('.feat-card,.stat-card,.earn-card,.eco-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX-r.left)/r.width  - .5;
      const y = (e.clientY-r.top) /r.height - .5;
      card.style.transform = `perspective(700px) rotateX(${-y*4}deg) rotateY(${x*4}deg) translateY(-3px)`;
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

  /* Web3 Cursor Spark Trail */
  (function initSparkTrail() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const colors = ['#a78bfa', '#c084fc', '#818cf8', '#22d3ee'];
    let lastActive = Date.now();
    const style = document.createElement('style');
    style.textContent = `
      .arc-spark {
        position: fixed;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 999999;
        transform: translate(-50%, -50%);
        transition: transform 0.6s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 0.6s ease-out;
        opacity: 0.8;
      }
    `;
    document.head.appendChild(style);
    let lastX = 0, lastY = 0;
    const distThreshold = 12;
    document.addEventListener('mousemove', e => {
      const now = Date.now();
      if (now - lastActive < 30) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.sqrt(dx*dx + dy*dy) < distThreshold) return;
      lastActive = now; lastX = e.clientX; lastY = e.clientY;
      createSpark(e.clientX, e.clientY);
    }, {passive:true});

    function createSpark(x, y) {
      const spark = document.createElement('div');
      spark.className = 'arc-spark';
      const col = colors[Math.floor(Math.random() * colors.length)];
      const sz = Math.random() * 4 + 4;
      spark.style.width = sz + 'px';
      spark.style.height = sz + 'px';
      spark.style.background = `radial-gradient(circle, ${col} 0%, transparent 80%)`;
      spark.style.boxShadow = `0 0 8px ${col}`;
      spark.style.left = x + 'px';
      spark.style.top = y + 'px';
      document.body.appendChild(spark);
      const angle = Math.random() * Math.PI * 2;
      const travel = Math.random() * 24 + 8;
      requestAnimationFrame(() => {
        spark.style.transform = `translate(calc(-50% + ${Math.cos(angle)*travel}px), calc(-50% + ${Math.sin(angle)*travel}px)) scale(0.1)`;
        spark.style.opacity = '0';
      });
      setTimeout(() => spark.remove(), 600);
    }
  })();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
else onReady();

})();
