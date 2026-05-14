/* Arc Nova — Shared UI helpers */
/* NOTE: walletConnected / activeAccount / activeSigner live in wallet.js  */

/* ── TOAST ── */
function showToast(msg, type = 'info') {
  const existing = document.querySelector('.arc-toast');
  if (existing) existing.remove();

  const colors = { success:'#10b981', error:'#ef4444', info:'#8b5cf6' };
  const toast = document.createElement('div');
  toast.className = 'arc-toast';
  toast.textContent = msg;
  Object.assign(toast.style, {
    position:'fixed', bottom:'24px', right:'24px', zIndex:'9999',
    padding:'12px 20px', borderRadius:'10px',
    background:'rgba(14,14,36,0.95)', backdropFilter:'blur(12px)',
    border:`1px solid ${colors[type]}44`,
    color: colors[type], fontSize:'0.875rem', fontWeight:'600',
    boxShadow:`0 0 24px ${colors[type]}22`,
    animation:'fadeUp 0.3s ease both',
    fontFamily:'Inter,sans-serif',
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

/* ── COUNTER ANIMATION ── */
function animateCount(el, target, prefix = '', suffix = '', duration = 1400) {
  const start    = performance.now();
  const isFloat  = String(target).includes('.');
  const decimals = isFloat ? String(target).split('.')[1].length : 0;

  function update(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3);
    const value    = target * ease;
    el.textContent = prefix + (isFloat ? value.toFixed(decimals) : Math.floor(value).toLocaleString()) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

/* ── MOBILE NAV ── */
function toggleMobileNav() {
  const nav     = document.getElementById('mobileNav');
  const overlay = document.getElementById('mobileOverlay');
  const btn     = document.getElementById('hamburgerBtn');
  if (!nav) return;
  const isOpen = nav.classList.toggle('open');
  overlay?.classList.toggle('show', isOpen);
  btn?.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

/* ── TOKENS (for token selector modal) ── */
const TOKENS = [
  { sym:'NOVA', name:'Arc Nova Token', color:'#a78bfa', bg:'rgba(124,58,237,0.25)', init:'N' },
  { sym:'USDC', name:'USD Coin',       color:'#10b981', bg:'rgba(16,185,129,0.2)',  init:'U' },
  { sym:'ARC',  name:'Arc Network',   color:'#818cf8', bg:'rgba(129,140,248,0.2)', init:'A' },
  { sym:'USDT', name:'Tether',         color:'#10b981', bg:'rgba(16,185,129,0.15)', init:'T' },
];

let _tokenSide = 'from';

function openTokenModal(side) {
  _tokenSide = side;
  const modal = document.getElementById('tokenModal');
  if (!modal) { showToast('Token selector coming soon', 'info'); return; }
  modal.classList.add('open');
  const search = document.getElementById('tokenSearch');
  if (search) { search.value = ''; search.focus(); renderTokenList(''); }
}

function closeTokenModal() {
  document.getElementById('tokenModal')?.classList.remove('open');
}

function renderTokenList(q) {
  const list = document.getElementById('tokenList');
  if (!list) return;
  const filtered = TOKENS.filter(t =>
    t.sym.toLowerCase().includes(q.toLowerCase()) ||
    t.name.toLowerCase().includes(q.toLowerCase())
  );
  list.innerHTML = filtered.map(t => `
    <div class="token-item" onclick="selectToken('${t.sym}','${t.color}','${t.bg}','${t.init}')">
      <div class="token-item-left">
        <div style="width:36px;height:36px;border-radius:50%;background:${t.bg};color:${t.color};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px">${t.init}</div>
        <div>
          <div style="font-weight:700;color:var(--text);font-size:0.9rem">${t.sym}</div>
          <div style="font-size:0.75rem;color:var(--muted)">${t.name}</div>
        </div>
      </div>
      <div style="text-align:right;font-size:0.8rem;color:var(--muted)">—</div>
    </div>
  `).join('');
}

function selectToken(sym, color, bg, init) {
  const btn = document.getElementById(_tokenSide + 'Token');
  if (btn) {
    btn.dataset.symbol = sym;
    btn.innerHTML = `<div style="width:22px;height:22px;border-radius:50%;background:${bg};color:${color};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:11px">${init}</div>${sym} ▾`;
    /* sync defi page state variables if present */
    if (_tokenSide === 'from' && typeof fromSym !== 'undefined') fromSym = sym;
    if (_tokenSide === 'to'   && typeof toSym   !== 'undefined') toSym   = sym;
  }
  closeTokenModal();
  if (typeof calcSwap === 'function') calcSwap();
}

/* ── CONFIRM MODAL ── */
function showConfirmModal(title, rows, onConfirm) {
  const modal = document.getElementById('confirmModal');
  if (!modal) { onConfirm(); return; }
  document.getElementById('confirmTitle').textContent = title;
  const body = document.getElementById('confirmDetails');
  body.innerHTML = rows.map(([label, val, col]) =>
    `<div class="confirm-row">
      <span style="color:var(--muted)">${label}</span>
      <span style="font-weight:700;color:${col||'var(--text)'}">${val}</span>
    </div>`
  ).join('');
  modal.classList.add('open');
  document.getElementById('confirmBtn').onclick = () => {
    modal.classList.remove('open');
    onConfirm();
  };
}

function closeConfirmModal() {
  document.getElementById('confirmModal')?.classList.remove('open');
}

/* ── COUNTDOWN ── */
function startCountdown(targetMs, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  function tick() {
    const diff = targetMs - Date.now();
    if (diff <= 0) {
      el.innerHTML = '<span style="color:var(--green);font-weight:700">Live Now!</span>';
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000)  / 60000);
    const s = Math.floor((diff % 60000)    / 1000);
    el.innerHTML = `<div class="countdown">
      <div class="cd-block"><span class="cd-num">${String(d).padStart(2,'0')}</span><span class="cd-lbl">Days</span></div>
      <span class="cd-sep">:</span>
      <div class="cd-block"><span class="cd-num">${String(h).padStart(2,'0')}</span><span class="cd-lbl">Hrs</span></div>
      <span class="cd-sep">:</span>
      <div class="cd-block"><span class="cd-num">${String(m).padStart(2,'0')}</span><span class="cd-lbl">Min</span></div>
      <span class="cd-sep">:</span>
      <div class="cd-block"><span class="cd-num">${String(s).padStart(2,'0')}</span><span class="cd-lbl">Sec</span></div>
    </div>`;
  }
  tick();
  setInterval(tick, 1000);
}

/* ── NOTIFICATIONS ── */
const _notifs = [
  { text:'ArcVault raise is 97% full — act fast!',  time:'2m ago',  color:'var(--red)' },
  { text:'NovaLend whitelist is now open',           time:'14m ago', color:'var(--lavender)' },
  { text:'Your NOVA stake is earning 12% APY',       time:'1h ago',  color:'var(--green)' },
];

function toggleNotifPanel() {
  document.getElementById('notifPanel')?.classList.toggle('show');
}

function renderNotifications() {
  const panel = document.getElementById('notifPanel');
  if (!panel) return;
  panel.innerHTML = `
    <div class="notif-panel-header">
      <span>Notifications</span>
      <span style="color:var(--red);font-size:0.72rem;font-weight:700">${_notifs.length} new</span>
    </div>
    ${_notifs.map(n => `
      <div class="notif-item" style="display:flex;gap:10px;align-items:flex-start">
        <div class="notif-dot" style="background:${n.color};margin-top:6px"></div>
        <div>
          <div style="font-weight:600;color:var(--text);font-size:0.83rem;margin-bottom:2px">${n.text}</div>
          <div style="color:var(--muted);font-size:0.74rem">${n.time}</div>
        </div>
      </div>
    `).join('')}
    <div style="padding:10px 16px;text-align:center;border-top:1px solid var(--border)">
      <a href="#" style="font-size:0.78rem;color:var(--lavender);font-weight:700;text-decoration:none">Mark all read</a>
    </div>`;
}

/* ── CHART HELPERS ── */
function createSparkline(canvas, data, color) {
  if (!canvas || typeof Chart === 'undefined') return;
  new Chart(canvas, {
    type: 'line',
    data: {
      labels: data.map((_,i) => i),
      datasets: [{ data, borderColor: color, borderWidth: 2, fill: true,
        backgroundColor: color.replace(')',',0.08)').replace('rgb','rgba'),
        pointRadius: 0, tension: 0.4 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend:{display:false}, tooltip:{enabled:false} },
      scales:  { x:{display:false}, y:{display:false} },
    }
  });
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  /* Animate stat counters */
  document.querySelectorAll('[data-count]').forEach(el => {
    animateCount(el, parseFloat(el.dataset.count), el.dataset.prefix || '', el.dataset.suffix || '');
  });

  /* Animate progress bars */
  setTimeout(() => {
    document.querySelectorAll('.progress-fill[data-width]').forEach(bar => {
      bar.style.width = bar.dataset.width + '%';
    });
  }, 300);

  /* Init notifications */
  renderNotifications();

  /* Start countdowns — keyed by absolute timestamp stored in sessionStorage
     so refreshing the page doesn't reset the timer */
  document.querySelectorAll('[data-countdown]').forEach(el => {
    const key    = 'cd_' + el.id;
    const stored = sessionStorage.getItem(key);
    let targetMs;
    if (stored) {
      targetMs = parseInt(stored, 10);
    } else {
      targetMs = Date.now() + parseInt(el.dataset.countdown, 10) * 1000;
      sessionStorage.setItem(key, targetMs);
    }
    startCountdown(targetMs, el.id);
  });
});

/* Close panels on outside click */
document.addEventListener('click', e => {
  if (e.target.id === 'tokenModal')  closeTokenModal();
  if (e.target.id === 'confirmModal') closeConfirmModal();
  if (!e.target.closest?.('.notif-wrapper')) {
    document.getElementById('notifPanel')?.classList.remove('show');
  }
});
