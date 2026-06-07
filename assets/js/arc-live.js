'use strict';
/* ── Arc Network Live Data ── polls real Arc testnet RPC ── */

const ArcLive = (() => {

  const RPC = 'https://rpc.testnet.arc.network';
  let _lastBlock = 0, _lastBlockTime = Date.now(), _blockTimes = [];

  async function _rpc(method, params) {
    const res = await fetch(RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method, params: params || [], id: 1 })
    });
    const d = await res.json();
    return d.result;
  }

  function _set(selector, value) {
    document.querySelectorAll(selector).forEach(el => {
      if (el.textContent !== String(value)) {
        el.textContent = value;
        el.classList.remove('arc-live-flash');
        void el.offsetWidth;
        el.classList.add('arc-live-flash');
      }
    });
  }

  async function poll() {
    try {
      const hex = await _rpc('eth_blockNumber');
      const block = parseInt(hex, 16);

      if (block > _lastBlock) {
        const now = Date.now();
        const elapsed = (now - _lastBlockTime) / 1000;

        if (_lastBlock > 0) {
          _blockTimes.push(elapsed);
          if (_blockTimes.length > 10) _blockTimes.shift();
        }

        const avgBlockTime = _blockTimes.length
          ? (_blockTimes.reduce((a,b) => a+b, 0) / _blockTimes.length).toFixed(2)
          : '—';

        _lastBlock     = block;
        _lastBlockTime = now;

        _set('[data-arc-block]',     block.toLocaleString());
        _set('[data-arc-blocktime]', avgBlockTime + 's');
        _set('[data-arc-network]',   'Arc Testnet');

        // pulse the status dot
        document.querySelectorAll('.arc-status-dot').forEach(el => {
          el.classList.remove('arc-status-pulse');
          void el.offsetWidth;
          el.classList.add('arc-status-pulse');
        });
      }

      // network status always green if we got a response
      document.querySelectorAll('[data-arc-status]').forEach(el => {
        el.textContent = 'Online';
        el.style.color = 'var(--green)';
      });

    } catch {
      document.querySelectorAll('[data-arc-status]').forEach(el => {
        el.textContent = 'Connecting…';
        el.style.color = 'var(--muted)';
      });
    }
  }

  function start() {
    poll();
    setInterval(poll, 4000);
  }

  document.addEventListener('DOMContentLoaded', start);

  return { poll, start };
})();
