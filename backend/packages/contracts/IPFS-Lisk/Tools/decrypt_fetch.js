// Uso: node Tools/decrypt_fetch.js <CID_o_CID/archivo> <KEY_B64>
// Ejemplos:
//   node Tools/decrypt_fetch.js bafy.../zkredit.enc.json MI_KEY_B64
//   node Tools/decrypt_fetch.js bafy... MI_KEY_B64           (si subiste con --no-wrap)
const crypto = require('crypto');

function b64d(s){ return Buffer.from(s, 'base64'); }

async function fetchEnvelope(cidOrPath){
  // probamos w3s.link y, si falla, ipfs.io como fallback
  const urls = [
    `https://w3s.link/ipfs/${cidOrPath}`,
    `https://ipfs.io/ipfs/${cidOrPath}`,
    `https://dweb.link/ipfs/${cidOrPath}`,
  ];
  let lastErr;
  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: 'follow' }); // ¡sigue 301/302!
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return await res.json(); // nuestro archivo es JSON (el "sobre" cifrado)
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

(async () => {
  const [,, CID_OR_PATH, KEY_B64] = process.argv;
  if (!CID_OR_PATH || !KEY_B64) {
    console.error('Uso: node Tools/decrypt_fetch.js <CID_o_CID/archivo> <KEY_B64>');
    process.exit(1);
  }

  const env = await fetchEnvelope(CID_OR_PATH);

  const key = b64d(KEY_B64);
  if (key.length !== 32) throw new Error('KEY_B64 no es AES-256');

  const iv  = b64d(env.iv);
  const tag = b64d(env.tag);
  const ct  = b64d(env.ciphertext);

  const dec = crypto.createDecipheriv('aes-256-gcm', key, iv);
  dec.setAuthTag(tag);
  const pt = Buffer.concat([dec.update(ct), dec.final()]);
  const meta = JSON.parse(pt.toString('utf8'));

  console.log('✅ Descifrado OK');
  console.log(meta);
  console.log(`Nombre: ${meta.name} | Score: ${meta.attributes?.[0]?.value}`);
})().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
