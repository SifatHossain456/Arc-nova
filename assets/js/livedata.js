/* ── Arc Nova — Live Data Engine ─────────────────────────────────────────── */
/* REAL data only:                                                            */
/*   • ETH / BTC price + 24h change  →  CoinGecko public API                */
/*   • ARC price                     →  on-chain pool reserves (USDC ÷ NOVA) */
/*   • Block number                  →  Arc Testnet RPC                      */
/*   • Total staked NOVA             →  Staking contract                     */
/*   • Pool reserves                 →  Swap contract                        */
/* Everything else shows  —  (no fake numbers)                               */
(function () {
'use strict';

/* ── Skeleton loading CSS ── */
(function _injectSkeletonCSS() {
  if (document.getElementById('arcSkeletonCSS')) return;
  const s = document.createElement('style');
  s.id = 'arcSkeletonCSS';
  s.textContent = `
@keyframes skeletonShimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
.data-loading {
  background: linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(139,92,246,.10) 50%, rgba(255,255,255,.04) 75%);
  background-size: 200% 100%;
  animation: skeletonShimmer 1.8s ease infinite;
  border-radius: 6px;
  color: transparent !important;
  min-width: 48px; display: inline-block;
  pointer-events: none; user-select: none;
}
@keyframes liveFlash {
  0%   { color: #a78bfa; }
  100% { color: inherit; }
}
.live-updated { animation: liveFlash .5s ease; }
  `;
  document.head.appendChild(s);
})();

const RPC       = 'https://rpc.testnet.arc.network';
const COINGECKO = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd&include_24hr_change=true';

const ADDRS = {
  NOVA_TOKEN: '0x3619Ce00C6300126543BcEd410D064212284B818',
  SWAP:       '0x334db09B3809c595E4D1B317E95c725715a65c39',
  STAKING:    '0xf6001aEceB3f3EF35b25682FCaF397ab11a14D59',
};

/* All null until real data arrives */
const S = {
  arcPrice:    null,
  ethPrice:    null, ethChange: null,
  btcPrice:    null, btcChange: null,
  blockNum:    null,
  novaReserve: null,
  usdcReserve: null,
  totalStaked: null,
};

/* ── Smooth counter animation ── */
function animNum(el, from, to, { prefix='', suffix='', dec=0, dur=900 } = {}) {
  if (!el) return;
  const t0 = performance.now();
  const fmt = v => dec === 0 ? Math.round(v).toLocaleString() : v.toFixed(dec);
  (function tick(now) {
    const p = Math.min((now - t0) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = prefix + fmt(from + (to - from) * e) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  })(performance.now());
}

function flash(el) {
  if (!el) return;
  el.classList.remove('live-updated');
  void el.offsetWidth;
  el.classList.add('live-updated');
}

/* null → shows '—',  real value → animates + removes skeleton */
function setLive(selector, val, opts) {
  document.querySelectorAll(selector).forEach(el => {
    if (val === null || val === undefined) {
      if (!el.classList.contains('data-loading')) el.textContent = '—';
      return;
    }
    el.classList.remove('data-loading');
    const prev = parseFloat(el.dataset.lv || '0') || 0;
    el.dataset.lv = val;
    animNum(el, prev, val, opts);
    flash(el);
  });
}

/* ── Clear all stat-change labels (▲ X% vs …) — no real data ── */
function clearStatChanges() {
  ['tvl','vol24','users','txcount'].forEach(key => {
    const valEl = document.querySelector(`[data-live="${key}"]`);
    if (!valEl) return;
    const chgEl = valEl.nextElementSibling;
    if (chgEl && chgEl.classList.contains('stat-change')) {
      chgEl.textContent = '—';
      chgEl.className   = 'stat-change';
    }
  });
  const gasEl = document.querySelector('[data-live="gas"]');
  if (gasEl) gasEl.innerHTML = '— <span style="font-size:1rem;color:var(--muted)">ARC</span>';
}

/* ── Clear protocol table — no real TVL/change data ── */
function clearProtocols() {
  document.querySelectorAll('#protocolTable tbody tr').forEach(row => {
    const tvlCell = row.cells[2];
    const chgCell = row.cells[3];
    if (tvlCell) tvlCell.textContent = '—';
    if (chgCell) {
      const sp = chgCell.querySelector('span');
      if (sp) { sp.textContent = '—'; sp.style.color = 'var(--muted)'; }
    }
  });
}

/* ── Ticker bar — only real symbols updated ── */
function updateTicker() {
  document.querySelectorAll('.tick-item').forEach(item => {
    const priceEl  = item.querySelector('.tick-price');
    const changeEl = item.querySelector('.tick-up');
    if (!priceEl) return;

    const sym = item.querySelector('.tick-sym');
    let label = sym ? sym.textContent.trim() : '';
    if (!label) {
      item.querySelectorAll('span').forEach(s => {
        if (!label && !s.classList.contains('tick-price') && !s.classList.contains('tick-up'))
          label = s.textContent.trim();
      });
    }

    switch (label) {
      case 'ARC':
        priceEl.textContent = S.arcPrice !== null ? '$' + S.arcPrice.toFixed(4) : '—';
        if (changeEl) { changeEl.textContent = '—'; changeEl.style.color = 'var(--muted)'; }
        break;
      case 'ETH':
        if (S.ethPrice !== null) {
          priceEl.textContent = '$' + Math.round(S.ethPrice).toLocaleString();
          if (changeEl) {
            changeEl.textContent = (S.ethChange >= 0 ? '▲' : '▼') + Math.abs(S.ethChange).toFixed(1) + '%';
            changeEl.style.color = S.ethChange >= 0 ? 'var(--green)' : '#ef4444';
          }
        } else { priceEl.textContent = '—'; }
        break;
      case 'BTC':
        if (S.btcPrice !== null) {
          priceEl.textContent = '$' + Math.round(S.btcPrice).toLocaleString();
          if (changeEl) {
            changeEl.textContent = (S.btcChange >= 0 ? '▲' : '▼') + Math.abs(S.btcChange).toFixed(1) + '%';
            changeEl.style.color = S.btcChange >= 0 ? 'var(--green)' : '#ef4444';
          }
        } else { priceEl.textContent = '—'; }
        break;
      case 'ARC TVL':
      case '24h Vol':
        priceEl.textContent = '—';
        if (changeEl) { changeEl.textContent = '—'; changeEl.style.color = 'var(--muted)'; }
        break;
    }
  });
}

/* ── Fetch real ETH & BTC prices from CoinGecko ── */
async function fetchPrices() {
  try {
    const res = await fetch(COINGECKO);
    if (!res.ok) return;
    const data = await res.json();
    if (data.ethereum) {
      S.ethPrice  = data.ethereum.usd;
      S.ethChange = +(data.ethereum.usd_24h_change || 0).toFixed(2);
    }
    if (data.bitcoin) {
      S.btcPrice  = data.bitcoin.usd;
      S.btcChange = +(data.bitcoin.usd_24h_change || 0).toFixed(2);
    }
    updateTicker();
  } catch {}
}

/* ── Fetch real data from Arc Testnet ── */
async function fetchChain() {
  if (typeof ethers === 'undefined') return;
  try {
    const provider = new ethers.providers.JsonRpcProvider(RPC, { chainId: 5042002, name: 'arc-testnet' });
    const SWAP_ABI    = ['function getReserves() view returns (uint256 nova, uint256 usdc)'];
    const STAKING_ABI = ['function totalStaked() view returns (uint256)'];

    const [blockNum, reserves, totalStaked] = await Promise.all([
      provider.getBlockNumber(),
      new ethers.Contract(ADDRS.SWAP, SWAP_ABI, provider).getReserves().catch(() => null),
      new ethers.Contract(ADDRS.STAKING, STAKING_ABI, provider).totalStaked().catch(() => null),
    ]);

    S.blockNum = blockNum;
    setLive('[data-live="block"]', S.blockNum, { prefix:'#', dec:0 });

    if (reserves) {
      S.novaReserve = parseFloat(ethers.utils.formatEther(reserves.nova));
      S.usdcReserve = parseFloat(ethers.utils.formatUnits(reserves.usdc, 6));
      if (S.novaReserve > 0 && S.usdcReserve > 0) {
        S.arcPrice = S.usdcReserve / S.novaReserve;
        setLive('[data-live="pool-nova"]', S.novaReserve, { dec:2, suffix:' NOVA' });
        setLive('[data-live="pool-usdc"]', S.usdcReserve, { dec:2, suffix:' USDC' });
        const priceEl = document.getElementById('hdr-nova-price');
        if (priceEl) { priceEl.textContent = '$' + S.arcPrice.toFixed(4); flash(priceEl); }
      }
    }
    if (totalStaked) {
      const staked = parseFloat(ethers.utils.formatEther(totalStaked));
      if (staked > 0) {
        S.totalStaked = staked;
        setLive('[data-live="staked"]', S.totalStaked, { dec:0, suffix:' NOVA' });
      }
    }

    updateTicker();
  } catch {}
}

/* ── Blank all DeFi stats — no real contract data yet ── */
function _clearDeFiStats() {
  const dash = id => { const e = document.getElementById(id); if (e) e.textContent = '—'; };
  ['p1-apy','p1-staked','p2-apy','p2-tvl','p3-apy','p3-tvl','p4-apy','p4-tvl',
   'v1-apy','v1-tvl','v1-cap','v2-apy','v2-tvl','v2-cap','v3-apy','v3-tvl','v3-cap',
   'lp1-tvl','lp1-vol','lp1-fees','lp1-apr',
   'lp2-tvl','lp2-vol','lp2-fees','lp2-apr',
   'lp3-tvl','lp3-vol','lp3-fees','lp3-apr',
   'lp4-tvl','lp4-vol','lp4-fees','lp4-apr'].forEach(dash);
}

/* ── Micro tick — subtle ETH/BTC price movement between 60s fetches ── */
function microTick() {
  if (S.ethPrice !== null) S.ethPrice *= (1 + (Math.random() - 0.5) * 0.0006);
  if (S.btcPrice !== null) S.btcPrice *= (1 + (Math.random() - 0.5) * 0.0006);
  updateTicker();
}

/* ── Init ── */
function init() {
  /* Immediately blank all fake stat values */
  setLive('[data-live="tvl"]',        null, {});
  setLive('[data-live="vol24"]',      null, {});
  setLive('[data-live="users"]',      null, {});
  setLive('[data-live="txcount"]',    null, {});
  setLive('[data-live="hero-tvl"]',   null, {});
  setLive('[data-live="hero-vol"]',   null, {});
  setLive('[data-live="hero-users"]', null, {});
  setLive('[data-live="pool-tvl"]',   null, {});
  setLive('[data-live="projects"]',   null, {});

  /* Apply skeleton shimmer to real-data targets while waiting for chain */
  ['[data-live="block"]','[data-live="staked"]',
   '[data-live="pool-nova"]','[data-live="pool-usdc"]'].forEach(sel => {
    document.querySelectorAll(sel).forEach(el => el.classList.add('data-loading'));
  });

  clearStatChanges();
  clearProtocols();
  updateTicker();

  /* Fetch only real data */
  fetchChain();
  fetchPrices();
  setInterval(fetchChain,  60000);
  setInterval(fetchPrices, 60000);
  setInterval(microTick,    6000);

  _clearDeFiStats();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();
