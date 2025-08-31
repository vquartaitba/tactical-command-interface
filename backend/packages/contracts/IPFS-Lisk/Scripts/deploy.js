const hre = require("hardhat");
async function main() {
  const ScoreNFT = await hre.ethers.getContractFactory("ScoreNFT");
  const nft = await ScoreNFT.deploy();
  await nft.waitForDeployment();
  console.log("ScoreNFT:", await nft.getAddress());
}
main().catch((e)=>{ console.error(e); process.exit(1); });
