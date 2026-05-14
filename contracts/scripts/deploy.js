const hre = require("hardhat");
const fs  = require("fs");
const path = require("path");

const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  /* ── Check native USDC balance ── */
  const natBal  = await hre.ethers.provider.getBalance(deployer.address);
  const usdcBal = parseFloat(hre.ethers.formatEther(natBal)); // Arc stores natively as 18-decimal wei
  console.log("USDC Balance:", usdcBal.toFixed(4), "USDC\n");

  if (usdcBal < 0.1) {
    console.error("ERROR: Insufficient USDC. Get test USDC from https://faucet.circle.com (select Arc Testnet)");
    process.exit(1);
  }

  /* ── 1. Deploy NOVA Token ── */
  console.log("1. Deploying ArcNovaToken...");
  const Token = await hre.ethers.getContractFactory("ArcNovaToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("   NOVA Token:", tokenAddr);

  /* ── 2. Deploy Swap ── */
  console.log("2. Deploying ArcNovaSwap...");
  const Swap = await hre.ethers.getContractFactory("ArcNovaSwap");
  const swap = await Swap.deploy(tokenAddr, USDC_ADDRESS);
  await swap.waitForDeployment();
  const swapAddr = await swap.getAddress();
  console.log("   Swap:      ", swapAddr);

  /* ── 3. Deploy Staking ── */
  console.log("3. Deploying ArcNovaStaking...");
  const Staking = await hre.ethers.getContractFactory("ArcNovaStaking");
  const staking = await Staking.deploy(tokenAddr);
  await staking.waitForDeployment();
  const stakingAddr = await staking.getAddress();
  console.log("   Staking:   ", stakingAddr);

  /* ── 4. Seed liquidity (scale to available USDC, max 5) ── */
  console.log("\n4. Seeding initial liquidity...");
  const usdcForLiq  = Math.min(usdcBal * 0.3, 5);    // use 30% of balance, max 5 USDC
  const novaForLiq  = usdcForLiq * 1000;              // 1000 NOVA per 1 USDC ratio
  const novaLiqAmt  = hre.ethers.parseEther(String(Math.floor(novaForLiq)));
  const usdcLiqAmt  = hre.ethers.parseUnits(usdcForLiq.toFixed(6), 6);

  /* Approve BOTH tokens for the swap contract */
  const usdcErc20 = new hre.ethers.Contract(USDC_ADDRESS, [
    "function approve(address,uint256) returns (bool)",
    "function allowance(address,address) view returns (uint256)",
  ], deployer);
  console.log("   Approving NOVA for swap...");
  await (await token.approve(swapAddr, novaLiqAmt)).wait();
  console.log("   Approving USDC for swap...");
  await (await usdcErc20.approve(swapAddr, usdcLiqAmt)).wait();
  console.log("   Adding liquidity...");
  await (await swap.addLiquidity(novaLiqAmt, usdcLiqAmt)).wait();
  console.log(`   Added ${Math.floor(novaForLiq).toLocaleString()} NOVA + ${usdcForLiq.toFixed(4)} USDC`);

  /* ── 5. Fund staking rewards (5M NOVA) ── */
  console.log("5. Funding staking rewards...");
  const rewardFund = hre.ethers.parseEther("5000000");
  await (await token.approve(stakingAddr, rewardFund)).wait();
  await (await staking.fundRewards(rewardFund)).wait();
  console.log("   Funded 5,000,000 NOVA for rewards");

  /* ── 6. Write addresses to contracts.js ── */
  const addresses = {
    NOVA_TOKEN: tokenAddr,
    SWAP:       swapAddr,
    STAKING:    stakingAddr,
    USDC:       USDC_ADDRESS,
  };

  const outPath  = path.join(__dirname, "../../assets/js/contracts.js");
  const existing = fs.readFileSync(outPath, "utf8");
  const updated  = existing.replace(
    /const CONTRACT_ADDRESSES = \{[\s\S]*?\};/,
    `const CONTRACT_ADDRESSES = ${JSON.stringify(addresses, null, 2)};`
  );
  fs.writeFileSync(outPath, updated);

  console.log("\n✅ Deployment complete!");
  console.log("   NOVA Token:", tokenAddr);
  console.log("   Swap:      ", swapAddr);
  console.log("   Staking:   ", stakingAddr);
  console.log("   Explorer:  ", "https://testnet.arcscan.app/address/" + tokenAddr);
  console.log("\n⚡ contracts.js updated — refresh the website!");
}

main().catch(err => { console.error(err); process.exit(1); });
