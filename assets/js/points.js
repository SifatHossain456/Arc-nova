/* ── Arc Nova XP & Airdrop Engine ─────────────────────────────────────────── */
(function () {
'use strict';

const KEY = 'arcnova_xp_v2';

const XP_TABLE = {
  connect_wallet: 50, swap: 25, stake: 40,
  unstake: 10, claim_rewards: 20, faucet: 5, add_liquidity: 60,
};
const FIRST_TIME = { swap: 100, stake: 100 };

const TIERS = [
  { name:'Bronze',   min:0,    max:249,  color:'#cd7f32', icon:'🥉', alloc:'0.5%' },
  { name:'Silver',   min:250,  max:799,  color:'#94a3b8', icon:'🥈', alloc:'1%'   },
  { name:'Gold',     min:800,  max:1999, color:'#f59e0b', icon:'🥇', alloc:'2%'   },
  { name:'Platinum', min:2000, max:4999, color:'#e2e8f0', icon:'🏆', alloc:'4%'   },
  { name:'Diamond',  min:5000, max:1e9,  color:'#22d3ee', icon:'💎', alloc:'8%'   },
];

const ACHIEVEMENTS = [
  { id:'pioneer',  icon:'🌟', title:'Pioneer',        action:'connect_wallet', n:1    },
  { id:'trader1',  icon:'⚡', title:'First Trade',    action:'swap',           n:1    },
  { id:'trader10', icon:'📈', title:'Active Trader',  action:'swap',           n:10   },
  { id:'staker1',  icon:'🏦', title:'Staker',         action:'stake',          n:1    },
  { id:'staker5',  icon:'💎', title:'Diamond Hands',  action:'stake',          n:5    },
  { id:'streak7',  icon:'🔥', title:'Daily Grinder',  action:'_streak',        n:7    },
  { id:'harvest3', icon:'🌾', title:'Yield Harvester',action:'claim_rewards',  n:3    },
  { id:'xp1000',   icon:'🎖', title:'Centurion',      action:'_xp',            n:1000 },
];

const FAKE_BOARD = [];

function _load() {
  try {
    return { xp:0, counts:{}, achievements:[], streak:0, lastDay:null,
      ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch { return { xp:0, counts:{}, achievements:[], streak:0, lastDay:null }; }
}
function _save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }

function _getTier(xp) { return TIERS.find(t => xp >= t.min && xp <= t.max) || TIERS[0]; }

function _board(s) {
  const addr = (typeof activeAccount !== 'undefined' && activeAccount)
    ? activeAccount.slice(0,6)+'…'+activeAccount.slice(-4) : 'You';
  return [...FAKE_BOARD, { addr, xp: s.xp, isMe: true }].sort((a,b) => b.xp - a.xp);
}

function _checkAchievements(s) {
  ACHIEVEMENTS.forEach(a => {
    if (s.achievements.includes(a.id)) return;
    const n = a.action === '_streak' ? s.streak :
              a.action === '_xp'     ? s.xp :
              (s.counts[a.action] || 0);
    if (n >= a.n) {
      s.achievements.push(a.id);
      setTimeout(() => {
        if (typeof showToast === 'function')
          showToast(`${a.icon} Achievement unlocked: <strong>${a.title}</strong>`, 'success', 5000);
      }, 900);
    }
  });
}

/* ── CSS injection ── */
function _css() {
  if (document.getElementById('arcXpCSS')) return;
  const s = document.createElement('style');
  s.id = 'arcXpCSS';
  s.textContent = `
@keyframes xpFloat{0%{opacity:0;transform:translateY(0) scale(.8)}25%{opacity:1;transform:translateY(-10px) scale(1.05)}100%{opacity:0;transform:translateY(-38px) scale(.9)}}
.arc-xp-pop{position:fixed;z-index:99998;pointer-events:none;font-size:.82rem;font-weight:900;color:#a78bfa;text-shadow:0 0 14px rgba(139,92,246,.6);font-family:Inter,sans-serif;white-space:nowrap;animation:xpFloat 1.5s cubic-bezier(.22,1,.36,1) both}
.xp-bar-wrap{height:5px;border-radius:5px;background:rgba(255,255,255,.06);overflow:hidden;margin-top:8px}
.xp-bar-fill{height:100%;border-radius:5px;background:linear-gradient(90deg,#7c3aed,#22d3ee);transition:width .9s cubic-bezier(.22,1,.36,1)}
.lb-row{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;transition:background .15s}
.lb-row:hover{background:rgba(255,255,255,.04)}
.lb-me{background:rgba(139,92,246,.1)!important;border:1px solid rgba(139,92,246,.22);border-radius:10px}
.lb-rank{width:28px;text-align:center;font-weight:800;font-size:.82rem;color:var(--muted);flex-shrink:0}
.lb-addr{flex:1;font-size:.8rem;font-weight:600;color:var(--text-2);font-family:monospace;min-width:0;overflow:hidden;text-overflow:ellipsis}
.lb-tier{flex-shrink:0;font-size:.9rem}
.lb-xp{font-size:.82rem;font-weight:800;color:var(--text);text-align:right;flex-shrink:0}
.lb-sep{text-align:center;color:var(--muted);font-size:.75rem;padding:4px 0;letter-spacing:.1em}
.quest-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04)}
.quest-row:last-child{border-bottom:none}
.quest-done .quest-lbl{text-decoration:line-through;opacity:.5}
.tier-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:100px;font-size:.72rem;font-weight:800}
`;
  document.head.appendChild(s);
}

function _showXpPop(text) {
  _css();
  const ref = document.getElementById('walletBtn') || document.body;
  const r = ref.getBoundingClientRect?.() || {};
  const el = document.createElement('div');
  el.className = 'arc-xp-pop';
  el.textContent = text;
  el.style.right = (window.innerWidth - (r.right || 80)) + 'px';
  el.style.top   = ((r.bottom || 70) + 8) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

function _updateUI(s) {
  const tier = _getTier(s.xp);
  const board = _board(s);
  const rank  = board.findIndex(u => u.isMe) + 1;
  const pct   = tier.max === 1e9 ? 100 :
    Math.min(((s.xp - tier.min) / (tier.max - tier.min + 1)) * 100, 100);

  document.querySelectorAll('[data-xp]').forEach(e => e.textContent = s.xp.toLocaleString());
  document.querySelectorAll('[data-xp-rank]').forEach(e => e.textContent = '#' + rank);
  document.querySelectorAll('[data-xp-streak]').forEach(e => e.textContent = (s.streak || 0) + (s.streak === 1 ? ' day' : ' days'));
  document.querySelectorAll('[data-xp-tier]').forEach(e => {
    e.textContent = tier.icon + ' ' + tier.name; e.style.color = tier.color;
  });
  document.querySelectorAll('[data-xp-next]').forEach(e => {
    e.textContent = tier.max === 1e9 ? 'Max tier reached!' : tier.max - s.xp + ' XP to ' + TIERS[TIERS.indexOf(tier)+1]?.name;
  });
  document.querySelectorAll('.xp-bar-fill').forEach(e => e.style.width = pct + '%');

  renderLeaderboard(s);
  renderQuests(s);

  const card = document.getElementById('airXpCard');
  if (card && typeof walletConnected !== 'undefined' && walletConnected) {
    card.style.display = 'block';
    const cta = document.getElementById('airCtaBtn');
    if (cta) { cta.textContent = '→ Go Earn XP'; cta.onclick = () => { window.location.href = 'defi.html'; }; }
  }
}

/* ── Leaderboard ── */
function renderLeaderboard(state) {
  const el = document.getElementById('xpLeaderboard');
  if (!el) return;
  _css();
  const s     = state || _load();
  const board = _board(s);
  const myIdx = board.findIndex(u => u.isMe);

  const top3   = board.slice(0, 3);
  const start  = Math.max(3, myIdx - 1);
  const nearby = board.slice(start, start + 4);
  const gap    = start > 3;

  const row = u => {
    const r  = board.indexOf(u) + 1;
    const t  = _getTier(u.xp);
    const lbl = r <= 3 ? ['🥇','🥈','🥉'][r-1] : r;
    return `<div class="lb-row${u.isMe ? ' lb-me' : ''}">
      <span class="lb-rank">${lbl}</span>
      <span class="lb-addr">${u.addr}${u.isMe ? ' <span style="color:#a78bfa;font-size:.65rem">(You)</span>' : ''}</span>
      <span class="lb-tier">${t.icon}</span>
      <span class="lb-xp">${u.xp.toLocaleString()} <span style="font-size:.7rem;color:var(--muted)">XP</span></span>
    </div>`;
  };

  if (board.length === 0 || (board.length === 1 && board[0].isMe && board[0].xp === 0)) {
    el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--muted);font-size:0.85rem">No activity yet — be the first to earn XP!</div>';
    return;
  }

  el.innerHTML = top3.map(row).join('')
    + (gap ? '<div class="lb-sep">· · ·</div>' : '')
    + nearby.map(row).join('');
}

/* ── Quests ── */
function renderQuests(state) {
  const el = document.getElementById('xpQuests');
  if (!el) return;
  const s    = state || _load();
  const today = new Date().toDateString();

  const quests = [
    { icon:'📅', label:'Daily Check-in',   xp:15, done: s.lastDay === today },
    { icon:'🔄', label:'Make a Swap',       xp:25, done: !!(s.counts.swap)   },
    { icon:'🏦', label:'Stake NOVA',        xp:40, done: !!(s.counts.stake)  },
    { icon:'🚰', label:'Claim from Faucet', xp:5,  done: !!(s.counts.faucet) },
  ];

  el.innerHTML = quests.map(q => `
    <div class="quest-row${q.done ? ' quest-done' : ''}">
      <span style="font-size:.95rem">${q.icon}</span>
      <span class="quest-lbl" style="flex:1;font-size:.83rem;font-weight:600;color:var(--text)">${q.label}</span>
      <span style="font-size:.78rem;font-weight:800;color:${q.done ? '#10b981' : '#a78bfa'}">${q.done ? '✓ Done' : '+'+q.xp+' XP'}</span>
    </div>`).join('');
}

/* ── Public API ── */
const ArcPoints = {
  award(action) {
    const xp = XP_TABLE[action];
    if (!xp) return;
    const s = _load();
    if (action === 'connect_wallet' && s.counts.connect_wallet >= 1) return;

    const bonus = FIRST_TIME[action] && !(s.counts[action] >= 1) ? FIRST_TIME[action] : 0;
    s.counts[action] = (s.counts[action] || 0) + 1;
    s.xp += xp + bonus;

    if (bonus) {
      setTimeout(() => {
        if (typeof showToast === 'function')
          showToast(`🎉 First ${action}! +${bonus} XP bonus`, 'success', 4500);
      }, 400);
    }

    _checkAchievements(s);
    _save(s);
    _showXpPop('+' + (xp + bonus) + ' XP');
    _updateUI(s);
  },

  checkin() {
    const s = _load();
    const today = new Date().toDateString();
    if (s.lastDay === today) return false;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    s.streak = (s.lastDay === yesterday) ? (s.streak || 0) + 1 : 1;
    s.lastDay = today;
    const bonus = Math.min((s.streak - 1) * 5, 30);
    const total = 15 + bonus;
    s.xp += total;
    s.counts.daily_checkin = (s.counts.daily_checkin || 0) + 1;
    _checkAchievements(s);
    _save(s);
    _showXpPop('+' + total + ' XP' + (s.streak > 1 ? ` 🔥 ${s.streak}-day streak!` : ''));
    _updateUI(s);
    return true;
  },

  getState()  { return _load(); },
  getTier()   { return _getTier(_load().xp); },
  getRank()   { const s = _load(); return _board(s).findIndex(u => u.isMe) + 1; },
};

window.ArcPoints       = ArcPoints;
window.renderLeaderboard = renderLeaderboard;
window.renderQuests    = renderQuests;

document.addEventListener('DOMContentLoaded', () => {
  _css();
  const s = _load();
  _updateUI(s);
  setTimeout(() => {
    if (typeof walletConnected !== 'undefined' && walletConnected) ArcPoints.checkin();
  }, 1800);
});

document.addEventListener('arcWalletConnected', () => {
  ArcPoints.award('connect_wallet');
  ArcPoints.checkin();
  _updateUI(_load());
  const card = document.getElementById('airXpCard');
  if (card) card.style.display = 'block';
  const cta = document.getElementById('airCtaBtn');
  if (cta) { cta.textContent = '→ Go Earn XP'; cta.onclick = () => { window.location.href = 'defi.html'; }; }
});

})();
