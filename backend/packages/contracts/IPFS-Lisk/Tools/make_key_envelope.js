// Uso: node Tools/make_key_envelope.js "<KEY_B64>" "<MSG>" "<SIG_HEX>"
const { recoverPublicKey, hashMessage } = require("ethers");
const ecies = require("eciesjs");

const KEY_B64 = process.argv[2];
const MSG     = process.argv[3] || "Approve decrypt for token #1";
const SIG     = process.argv[4];

if (!KEY_B64 || !SIG) {
  console.error('Uso: node Tools/make_key_envelope.js "<KEY_B64>" "<MSG>" "<SIG_HEX>"');
  process.exit(1);
}

const digest = hashMessage(MSG);                 // EIP-191 hash
const pubKeyHex = recoverPublicKey(digest, SIG); // 0x04... (uncompressed)
const pubKey = Buffer.from(pubKeyHex.slice(2), "hex");

const encKey = ecies.encrypt(pubKey, Buffer.from(KEY_B64, "base64"));

const envelope = {
  forMessage: MSG,
  signature: SIG,
  alg: "ECIES-secp256k1",
  key_b64_enc: encKey.toString("base64"),
};

console.log(JSON.stringify(envelope, null, 2));
