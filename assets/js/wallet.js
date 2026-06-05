/* ── Arc Nova Wallet Manager v2 ──────────────────────────────────────────── */
/* EIP-6963 multi-wallet, session restore, Arc Testnet auto-switch           */

'use strict';

/* ── State ── */
let activeProvider  = null;
let activeAccount   = null;
let activeSigner    = null;
let ethersProvider  = null;
let walletConnected = false;
const eip6963Wallets = new Map();

/* ── Known wallet display info ── */
const WALLET_META = {
  'MetaMask':        { emoji: '🦊', color: '#f6851b', bg: 'rgba(246,133,27,0.12)' },
  'Rabby Wallet':    { emoji: '🐰', color: '#8697ff', bg: 'rgba(134,151,255,0.12)' },
  'Coinbase Wallet': { emoji: '🔵', color: '#0052ff', bg: 'rgba(0,82,255,0.12)'   },
  'Trust Wallet':    { emoji: '🛡️', color: '#3375bb', bg: 'rgba(51,117,187,0.12)' },
  'Brave Wallet':    { emoji: '🦁', color: '#fb542b', bg: 'rgba(251,84,43,0.12)'  },
  'Frame':           { emoji: '🖼️', color: '#7c7c7c', bg: 'rgba(124,124,124,0.1)' },
  'OKX Wallet':      { emoji: '⭕', color: '#aaaaaa', bg: 'rgba(170,170,170,0.1)' },
  'Phantom':         { emoji: '👻', color: '#ab9ff2', bg: 'rgba(171,159,242,0.12)'},
};

/* ── Session helpers ── */
function _saveSession(account) {
  sessionStorage.setItem('arcnova_account', account);
}
function _clearSession() {
  sessionStorage.removeItem('arcnova_account');
}
function _saveRecentWallet(name) {
  try { localStorage.setItem('arcnova_recent_wallet', name); } catch {}
}
function _getRecentWallet() {
  try { return localStorage.getItem('arcnova_recent_wallet'); } catch { return null; }
}

/* ── EIP-6963: Listen for wallet announcements ── */
window.addEventListener('eip6963:announceProvider', ({ detail }) => {
  eip6963Wallets.set(detail.info.uuid, detail);
  _renderWalletList();
});

/* ── CSS for wallet modal ── */
function _injectWalletCSS() {
  if (document.getElementById('arcWalletCSS')) return;
  const s = document.createElement('style');
  s.id = 'arcWalletCSS';
  s.textContent = `
/* ── Wallet modal — split layout ── */
#walletModal .modal-box {
  display: flex !important; flex-direction: row !important;
  overflow: hidden !important; padding: 0 !important;
  border-radius: 20px !important; width: 556px !important;
  background: transparent !important; border: none !important;
  box-shadow: 0 32px 80px rgba(0,0,0,.72), 0 0 0 1px rgba(255,255,255,.07) !important;
}

/* Brand panel (left) */
.wlt-brand {
  width: 190px; flex-shrink: 0;
  background: linear-gradient(160deg, #0a0614 0%, #15092c 55%, #0c0c1c 100%);
  padding: 28px 22px; display: flex; flex-direction: column;
  border-right: 1px solid rgba(139,92,246,.14);
  position: relative; overflow: hidden;
}
.wlt-brand::before {
  content: ''; position: absolute; top: -50px; left: -50px;
  width: 220px; height: 220px;
  background: radial-gradient(ellipse, rgba(124,58,237,.28) 0%, transparent 70%);
  pointer-events: none;
}
.wlt-brand-logo {
  width: 46px; height: 46px;
  background: linear-gradient(135deg, #7c3aed, #22d3ee);
  border-radius: 14px; display: flex; align-items: center; justify-content: center;
  font-size: 22px; font-weight: 900; color: white;
  box-shadow: 0 0 24px rgba(124,58,237,.45);
  margin-bottom: 16px; position: relative; z-index: 1;
}
.wlt-brand-name {
  font-size: 1.05rem; font-weight: 900; color: white;
  letter-spacing: -0.02em; margin-bottom: 8px; position: relative; z-index: 1;
}
.wlt-brand-desc {
  font-size: 0.71rem; color: rgba(255,255,255,.32); line-height: 1.65;
  position: relative; z-index: 1; margin-bottom: 24px;
}
.wlt-brand-badges { margin-top: auto; display: flex; flex-direction: column; gap: 9px; position: relative; z-index: 1; }
.wlt-brand-badge { display: flex; align-items: center; gap: 7px; font-size: 0.68rem; font-weight: 600; color: rgba(255,255,255,.36); }

/* Wallet list panel (right) */
.wlt-list-panel {
  flex: 1; padding: 22px 20px 18px;
  display: flex; flex-direction: column; min-width: 0;
  background: #0f1016;
}
.wlt-panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.wlt-panel-title  { font-size: 0.95rem; font-weight: 800; color: white; letter-spacing: -0.01em; }
.wlt-panel-close  {
  width: 28px; height: 28px; border-radius: 8px;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08);
  color: rgba(255,255,255,.4); cursor: pointer; font-size: 0.85rem;
  display: flex; align-items: center; justify-content: center;
  transition: all .15s; font-family: inherit;
}
.wlt-panel-close:hover { background: rgba(255,255,255,.12); color: white; }

/* Wallet items */
.wlt-item {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 13px; border-radius: 12px;
  border: 1px solid rgba(255,255,255,.06);
  background: rgba(255,255,255,.03);
  cursor: pointer; transition: all .18s cubic-bezier(.22,1,.36,1);
  margin-bottom: 6px;
}
.wlt-item:last-child { margin-bottom: 0; }
.wlt-item:hover { background: rgba(139,92,246,.09); border-color: rgba(139,92,246,.30); transform: translateX(3px); }
.wlt-item:active { transform: scale(0.97); }
.wlt-item.wlt-recent { border-color: rgba(245,158,11,.22); background: rgba(245,158,11,.04); }

.wlt-icon { width: 40px; height: 40px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.wlt-info { flex: 1; min-width: 0; }
.wlt-name { font-weight: 700; font-size: 0.88rem; color: white; }
.wlt-sub  { font-size: 0.69rem; color: rgba(255,255,255,.32); display: flex; align-items: center; gap: 5px; margin-top: 2px; }
.wlt-sub-dot { width: 4px; height: 4px; border-radius: 50%; background: #10b981; flex-shrink: 0; }

.wlt-badge { padding: 2px 7px; border-radius: 5px; font-size: 0.61rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; flex-shrink: 0; }
.wlt-badge.recent  { background: rgba(245,158,11,.14); color: #f59e0b; border: 1px solid rgba(245,158,11,.28); }
.wlt-badge.popular { background: rgba(139,92,246,.14); color: #a78bfa; border: 1px solid rgba(139,92,246,.28); }

.wlt-arrow { color: rgba(255,255,255,.18); flex-shrink: 0; font-size: 1rem; transition: transform .15s, color .15s; }
.wlt-item:hover .wlt-arrow { transform: translateX(2px); color: rgba(255,255,255,.50); }

.wlt-section-label { font-size: .61rem; font-weight: 700; color: rgba(255,255,255,.22); letter-spacing: .08em; text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
.wlt-section-label::after { content:''; flex:1; height:1px; background:rgba(255,255,255,.06); }
.wlt-divider  { height:1px; background:rgba(255,255,255,.06); margin:12px 0; }
.wlt-footer   { font-size:.69rem; color:rgba(255,255,255,.25); display:flex; align-items:center; gap:9px; flex-wrap:wrap; padding-top:2px; }
.wlt-footer a { color:#a78bfa; font-weight:700; text-decoration:none; }
.wlt-footer a:hover { color:white; }

@keyframes wltPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.06);opacity:.8} }

@media(max-width:600px){
  #walletModal .modal-box { flex-direction:column !important; width:calc(100vw - 28px) !important; }
  .wlt-brand { width:100% !important; padding:18px 20px !important; flex-direction:row; align-items:center; gap:14px; }
  .wlt-brand::before,.wlt-brand-desc,.wlt-brand-badges { display:none !important; }
  .wlt-brand-logo { margin-bottom:0; width:36px; height:36px; font-size:17px; }
  .wlt-brand-name { font-size:.9rem; margin-bottom:0; }
  .wlt-list-panel { padding:18px 16px 16px; }
}

/* ── TX progress steps ── */
.tx-step {
  display: flex; align-items: center; gap: 12px; padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,.04);
}
.tx-step:last-child { border-bottom: none; }
.tx-step-icon {
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 16px;
}
.tx-step-icon.pending { background: rgba(245,158,11,.12); border: 1px solid rgba(245,158,11,.25); animation: stepPulse 1.5s ease infinite; }
.tx-step-icon.done    { background: rgba(16,185,129,.12); border: 1px solid rgba(16,185,129,.25); }
.tx-step-icon.error   { background: rgba(239,68,68,.1);   border: 1px solid rgba(239,68,68,.22); }
.tx-step-icon.idle    { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); }
@keyframes stepPulse {
  0%,100%{ box-shadow: 0 0 0 0 rgba(245,158,11,0); }
  50%    { box-shadow: 0 0 0 6px rgba(245,158,11,0); }
}
.tx-step-title   { font-size: 0.88rem; font-weight: 700; color: var(--text); line-height: 1.2; }
.tx-step-sub     { font-size: 0.75rem; color: var(--muted); margin-top: 1px; }
.tx-step.active .tx-step-title { color: #fbbf24; }
.tx-step.done  .tx-step-title  { color: #10b981; }
.tx-step.error .tx-step-title  { color: #f87171; }

/* ── Account avatar gradient ── */
.acct-avatar {
  width: 68px; height: 68px; border-radius: 50%;
  background: conic-gradient(#7c3aed 0deg, #a855f7 120deg, #22d3ee 240deg, #7c3aed 360deg);
  margin: 0 auto 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.6rem; font-weight: 900; color: white;
  box-shadow: 0 0 40px rgba(124,58,237,.40);
  position: relative;
}
.acct-avatar::after {
  content: '';
  position: absolute; inset: 3px; border-radius: 50%;
  background: rgba(7,7,30,.8);
  display: flex; align-items: center; justify-content: center;
}
.acct-avatar-inner {
  position: relative; z-index: 1;
  width: 62px; height: 62px; border-radius: 50%;
  background: linear-gradient(135deg, rgba(124,58,237,.4), rgba(34,211,238,.2));
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem;
}

/* ── Wrong-network banner ── */
#arcNetworkBanner {
  position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
  display: none; align-items: center; justify-content: center; gap: 10px;
  padding: 9px 16px;
  background: linear-gradient(90deg, rgba(245,158,11,.14), rgba(239,68,68,.10), rgba(245,158,11,.14));
  border-bottom: 1px solid rgba(245,158,11,.35);
  backdrop-filter: blur(12px);
  font-family: Inter, sans-serif; font-size: 0.82rem; font-weight: 600;
  color: rgba(253,230,138,.95);
  animation: slideDown .25s cubic-bezier(.22,1,.36,1) both;
}
#arcNetworkBanner.visible { display: flex; }
#arcNetworkBanner .net-banner-icon { font-size: 1rem; flex-shrink: 0; }
#arcNetworkBanner .net-banner-msg { flex: 1; text-align: center; }
#arcNetworkBanner .net-banner-btn {
  padding: 5px 14px; border-radius: 8px;
  background: rgba(245,158,11,.22); border: 1px solid rgba(245,158,11,.45);
  color: #fcd34d; font-size: 0.76rem; font-weight: 800; cursor: pointer;
  font-family: inherit; transition: all .18s; flex-shrink: 0;
  letter-spacing: 0.02em;
}
#arcNetworkBanner .net-banner-btn:hover {
  background: rgba(245,158,11,.35); border-color: rgba(245,158,11,.65);
}

/* ── Net badge ── */
.net-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px; border-radius: 100px;
  font-size: 0.72rem; font-weight: 700;
  background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.22); color: #10b981;
}
.net-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #10b981;
  box-shadow: 0 0 6px rgba(16,185,129,.6);
}

/* ── Bal row ── */
.acct-bal-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; border-radius: 10px;
  background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.05);
  margin-bottom: 8px;
}
.acct-bal-sym { font-size: 0.75rem; color: var(--muted); font-weight: 600; }
.acct-bal-val { font-size: 1rem; font-weight: 800; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }

/* ── Nav connected button ── */
.wallet-connected-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 7px 13px; border-radius: 10px;
  background: rgba(139,92,246,.10); border: 1px solid rgba(139,92,246,.28);
  color: var(--text); font-size: 0.8rem; font-weight: 700;
  cursor: pointer; transition: all 0.2s; font-family: inherit;
  letter-spacing: -0.01em;
}
.wallet-connected-btn:hover {
  background: rgba(139,92,246,.18); border-color: rgba(139,92,246,.50);
}
.wallet-net-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #10b981;
  box-shadow: 0 0 6px rgba(16,185,129,.5); flex-shrink: 0;
  animation: livePulse 2s ease infinite;
}
  `;
  document.head.appendChild(s);
}

/* ── Wrong-network banner ── */
function _injectNetworkBanner() {
  if (document.getElementById('arcNetworkBanner')) return;
  const el = document.createElement('div');
  el.id = 'arcNetworkBanner';
  el.innerHTML = `
    <span class="net-banner-icon">⚠️</span>
    <span class="net-banner-msg">You are connected to the wrong network. Please switch to <strong>Arc Testnet</strong>.</span>
    <button class="net-banner-btn" onclick="switchToArcNetwork()">Switch Network</button>
  `;
  document.body.prepend(el);
}

function _showNetworkBanner(show) {
  _injectNetworkBanner();
  const el = document.getElementById('arcNetworkBanner');
  if (!el) return;
  if (show) {
    el.classList.add('visible');
    /* push body down so banner doesn't cover nav */
    document.body.style.paddingTop = (document.body.style.paddingTop ? '' : '0');
  } else {
    el.classList.remove('visible');
  }
}

async function switchToArcNetwork() {
  if (!activeProvider) return;
  try {
    await _switchToArc(activeProvider);
    _showNetworkBanner(false);
    showToast('Switched to Arc Testnet', 'success');
    await _loadBalances();
  } catch (err) {
    showToast('Network switch failed: ' + (err.message?.slice(0, 50) || 'Unknown'), 'error');
  }
}

/* ── Inject wallet modal HTML into <body> ── */
function _injectWalletModal() {
  if (document.getElementById('walletModal')) return;
  _injectWalletCSS();

  const el = document.createElement('div');
  el.innerHTML = `
  <!-- ═══ WALLET CONNECT MODAL ═══ -->
  <div class="modal-overlay" id="walletModal">
    <div class="modal-box">
      <!-- Left: Brand panel -->
      <div class="wlt-brand">
        <div>
          <div class="wlt-brand-logo">◈</div>
          <div class="wlt-brand-name">Arc Nova</div>
          <div class="wlt-brand-desc">The DeFi hub on Arc Network. Swap, stake, and earn yield.</div>
        </div>
        <div class="wlt-brand-badges">
          <div class="wlt-brand-badge"><span>🔒</span> Non-custodial</div>
          <div class="wlt-brand-badge"><span>⚡</span> Arc Testnet</div>
          <div class="wlt-brand-badge"><span>🪂</span> Earn XP rewards</div>
        </div>
      </div>
      <!-- Right: Wallet list panel -->
      <div class="wlt-list-panel">
        <div class="wlt-panel-header">
          <div class="wlt-panel-title">Choose Wallet</div>
          <button class="wlt-panel-close" onclick="closeWalletModal()">✕</button>
        </div>
        <div id="walletList"></div>
        <div class="wlt-divider"></div>
        <div class="wlt-footer">
          <span>New?</span>
          <a href="https://metamask.io/download/" target="_blank" rel="noopener">MetaMask ↗</a>
          <span style="opacity:.35">·</span>
          <a href="https://rabby.io/" target="_blank" rel="noopener">Rabby ↗</a>
          <span style="opacity:.35">·</span>
          <a href="https://www.coinbase.com/wallet" target="_blank" rel="noopener">Coinbase ↗</a>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══ TX STATUS MODAL ═══ -->
  <div class="modal-overlay" id="txModal">
    <div class="modal-box" style="width:390px">
      <div class="modal-header" style="padding:18px 20px 14px">
        <span class="modal-title" id="txModalTitle">Transaction</span>
        <button class="modal-close" id="txModalClose" style="display:none" onclick="closeTxModal()">✕</button>
      </div>
      <div class="modal-body" style="padding:4px 20px 20px">
        <div id="txSteps"></div>
        <div id="txHashRow" style="display:none;margin-top:14px">
          <a id="txHashLink" href="#" target="_blank" class="btn btn-ghost btn-sm" style="width:100%;justify-content:center;gap:6px">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            View on Explorer
          </a>
        </div>
        <button id="txCloseBtn" style="display:none;margin-top:10px;width:100%" class="btn btn-primary" onclick="closeTxModal()">Close</button>
      </div>
    </div>
  </div>

  <!-- ═══ ACCOUNT MODAL ═══ -->
  <div class="modal-overlay" id="accountModal">
    <div class="modal-box" style="width:360px">
      <div class="modal-header" style="padding:18px 20px 14px">
        <span class="modal-title">Your Account</span>
        <button class="modal-close" onclick="closeAccountModal()">✕</button>
      </div>
      <div class="modal-body" style="padding:0 20px 20px">
        <!-- Avatar + address -->
        <div style="text-align:center;padding:12px 0 18px">
          <div class="acct-avatar">
            <div class="acct-avatar-inner">◈</div>
          </div>
          <div id="acctAddress" style="font-size:0.92rem;font-weight:800;letter-spacing:0.01em;font-family:monospace;margin-bottom:8px">—</div>
          <span class="net-badge"><span class="net-dot"></span>Arc Testnet</span>
        </div>

        <!-- Balances -->
        <div style="margin-bottom:14px">
          <div style="font-size:0.68rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">Balances</div>
          <div class="acct-bal-row">
            <span class="acct-bal-sym">USDC</span>
            <span class="acct-bal-val" id="acctUSDC" style="color:var(--green)">—</span>
          </div>
          <div class="acct-bal-row">
            <span class="acct-bal-sym">NOVA</span>
            <span class="acct-bal-val" id="acctNOVA" style="color:var(--lavender)">—</span>
          </div>
        </div>

        <!-- Actions -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <button class="btn btn-ghost" onclick="copyWalletAddress()" style="font-size:0.82rem;border-radius:10px;gap:6px;padding:10px">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy Address
          </button>
          <a id="acctExplorerBtn" href="#" target="_blank" class="btn btn-ghost" style="font-size:0.82rem;border-radius:10px;gap:6px;padding:10px;text-decoration:none;justify-content:center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Explorer
          </a>
        </div>
        <button class="btn btn-ghost" style="width:100%;font-size:0.82rem;border-radius:10px;border-color:rgba(239,68,68,.28);color:#f87171;gap:6px" onclick="_disconnect();closeAccountModal()">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Disconnect Wallet
        </button>
      </div>
    </div>
  </div>`;

  document.body.appendChild(el);
}

/* ── Collect all available providers ── */
function _collectWallets() {
  const wallets = [];
  const seen    = new Set();

  eip6963Wallets.forEach(({ info, provider }) => {
    wallets.push({ name: info.name, iconUrl: info.icon, uuid: info.uuid, provider });
    seen.add(info.uuid);
  });

  if (Array.isArray(window.ethereum?.providers)) {
    window.ethereum.providers.forEach((prov, i) => {
      const uuid = 'legacy-' + i;
      if (seen.has(uuid)) return;
      const name = prov.isRabby         ? 'Rabby Wallet'    :
                   prov.isCoinbaseWallet ? 'Coinbase Wallet' :
                   prov.isMetaMask       ? 'MetaMask'        : 'Browser Wallet';
      wallets.push({ name, iconUrl: null, uuid, provider: prov });
      seen.add(uuid);
    });
  }

  if (wallets.length === 0 && window.ethereum) {
    const name = window.ethereum.isRabby         ? 'Rabby Wallet'    :
                 window.ethereum.isCoinbaseWallet ? 'Coinbase Wallet' :
                 window.ethereum.isMetaMask       ? 'MetaMask'        : 'Browser Wallet';
    wallets.push({ name, iconUrl: null, uuid: 'injected', provider: window.ethereum });
  }

  return wallets;
}

/* ── Render wallet list inside modal ── */
function _renderWalletList() {
  const list = document.getElementById('walletList');
  if (!list) return;

  const wallets = _collectWallets();
  const recent  = _getRecentWallet();

  if (wallets.length === 0) {
    list.innerHTML = `
      <div style="padding:8px 0 4px">
        <div style="font-size:.61rem;font-weight:700;color:rgba(255,255,255,.22);letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px">No wallets found</div>
        <div style="font-size:0.82rem;color:rgba(255,255,255,.38);line-height:1.7;margin-bottom:16px">
          Install a browser wallet extension then click retry.
        </div>
        <button onclick="_retryDetect()" style="width:100%;padding:10px;border-radius:10px;background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.28);color:#a78bfa;font-size:.82rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .18s" onmouseover="this.style.background='rgba(139,92,246,.20)'" onmouseout="this.style.background='rgba(139,92,246,.12)'">
          ↺ Retry Detection
        </button>
      </div>`;
    return;
  }

  /* Sort: recent wallet first */
  const sorted = recent
    ? [...wallets.filter(w => w.name === recent), ...wallets.filter(w => w.name !== recent)]
    : wallets;

  const header = `<div class="wlt-section-label">${wallets.length} wallet${wallets.length !== 1 ? 's' : ''} detected</div>`;

  const items = sorted.map((w, i) => {
    const meta     = WALLET_META[w.name] || { emoji: '👛', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' };
    const isRecent = w.name === recent;
    const isPopular = i === 0 && ['MetaMask', 'Rabby Wallet', 'Coinbase Wallet'].includes(w.name) && !isRecent;

    const icon = w.iconUrl
      ? `<img src="${w.iconUrl}" style="width:40px;height:40px;border-radius:11px;object-fit:contain" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="wlt-icon" style="display:none;background:${meta.bg};color:${meta.color}">${meta.emoji}</div>`
      : `<div class="wlt-icon" style="background:${meta.bg};color:${meta.color}">${meta.emoji}</div>`;

    const badge = isRecent
      ? `<span class="wlt-badge recent">Recent</span>`
      : (isPopular ? `<span class="wlt-badge popular">Popular</span>` : '');

    return `
      <div class="wlt-item ${isRecent ? 'wlt-recent' : ''}" onclick="_connect('${w.uuid}')">
        ${icon}
        <div class="wlt-info">
          <div class="wlt-name">${w.name}</div>
          <div class="wlt-sub"><span class="wlt-sub-dot"></span>Ready to connect</div>
        </div>
        ${badge}
        <span class="wlt-arrow">›</span>
      </div>`;
  }).join('');

  list.innerHTML = header + items;
}

/* ── Manual retry detection ── */
function _retryDetect() {
  const list = document.getElementById('walletList');
  if (list) list.innerHTML = `
    <div style="text-align:center;padding:24px 0">
      <div style="font-size:22px;margin-bottom:12px;animation:spin 1.2s linear infinite;display:inline-block">↻</div>
      <div style="color:rgba(255,255,255,.45);font-size:0.83rem;font-weight:600">Scanning for wallets…</div>
    </div>`;
  window.dispatchEvent(new Event('eip6963:requestProvider'));
  let tries = 0;
  const check = () => {
    _renderWalletList();
    if (_collectWallets().length === 0 && ++tries < 5) setTimeout(check, 600);
  };
  setTimeout(check, 400);
}

/* ── Show connecting state ── */
function _showConnecting(walletName) {
  const meta = WALLET_META[walletName] || { emoji: '👛', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' };
  const list = document.getElementById('walletList');
  if (list) list.innerHTML = `
    <div style="text-align:center;padding:20px 0 12px">
      <div style="width:60px;height:60px;border-radius:16px;background:${meta.bg};border:1px solid ${meta.color}44;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 16px;animation:wltPulse 1.6s ease-in-out infinite">
        ${meta.emoji}
      </div>
      <div style="font-weight:800;font-size:0.92rem;color:white;margin-bottom:6px">${walletName}</div>
      <div style="font-size:0.76rem;color:rgba(255,255,255,.35);margin-bottom:16px">Open your wallet to approve…</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:0.73rem;color:#a78bfa;font-weight:600">
        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#a78bfa;animation:wltPulse 1s ease infinite"></span>
        Waiting for approval
      </div>
    </div>`;
}

/* ── Resolve provider from uuid ── */
function _resolveProvider(uuid) {
  if (uuid === 'injected') return window.ethereum;
  if (uuid.startsWith('legacy-')) return window.ethereum?.providers?.[parseInt(uuid.split('-')[1], 10)];
  return eip6963Wallets.get(uuid)?.provider;
}

/* ── Connect to selected wallet ── */
async function _connect(uuid) {
  const prov    = _resolveProvider(uuid);
  if (!prov) { showToast('Provider not found', 'error'); return; }
  const wallets = _collectWallets();
  const w       = wallets.find(x => x.uuid === uuid);
  if (w) _showConnecting(w.name);

  try {
    const accounts = await prov.request({ method: 'eth_requestAccounts' });
    if (!accounts?.length) throw new Error('No accounts returned');

    await _switchToArc(prov);
    await _activateProvider(prov, accounts[0]);
    if (w) _saveRecentWallet(w.name);

    closeWalletModal();
    showToast('Wallet connected! Welcome to Arc Nova 🎉', 'success');
    document.dispatchEvent(new CustomEvent('arcWalletConnected'));
    await _loadBalances();
    if (typeof initDemoBalances === 'function') initDemoBalances();

    prov.on('accountsChanged', accs => {
      if (!accs.length) { _disconnect(); return; }
      activeAccount = accs[0];
      _saveSession(activeAccount);
      _updateNavUI();
      _loadBalances();
    });
    prov.on('chainChanged', chainId => {
      _showNetworkBanner(chainId !== ARC_CHAIN_HEX);
      if (chainId === ARC_CHAIN_HEX) {
        ethersProvider = new ethers.providers.Web3Provider(prov, 'any');
        activeSigner   = ethersProvider.getSigner();
        _loadBalances();
      }
    });

  } catch (err) {
    _renderWalletList();
    if (err.code === 4001) showToast('Connection rejected', 'error');
    else showToast('Error: ' + (err.message?.slice(0, 60) || 'Unknown'), 'error');
  }
}

/* ── Shared provider activation ── */
async function _activateProvider(prov, account) {
  activeProvider  = prov;
  activeAccount   = account;
  ethersProvider  = new ethers.providers.Web3Provider(prov, 'any');
  activeSigner    = ethersProvider.getSigner();
  walletConnected = true;
  _saveSession(account);
  _updateNavUI();
  /* Check current chain and show banner if wrong */
  try {
    const chainId = await prov.request({ method: 'eth_chainId' });
    _showNetworkBanner(chainId !== ARC_CHAIN_HEX);
  } catch {}
}

/* ── Switch to / add Arc Testnet ── */
async function _switchToArc(prov) {
  try {
    await prov.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ARC_CHAIN_HEX }] });
  } catch (err) {
    if (err.code === 4902 || err.code === -32603) {
      await prov.request({ method: 'wallet_addEthereumChain', params: [ARC_TESTNET_PARAMS] });
    } else throw err;
  }
}

/* ── Update nav button ── */
function _updateNavUI() {
  if (!activeAccount) return;
  const short = activeAccount.slice(0, 6) + '…' + activeAccount.slice(-4);

  document.querySelectorAll('#walletBtn').forEach(btn => {
    btn.className = 'wallet-connected-btn';
    btn.innerHTML = `<span class="wallet-net-dot"></span>${short}`;
    btn.onclick = openAccountModal;
  });

  document.querySelectorAll('.wallet-address').forEach(el => el.textContent = short);
  const ub = document.getElementById('userBalance');
  if (ub && ub.textContent === '—') ub.textContent = '…';
}

/* ── Disconnect ── */
function _disconnect() {
  activeProvider = activeAccount = activeSigner = ethersProvider = null;
  walletConnected = false;
  _clearSession();

  document.querySelectorAll('#walletBtn').forEach(btn => {
    btn.className = 'btn btn-primary';
    btn.textContent = 'Connect Wallet';
    btn.onclick = openWalletModal;
  });
  showToast('Wallet disconnected', 'info');
}

/* ── Silently restore session on page load ── */
async function _tryRestoreSession() {
  const saved = sessionStorage.getItem('arcnova_account');
  if (!saved) return;

  for (let i = 0; i < 6; i++) {
    const wallets = _collectWallets();
    if (wallets.length > 0) {
      for (const w of wallets) {
        try {
          const accounts = await w.provider.request({ method: 'eth_accounts' });
          if (accounts.map(a => a.toLowerCase()).includes(saved.toLowerCase())) {
            try { await _switchToArc(w.provider); } catch {}
            await _activateProvider(w.provider, accounts.find(a => a.toLowerCase() === saved.toLowerCase()));
            await _loadBalances();
            if (typeof initDemoBalances === 'function') initDemoBalances();
            w.provider.on('accountsChanged', accs => {
              if (!accs.length) { _disconnect(); return; }
              activeAccount = accs[0];
              _saveSession(activeAccount);
              _updateNavUI();
              _loadBalances();
            });
            w.provider.on('chainChanged', chainId => {
              _showNetworkBanner(chainId !== ARC_CHAIN_HEX);
              if (chainId === ARC_CHAIN_HEX) {
                ethersProvider = new ethers.providers.Web3Provider(w.provider, 'any');
                activeSigner   = ethersProvider.getSigner();
                _loadBalances();
              }
            });
            return;
          }
        } catch {}
      }
    }
    await new Promise(r => setTimeout(r, 250));
  }
  _clearSession();
}

/* ── Load on-chain balances ── */
async function _loadBalances() {
  if (!activeAccount || !ethersProvider) return;
  try {
    let novaStr = '—', usdcStr = '—';

    if (isDeployed(CONTRACT_ADDRESSES.NOVA_TOKEN)) {
      const novaC   = new ethers.Contract(CONTRACT_ADDRESSES.NOVA_TOKEN, ERC20_ABI, ethersProvider);
      const novaBal = await novaC.balanceOf(activeAccount);
      const nova    = parseFloat(ethers.utils.formatEther(novaBal)).toFixed(2);
      novaStr = nova + ' NOVA';
      document.querySelectorAll('.balance-nova').forEach(el => el.textContent = novaStr);
      const fb = document.getElementById('fromBal');
      if (fb) fb.textContent = novaStr;
    }

    const usdcC   = new ethers.Contract(CONTRACT_ADDRESSES.USDC, ERC20_ABI, ethersProvider);
    const usdcBal = await usdcC.balanceOf(activeAccount);
    const usdc    = parseFloat(ethers.utils.formatUnits(usdcBal, 6)).toFixed(2);
    usdcStr = usdc + ' USDC';
    document.querySelectorAll('.balance-usdc').forEach(el => el.textContent = usdcStr);
    const ub = document.getElementById('userBalance');
    if (ub) ub.textContent = usdcStr;
    const tb = document.getElementById('toBal');
    if (tb) tb.textContent = usdcStr;

    /* Update account modal balances live */
    const acctU = document.getElementById('acctUSDC');
    const acctN = document.getElementById('acctNOVA');
    if (acctU) acctU.textContent = usdcStr;
    if (acctN) acctN.textContent = novaStr;

    if (isDeployed(CONTRACT_ADDRESSES.STAKING)) {
      const sc   = new ethers.Contract(CONTRACT_ADDRESSES.STAKING, STAKING_ABI, ethersProvider);
      const info = await sc.getUserInfo(activeAccount);
      const staked    = parseFloat(ethers.utils.formatEther(info[0]));
      const pending   = parseFloat(ethers.utils.formatEther(info[1]));
      const unbonding = parseFloat(ethers.utils.formatEther(info[2]));
      const unbondEnd = info[3].toNumber();

      document.querySelectorAll('#stakedValue, #miniStakedValue').forEach(el => {
        el.textContent = staked > 0 ? staked.toFixed(2) + ' NOVA' : '—';
      });
      document.querySelectorAll('#earnedRewards, #miniEarnedRewards').forEach(el => {
        el.textContent = pending > 0 ? pending.toFixed(4) + ' NOVA' : '—';
      });
      const unb = document.getElementById('unbondingDisplay');
      if (unb) {
        if (unbonding > 0) {
          const now  = Math.floor(Date.now() / 1000);
          const left = unbondEnd > now
            ? Math.ceil((unbondEnd - now) / 3600) + 'h left'
            : 'ready to withdraw';
          unb.textContent = unbonding.toFixed(2) + ' NOVA (' + left + ')';
        } else { unb.textContent = '—'; }
      }
    }
  } catch (e) {
    console.warn('Balance load:', e.message);
  }
}

/* ── TX Status Modal — step-based ── */
let _txStepState = [];

function _renderTxSteps() {
  const el = document.getElementById('txSteps');
  if (!el) return;
  el.innerHTML = _txStepState.map(step => `
    <div class="tx-step ${step.state}">
      <div class="tx-step-icon ${step.state}">${step.icon}</div>
      <div style="flex:1">
        <div class="tx-step-title">${step.title}</div>
        <div class="tx-step-sub">${step.sub}</div>
      </div>
    </div>`).join('');
}

function openTxModal(title, desc) {
  const m = document.getElementById('txModal');
  if (!m) return;
  const titleEl = document.getElementById('txModalTitle');
  const closeBtn = document.getElementById('txModalClose');
  if (titleEl) titleEl.textContent = title;
  if (closeBtn) closeBtn.style.display = 'none';
  document.getElementById('txHashRow').style.display  = 'none';
  document.getElementById('txCloseBtn').style.display = 'none';
  _txStepState = [
    { icon: '✍️', title: 'Confirm in Wallet', sub: desc || 'Approve this transaction in your wallet extension', state: 'active' },
    { icon: '📡', title: 'Broadcasting',      sub: 'Sending transaction to Arc Network',                      state: 'idle'   },
    { icon: '✅', title: 'Confirmed',          sub: 'Transaction finalized on-chain',                          state: 'idle'   },
  ];
  _renderTxSteps();
  m.classList.add('open');
}

function txPending(hash) {
  _txStepState[0].state = 'done';
  _txStepState[0].icon  = '✅';
  _txStepState[1].state = 'active';
  _renderTxSteps();
  const row  = document.getElementById('txHashRow');
  const link = document.getElementById('txHashLink');
  if (row && link) {
    link.href = `${EXPLORER}/tx/${hash}`;
    row.style.display = 'block';
  }
}

function txSuccess(msg) {
  _txStepState[0].state = 'done'; _txStepState[0].icon = '✅';
  _txStepState[1].state = 'done'; _txStepState[1].icon = '✅';
  _txStepState[2].state = 'done'; _txStepState[2].sub  = msg;
  _renderTxSteps();
  const closeBtn = document.getElementById('txCloseBtn');
  const modalClose = document.getElementById('txModalClose');
  if (closeBtn) closeBtn.style.display = 'block';
  if (modalClose) modalClose.style.display = 'flex';
  _loadBalances();
}

function txError(msg) {
  const pendingIdx = _txStepState.findIndex(s => s.state === 'active');
  const idx = pendingIdx >= 0 ? pendingIdx : 0;
  _txStepState[idx].state = 'error';
  _txStepState[idx].icon  = '❌';
  _txStepState[idx].sub   = msg;
  _renderTxSteps();
  const closeBtn = document.getElementById('txCloseBtn');
  const modalClose = document.getElementById('txModalClose');
  if (closeBtn) closeBtn.style.display = 'block';
  if (modalClose) modalClose.style.display = 'flex';
}

function closeTxModal() {
  document.getElementById('txModal')?.classList.remove('open');
}

/* ── Public API ── */
function openWalletModal() {
  _injectWalletCSS();
  document.getElementById('walletModal')?.classList.add('open');
  window.dispatchEvent(new Event('eip6963:requestProvider'));
  [100, 500, 1200].forEach(ms => setTimeout(_renderWalletList, ms));
}

function closeWalletModal() {
  document.getElementById('walletModal')?.classList.remove('open');
}

function openAccountModal() {
  if (!walletConnected) { openWalletModal(); return; }
  const modal = document.getElementById('accountModal');
  if (!modal) return;
  const short = activeAccount ? activeAccount.slice(0, 6) + '…' + activeAccount.slice(-4) : '—';
  const addrEl = document.getElementById('acctAddress');
  if (addrEl) addrEl.textContent = short;

  /* Balances */
  const ub = document.getElementById('userBalance');
  const acctU = document.getElementById('acctUSDC');
  const acctN = document.getElementById('acctNOVA');
  if (acctU && ub) acctU.textContent = (ub.textContent && ub.textContent !== '—' && ub.textContent !== '…') ? ub.textContent : '—';
  if (acctN) {
    const balNova = document.querySelector('.balance-nova');
    acctN.textContent = balNova?.textContent || '—';
  }

  /* Explorer link */
  const expBtn = document.getElementById('acctExplorerBtn');
  if (expBtn && activeAccount) expBtn.href = `${EXPLORER}/address/${activeAccount}`;

  modal.classList.add('open');
}

function closeAccountModal() {
  document.getElementById('accountModal')?.classList.remove('open');
}

function copyWalletAddress() {
  if (!activeAccount) return;
  navigator.clipboard?.writeText(activeAccount)
    .then(() => showToast('Address copied to clipboard!', 'success'))
    .catch(() => showToast(activeAccount.slice(0,6)+'…'+activeAccount.slice(-4), 'info'));
}

function connectWallet() { openWalletModal(); }

/* ── Init on DOM ready ── */
document.addEventListener('DOMContentLoaded', () => {
  _injectWalletModal();

  document.querySelectorAll('#walletBtn').forEach(btn => {
    btn.onclick = openWalletModal;
  });

  document.addEventListener('click', e => {
    if (e.target.id === 'walletModal')  closeWalletModal();
    if (e.target.id === 'txModal')      closeTxModal();
    if (e.target.id === 'accountModal') closeAccountModal();
  });

  window.dispatchEvent(new Event('eip6963:requestProvider'));
  let polls = 0;
  const poll = setInterval(() => {
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    if (window.ethereum || ++polls >= 6) clearInterval(poll);
  }, 500);

  _tryRestoreSession();
});
