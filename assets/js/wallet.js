/* ── Arc Nova Wallet Manager ────────────────────────────────────────────── */
/* Supports: MetaMask, Rabby, Coinbase Wallet, Trust Wallet, Brave + any    */
/* EIP-6963 wallet. Session persists across page navigations.               */

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
  'MetaMask':        { emoji: '🦊', color: '#f6851b' },
  'Rabby Wallet':    { emoji: '🐰', color: '#8697ff' },
  'Coinbase Wallet': { emoji: '🔵', color: '#0052ff' },
  'Trust Wallet':    { emoji: '🛡️', color: '#3375bb' },
  'Brave Wallet':    { emoji: '🦁', color: '#fb542b' },
  'Frame':           { emoji: '🖼️', color: '#6c6c6c' },
  'OKX Wallet':      { emoji: '⭕', color: '#000000' },
  'Phantom':         { emoji: '👻', color: '#ab9ff2' },
};

/* ── Session helpers ── */
function _saveSession(account) {
  sessionStorage.setItem('arcnova_account', account);
}
function _clearSession() {
  sessionStorage.removeItem('arcnova_account');
}

/* ── EIP-6963: Listen for wallet announcements ── */
window.addEventListener('eip6963:announceProvider', ({ detail }) => {
  eip6963Wallets.set(detail.info.uuid, detail);
  _renderWalletList();
});

/* ── Inject wallet modal HTML into <body> ── */
function _injectWalletModal() {
  if (document.getElementById('walletModal')) return;

  const el = document.createElement('div');
  el.innerHTML = `
  <div class="modal-overlay" id="walletModal">
    <div class="modal-box" style="width:420px">
      <div class="modal-header">
        <span class="modal-title">Connect Wallet</span>
        <button class="modal-close" onclick="closeWalletModal()">✕</button>
      </div>
      <div class="modal-body">
        <div id="walletList"></div>
        <div style="margin-top:16px;padding:12px;background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.18);border-radius:10px;font-size:0.78rem;color:var(--text-2);line-height:1.6">
          🔒 Arc Nova never stores your private keys. Transactions require your wallet's approval.
        </div>
        <div style="margin-top:12px;text-align:center;font-size:0.78rem;color:var(--muted)">
          New to crypto?
          <a href="https://metamask.io/download/" target="_blank" style="color:var(--lavender);font-weight:600;text-decoration:none">Install MetaMask</a>
          or
          <a href="https://rabby.io/" target="_blank" style="color:var(--lavender);font-weight:600;text-decoration:none">Rabby Wallet</a>
        </div>
      </div>
    </div>
  </div>

  <div class="modal-overlay" id="txModal">
    <div class="modal-box" style="width:380px;text-align:center">
      <div class="modal-body" style="padding:32px 24px">
        <div id="txSpinner" style="font-size:2.5rem;margin-bottom:16px;animation:spin 1s linear infinite">⏳</div>
        <div id="txTitle" style="font-weight:800;font-size:1.05rem;margin-bottom:8px">Waiting for confirmation</div>
        <div id="txDesc" style="font-size:0.85rem;color:var(--muted);margin-bottom:20px;line-height:1.6">Confirm this transaction in your wallet</div>
        <div id="txHashRow" style="display:none">
          <a id="txHashLink" href="#" target="_blank" class="btn btn-ghost btn-sm" style="width:100%">View on Explorer ↗</a>
        </div>
        <button id="txCloseBtn" style="display:none;margin-top:10px;width:100%" class="btn btn-primary" onclick="closeTxModal()">Done</button>
      </div>
    </div>
  </div>

  <div class="modal-overlay" id="accountModal">
    <div class="modal-box" style="width:340px">
      <div class="modal-header">
        <span class="modal-title">Connected Account</span>
        <button class="modal-close" onclick="closeAccountModal()">✕</button>
      </div>
      <div class="modal-body">
        <div style="text-align:center;padding:8px 0 20px">
          <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#7c3aed);margin:0 auto 14px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;box-shadow:0 0 32px rgba(168,85,247,.45)">◈</div>
          <div id="acctAddress" style="font-size:1rem;font-weight:800;letter-spacing:-0.01em;font-family:monospace">—</div>
          <div style="font-size:0.75rem;color:var(--muted);margin-top:6px;display:flex;align-items:center;justify-content:center;gap:5px">
            <div style="width:6px;height:6px;border-radius:50%;background:#10b981;box-shadow:0 0 6px rgba(16,185,129,.5)"></div>
            Arc Testnet
          </div>
        </div>
        <div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:16px">
          <div style="font-size:0.68rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;font-weight:700">Balance</div>
          <div id="acctBalance" style="font-size:1.5rem;font-weight:900;letter-spacing:-0.02em">—</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <button class="btn btn-ghost" onclick="copyWalletAddress()" style="font-size:0.82rem;gap:6px">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            Copy
          </button>
          <button class="btn btn-ghost" style="font-size:0.82rem;border-color:rgba(239,68,68,.28);color:#f87171;gap:6px" onclick="_disconnect();closeAccountModal()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Disconnect
          </button>
        </div>
      </div>
    </div>
  </div>`;

  document.body.appendChild(el);
}

/* ── Collect all available providers ── */
function _collectWallets() {
  const wallets = [];
  const seen    = new Set();

  /* EIP-6963 discovered wallets */
  eip6963Wallets.forEach(({ info, provider }) => {
    wallets.push({ name: info.name, iconUrl: info.icon, uuid: info.uuid, provider });
    seen.add(info.uuid);
  });

  /* window.ethereum.providers array (multiple wallets co-installed) */
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

  /* Single window.ethereum fallback */
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

  if (wallets.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:32px 0;color:var(--muted)">
        <div style="width:56px;height:56px;border-radius:16px;background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.15);display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 16px">🔌</div>
        <div style="font-weight:700;margin-bottom:6px;color:var(--text);font-size:0.95rem">No Wallet Detected</div>
        <div style="font-size:0.82rem;line-height:1.65;margin-bottom:20px;color:var(--muted)">
          Install a wallet extension and reload,<br>or serve this page via <strong style="color:var(--lavender)">http://</strong> (not file://).
        </div>
        <button onclick="_retryDetect()" class="btn btn-outline btn-sm" style="width:100%">
          🔄 Retry Detection
        </button>
      </div>`;
    return;
  }

  const header = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--border)">
      <span style="font-size:0.7rem;font-weight:700;color:var(--muted);letter-spacing:0.07em;text-transform:uppercase">Available Wallets</span>
      <div style="display:flex;align-items:center;gap:5px">
        <div style="width:6px;height:6px;border-radius:50%;background:#10b981;box-shadow:0 0 6px rgba(16,185,129,0.5)"></div>
        <span style="font-size:0.72rem;color:#10b981;font-weight:600">${wallets.length} detected</span>
      </div>
    </div>`;

  const items = wallets.map(w => {
    const meta = WALLET_META[w.name] || { emoji: '👛', color: '#8b5cf6' };
    const icon = w.iconUrl
      ? `<img src="${w.iconUrl}" style="width:40px;height:40px;border-radius:12px;object-fit:contain;flex-shrink:0" onerror="this.outerHTML='<div style=width:40px;height:40px;border-radius:12px;background:${meta.color}1a;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0>${meta.emoji}</div>'">`
      : `<div style="width:40px;height:40px;border-radius:12px;background:${meta.color}1a;border:1px solid ${meta.color}30;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${meta.emoji}</div>`;
    return `
      <div class="wallet-item" onclick="_connect('${w.uuid}')" style="margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:14px;min-width:0">
          ${icon}
          <div style="min-width:0">
            <div style="font-weight:700;font-size:0.92rem;color:var(--text)">${w.name}</div>
            <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
              <div style="width:5px;height:5px;border-radius:50%;background:#10b981;flex-shrink:0"></div>
              <span style="font-size:0.72rem;color:#10b981;font-weight:600">Ready · Click to connect</span>
            </div>
          </div>
        </div>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--muted);flex-shrink:0"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>`;
  }).join('');

  list.innerHTML = header + `<div>${items}</div>`;
}

/* ── Manual retry detection ── */
function _retryDetect() {
  const list = document.getElementById('walletList');
  if (list) list.innerHTML = `<div style="text-align:center;padding:28px;color:var(--muted)"><div style="font-size:2rem;margin-bottom:10px;animation:spin 1s linear infinite">⟳</div><div>Scanning for wallets…</div></div>`;
  window.dispatchEvent(new Event('eip6963:requestProvider'));
  let tries = 0;
  const check = () => {
    _renderWalletList();
    if (_collectWallets().length === 0 && ++tries < 5) setTimeout(check, 600);
  };
  setTimeout(check, 400);
}

/* ── Resolve provider from uuid ── */
function _resolveProvider(uuid) {
  if (uuid === 'injected') return window.ethereum;
  if (uuid.startsWith('legacy-')) {
    return window.ethereum?.providers?.[parseInt(uuid.split('-')[1], 10)];
  }
  return eip6963Wallets.get(uuid)?.provider;
}

/* ── Connect to selected wallet ── */
async function _connect(uuid) {
  const prov = _resolveProvider(uuid);
  if (!prov) { showToast('Provider not found', 'error'); return; }

  const listEl = document.getElementById('walletList');
  if (listEl) listEl.innerHTML = `<div style="text-align:center;padding:40px 0;color:var(--muted)"><div style="width:48px;height:48px;border-radius:14px;background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 16px;animation:spin 1s linear infinite">⟳</div><div style="font-weight:600;color:var(--text);margin-bottom:4px">Connecting…</div><div style="font-size:0.8rem">Approve in your wallet</div></div>`;

  try {
    const accounts = await prov.request({ method: 'eth_requestAccounts' });
    if (!accounts?.length) throw new Error('No accounts returned');

    await _switchToArc(prov);
    await _activateProvider(prov, accounts[0]);

    closeWalletModal();
    showToast('Wallet connected! 🎉', 'success');
    await _loadBalances();
    if (typeof initDemoBalances === 'function') initDemoBalances();

    prov.on('accountsChanged', accs => {
      if (!accs.length) { _disconnect(); return; }
      activeAccount = accs[0];
      _saveSession(activeAccount);
      _updateNavUI();
      _loadBalances();
    });
    prov.on('chainChanged', () => window.location.reload());

  } catch (err) {
    _renderWalletList();
    if (err.code === 4001) showToast('Rejected by user', 'error');
    else showToast('Error: ' + (err.message || 'unknown'), 'error');
  }
}

/* ── Shared provider activation (used by connect + session restore) ── */
async function _activateProvider(prov, account) {
  activeProvider  = prov;
  activeAccount   = account;
  ethersProvider  = new ethers.providers.Web3Provider(prov, 'any');
  activeSigner    = ethersProvider.getSigner();
  walletConnected = true;
  _saveSession(account);
  _updateNavUI();
}

/* ── Switch to / add Arc Testnet ── */
async function _switchToArc(prov) {
  try {
    await prov.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ARC_CHAIN_HEX }] });
  } catch (err) {
    if (err.code === 4902 || err.code === -32603) {
      await prov.request({ method: 'wallet_addEthereumChain', params: [ARC_TESTNET_PARAMS] });
    } else {
      throw err;
    }
  }
}

/* ── Update nav button & address displays ── */
function _updateNavUI() {
  if (!activeAccount) return;
  const short = activeAccount.slice(0, 6) + '…' + activeAccount.slice(-4);

  document.querySelectorAll('#walletBtn').forEach(btn => {
    btn.textContent = short;
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-ghost');
    btn.onclick = openAccountModal;
  });

  document.querySelectorAll('.wallet-address').forEach(el => el.textContent = short);

  const ub = document.getElementById('userBalance');
  if (ub && ub.textContent === '—') ub.textContent = 'Loading…';
}

/* ── Disconnect ── */
function _disconnect() {
  activeProvider = activeAccount = activeSigner = ethersProvider = null;
  walletConnected = false;
  _clearSession();

  document.querySelectorAll('#walletBtn').forEach(btn => {
    btn.textContent = 'Connect Wallet';
    btn.classList.remove('btn-ghost');
    btn.classList.add('btn-primary');
    btn.onclick = openWalletModal;
  });
  showToast('Wallet disconnected', 'info');
}

/* ── Silently restore session on page load ── */
async function _tryRestoreSession() {
  const saved = sessionStorage.getItem('arcnova_account');
  if (!saved) return;

  /* Wait up to 1.5 s for providers to announce themselves */
  for (let i = 0; i < 6; i++) {
    const wallets = _collectWallets();
    if (wallets.length > 0) {
      /* Try each provider to see if it still holds the account */
      for (const w of wallets) {
        try {
          const accounts = await w.provider.request({ method: 'eth_accounts' });
          if (accounts.map(a => a.toLowerCase()).includes(saved.toLowerCase())) {
            try { await _switchToArc(w.provider); } catch { /* ignore — user can switch manually */ }
            await _activateProvider(w.provider, accounts.find(a => a.toLowerCase() === saved.toLowerCase()));
            await _loadBalances();
            if (typeof initDemoBalances === 'function') initDemoBalances();

            /* Re-attach event listeners */
            w.provider.on('accountsChanged', accs => {
              if (!accs.length) { _disconnect(); return; }
              activeAccount = accs[0];
              _saveSession(activeAccount);
              _updateNavUI();
              _loadBalances();
            });
            w.provider.on('chainChanged', () => window.location.reload());
            return;
          }
        } catch { /* provider not ready yet */ }
      }
    }
    await new Promise(r => setTimeout(r, 250));
  }
  /* Session stale — clear it */
  _clearSession();
}

/* ── Load on-chain balances ── */
async function _loadBalances() {
  if (!activeAccount || !ethersProvider) return;
  try {
    /* NOVA balance (skip if contract not deployed) */
    if (isDeployed(CONTRACT_ADDRESSES.NOVA_TOKEN)) {
      const novaC   = new ethers.Contract(CONTRACT_ADDRESSES.NOVA_TOKEN, ERC20_ABI, ethersProvider);
      const novaBal = await novaC.balanceOf(activeAccount);
      const nova    = parseFloat(ethers.utils.formatEther(novaBal)).toFixed(2);
      document.querySelectorAll('.balance-nova').forEach(el => el.textContent = nova + ' NOVA');
      const fb = document.getElementById('fromBal');
      if (fb) fb.textContent = nova + ' NOVA';
    }

    /* USDC balance (always available — native gas token) */
    const usdcC   = new ethers.Contract(CONTRACT_ADDRESSES.USDC, ERC20_ABI, ethersProvider);
    const usdcBal = await usdcC.balanceOf(activeAccount);
    const usdc    = parseFloat(ethers.utils.formatUnits(usdcBal, 6)).toFixed(2);
    document.querySelectorAll('.balance-usdc').forEach(el => el.textContent = usdc + ' USDC');
    const ub = document.getElementById('userBalance');
    if (ub) ub.textContent = usdc + ' USDC';
    const tb = document.getElementById('toBal');
    if (tb) tb.textContent = usdc + ' USDC';

    /* Staking info */
    if (isDeployed(CONTRACT_ADDRESSES.STAKING)) {
      const sc   = new ethers.Contract(CONTRACT_ADDRESSES.STAKING, STAKING_ABI, ethersProvider);
      const info = await sc.getUserInfo(activeAccount);
      const staked  = parseFloat(ethers.utils.formatEther(info[0])).toFixed(2);
      const pending = parseFloat(ethers.utils.formatEther(info[1])).toFixed(4);
      const sv = document.getElementById('stakedValue');
      const er = document.getElementById('earnedRewards');
      if (sv) sv.textContent = staked + ' NOVA';
      if (er) er.textContent = pending + ' NOVA';
    }
  } catch (e) {
    console.warn('Balance load:', e.message);
  }
}

/* ── TX Status Modal ── */
function openTxModal(title, desc) {
  const m = document.getElementById('txModal');
  if (!m) return;
  document.getElementById('txSpinner').style.display  = 'block';
  document.getElementById('txSpinner').textContent    = '⏳';
  document.getElementById('txSpinner').style.animation = 'spin 1s linear infinite';
  document.getElementById('txTitle').textContent      = title;
  document.getElementById('txDesc').textContent       = desc;
  document.getElementById('txHashRow').style.display  = 'none';
  document.getElementById('txCloseBtn').style.display = 'none';
  m.classList.add('open');
}

function txPending(hash) {
  const spinner = document.getElementById('txSpinner');
  if (spinner) { spinner.textContent = '🔄'; spinner.style.animation = 'spin 1s linear infinite'; }
  const t = document.getElementById('txTitle');
  if (t) t.textContent = 'Transaction Pending…';
  const d = document.getElementById('txDesc');
  if (d) d.textContent = 'Waiting for blockchain confirmation';
  const row  = document.getElementById('txHashRow');
  const link = document.getElementById('txHashLink');
  if (row && link) { link.href = `${EXPLORER}/tx/${hash}`; row.style.display = 'block'; }
}

function txSuccess(msg) {
  const spinner = document.getElementById('txSpinner');
  if (spinner) { spinner.textContent = '✅'; spinner.style.animation = 'none'; }
  const t = document.getElementById('txTitle');
  if (t) t.textContent = 'Success!';
  const d = document.getElementById('txDesc');
  if (d) d.textContent = msg;
  const btn = document.getElementById('txCloseBtn');
  if (btn) btn.style.display = 'block';
  _loadBalances();
}

function txError(msg) {
  const spinner = document.getElementById('txSpinner');
  if (spinner) { spinner.textContent = '❌'; spinner.style.animation = 'none'; }
  const t = document.getElementById('txTitle');
  if (t) t.textContent = 'Transaction Failed';
  const d = document.getElementById('txDesc');
  if (d) d.textContent = msg;
  const btn = document.getElementById('txCloseBtn');
  if (btn) btn.style.display = 'block';
}

function closeTxModal() {
  document.getElementById('txModal')?.classList.remove('open');
}

/* ── Public API ── */
function openWalletModal() {
  document.getElementById('walletModal')?.classList.add('open');
  window.dispatchEvent(new Event('eip6963:requestProvider'));
  [200, 700, 1500].forEach(ms => setTimeout(_renderWalletList, ms));
}

function closeWalletModal() {
  document.getElementById('walletModal')?.classList.remove('open');
}

function openAccountModal() {
  if (!walletConnected) { openWalletModal(); return; }
  const modal = document.getElementById('accountModal');
  if (!modal) return;
  const short = activeAccount ? activeAccount.slice(0,6) + '…' + activeAccount.slice(-4) : '—';
  const addrEl = document.getElementById('acctAddress');
  if (addrEl) addrEl.textContent = short;
  const balEl = document.getElementById('acctBalance');
  if (balEl) {
    const ub = document.getElementById('userBalance');
    balEl.textContent = (ub && ub.textContent !== '—' && ub.textContent !== 'Loading…') ? ub.textContent : '— USDC';
  }
  modal.classList.add('open');
}

function closeAccountModal() {
  document.getElementById('accountModal')?.classList.remove('open');
}

function copyWalletAddress() {
  if (!activeAccount) return;
  navigator.clipboard?.writeText(activeAccount)
    .then(() => showToast('Address copied!', 'success'))
    .catch(() => showToast(activeAccount.slice(0,6)+'…'+activeAccount.slice(-4), 'info'));
}

/* connectWallet() called from HTML onclick buttons */
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

  /* Broadcast EIP-6963 + poll for late-injecting wallets */
  window.dispatchEvent(new Event('eip6963:requestProvider'));
  let polls = 0;
  const poll = setInterval(() => {
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    if (window.ethereum || ++polls >= 6) clearInterval(poll);
  }, 500);

  /* Try to restore previous session silently */
  _tryRestoreSession();
});
