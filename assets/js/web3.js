/* ── Arc Nova Web3 Layer ─────────────────────────────────────────────────── */
/* Real on-chain when contracts deployed; seamless Demo Mode when not.       */

'use strict';

/* ── Demo state (lives in memory per page load) ── */
const _demo = {
  nova:      10000.00,
  usdc:      100.00,
  staked:    0.00,
  rewards:   0.00,
  unbonding: 0.00,
  lastFaucet: 0,
};

/* ── Helpers ── */
const _isDemo   = () => !isDeployed(CONTRACT_ADDRESSES.NOVA_TOKEN);
const _fakeHash = () => '0x' + Array.from({length:64}, () => Math.floor(Math.random()*16).toString(16)).join('');

/* Simulate a tx: show TX modal → pending (with fake hash) → call fn() → success */
async function _demoTx(title, workFn, successMsg) {
  openTxModal(title, 'Processing… (Demo Mode — no real transaction)');
  await new Promise(r => setTimeout(r, 700));
  const hash = _fakeHash();
  txPending(hash);
  await new Promise(r => setTimeout(r, 1400));
  workFn();
  _refreshDemoUI();
  txSuccess(successMsg + '\n(Demo Mode)');
}

/* Refresh all balance elements from demo state */
function _refreshDemoUI() {
  const d = _demo;
  document.querySelectorAll('.balance-nova').forEach(el => el.textContent = d.nova.toFixed(2) + ' NOVA');
  document.querySelectorAll('.balance-usdc').forEach(el => el.textContent = d.usdc.toFixed(2) + ' USDC');
  const fromSym = document.getElementById('fromToken')?.dataset.symbol || 'NOVA';
  const toSym   = document.getElementById('toToken')?.dataset.symbol   || 'USDC';
  const fb = document.getElementById('fromBal');
  if (fb) fb.textContent = fromSym === 'NOVA' ? d.nova.toFixed(2) + ' NOVA' : d.usdc.toFixed(2) + ' USDC';
  const tb = document.getElementById('toBal');
  if (tb) tb.textContent = toSym  === 'NOVA' ? d.nova.toFixed(2) + ' NOVA' : d.usdc.toFixed(2) + ' USDC';
  const ub = document.getElementById('userBalance');
  if (ub) ub.textContent = d.usdc.toFixed(2) + ' USDC';
  const sv = document.getElementById('stakedValue');
  if (sv) sv.textContent = d.staked.toFixed(2) + ' NOVA';
  const er = document.getElementById('earnedRewards');
  if (er) er.textContent = d.rewards.toFixed(4) + ' NOVA';
}

/* ── Guard helpers ── */
function _requireWallet() {
  if (!walletConnected || !activeSigner) {
    showToast('Connect your wallet first', 'error');
    openWalletModal();
    return false;
  }
  return true;
}

/* Silently switch to Arc Testnet if the wallet drifted to another chain */
async function _ensureNetwork() {
  try {
    const net = await ethersProvider.getNetwork();
    if (net.chainId !== ARC_CHAIN_ID) {
      showToast('Switching to Arc Testnet…', 'info');
      await _switchToArc(activeProvider);
      /* Re-create provider+signer so they point to the new chain */
      ethersProvider = new ethers.providers.Web3Provider(activeProvider, 'any');
      activeSigner   = ethersProvider.getSigner();
    }
  } catch { /* if network check itself fails, proceed and let the tx fail naturally */ }
}

/* ── ERC20 approve (only if allowance insufficient) ── */
async function _ensureApproval(tokenAddr, spenderAddr, amount) {
  const token     = new ethers.Contract(tokenAddr, ERC20_ABI, activeSigner);
  const allowance = await token.allowance(activeAccount, spenderAddr);
  if (allowance.lt(amount)) {
    const tx = await token.approve(spenderAddr, ethers.constants.MaxUint256);
    await tx.wait();
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   FAUCET
═══════════════════════════════════════════════════════════════════════════ */
async function claimFaucet() {
  if (!_requireWallet()) return;

  /* ── Demo Mode ── */
  if (_isDemo()) {
    const now = Math.floor(Date.now() / 1000);
    if (_demo.lastFaucet && now - _demo.lastFaucet < 86400) {
      const rem = 86400 - (now - _demo.lastFaucet);
      openTxModal('Faucet Cooldown', '');
      txError(`Cooldown active: ${Math.floor(rem/3600)}h ${Math.floor((rem%3600)/60)}m remaining`);
      return;
    }
    await _demoTx('Claiming 1,000 NOVA', () => {
      _demo.nova += 1000;
      _demo.lastFaucet = Math.floor(Date.now() / 1000);
    }, 'Claimed 1,000 NOVA!');
    return;
  }

  /* ── Real Mode ── */
  await _ensureNetwork();
  openTxModal('Claiming NOVA', 'Confirm the faucet transaction in your wallet');
  try {
    const token = new ethers.Contract(CONTRACT_ADDRESSES.NOVA_TOKEN, TOKEN_ABI, activeSigner);
    const last  = await token.lastFaucet(activeAccount);
    const now   = Math.floor(Date.now() / 1000);
    if (last.gt(0) && now - last.toNumber() < 86400) {
      const rem = 86400 - (now - last.toNumber());
      txError(`Faucet cooldown: ${Math.floor(rem/3600)}h ${Math.floor((rem%3600)/60)}m`);
      return;
    }
    const tx = await token.faucet();
    txPending(tx.hash);
    await tx.wait();
    txSuccess('Claimed 1,000 NOVA!');
  } catch (err) { txError(_parseErr(err)); }
}

/* ═══════════════════════════════════════════════════════════════════════════
   SWAP
═══════════════════════════════════════════════════════════════════════════ */
async function executeSwap(fromSym, toSym, amountIn, slippagePct = 0.5) {
  if (!_requireWallet()) return;

  /* ── Demo Mode ── */
  if (_isDemo()) {
    const RATE = { 'NOVA/USDC': 0.001, 'USDC/NOVA': 1000 };
    const rate  = RATE[`${fromSym}/${toSym}`] || 1;
    const amtOut = amountIn * rate;
    if (fromSym === 'NOVA' && _demo.nova < amountIn) { showToast('Insufficient NOVA balance', 'error'); return; }
    if (fromSym === 'USDC' && _demo.usdc < amountIn) { showToast('Insufficient USDC balance', 'error'); return; }
    await _demoTx(`Swapping ${amountIn} ${fromSym}`, () => {
      if (fromSym === 'NOVA') { _demo.nova -= amountIn; _demo.usdc += amtOut; }
      else                    { _demo.usdc -= amountIn; _demo.nova += amtOut; }
    }, `Swapped ${amountIn} ${fromSym} → ${amtOut.toFixed(4)} ${toSym}`);
    return;
  }

  /* ── Real Mode ── */
  await _ensureNetwork();
  const swapAddr = CONTRACT_ADDRESSES.SWAP;
  openTxModal('Swapping tokens', 'Confirm this transaction in your wallet');
  try {
    const swapR = new ethers.Contract(swapAddr, SWAP_ABI, ethersProvider);
    const [novaRes, usdcRes] = await swapR.getReserves();
    const swapW = new ethers.Contract(swapAddr, SWAP_ABI, activeSigner);
    let tx;
    if (fromSym === 'NOVA') {
      const parsed  = ethers.utils.parseEther(String(amountIn));
      const expected = await swapR.getAmountOut(parsed, novaRes, usdcRes);
      const minOut   = expected.mul(Math.floor((1 - slippagePct/100)*10000)).div(10000);
      await _ensureApproval(CONTRACT_ADDRESSES.NOVA_TOKEN, swapAddr, parsed);
      tx = await swapW.swapNovaForUsdc(parsed, minOut);
    } else {
      const parsed   = ethers.utils.parseUnits(String(amountIn), 6);
      const expected = await swapR.getAmountOut(parsed, usdcRes, novaRes);
      const minOut   = expected.mul(Math.floor((1 - slippagePct/100)*10000)).div(10000);
      await _ensureApproval(CONTRACT_ADDRESSES.USDC, swapAddr, parsed);
      tx = await swapW.swapUsdcForNova(parsed, minOut);
    }
    txPending(tx.hash);
    await tx.wait();
    txSuccess(`Swapped ${amountIn} ${fromSym} → ${toSym}`);
  } catch (err) { txError(_parseErr(err)); }
}

/* ═══════════════════════════════════════════════════════════════════════════
   STAKE
═══════════════════════════════════════════════════════════════════════════ */
async function executeStake(amountStr) {
  if (!_requireWallet()) return;
  const amount = parseFloat(amountStr);

  /* ── Demo Mode ── */
  if (_isDemo()) {
    if (_demo.nova < amount) { showToast('Insufficient NOVA balance', 'error'); return; }
    await _demoTx(`Staking ${amount} NOVA`, () => {
      _demo.nova  -= amount;
      _demo.staked += amount;
    }, `Staked ${amount} NOVA! Earning ~12% APY`);
    return;
  }

  /* ── Real Mode ── */
  await _ensureNetwork();
  openTxModal('Staking NOVA', 'Confirm the staking transaction in your wallet');
  try {
    const parsed = ethers.utils.parseEther(amountStr);
    await _ensureApproval(CONTRACT_ADDRESSES.NOVA_TOKEN, CONTRACT_ADDRESSES.STAKING, parsed);
    const sc = new ethers.Contract(CONTRACT_ADDRESSES.STAKING, STAKING_ABI, activeSigner);
    const tx = await sc.stake(parsed);
    txPending(tx.hash);
    await tx.wait();
    txSuccess(`Staked ${amount} NOVA successfully!`);
  } catch (err) { txError(_parseErr(err)); }
}

/* ═══════════════════════════════════════════════════════════════════════════
   UNSTAKE
═══════════════════════════════════════════════════════════════════════════ */
async function executeUnstake(amountStr) {
  if (!_requireWallet()) return;
  const amount = parseFloat(amountStr);

  if (_isDemo()) {
    if (_demo.staked < amount) { showToast('Insufficient staked balance', 'error'); return; }
    await _demoTx(`Unstaking ${amount} NOVA`, () => {
      _demo.staked    -= amount;
      _demo.unbonding += amount;
    }, `Unstake requested! Tokens unlock in 24h.`);
    return;
  }

  await _ensureNetwork();
  openTxModal('Unstaking NOVA', 'Confirm the unstake transaction in your wallet');
  try {
    const sc = new ethers.Contract(CONTRACT_ADDRESSES.STAKING, STAKING_ABI, activeSigner);
    const tx = await sc.requestUnstake(ethers.utils.parseEther(amountStr));
    txPending(tx.hash);
    await tx.wait();
    txSuccess('Unstake requested! Tokens unlock after 24h.');
  } catch (err) { txError(_parseErr(err)); }
}

/* ═══════════════════════════════════════════════════════════════════════════
   WITHDRAW
═══════════════════════════════════════════════════════════════════════════ */
async function executeWithdraw() {
  if (!_requireWallet()) return;

  if (_isDemo()) {
    if (_demo.unbonding <= 0) { showToast('No tokens available to withdraw', 'error'); return; }
    await _demoTx('Withdrawing NOVA', () => {
      _demo.nova      += _demo.unbonding;
      _demo.unbonding  = 0;
    }, 'NOVA withdrawn to your wallet!');
    return;
  }

  await _ensureNetwork();
  openTxModal('Withdrawing NOVA', 'Confirm the withdrawal in your wallet');
  try {
    const sc = new ethers.Contract(CONTRACT_ADDRESSES.STAKING, STAKING_ABI, activeSigner);
    const tx = await sc.withdraw();
    txPending(tx.hash);
    await tx.wait();
    txSuccess('NOVA withdrawn to your wallet!');
  } catch (err) { txError(_parseErr(err)); }
}

/* ═══════════════════════════════════════════════════════════════════════════
   CLAIM REWARDS
═══════════════════════════════════════════════════════════════════════════ */
async function executeClaim() {
  if (!_requireWallet()) return;

  if (_isDemo()) {
    /* Accrue some demo rewards based on staked amount */
    const accrued = _demo.staked * 0.12 / 365 * 0.1; /* ~10 minutes worth */
    _demo.rewards += accrued;
    if (_demo.rewards < 0.0001) { showToast('No rewards to claim yet', 'info'); return; }
    await _demoTx('Claiming Rewards', () => {
      _demo.nova    += _demo.rewards;
      _demo.rewards  = 0;
    }, `Claimed ${_demo.rewards.toFixed(4)} NOVA rewards!`);
    return;
  }

  await _ensureNetwork();
  openTxModal('Claiming Rewards', 'Confirm the claim transaction in your wallet');
  try {
    const sc = new ethers.Contract(CONTRACT_ADDRESSES.STAKING, STAKING_ABI, activeSigner);
    const tx = await sc.claimRewards();
    txPending(tx.hash);
    await tx.wait();
    txSuccess('Staking rewards claimed!');
  } catch (err) { txError(_parseErr(err)); }
}

/* ═══════════════════════════════════════════════════════════════════════════
   LIVE SWAP QUOTE
═══════════════════════════════════════════════════════════════════════════ */
async function getSwapQuote(fromSym, toSym, amountIn) {
  /* Demo fallback rates */
  const DEMO_RATES = { 'NOVA/USDC': 0.001, 'USDC/NOVA': 1000 };
  const key = `${fromSym}/${toSym}`;

  if (!isDeployed(CONTRACT_ADDRESSES.SWAP)) {
    const rate = DEMO_RATES[key];
    return rate ? (amountIn * rate).toFixed(4) : null;
  }

  try {
    const rpc    = ethersProvider || new ethers.providers.JsonRpcProvider('https://rpc.testnet.arc.network');
    const swapC  = new ethers.Contract(CONTRACT_ADDRESSES.SWAP, SWAP_ABI, rpc);
    const [novaRes, usdcRes] = await swapC.getReserves();
    if (fromSym === 'NOVA') {
      const out = await swapC.getAmountOut(ethers.utils.parseEther(String(amountIn)), novaRes, usdcRes);
      return parseFloat(ethers.utils.formatUnits(out, 6)).toFixed(4);
    } else {
      const out = await swapC.getAmountOut(ethers.utils.parseUnits(String(amountIn), 6), usdcRes, novaRes);
      return parseFloat(ethers.utils.formatEther(out)).toFixed(4);
    }
  } catch { return (amountIn * (DEMO_RATES[key] || 1)).toFixed(4); }
}

/* ── Expose demo refresh for wallet.js to call after connect ── */
function initDemoBalances() {
  if (_isDemo() && walletConnected) _refreshDemoUI();
}

/* ── Error parser ── */
function _parseErr(err) {
  if (err.code === 4001 || err.code === 'ACTION_REJECTED') return 'Transaction rejected by user';
  if (err.code === -32603) return 'RPC error — check your connection';
  const msg = err.reason || err.data?.message || err.message || 'Unknown error';
  if (msg.includes('insufficient')) return 'Insufficient balance';
  if (msg.includes('cooldown'))     return 'Faucet cooldown active';
  if (msg.includes('slippage'))     return 'Slippage exceeded — try again';
  if (msg.includes('allowance'))    return 'Token approval failed';
  return msg.length > 100 ? msg.slice(0, 100) + '…' : msg;
}
