#!/usr/bin/env node
/**
 * Encode an API key for config.json (apiKeyEnc field).
 * Usage: node tools/encode-key.js <your-api-key>
 * Output: base64(XOR(key, "dsh-prompt-polish")) — paste into config.json as apiKeyEnc.
 */
const XOR_PAD = 'dsh-prompt-polish';
const key = process.argv[2];
if (!key) {
  console.error('Usage: node tools/encode-key.js <your-api-key>');
  process.exit(1);
}
const out = Buffer.alloc(key.length);
for (let i = 0; i < key.length; i += 1) out[i] = key.charCodeAt(i) ^ XOR_PAD.charCodeAt(i % XOR_PAD.length);
console.log(out.toString('base64'));
