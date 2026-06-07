'use strict';
/* ── Arc Nova Effects Engine ── particles · counters · feed · achievements */

const NovaFX = (() => {

  /* ─────────────────────────────────────────────────────────────────
     1. ANIMATED COUNTERS
     Usage: <span data-count-to="2400000" data-prefix="$" data-suffix="+" data-decimals="0">
  ───────────────────────────────────────────────────────────────── */
  function initCounters() {
    const els = document.querySelectorAll('[data-count-to]');
    if (!els.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { _runCounter(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.2 });
    els.forEach(el => io.observe(el));
  }

  function _runCounter(el) {
    const to  = parseFloat(el.dataset.countTo);
    const pre = el.dataset.prefix  || '';
    const suf = el.dataset.suffix  || '';
    const dec = parseInt(el.dataset.decimals || '0');
    const dur = 2000;
    const t0  = performance.now();
    (function tick(now) {
      const p    = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      const val  = to * ease;
      el.textContent = pre + (dec ? val.toFixed(dec) : Math.round(val).toLocaleString()) + suf;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ─────────────────────────────────────────────────────────────────
     2. LIVE ACTIVITY FEED
     Call: NovaFX.initActivityFeed('elementId')
  ───────────────────────────────────────────────────────────────── */
  const _ADDRS  = ['0x3a…f2','0x7c…b8','0xe1…44','0x9f…c3','0x2d…7a',
                   '0x5b…19','0x8e…d6','0x4a…e9','0x1c…87','0x6f…31',
                   '0xbb…01','0xd4…cc','0x12…5e','0xa9…77'];
  const _SWAPS  = [['142','NOVA','USDC'],['500','NOVA','USDC'],['1,200','NOVA','USDC'],
                   ['2,000','USDC','NOVA'],['88','NOVA','USDC'],['4,500','USDC','NOVA'],
                   ['320','NOVA','USDC'],['75','USDC','NOVA'],['600','NOVA','USDC']];
  const _STAKES = ['staked 500 NOVA','staked 1,200 NOVA','claimed 38 NOVA',
                   'unstaked 750 NOVA','staked 300 NOVA','claimed 12 NOVA',
                   'staked 2,000 NOVA','claimed 88 NOVA'];

  function _rndAct() {
    const r = Math.random();
    if (r < 0.55) {
      const s = _SWAPS[Math.floor(Math.random() * _SWAPS.length)];
      return { icon: '🔄', text: `swapped ${s[0]} ${s[1]} → ${s[2]}`, col: '#a78bfa' };
    } else if (r < 0.82) {
      return { icon: '💎', text: _STAKES[Math.floor(Math.random() * _STAKES.length)], col: '#10b981' };
    } else {
      return { icon: '🪂', text: `earned +${Math.floor(Math.random()*20+5)} XP`, col: '#22d3ee' };
    }
  }

  function initActivityFeed(id) {
    const wrap = document.getElementById(id);
    if (!wrap) return;
    const timers = new WeakMap();

    function push() {
      const act  = _rndAct();
      const addr = _ADDRS[Math.floor(Math.random() * _ADDRS.length)];
      const row  = document.createElement('div');
      row.className = 'nfx-act-row';
      row.innerHTML = `
        <span class="nfx-act-dot" style="background:${act.col}"></span>
        <span class="nfx-act-body">
          <span class="nfx-act-addr">${addr}</span>
          <span class="nfx-act-txt"> ${act.text}</span>
        </span>
        <span class="nfx-act-age">now</span>`;
      row.style.cssText = 'opacity:0;transform:translateY(-10px)';
      wrap.insertBefore(row, wrap.firstChild);
      requestAnimationFrame(() => {
        row.style.transition = 'opacity .32s,transform .32s cubic-bezier(.22,1,.36,1)';
        row.style.opacity = '1'; row.style.transform = '';
      });

      let secs = 0;
      const iv = setInterval(() => {
        secs += 3;
        const age = row.querySelector('.nfx-act-age');
        if (age) age.textContent = secs < 60 ? secs + 's' : Math.floor(secs / 60) + 'm';
      }, 3000);
      timers.set(row, iv);

      const rows = wrap.querySelectorAll('.nfx-act-row');
      if (rows.length > 8) {
        const last = rows[rows.length - 1];
        clearInterval(timers.get(last));
        last.style.transition = 'opacity .28s';
        last.style.opacity = '0';
        setTimeout(() => last.remove(), 300);
      }
    }

    for (let i = 0; i < 5; i++) setTimeout(push, i * 150);
    (function loop() {
      setTimeout(() => { push(); loop(); }, Math.random() * 3800 + 2200);
    })();
  }

  /* ─────────────────────────────────────────────────────────────────
     3. PARTICLE BURST
     Call: NovaFX.burst(x, y, color?)
  ───────────────────────────────────────────────────────────────── */
  function burst(x, y, col) {
    const cols = [col || '#a78bfa', '#c084fc', '#818cf8', '#e0d0ff'];
    for (let i = 0; i < 24; i++) {
      const p    = document.createElement('div');
      const sz   = Math.random() * 5 + 3;
      p.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;
        border-radius:50%;background:${cols[i % cols.length]};pointer-events:none;z-index:99999;`;
      document.body.appendChild(p);
      const ang  = (Math.PI * 2 * i) / 24 + Math.random() * 0.4;
      const dist = Math.random() * 100 + 45;
      requestAnimationFrame(() => {
        p.style.transition = `transform .72s cubic-bezier(.22,1,.36,1),opacity .72s`;
        p.style.transform  = `translate(${Math.cos(ang)*dist}px,${Math.sin(ang)*dist}px)`;
        p.style.opacity    = '0';
      });
      setTimeout(() => p.remove(), 780);
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     4. ACHIEVEMENT TOAST
     Call: NovaFX.achievement('Title', 'desc', '🏆')
  ───────────────────────────────────────────────────────────────── */
  let _achStack = 0;
  function achievement(title, desc, icon) {
    const el = document.createElement('div');
    el.className = 'nfx-ach';
    el.style.bottom = (24 + _achStack * 80) + 'px';
    _achStack++;
    el.innerHTML = `<div class="nfx-ach-icon">${icon || '🏆'}</div>
      <div><div class="nfx-ach-title">${title}</div>
      <div class="nfx-ach-desc">${desc}</div></div>
      <div class="nfx-ach-bar"></div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('nfx-ach-show'));
    setTimeout(() => {
      el.classList.remove('nfx-ach-show');
      setTimeout(() => { el.remove(); _achStack = Math.max(0, _achStack - 1); }, 420);
    }, 4000);
  }

  /* ─────────────────────────────────────────────────────────────────
     5. SPARKLINE CHART
     Call: NovaFX.sparkline('elementId', dataArray)
  ───────────────────────────────────────────────────────────────── */
  function sparkline(id, data) {
    const c = document.getElementById(id);
    if (!c || !data || data.length < 2) return;
    const w  = c.offsetWidth  || 220;
    const h  = c.offsetHeight || 44;
    const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
    const pts = data.map((v, i) =>
      `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * (h - 10) - 5}`
    );
    const lp  = pts[pts.length - 1].split(',');
    const up  = data[data.length - 1] >= data[0];
    const col = up ? '#10b981' : '#ef4444';
    const pct = (((data[data.length-1] - data[0]) / data[0]) * 100).toFixed(2);
    c.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <defs><linearGradient id="sg_${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${col}" stop-opacity=".25"/>
        <stop offset="100%" stop-color="${col}" stop-opacity="0"/>
      </linearGradient></defs>
      <path d="M ${pts.join(' L ')} L ${w},${h} L 0,${h} Z" fill="url(#sg_${id})"/>
      <polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="1.5"
        stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${lp[0]}" cy="${lp[1]}" r="3.5" fill="${col}"/>
    </svg>`;
    // update pct badge if present
    const badge = document.getElementById(id + '_pct');
    if (badge) { badge.textContent = (up ? '+' : '') + pct + '%'; badge.style.color = col; }
  }

  function fakePrices(n, base, vol) {
    n = n || 24; base = base || 0.0847; vol = vol || 0.06;
    const d = [base];
    for (let i = 1; i < n; i++) {
      const chg = (Math.random() - 0.47) * vol * d[i - 1];
      d.push(Math.max(d[i - 1] + chg, base * 0.55));
    }
    return d;
  }

  /* ─────────────────────────────────────────────────────────────────
     6. "TRY DEMO" FLOATING BUTTON
  ───────────────────────────────────────────────────────────────── */
  function initTryDemo() {
    if (document.getElementById('nfxTryDemo')) return;
    const btn = document.createElement('button');
    btn.id = 'nfxTryDemo';
    btn.className = 'nfx-try-demo';
    btn.innerHTML = '<span class="nfx-demo-pulse"></span>⚡ Try Demo';
    btn.title = 'Explore all features without a real wallet';
    btn.onclick = () => {
      if (!window.location.pathname.includes('defi')) {
        window.location.href = 'defi.html';
      } else {
        if (typeof openWalletModal === 'function') openWalletModal();
        // auto-click MetaMask/first wallet after modal opens
        setTimeout(() => {
          const firstWlt = document.querySelector('.wlt-item');
          if (firstWlt) firstWlt.click();
        }, 400);
      }
    };
    document.body.appendChild(btn);
  }

  /* ─────────────────────────────────────────────────────────────────
     AUTO-INIT
  ───────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initCounters();
    initTryDemo();

    // Render sparkline after layout paints
    setTimeout(() => {
      const prices = fakePrices(48, 0.0847, 0.055);
      sparkline('novaSparkline', prices);
    }, 300);

    // Wallet connect
    document.addEventListener('arcWalletConnected', () => {
      achievement('Connected!', 'Welcome to Arc Nova — you earned 50 XP', '🎉');
    });

    // Tx success
    document.addEventListener('arcTxSuccess', e => {
      const d = e.detail || {};
      // particles
      if (d.btn) {
        const r = d.btn.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, d.col);
      } else {
        burst(window.innerWidth / 2, window.innerHeight * 0.65);
      }
      // achievement
      const map = {
        swap:    ['Swap Complete!',    'You earned 10 XP',             '🔄'],
        stake:   ['NOVA Staked!',      'Earning 12.5% APY — +25 XP',  '💎'],
        unstake: ['Unstaking…',        'Tokens unlock in 24 hours',    '🔓'],
        claim:   ['Rewards Claimed!',  'Tokens back in your wallet',   '🎁'],
        faucet:  ['Faucet Claimed!',   '1,000 NOVA sent — +5 XP',     '🚰'],
        withdraw:['Withdrawn!',        'Tokens in your wallet',        '✅'],
      };
      const [t, desc, ico] = map[d.type] || ['Done!', 'Transaction complete', '✅'];
      achievement(t, desc, ico);
    });
  });

  return { initCounters, initActivityFeed, burst, achievement, sparkline, fakePrices, initTryDemo };
})();
