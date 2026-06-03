# Arc Nova — DeFi Hub on Arc Network

> Production-quality DeFi application on Arc Testnet. Swap tokens, stake NOVA, earn yield, and discover early-stage projects — real on-chain settlement, premium UI, zero frameworks.

**[Live App →](https://arc-nova.vercel.app)**

---

## Features

| | |
|---|---|
| 🔄 **Token Swap** | NOVA ↔ USDC with live on-chain quote, 0.3% fee, configurable slippage |
| 🏦 **NOVA Staking** | 12% APY, 24h unbonding, real-time reward accrual |
| 💰 **Yield Vaults** | Multiple strategies with live APY and TVL |
| 🌊 **Liquidity Pools** | Add/remove LP, track fees and 24h volume |
| 📊 **Live Dashboard** | Real block data, CoinGecko prices, DEX analytics |
| 🚀 **Launchpad** | IDO discovery and fair-launch participation |
| 🪂 **XP Airdrop** | Earn XP for every on-chain action → NOVA allocation at mainnet |

---

## Technical Highlights

**Wallet**
- EIP-6963 multi-provider detection — picks up MetaMask, Rabby, Coinbase Wallet, Trust, Phantom, and any other installed wallet simultaneously
- "Recent wallet" memory via `localStorage`
- Wrong-network amber banner + one-click switch to Arc Testnet
- 3-step TX modal: *Confirm in wallet → Broadcasting → Confirmed*

**UX**
- Smart swap button states: *Enter an amount → Getting price… → Swap Now*
- Skeleton shimmer loaders while chain data loads
- Stacked toast system (max 4, progress bar, auto-dismiss)
- ESC closes any open modal
- Card mouse-glow spotlight + 3D tilt on hover
- Aurora blob background with scroll reveal animations

**Data**
- Arc Testnet RPC: live block number, pool reserves, total staked
- CoinGecko public API: ETH & BTC prices with 24h change
- No mocked prices — shows `—` until real data arrives

**XP & Airdrop Engine**
- Awards XP for every on-chain action (swap, stake, claim, faucet, daily check-in)
- Tier system: Bronze → Silver → Gold → Platinum → 💎 Diamond
- Achievement badges, daily streak with compounding bonus, leaderboard
- All state in `localStorage` — no backend required

---

## Stack

| Layer | Tech |
|---|---|
| Web3 | ethers.js 5.7.2 |
| Wallet detection | EIP-6963 (`eip6963:announceProvider`) |
| Price data | CoinGecko public REST API |
| Charts | Chart.js 4.4 |
| Fonts | Inter — Google Fonts |
| Deploy | Vercel (auto-deploy on `git push main`) |
| Framework | **None** — pure HTML / CSS / JS |

---

## Architecture

```
arc-nova/
├── index.html           # Landing page + airdrop XP section
├── dashboard.html       # Live protocol analytics + XP leaderboard
├── defi.html            # Swap / Stake / Earn / Pools
├── launchpad.html       # Project discovery + IDO participation
└── assets/
    ├── css/
    │   └── styles.css   # Full design system (vars, components, layout)
    └── js/
        ├── contracts.js # ABIs + contract addresses + chain config
        ├── wallet.js    # EIP-6963 manager, connect modal, TX modal, account modal
        ├── web3.js      # All on-chain logic (swap, stake, claim, faucet)
        ├── livedata.js  # Real-time data engine (RPC + CoinGecko polling)
        ├── points.js    # XP / airdrop engine (tiers, achievements, leaderboard)
        ├── animations.js# Aurora blobs, scroll reveal, card glow, button ripple
        └── app.js       # Toast stack, token selector, countdown, keyboard shortcuts
```

---

## Smart Contracts (Arc Testnet — Chain ID: 5042002)

| Contract | Address |
|---|---|
| NOVA Token | `0x3619Ce00C6300126543BcEd410D064212284B818` |
| Swap | `0x334db09B3809c595E4D1B317E95c725715a65c39` |
| Staking | `0xf6001aEceB3f3EF35b25682FCaF397ab11a14D59` |

RPC: `https://rpc.testnet.arc.network`  
Explorer: `https://testnet.arcscan.app`

---

## Run Locally

```bash
git clone https://github.com/SifatHossain456/Arc-nova.git
cd Arc-nova

# No build step. No npm install. Just open index.html, or:
npx serve .
```

Add Arc Testnet to MetaMask manually:

| Field | Value |
|---|---|
| Network name | Arc Testnet |
| RPC URL | `https://rpc.testnet.arc.network` |
| Chain ID | `5042002` |
| Currency symbol | `ARC` |
| Block explorer | `https://testnet.arcscan.app` |

---

## XP & Airdrop System

Early testnet users accumulate XP through on-chain activity. Higher tier at mainnet launch = larger NOVA token allocation.

| Action | XP |
|---|---|
| Connect wallet | +50 (once) |
| Swap tokens | +25 per swap (+100 first time) |
| Stake NOVA | +40 per stake (+100 first time) |
| Claim rewards | +20 per claim |
| Daily check-in | +15/day (+5 streak bonus/day, max +30) |

| Tier | XP | Allocation |
|---|---|---|
| 🥉 Bronze | 0 – 249 | 0.5% |
| 🥈 Silver | 250 – 799 | 1% |
| 🥇 Gold | 800 – 1,999 | 2% |
| 🏆 Platinum | 2,000 – 4,999 | 4% |
| 💎 Diamond | 5,000+ | 8% |

Snapshot date: TBA at mainnet launch.

---

## Demo Mode

When contracts are not deployed, Arc Nova enters **Demo Mode** automatically — simulated transactions with a fake hash, realistic timing, no wallet approval needed. All XP awards fire in demo mode too.

---

## License

MIT — built by [@SifatHossain456](https://github.com/SifatHossain456)
