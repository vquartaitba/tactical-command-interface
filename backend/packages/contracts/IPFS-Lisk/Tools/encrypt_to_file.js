// Uso: node Tools/encrypt_to_file.js "Nombre Apellido" 742
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const NAME  = process.argv[2] || 'Alice Demo';
const SCORE = Number(process.argv[3] || 735);

function b64(buf){ return Buffer.from(buf).toString('base64'); }

const metadata = {
  name: NAME,
  description: 'ZKredit score (demo cifrada)',
  attributes: [{ trait_type: 'ZKreditScore', value: SCORE }],
  schema: 'zkredit-v1',
  encryptedAt: new Date().toISOString(),
};

// AES-256-GCM
const key = crypto.randomBytes(32);   // 256-bit
const iv  = crypto.randomBytes(12);   // 96-bit
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

const plaintext  = Buffer.from(JSON.stringify(metadata), 'utf8');
const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
const tag = cipher.getAuthTag();

const envelope = { alg:'AES-256-GCM', iv:b64(iv), tag:b64(tag), ciphertext:b64(ciphertext) };

fs.mkdirSync(path.join(process.cwd(), 'out'), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), 'out', 'zkredit.enc.json'), JSON.stringify(envelope), 'utf8');

console.log('✅ Generado: out/zkredit.enc.json');
console.log('KEY_B64 (guardá esto):', b64(key));
