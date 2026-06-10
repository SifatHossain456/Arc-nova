/* ── Arc Nova Web3 Layer — Real on-chain only ─────────────────────────────── */
'use strict';

/* ── Guard helpers ── */
function _requireWallet() {
  if (!walletConnected || !activeSigner) {
    showToast('Connect your wallet first', 'error');
    openWalletModal();
    return false;
  }
  return true;
}

/* Silently switch to Arc Testnet if the wallet is on another chain */
async function _ensureNetwork() {
  try {
    const net = await ethersProvider.getNetwork();
    if (net.chainId !== ARC_CHAIN_ID) {
      showToast('Switching to Arc Testnet…', 'info');
      await _switchToArc(activeProvider);
      ethersProvider = new ethers.providers.Web3Provider(activeProvider, 'any');
      activeSigner   = ethersProvider.getSigner();
    }
  } catch {}
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

/* Refresh all balance/staking elements from chain after a tx */
async function _refreshOnchainUI() {
  if (!walletConnected || !activeAccount || !ethersProvider) return;
  try {
    const novaC = new ethers.Contract(CONTRACT_ADDRESSES.NOVA_TOKEN, ERC20_ABI, ethersProvider);
    const scC   = new ethers.Contract(CONTRACT_ADDRESSES.STAKING, STAKING_ABI, ethersProvider);
    const [nBal, userInfo] = await Promise.all([
      novaC.balanceOf(activeAccount).catch(() => null),
      scC.getUserInfo(activeAccount).catch(() => null),
    ]);
    if (nBal) {
      const nova = parseFloat(ethers.utils.formatEther(nBal));
      document.querySelectorAll('.balance-nova').forEach(el => el.textContent = nova.toFixed(2) + ' NOVA');
      const fb = document.getElementById('fromBal');
      const fromSym = document.getElementById('fromToken')?.dataset.symbol || 'NOVA';
      if (fb && fromSym === 'NOVA') fb.textContent = nova.toFixed(2) + ' NOVA';
    }
    if (userInfo) {
      const staked    = parseFloat(ethers.utils.formatEther(userInfo[0]));
      const rewards   = parseFloat(ethers.utils.formatEther(userInfo[1]));
      const unbonding = parseFloat(ethers.utils.formatEther(userInfo[2]));
      const unbondEnd = userInfo[3].toNumber();
      document.querySelectorAll('#stakedValue, #miniStakedValue').forEach(el => {
        el.textContent = staked > 0 ? staked.toFixed(2) + ' NOVA' : '—';
      });
      document.querySelectorAll('#earnedRewards, #miniEarnedRewards').forEach(el => {
        el.textContent = rewards > 0 ? rewards.toFixed(4) + ' NOVA' : '—';
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
  } catch {}
}

/* ═══════════════════════════════════════════════════════════════════════════
   FAUCET
═══════════════════════════════════════════════════════════════════════════ */
async function claimFaucet() {
  if (!_requireWallet()) return;
  await _ensureNetwork();
  openTxModal('Claiming NOVA', 'Confirm the faucet transaction in your wallet');
  try {
    const token = new ethers.Contract(CONTRACT_ADDRESSES.NOVA_TOKEN, TOKEN_ABI, activeSigner);
    const last  = await token.lastFaucet(activeAccount);
    const now   = Math.floor(Date.now() / 1000);
    if (last.gt(0) && now - last.toNumber() < 86400) {
      const rem = 86400 - (now - last.toNumber());
      txError(`Faucet cooldown: ${Math.floor(rem/3600)}h ${Math.floor((rem%3600)/60)}m remaining`);
      return;
    }
    const tx = await token.faucet();
    txPending(tx.hash);
    await tx.wait();
    txSuccess('Claimed 1,000 NOVA!');
    window.ArcPoints?.award('faucet');
    document.dispatchEvent(new CustomEvent('arcTxSuccess', { detail: { type: 'faucet' } }));
    _refreshOnchainUI();
  } catch (err) { txError(_parseErr(err)); }
}

/* ═══════════════════════════════════════════════════════════════════════════
   SWAP
═══════════════════════════════════════════════════════════════════════════ */
async function executeSwap(fromSym, toSym, amountIn, slippagePct = 0.5) {
  if (!_requireWallet()) return;
  await _ensureNetwork();
  const swapAddr = CONTRACT_ADDRESSES.SWAP;
  openTxModal('Swapping tokens', 'Confirm this transaction in your wallet');
  try {
    const swapR = new ethers.Contract(swapAddr, SWAP_ABI, ethersProvider);
    const [novaRes, usdcRes] = await swapR.getReserves();
    const swapW = new ethers.Contract(swapAddr, SWAP_ABI, activeSigner);
    let tx;
    if (fromSym === 'NOVA') {
      const parsed   = ethers.utils.parseEther(String(amountIn));
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
    window.ArcPoints?.award('swap');
    document.dispatchEvent(new CustomEvent('arcTxSuccess', { detail: { type: 'swap', btn: document.getElementById('swapBtn') } }));
    _refreshOnchainUI();
  } catch (err) { txError(_parseErr(err)); }
}

/* ═══════════════════════════════════════════════════════════════════════════
   STAKE
═══════════════════════════════════════════════════════════════════════════ */
async function executeStake(amountStr) {
  if (!_requireWallet()) return;
  const amount = parseFloat(amountStr);
  await _ensureNetwork();
  openTxModal('Staking NOVA', 'Step 1 — Approve NOVA in your wallet, then confirm stake');
  try {
    const parsed = ethers.utils.parseEther(amountStr);
    await _ensureApproval(CONTRACT_ADDRESSES.NOVA_TOKEN, CONTRACT_ADDRESSES.STAKING, parsed);
    const sc = new ethers.Contract(CONTRACT_ADDRESSES.STAKING, STAKING_ABI, activeSigner);
    const tx = await sc.stake(parsed);
    txPending(tx.hash);
    await tx.wait();
    txSuccess(`Staked ${amount} NOVA successfully!`);
    window.ArcPoints?.award('stake');
    document.dispatchEvent(new CustomEvent('arcTxSuccess', { detail: { type: 'stake', btn: document.getElementById('stakeBtn') } }));
    _refreshOnchainUI();
  } catch (err) { txError(_parseErr(err)); }
}

/* ═══════════════════════════════════════════════════════════════════════════
   UNSTAKE
═══════════════════════════════════════════════════════════════════════════ */
async function executeUnstake(amountStr) {
  if (!_requireWallet()) return;
  await _ensureNetwork();
  openTxModal('Unstaking NOVA', 'Confirm the unstake transaction in your wallet');
  try {
    const sc = new ethers.Contract(CONTRACT_ADDRESSES.STAKING, STAKING_ABI, activeSigner);
    const tx = await sc.requestUnstake(ethers.utils.parseEther(amountStr));
    txPending(tx.hash);
    await tx.wait();
    txSuccess('Unstake requested! Tokens unlock after 24h.');
    window.ArcPoints?.award('unstake');
    document.dispatchEvent(new CustomEvent('arcTxSuccess', { detail: { type: 'unstake' } }));
    _refreshOnchainUI();
  } catch (err) { txError(_parseErr(err)); }
}

/* ═══════════════════════════════════════════════════════════════════════════
   WITHDRAW
═══════════════════════════════════════════════════════════════════════════ */
async function executeWithdraw() {
  if (!_requireWallet()) return;
  await _ensureNetwork();
  try {
    const scR = new ethers.Contract(CONTRACT_ADDRESSES.STAKING, STAKING_ABI, ethersProvider);
    const info = await scR.getUserInfo(activeAccount);
    const unbonding = parseFloat(ethers.utils.formatEther(info[2]));
    if (unbonding <= 0) { showToast('Nothing to withdraw — unstake first', 'info'); return; }
    const unbondEnd = info[3].toNumber();
    if (unbondEnd > Math.floor(Date.now() / 1000)) {
      const h = Math.ceil((unbondEnd - Date.now() / 1000) / 3600);
      showToast(`Tokens still bonding — ${h}h remaining`, 'info'); return;
    }
  } catch {}
  openTxModal('Withdrawing NOVA', 'Confirm the withdrawal in your wallet');
  try {
    const sc = new ethers.Contract(CONTRACT_ADDRESSES.STAKING, STAKING_ABI, activeSigner);
    const tx = await sc.withdraw();
    txPending(tx.hash);
    await tx.wait();
    txSuccess('NOVA withdrawn to your wallet!');
    document.dispatchEvent(new CustomEvent('arcTxSuccess', { detail: { type: 'withdraw' } }));
    _refreshOnchainUI();
  } catch (err) { txError(_parseErr(err)); }
}

/* ═══════════════════════════════════════════════════════════════════════════
   CLAIM REWARDS
═══════════════════════════════════════════════════════════════════════════ */
async function executeClaim() {
  if (!_requireWallet()) return;
  await _ensureNetwork();
  try {
    const scR   = new ethers.Contract(CONTRACT_ADDRESSES.STAKING, STAKING_ABI, ethersProvider);
    const earned = await scR.earned(activeAccount);
    if (earned.eq(0)) { showToast('No rewards to claim yet', 'info'); return; }
  } catch {}
  openTxModal('Claiming Rewards', 'Confirm the claim transaction in your wallet');
  try {
    const sc = new ethers.Contract(CONTRACT_ADDRESSES.STAKING, STAKING_ABI, activeSigner);
    const tx = await sc.claimRewards();
    txPending(tx.hash);
    await tx.wait();
    txSuccess('Staking rewards claimed!');
    window.ArcPoints?.award('claim_rewards');
    document.dispatchEvent(new CustomEvent('arcTxSuccess', { detail: { type: 'claim', btn: document.querySelector('[onclick="doClaim()"]') } }));
    _refreshOnchainUI();
  } catch (err) { txError(_parseErr(err)); }
}

/* ═══════════════════════════════════════════════════════════════════════════
   LIVE SWAP QUOTE
═══════════════════════════════════════════════════════════════════════════ */
async function getSwapQuote(fromSym, toSym, amountIn) {
  try {
    const rpc   = ethersProvider || new ethers.providers.JsonRpcProvider('https://rpc.testnet.arc.network');
    const swapC = new ethers.Contract(CONTRACT_ADDRESSES.SWAP, SWAP_ABI, rpc);
    const [novaRes, usdcRes] = await swapC.getReserves();
    if (fromSym === 'NOVA') {
      const out = await swapC.getAmountOut(ethers.utils.parseEther(String(amountIn)), novaRes, usdcRes);
      return parseFloat(ethers.utils.formatUnits(out, 6)).toFixed(4);
    } else {
      const out = await swapC.getAmountOut(ethers.utils.parseUnits(String(amountIn), 6), usdcRes, novaRes);
      return parseFloat(ethers.utils.formatEther(out)).toFixed(4);
    }
  } catch { return null; }
}

/* ── Called by wallet.js after wallet connect ── */
function initDemoBalances() {
  if (walletConnected) _refreshOnchainUI();
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
