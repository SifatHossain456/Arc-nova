const hre = require("hardhat");
const fs  = require("fs");
const path = require("path");

/* ── Deployed addresses (from previous deploy run) ── */
const TOKEN_ADDR   = "0xd6c5A7993667AE2802A65F65eaA86e37DBF5bb08";
const SWAP_ADDR    = "0x72d707d8Dc5556f634fA8B372Ef85e19E0663287";
const STAKING_ADDR = "0xA299E710a399095c05d18c9b39FEa016114Ef551";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Wallet:", deployer.address);

  /* Check USDC ERC20 balance */
  const usdcERC20 = new hre.ethers.Contract(USDC_ADDRESS, ERC20_ABI, deployer);
  const usdcRaw   = await usdcERC20.balanceOf(deployer.address);
  const usdcBal   = parseFloat(hre.ethers.formatUnits(usdcRaw, 6));
  console.log("ERC20 USDC balance:", usdcBal.toFixed(4), "USDC");

  /* NOVA token */
  const token = await hre.ethers.getContractAt("ArcNovaToken", TOKEN_ADDR, deployer);
  const novaBal = parseFloat(hre.ethers.formatEther(await token.balanceOf(deployer.address)));
  console.log("NOVA balance:", novaBal.toFixed(2), "NOVA\n");

  /* ── Seed liquidity ── */
  /* Use 5 USDC + 5,000 NOVA (keeps gas money; ratio = 1 USDC per 1000 NOVA) */
  const usdcLiq = hre.ethers.parseUnits("5", 6);
  const novaLiq = hre.ethers.parseEther("5000");

  console.log("Approving NOVA for Swap...");
  await (await token.approve(SWAP_ADDR, novaLiq)).wait();
  console.log("Approving USDC for Swap...");
  await (await usdcERC20.approve(SWAP_ADDR, usdcLiq)).wait();

  console.log("Adding liquidity (5,000 NOVA + 5 USDC)...");
  const swap = await hre.ethers.getContractAt("ArcNovaSwap", SWAP_ADDR, deployer);
  await (await swap.addLiquidity(novaLiq, usdcLiq)).wait();
  console.log("✅ Liquidity seeded!");

  /* ── Fund staking rewards ── */
  console.log("\nFunding staking (500,000 NOVA rewards)...");
  const rewardAmt = hre.ethers.parseEther("500000");
  await (await token.approve(STAKING_ADDR, rewardAmt)).wait();
  const staking = await hre.ethers.getContractAt("ArcNovaStaking", STAKING_ADDR, deployer);
  await (await staking.fundRewards(rewardAmt)).wait();
  console.log("✅ Staking rewards funded!");

  /* ── Update contracts.js ── */
  const addresses = {
    NOVA_TOKEN: TOKEN_ADDR,
    SWAP:       SWAP_ADDR,
    STAKING:    STAKING_ADDR,
    USDC:       USDC_ADDRESS,
  };

  const outPath  = path.join(__dirname, "../../assets/js/contracts.js");
  const existing = fs.readFileSync(outPath, "utf8");
  const updated  = existing.replace(
    /const CONTRACT_ADDRESSES = \{[\s\S]*?\};/,
    `const CONTRACT_ADDRESSES = ${JSON.stringify(addresses, null, 2)};`
  );
  fs.writeFileSync(outPath, updated);

  console.log("\n✅ contracts.js updated!");
  console.log("   NOVA :", TOKEN_ADDR);
  console.log("   Swap :", SWAP_ADDR);
  console.log("   Stake:", STAKING_ADDR);
  console.log("   Open http://localhost:3000 and test!");
}

main().catch(err => { console.error(err.message); process.exit(1); });
