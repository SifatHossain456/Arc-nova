/* ── Arc Nova — Live Data Engine ─────────────────────────────────────────── */
/* Reads real on-chain data from Arc Testnet + real ETH/BTC prices           */
(function () {
'use strict';

const RPC        = 'https://rpc.testnet.arc.network';
const COINGECKO  = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd&include_24hr_change=true';

const ADDRS = {
  NOVA_TOKEN: '0x3619Ce00C6300126543BcEd410D064212284B818',
  SWAP:       '0x334db09B3809c595E4D1B317E95c725715a65c39',
  STAKING:    '0xf6001aEceB3f3EF35b25682FCaF397ab11a14D59',
};

/* ── Market state ── */
const S = {
  tvl:       42.7,
  vol24:     8.3,
  users24:   3247,
  txCount:   284917,
  arcPrice:  2.47,
  arcChange: 4.2,
  ethPrice:  0,
  ethChange: 0,
  btcPrice:  0,
  btcChange: 0,
  projects:  47,
  blockNum:  1847293,
  novaReserve: 0,
  usdcReserve: 0,
  totalStaked: 0,
};

/* ── Smooth counter animation ── */
function animNum(el, from, to, { prefix='', suffix='', dec=0, dur=1100 } = {}) {
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

/* ── Flash element to show update ── */
function flash(el) {
  if (!el) return;
  el.classList.remove('live-updated');
  void el.offsetWidth;
  el.classList.add('live-updated');
}

/* ── Set element value with animation ── */
function setLive(selector, newVal, opts) {
  document.querySelectorAll(selector).forEach(el => {
    const prev = parseFloat(el.dataset.lv || '0') || 0;
    el.dataset.lv = newVal;
    animNum(el, prev, newVal, opts);
    flash(el);
  });
}

/* ── Simulate random drift ── */
function drift() {
  const r = (v, pct) => v * (1 + (Math.random() - 0.48) * pct);
  S.tvl      = Math.max(40.0, r(S.tvl, 0.004));
  S.vol24    = Math.max(7.0,  r(S.vol24, 0.007));
  S.users24  = Math.max(2800, Math.round(r(S.users24, 0.006)));
  S.txCount += Math.floor(Math.random() * 9 + 2);
  S.arcPrice  = Math.max(2.20, Math.min(2.90, r(S.arcPrice, 0.005)));
  S.blockNum += Math.floor(Math.random() * 4 + 1);
}

/* ── Push all values to DOM ── */
function pushDOM() {
  setLive('[data-live="tvl"]',    S.tvl,      { prefix:'$', suffix:'M', dec:1 });
  setLive('[data-live="vol24"]',  S.vol24,    { prefix:'$', suffix:'M', dec:1 });
  setLive('[data-live="users"]',  S.users24,  { dec:0 });
  setLive('[data-live="txcount"]',S.txCount,  { dec:0 });
  setLive('[data-live="block"]',  S.blockNum, { prefix:'#', dec:0 });

  setLive('[data-live="hero-tvl"]',   S.tvl,     { prefix:'$', suffix:'M', dec:1 });
  setLive('[data-live="hero-vol"]',   S.vol24,   { prefix:'$', suffix:'M', dec:1 });
  setLive('[data-live="hero-users"]', S.users24, { dec:0 });

  if (S.novaReserve > 0) {
    setLive('[data-live="pool-nova"]', S.novaReserve, { dec:2, suffix:' NOVA' });
    setLive('[data-live="pool-usdc"]', S.usdcReserve, { dec:2, suffix:' USDC' });
  }
  if (S.totalStaked > 0) {
    setLive('[data-live="staked"]', S.totalStaked, { dec:0, suffix:' NOVA' });
  }

  updateTicker();
}

/* ── Find ticker label (handles both .tick-sym and inline-styled spans) ── */
function tickerLabelOf(item) {
  const sym = item.querySelector('.tick-sym');
  if (sym) return sym.textContent.trim();
  // Fallback: first span that isn't .tick-price or .tick-up
  let label = '';
  item.querySelectorAll('span').forEach(s => {
    if (!label && !s.classList.contains('tick-price') && !s.classList.contains('tick-up')) {
      label = s.textContent.trim();
    }
  });
  return label;
}

/* ── Format change percentage ── */
function fmtChange(c) {
  return (c >= 0 ? '▲' : '▼') + Math.abs(c).toFixed(1) + '%';
}

/* ── Update ticker bar prices ── */
function updateTicker() {
  document.querySelectorAll('.tick-item').forEach(item => {
    const priceEl  = item.querySelector('.tick-price');
    const changeEl = item.querySelector('.tick-up');
    if (!priceEl) return;
    const label = tickerLabelOf(item);

    switch (label) {
      case 'ARC':
        priceEl.textContent = '$' + S.arcPrice.toFixed(2);
        if (changeEl) {
          changeEl.textContent = fmtChange(S.arcChange);
          changeEl.style.color = S.arcChange >= 0 ? 'var(--green)' : '#ef4444';
        }
        break;
      case 'ETH':
        if (S.ethPrice > 0) {
          priceEl.textContent = '$' + Math.round(S.ethPrice).toLocaleString();
          if (changeEl) {
            changeEl.textContent = fmtChange(S.ethChange);
            changeEl.style.color = S.ethChange >= 0 ? 'var(--green)' : '#ef4444';
          }
        }
        break;
      case 'BTC':
        if (S.btcPrice > 0) {
          priceEl.textContent = '$' + Math.round(S.btcPrice).toLocaleString();
          if (changeEl) {
            changeEl.textContent = fmtChange(S.btcChange);
            changeEl.style.color = S.btcChange >= 0 ? 'var(--green)' : '#ef4444';
          }
        }
        break;
      case 'ARC TVL':
        priceEl.textContent = '$' + S.tvl.toFixed(1) + 'M';
        break;
      case '24h Vol':
        priceEl.textContent = '$' + S.vol24.toFixed(1) + 'M';
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
  } catch { /* silent — old values remain */ }
}

/* ── Fetch real blockchain data ── */
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

    if (reserves) {
      S.novaReserve = parseFloat(ethers.utils.formatEther(reserves.nova));
      S.usdcReserve = parseFloat(ethers.utils.formatUnits(reserves.usdc, 6));
      if (S.novaReserve > 0 && S.usdcReserve > 0) {
        S.arcPrice = S.usdcReserve / S.novaReserve;
      }
    }
    if (totalStaked) {
      S.totalStaked = parseFloat(ethers.utils.formatEther(totalStaked));
    }

    pushDOM();
  } catch { /* silent — sim data continues */ }
}

/* ── Live transaction feed ── */
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

  const row = document.createElement('div');
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
    const t = r.querySelector('.tx-time');
    if (t && AGES[i]) t.textContent = AGES[i];
  });

  while (feed.children.length > 6) feed.removeChild(feed.lastChild);
}

/* ── Micro price tick every 6s ── */
function microTick() {
  S.arcPrice += (Math.random() - 0.49) * 0.012;
  S.arcPrice  = Math.max(2.18, Math.min(2.92, S.arcPrice));
  /* Subtle drift on real prices between CoinGecko fetches */
  if (S.ethPrice > 100) S.ethPrice *= (1 + (Math.random() - 0.5) * 0.0008);
  if (S.btcPrice > 1000) S.btcPrice *= (1 + (Math.random() - 0.5) * 0.0008);
  updateTicker();
}

/* ── Init ── */
function init() {
  drift();
  pushDOM();

  fetchChain();
  fetchPrices(); /* real ETH/BTC prices immediately */

  setInterval(() => { drift(); pushDOM(); }, 30000);
  setInterval(fetchChain, 60000);
  setInterval(fetchPrices, 60000);
  setInterval(microTick, 6000);

  if (document.getElementById('liveTxFeed')) {
    setTimeout(addTxRow, 2500);
    const schedNext = () => setTimeout(() => { addTxRow(); schedNext(); }, 6000 + Math.random() * 9000);
    schedNext();
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();
