# Arc Nova — DeFi Hub on Arc Network

The premier DeFi hub built on Arc Network — swap NOVA ↔ USDC, stake for yield, explore liquidity pools, and discover new projects on Arc's stablecoin-native testnet.

## Features

- **Swap** — NOVA ↔ USDC swaps with live quotes, slippage control, and confirm-before-execute flow
- **Stake** — Stake NOVA to earn ~12.4% APY with 24-hour unbonding; partial and max unstake support
- **Earn** — Auto-compounding yield vaults (USDC Vault, ARC Growth Vault, Nova Alpha Vault)
- **Pools** — Liquidity pool table with TVL, 24h volume, fees, and APR per pair
- **Dashboard** — Real-time TVL, volume, and protocol analytics across Arc ecosystem
- **Launchpad** — Discover and participate in new Arc ecosystem project launches
- **Demo Mode** — Fully functional without a wallet — simulates all transactions in-memory

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript (no build step) |
| Web3 | ethers.js v5 |
| Wallets | MetaMask, WalletConnect (any EVM wallet) |
| Network | Arc Testnet (EVM-compatible) |
| Data | CoinGecko API, on-chain RPCs |

## Getting Started

No build step required — open directly in a browser or serve with any static server.

```bash
cd arc-nova
# Option 1: Python
python -m http.server 8080

# Option 2: Node
npx serve .
```

Or use the included PowerShell script:

```powershell
.\start-server.ps1
```

Then open [http://localhost:8080](http://localhost:8080).

## Demo Mode

If no smart contracts are deployed (testnet is offline), Arc Nova automatically enters **Demo Mode** — all swaps, stakes, and claims are simulated in-memory with realistic timing and fake transaction hashes. Full UX works without a wallet.

## Project Structure

```
arc-nova/
├── index.html          # Homepage
├── defi.html           # Swap, Stake, Earn, Pools
├── dashboard.html      # Analytics dashboard
├── launchpad.html      # Project launchpad
├── assets/
│   ├── css/styles.css  # Design system
│   └── js/
│       ├── wallet.js   # Wallet connection + modal
│       ├── web3.js     # On-chain + demo transactions
│       ├── app.js      # DeFi page logic
│       ├── livedata.js # Price + TVL data fetching
│       └── animations.js  # Visual engine
└── contracts/          # Solidity smart contracts
```

## Smart Contracts

Located in `/contracts` — ERC-20 NOVA token with built-in faucet, AMM swap contract, and staking contract with configurable APY and unbonding period.

## License

MIT
