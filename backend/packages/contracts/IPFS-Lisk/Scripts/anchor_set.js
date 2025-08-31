require("dotenv").config();
const hre = require("hardhat");
const { keccak256, solidityPacked } = require("ethers");

async function main() {
  const { ANCHOR_ADDR, LISK_NFT_ADDR, TOKEN_ID, CID_PATH, ENC_HASH, PIECE_CID, DEAL_ID } = process.env;
  if (!ANCHOR_ADDR || !LISK_NFT_ADDR || !TOKEN_ID || !CID_PATH || !ENC_HASH) {
    throw new Error("Faltan ANCHOR_ADDR, LISK_NFT_ADDR, TOKEN_ID, CID_PATH, ENC_HASH");
  }
  const anchor = await hre.ethers.getContractAt("FilecoinAnchor", ANCHOR_ADDR);
  // key que vincula Lisk<->Filecoin: keccak(liskNFT, tokenId)
  const key = keccak256(solidityPacked(["address","uint256"], [LISK_NFT_ADDR, BigInt(TOKEN_ID)]));

  const tx = await anchor.set(key, {
    cid: CID_PATH,                           // ej: "bafy.../zkredit.enc.json"
    pieceCid: (PIECE_CID || ""),             // opcional
    dealId: Number(DEAL_ID || 0),            // opcional
    encHash: ENC_HASH                        // 0x...
  });
  const rc = await tx.wait();
  console.log("Anchored tx:", rc.hash);
  console.log("Key:", key);
}
main().catch(e => { console.error(e); process.exit(1); });
