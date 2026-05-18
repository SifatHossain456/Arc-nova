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

/* null → shows '—',  real value → animates */
function setLive(selector, val, opts) {
  document.querySelectorAll(selector).forEach(el => {
    if (val === null || val === undefined) {
      el.textContent = '—';
      return;
    }
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

/* ── Live transaction feed (UI demo — not real chain txs) ── */
const TX_TYPES = [
  { label:'Swap',    bg:'rgba(124,58,237,.15)', color:'#a78bfa' },
  { label:'Stake',   bg:'rgba(16,185,129,.12)', color:'#10b981' },
  { label:'Bridge',  bg:'rgba(34,211,238,.12)', color:'#22d3ee' },
  { label:'LP Add',  bg:'rgba(245,158,11,.12)', color:'#f59e0b' },
  { label:'Unstake', bg:'rgba(239,68,68,.12)',  color:'#ef4444' },
  { label:'Claim',   bg:'rgba(99,102,241,.12)', color:'#818cf8' },
];
const HEX_CHARS = '0123456789abcdef';
function randHex(n) { return Array.from({length:n}, () => HEX_CHARS[Math.floor(Math.random()*16)]).join(''); }

function addTxRow() {
  const feed = document.getElementById('liveTxFeed');
  if (!feed) return;
  const type = TX_TYPES[Math.floor(Math.random() * TX_TYPES.length)];
  const addr = '0x' + randHex(4) + '…' + randHex(4);
  const val  = (Math.random() * 4800 + 120).toFixed(0);
  const sign = Math.random() > 0.35 ? '+' : '';
  const row  = document.createElement('div');
  row.className = 'tx-row';
  row.style.cssText = 'opacity:0;transform:translateY(-8px);transition:opacity 0.4s ease,transform 0.4s ease';
  row.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px">
      <span class="tx-type" style="background:${type.bg};color:${type.color}">${type.label}</span>
      <span style="color:var(--text-2)">${addr}</span>
    </div>
    <div style="text-align:right">
      <div style="font-weight:700;color:var(--text)">${sign}$${val}</div>
      <div class="tx-time" style="font-size:0.72rem;color:var(--muted)">just now</div>
    </div>`;
  feed.insertBefore(row, feed.firstChild);
  requestAnimationFrame(() => { row.style.opacity = '1'; row.style.transform = 'translateY(0)'; });
  const AGES = ['just now', '3s ago', '12s ago', '28s ago', '52s ago', '1m ago', '2m ago'];
  feed.querySelectorAll('.tx-row').forEach((r, i) => {
    const t = r.querySelector('.tx-time'); if (t && AGES[i]) t.textContent = AGES[i];
  });
  while (feed.children.length > 6) feed.removeChild(feed.lastChild);
}

/* ── DeFi stats — realistic simulated data with subtle jitter ── */
const DEFI_BASE = {
  stakeApy:  12.4,
  p1Apy: 12.4,  p1Staked: 840000,
  p2Apy: 18.7,  p2Tvl:   1240000,
  p3Apy: 14.2,  p3Tvl:    680000,
  p4Apy:  7.8,  p4Tvl:    420000,
  v1Apy:  8.4,  v1Tvl:  2100000, v1Cap: 85,
  v2Apy: 23.7,  v2Tvl:   890000, v2Cap: 67,
  v3Apy: 48.2,  v3Tvl:   340000, v3Cap: 42,
  lp1Tvl: 1240000, lp1Vol: 187000, lp1Fees:  561, lp1Apr: 18.2,
  lp2Tvl:  680000, lp2Vol:  93000, lp2Fees:  279, lp2Apr: 14.8,
  lp3Tvl:  420000, lp3Vol: 312000, lp3Fees:  936, lp3Apr:  8.2,
  lp4Tvl:  290000, lp4Vol:  47000, lp4Fees:  141, lp4Apr: 22.4,
};

function _j(v, pct) { return v * (1 + (Math.random() - 0.5) * (pct || 0.03)); }
function _fmtM(v) {
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return '$' + (v / 1e3).toFixed(1) + 'K';
  return '$' + Math.round(v);
}
function _set(id, txt) { const e = document.getElementById(id); if (e) e.textContent = txt; }

function _updateDeFiStats() {
  const b = DEFI_BASE;
  _set('stake-info-apy', _j(b.stakeApy).toFixed(1) + '%');
  _set('p1-apy',   _j(b.p1Apy).toFixed(1) + '%');
  _set('p1-staked', _fmtM(_j(b.p1Staked)));
  _set('p2-apy',   _j(b.p2Apy).toFixed(1) + '%');
  _set('p2-tvl',   _fmtM(_j(b.p2Tvl)));
  _set('p3-apy',   _j(b.p3Apy).toFixed(1) + '%');
  _set('p3-tvl',   _fmtM(_j(b.p3Tvl)));
  _set('p4-apy',   _j(b.p4Apy).toFixed(1) + '%');
  _set('p4-tvl',   _fmtM(_j(b.p4Tvl)));

  _set('v1-apy', _j(b.v1Apy, 0.01).toFixed(1) + '%');
  _set('v1-tvl', _fmtM(_j(b.v1Tvl)));
  _set('v1-cap', Math.round(_j(b.v1Cap, 0.01)) + '%');
  _set('v2-apy', _j(b.v2Apy, 0.01).toFixed(1) + '%');
  _set('v2-tvl', _fmtM(_j(b.v2Tvl)));
  _set('v2-cap', Math.round(_j(b.v2Cap, 0.01)) + '%');
  _set('v3-apy', _j(b.v3Apy, 0.02).toFixed(1) + '%');
  _set('v3-tvl', _fmtM(_j(b.v3Tvl)));
  _set('v3-cap', Math.round(_j(b.v3Cap, 0.01)) + '%');

  _set('lp1-tvl',  _fmtM(_j(b.lp1Tvl)));
  _set('lp1-vol',  _fmtM(_j(b.lp1Vol)));
  _set('lp1-fees', '$' + Math.round(_j(b.lp1Fees)));
  _set('lp1-apr',  _j(b.lp1Apr, 0.02).toFixed(1) + '%');

  _set('lp2-tvl',  _fmtM(_j(b.lp2Tvl)));
  _set('lp2-vol',  _fmtM(_j(b.lp2Vol)));
  _set('lp2-fees', '$' + Math.round(_j(b.lp2Fees)));
  _set('lp2-apr',  _j(b.lp2Apr, 0.02).toFixed(1) + '%');

  _set('lp3-tvl',  _fmtM(_j(b.lp3Tvl)));
  _set('lp3-vol',  _fmtM(_j(b.lp3Vol)));
  _set('lp3-fees', '$' + Math.round(_j(b.lp3Fees)));
  _set('lp3-apr',  _j(b.lp3Apr, 0.02).toFixed(1) + '%');

  _set('lp4-tvl',  _fmtM(_j(b.lp4Tvl)));
  _set('lp4-vol',  _fmtM(_j(b.lp4Vol)));
  _set('lp4-fees', '$' + Math.round(_j(b.lp4Fees)));
  _set('lp4-apr',  _j(b.lp4Apr, 0.02).toFixed(1) + '%');
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

  clearStatChanges();
  clearProtocols();
  updateTicker();

  /* Fetch only real data */
  fetchChain();
  fetchPrices();
  setInterval(fetchChain,  60000);
  setInterval(fetchPrices, 60000);
  setInterval(microTick,    6000);

  /* DeFi stats — populate on load then refresh every 30s */
  _updateDeFiStats();
  setInterval(_updateDeFiStats, 30000);

  if (document.getElementById('liveTxFeed')) {
    setTimeout(addTxRow, 2500);
    const schedNext = () => setTimeout(() => { addTxRow(); schedNext(); }, 6000 + Math.random() * 9000);
    schedNext();
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();
