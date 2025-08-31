require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const { NFT_ADDR, TO, CID_PATH } = process.env;
  if (!NFT_ADDR || !TO || !CID_PATH) throw new Error("Faltan NFT_ADDR, TO, CID_PATH");
  const nft = await hre.ethers.getContractAt("ScoreNFT", NFT_ADDR);
  const tx = await nft.mintTo(TO, CID_PATH);
  const rc = await tx.wait();
  console.log("Mint OK. tx:", rc.hash);
}
main().catch(e => { console.error(e); process.exit(1); });
