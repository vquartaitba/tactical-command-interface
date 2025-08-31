// Uso: node Tools/open_key_envelope.js "<ENVELOPE_JSON>" "<PRIVATE_KEY_HEX>"
const ecies = require("eciesjs");

const envJson = process.argv[2];
const PK      = process.argv[3]; // 0x...

if (!envJson || !PK) { console.error("Uso: node Tools/open_key_envelope.js '<ENVELOPE_JSON>' '<PRIVATE_KEY_HEX>'"); process.exit(1); }

const env = JSON.parse(envJson);
const priv = Buffer.from(PK.replace(/^0x/, ""), "hex");

const aesKey = ecies.decrypt(priv, Buffer.from(env.key_b64_enc, "base64"));
console.log("KEY_B64:", aesKey.toString()); // con esto puede correr decrypt_fetch.js
