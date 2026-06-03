// Generates assets/beep.wav: a short ~120ms 2700Hz tone with quick attack/release,
// matching the chirpy "beep" of a supermarket barcode scanner.
const fs = require('fs');
const path = require('path');

const sampleRate = 22050;
const durationSec = 0.12;
const freq = 2700;
const amplitude = 0.55;

const totalSamples = Math.floor(sampleRate * durationSec);
const attack = Math.floor(sampleRate * 0.005);
const release = Math.floor(sampleRate * 0.02);

const pcm = Buffer.alloc(totalSamples * 2);
for (let i = 0; i < totalSamples; i++) {
  let env = 1;
  if (i < attack) env = i / attack;
  else if (i > totalSamples - release) env = (totalSamples - i) / release;
  const sample = Math.sin((2 * Math.PI * freq * i) / sampleRate) * amplitude * env;
  const int16 = Math.max(-1, Math.min(1, sample)) * 0x7fff;
  pcm.writeInt16LE(int16 | 0, i * 2);
}

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);          // PCM
header.writeUInt16LE(1, 22);          // mono
header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(sampleRate * 2, 28); // byte rate
header.writeUInt16LE(2, 32);          // block align
header.writeUInt16LE(16, 34);         // bits per sample
header.write('data', 36);
header.writeUInt32LE(pcm.length, 40);

const out = path.join(__dirname, '..', 'assets', 'beep.wav');
fs.writeFileSync(out, Buffer.concat([header, pcm]));
console.log('Wrote', out, pcm.length + 44, 'bytes');
