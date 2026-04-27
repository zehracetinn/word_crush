import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const dicPath = path.join(projectRoot, 'raw-dictionaries', 'tr_TR.dic');
const outPath = path.join(projectRoot, 'assets', 'dictionaries', 'tr_words.txt');

function normalizeTurkishWord(word) {
  return word
    .trim()
    .toLocaleUpperCase('tr-TR')
    .replace(/['’`-]/g, '');
}

function isOnlyTurkishLetters(word) {
  return /^[A-ZÇĞİIÖŞÜ]+$/u.test(word);
}

const raw = fs.readFileSync(dicPath, 'utf8');
const lines = raw.split(/\r?\n/);

const words = new Set();

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();

  if (!line) continue;

  // Hunspell .dic dosyalarında ilk satır genelde kelime sayısıdır
  if (i === 0 && /^\d+$/.test(line)) {
    continue;
  }

  // Yorum / metadata benzeri satırları atla
  if (line.startsWith('#')) continue;

  // İlk boşluğa kadar al
  let token = line.split(/\s+/)[0];

  // "kelime/FLAG" yapısında ise slash öncesini al
  token = token.split('/')[0];

  const normalized = normalizeTurkishWord(token);

  if (normalized.length < 3) continue;
  if (!isOnlyTurkishLetters(normalized)) continue;

  words.add(normalized);
}

const sortedWords = Array.from(words).sort((a, b) => a.localeCompare(b, 'tr'));
fs.writeFileSync(outPath, sortedWords.join('\n'), 'utf8');

console.log(`Sözlük hazırlandı: ${sortedWords.length} kelime`);
console.log(`Çıktı: ${outPath}`);