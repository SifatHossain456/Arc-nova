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
/* ── Wallet modal — list-left / info-right layout ── */
#walletModal .modal-box {
  display: flex !important; flex-direction: row !important;
  overflow: hidden !important; padding: 0 !important;
  border-radius: 20px !important; width: 680px !important;
  min-height: 460px !important; max-height: 540px !important;
  background: transparent !important; border: none !important;
  box-shadow: 0 32px 80px rgba(0,0,0,.75), 0 0 0 1px rgba(255,255,255,.07) !important;
}

/* ── Left: wallet list ── */
.wlt-left {
  width: 248px; flex-shrink: 0;
  background: #16161a;
  border-right: 1px solid rgba(255,255,255,.07);
  display: flex; flex-direction: column;
}
.wlt-left-title {
  padding: 22px 18px 16px;
  font-size: 1rem; font-weight: 800; color: white;
  letter-spacing: -0.01em; flex-shrink: 0;
  border-bottom: 1px solid rgba(255,255,255,.05);
}
.wlt-left-scroll {
  flex: 1; overflow-y: auto; padding: 12px 10px 14px;
  scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.08) transparent;
}
.wlt-section {
  font-size: .61rem; font-weight: 700; color: rgba(255,255,255,.28);
  letter-spacing: .08em; text-transform: uppercase;
  padding: 0 6px; margin: 14px 0 6px;
}
.wlt-section:first-child { margin-top: 2px; }

/* Wallet row items */
.wlt-item {
  display: flex; align-items: center; gap: 11px;
  padding: 9px 8px; border-radius: 10px;
  cursor: pointer; transition: background .14s;
  margin-bottom: 2px;
}
.wlt-item:hover   { background: rgba(255,255,255,.08); }
.wlt-item:active  { background: rgba(255,255,255,.04); }
.wlt-item.wlt-active { background: rgba(139,92,246,.16); }
.wlt-item.wlt-recent { background: rgba(245,158,11,.06); }
.wlt-item.wlt-recent:hover { background: rgba(245,158,11,.10); }

.wlt-icon {
  width: 36px; height: 36px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0;
}
.wlt-name { font-weight: 600; font-size: 0.86rem; color: rgba(255,255,255,.88); flex: 1; min-width: 0; }
.wlt-badge { padding: 1px 6px; border-radius: 4px; font-size: .58rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; flex-shrink: 0; }
.wlt-badge.recent  { background: rgba(245,158,11,.14); color: #f59e0b; }
.wlt-badge.popular { background: rgba(139,92,246,.14); color: #a78bfa; }

/* Install rows (not installed) */
.wlt-item.wlt-install { opacity: .52; }
.wlt-item.wlt-install:hover { opacity: .78; background: rgba(255,255,255,.06); }
.wlt-install-tag { font-size: .65rem; color: rgba(255,255,255,.28); flex-shrink: 0; }

/* ── Right: info / connecting panel ── */
.wlt-right {
  flex: 1; background: #0f1016;
  display: flex; flex-direction: column;
  position: relative; min-width: 0;
}
.wlt-right-close {
  position: absolute; top: 14px; right: 14px; z-index: 2;
  width: 28px; height: 28px; border-radius: 8px;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08);
  color: rgba(255,255,255,.38); cursor: pointer; font-size: .82rem;
  display: flex; align-items: center; justify-content: center;
  transition: all .15s; font-family: inherit;
}
.wlt-right-close:hover { background: rgba(255,255,255,.12); color: white; }

/* Info content (default state) */
.wlt-info {
  flex: 1; padding: 28px 26px 24px;
  display: flex; flex-direction: column;
}
.wlt-info-title {
  font-size: 1.05rem; font-weight: 800; color: white;
  letter-spacing: -0.02em; margin-bottom: 22px; margin-top: 4px;
}
.wlt-info-blocks { display: flex; flex-direction: column; gap: 16px; flex: 1; }
.wlt-info-block  { display: flex; gap: 14px; align-items: flex-start; }
.wlt-info-icon   {
  width: 46px; height: 46px; border-radius: 13px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 21px;
}
.wlt-info-block-title { font-size: .88rem; font-weight: 700; color: white; margin-bottom: 4px; }
.wlt-info-block-desc  { font-size: .76rem; color: rgba(255,255,255,.36); line-height: 1.65; }
.wlt-info-actions { display: flex; gap: 8px; margin-top: 22px; }
.wlt-btn-primary {
  flex: 1; padding: 11px 14px; border-radius: 12px;
  background: #7c3aed; border: none; color: white;
  font-size: .83rem; font-weight: 700; cursor: pointer;
  font-family: inherit; transition: background .18s; text-decoration: none;
  display: flex; align-items: center; justify-content: center;
}
.wlt-btn-primary:hover { background: #6d28d9; }
.wlt-btn-ghost {
  flex: 1; padding: 11px 14px; border-radius: 12px;
  background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09);
  color: rgba(255,255,255,.55); font-size: .83rem; font-weight: 600;
  cursor: pointer; font-family: inherit; transition: all .18s;
  text-decoration: none; display: flex; align-items: center; justify-content: center;
}
.wlt-btn-ghost:hover { background: rgba(255,255,255,.10); color: rgba(255,255,255,.85); }

/* Connecting state */
.wlt-connecting {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; padding: 24px;
  text-align: center;
}
@keyframes wltPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }

/* Mobile */
@media(max-width:640px){
  #walletModal .modal-box { flex-direction:column !important; width:calc(100vw - 28px) !important; min-height:unset !important; max-height:88vh !important; }
  .wlt-left { width:100% !important; border-right:none !important; border-bottom:1px solid rgba(255,255,255,.07) !important; max-height:230px; }
  .wlt-right { min-height:220px; }
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
      <!-- Left: wallet list -->
      <div class="wlt-left">
        <div class="wlt-left-title">Connect a Wallet</div>
        <div class="wlt-left-scroll">
          <div id="walletList"></div>
        </div>
      </div>
      <!-- Right: info panel -->
      <div class="wlt-right" id="wltRightPanel">
        <button class="wlt-right-close" onclick="closeWalletModal()">✕</button>
        <div class="wlt-info">
          <div class="wlt-info-title">What is a Wallet?</div>
          <div class="wlt-info-blocks">
            <div class="wlt-info-block">
              <div class="wlt-info-icon" style="background:rgba(124,58,237,.12);border:1px solid rgba(124,58,237,.2)">🏦</div>
              <div>
                <div class="wlt-info-block-title">A Home for Your Assets</div>
                <div class="wlt-info-block-desc">Wallets are used to send, receive, and store digital assets like tokens and NFTs.</div>
              </div>
            </div>
            <div class="wlt-info-block">
              <div class="wlt-info-icon" style="background:rgba(34,211,238,.10);border:1px solid rgba(34,211,238,.18)">🔑</div>
              <div>
                <div class="wlt-info-block-title">A New Way to Sign In</div>
                <div class="wlt-info-block-desc">No passwords. Connect your wallet once to access any Web3 app instantly.</div>
              </div>
            </div>
            <div class="wlt-info-block">
              <div class="wlt-info-icon" style="background:rgba(245,158,11,.10);border:1px solid rgba(245,158,11,.18)">🪂</div>
              <div>
                <div class="wlt-info-block-title">Earn XP on Arc Nova</div>
                <div class="wlt-info-block-desc">Every swap and stake earns you XP toward your NOVA airdrop allocation.</div>
              </div>
            </div>
          </div>
          <div class="wlt-info-actions">
            <a href="https://metamask.io/download/" target="_blank" rel="noopener" class="wlt-btn-primary">Get a Wallet ↗</a>
            <a href="https://docs.arc.network/" target="_blank" rel="noopener" class="wlt-btn-ghost">Learn More</a>
          </div>
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

  const POPULAR_WALLETS = [
    { name:'MetaMask',        emoji:'🦊', color:'#f6851b', bg:'rgba(246,133,27,0.12)',  url:'https://metamask.io/download/' },
    { name:'Rabby Wallet',    emoji:'🐰', color:'#8697ff', bg:'rgba(134,151,255,0.12)', url:'https://rabby.io/' },
    { name:'Coinbase Wallet', emoji:'🔵', color:'#0052ff', bg:'rgba(0,82,255,0.12)',    url:'https://www.coinbase.com/wallet' },
    { name:'Phantom',         emoji:'👻', color:'#ab9ff2', bg:'rgba(171,159,242,0.12)', url:'https://phantom.app/' },
  ];

  if (wallets.length === 0) {
    const popularItems = POPULAR_WALLETS.map(p => `
      <a href="${p.url}" target="_blank" rel="noopener" class="wlt-item wlt-install" style="text-decoration:none">
        <div class="wlt-icon" style="background:${p.bg};color:${p.color}">${p.emoji}</div>
        <span class="wlt-name">${p.name}</span>
        <span class="wlt-install-tag">Install ↗</span>
      </a>`).join('');
    list.innerHTML = `
      <div class="wlt-section">Popular</div>
      ${popularItems}
      <div style="margin-top:12px;padding:10px 8px">
        <button onclick="_retryDetect()" style="width:100%;padding:8px;border-radius:9px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.45);font-size:.78rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s" onmouseover="this.style.background='rgba(255,255,255,.09)'" onmouseout="this.style.background='rgba(255,255,255,.05)'">
          ↺ Retry Detection
        </button>
      </div>`;
    return;
  }

  /* Sort: recent wallet first */
  const sorted = recent
    ? [...wallets.filter(w => w.name === recent), ...wallets.filter(w => w.name !== recent)]
    : wallets;

  /* Detected wallets section */
  const installedItems = sorted.map((w, i) => {
    const meta     = WALLET_META[w.name] || { emoji: '👛', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' };
    const isRecent = w.name === recent;

    const icon = w.iconUrl
      ? `<img src="${w.iconUrl}" style="width:36px;height:36px;border-radius:9px;object-fit:contain" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="wlt-icon" style="display:none;background:${meta.bg};color:${meta.color}">${meta.emoji}</div>`
      : `<div class="wlt-icon" style="background:${meta.bg};color:${meta.color}">${meta.emoji}</div>`;

    const badge = isRecent ? `<span class="wlt-badge recent">Recent</span>` : '';

    return `
      <div class="wlt-item ${isRecent ? 'wlt-recent' : ''}" onclick="_connect('${w.uuid}')">
        ${icon}
        <span class="wlt-name">${w.name}</span>
        ${badge}
      </div>`;
  }).join('');

  /* Popular wallets not yet detected */
  const detectedNames = wallets.map(w => w.name);
  const notInstalled  = POPULAR_WALLETS.filter(p => !detectedNames.includes(p.name));
  const popularItems  = notInstalled.map(p => `
    <a href="${p.url}" target="_blank" rel="noopener" class="wlt-item wlt-install" style="text-decoration:none">
      <div class="wlt-icon" style="background:${p.bg};color:${p.color}">${p.emoji}</div>
      <span class="wlt-name">${p.name}</span>
      <span class="wlt-install-tag">Install ↗</span>
    </a>`).join('');

  list.innerHTML = `
    <div class="wlt-section">Installed</div>
    ${installedItems}
    ${notInstalled.length ? `<div class="wlt-section" style="margin-top:16px">Popular</div>${popularItems}` : ''}
  `;
}

/* ── Manual retry detection ── */
function _retryDetect() {
  const list = document.getElementById('walletList');
  if (list) list.innerHTML = `
    <div style="padding:16px 8px;text-align:center">
      <div style="font-size:20px;animation:spin 1.2s linear infinite;display:inline-block;margin-bottom:8px">↻</div>
      <div style="color:rgba(255,255,255,.4);font-size:.8rem;font-weight:600">Scanning…</div>
    </div>`;
  window.dispatchEvent(new Event('eip6963:requestProvider'));
  let tries = 0;
  const check = () => {
    _renderWalletList();
    if (_collectWallets().length === 0 && ++tries < 5) setTimeout(check, 600);
  };
  setTimeout(check, 400);
}

/* ── Show connecting state in right panel ── */
function _showConnecting(walletName) {
  const meta  = WALLET_META[walletName] || { emoji: '👛', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' };
  const right = document.getElementById('wltRightPanel');
  if (!right) return;
  right.innerHTML = `
    <button class="wlt-right-close" onclick="closeWalletModal()">✕</button>
    <div class="wlt-connecting">
      <div style="width:68px;height:68px;border-radius:20px;background:${meta.bg};border:1px solid ${meta.color}44;display:flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:20px;animation:wltPulse 1.6s ease-in-out infinite">
        ${meta.emoji}
      </div>
      <div style="font-size:1rem;font-weight:800;color:white;margin-bottom:8px">${walletName}</div>
      <div style="font-size:0.78rem;color:rgba(255,255,255,.38);line-height:1.65;max-width:200px;margin:0 auto 24px">
        Open ${walletName} to approve the connection request.
      </div>
      <button onclick="closeWalletModal()" style="padding:9px 22px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);color:rgba(255,255,255,.5);font-size:.8rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s" onmouseover="this.style.background='rgba(255,255,255,.11)'" onmouseout="this.style.background='rgba(255,255,255,.06)'">
        Cancel
      </button>
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
