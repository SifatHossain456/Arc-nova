const hre = require("hardhat");
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const bal = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Address:", deployer.address);
  console.log("Balance:", hre.ethers.formatUnits(bal, 6), "USDC");
  console.log("RAW_WEI:", bal.toString());
}
main().catch(e => { console.error(e.message); process.exit(1); });
