/* ── Arc Nova — Contract Addresses & ABIs ──────────────────────────────── */
/* After deploying, run: npm run deploy  (addresses auto-updated by script)  */

const CONTRACT_ADDRESSES = {
  "NOVA_TOKEN": "0x9a718c17a25bEB1Caf9a35c843932Bd4a6b75aB5",
  "SWAP": "0x4938ABC30c8730D39855d11fC10F37bAD87FAcD3",
  "STAKING": "0x93358717C67c575C6B8D4eBF750DA3f784ae2FfE",
  "USDC": "0x3600000000000000000000000000000000000000"
};

const isDeployed = addr => addr !== '0x0000000000000000000000000000000000000000';

/* ── ERC20 ABI (minimal) ── */
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function transfer(address,uint256) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

/* ── NOVA Token ABI ── */
const TOKEN_ABI = [
  ...ERC20_ABI,
  "function faucet()",
  "function lastFaucet(address) view returns (uint256)",
  "function mint(address,uint256)",
];

/* ── Swap ABI ── */
const SWAP_ABI = [
  "function swapNovaForUsdc(uint256 novaAmountIn, uint256 minUsdcOut)",
  "function swapUsdcForNova(uint256 usdcAmountIn, uint256 minNovaOut)",
  "function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) view returns (uint256)",
  "function getReserves() view returns (uint256 nova, uint256 usdc)",
  "function getPrice() view returns (uint256)",
  "function novaReserve() view returns (uint256)",
  "function usdcReserve() view returns (uint256)",
  "event Swap(address indexed user, address tokenIn, uint256 amountIn, uint256 amountOut)",
];

/* ── Staking ABI ── */
const STAKING_ABI = [
  "function stake(uint256 amount)",
  "function requestUnstake(uint256 amount)",
  "function withdraw()",
  "function claimRewards()",
  "function earned(address account) view returns (uint256)",
  "function getUserInfo(address account) view returns (uint256 staked, uint256 pendingRewards, uint256 unbondingAmount, uint256 unbondingEnd)",
  "function totalStaked() view returns (uint256)",
  "function rewardRate() view returns (uint256)",
  "event Staked(address indexed user, uint256 amount)",
  "event RewardClaimed(address indexed user, uint256 amount)",
  "event UnstakeRequested(address indexed user, uint256 amount, uint256 availableAt)",
];

/* ── Arc Testnet Config ── */
const ARC_CHAIN_ID  = 5042002;
const ARC_CHAIN_HEX = '0x' + ARC_CHAIN_ID.toString(16);

const ARC_TESTNET_PARAMS = {
  chainId:           ARC_CHAIN_HEX,
  chainName:         'Arc Testnet',
  nativeCurrency:    { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls:           ['https://rpc.testnet.arc.network'],
  blockExplorerUrls: ['https://testnet.arcscan.app'],
};

const EXPLORER = 'https://testnet.arcscan.app';
