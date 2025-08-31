const fs = require('fs');
const { keccak256 } = require('ethers');
const bytes = fs.readFileSync('out/zkredit.enc.json');
console.log('ENC_HASH:', keccak256(bytes)); // imprime 0x...
