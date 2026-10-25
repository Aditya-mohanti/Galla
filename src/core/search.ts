// IT-11: one search box that finds items saved in Devanagari or Latin script.
// Both sides are reduced to a loose Latin "sound key" so "chini" finds "चीनी"
// and "daal" finds "दाल".

const CONSONANTS: Record<string, string> = {
  क: 'k', ख: 'kh', ग: 'g', घ: 'gh', ङ: 'n', च: 'ch', छ: 'chh', ज: 'j', झ: 'jh', ञ: 'n',
  ट: 't', ठ: 'th', ड: 'd', ढ: 'dh', ण: 'n', त: 't', थ: 'th', द: 'd', ध: 'dh', न: 'n',
  प: 'p', फ: 'f', ब: 'b', भ: 'bh', म: 'm', य: 'y', र: 'r', ल: 'l', व: 'v', श: 'sh',
  ष: 'sh', स: 's', ह: 'h', ळ: 'l', क़: 'k', ख़: 'kh', ग़: 'g', ज़: 'j', ड़: 'r', ढ़: 'rh', फ़: 'f',
};
const VOWELS: Record<string, string> = {
  अ: 'a', आ: 'a', इ: 'i', ई: 'i', उ: 'u', ऊ: 'u', ऋ: 'ri', ए: 'e', ऐ: 'ai', ओ: 'o', औ: 'au',
};
const MATRAS: Record<string, string> = {
  'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u', 'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
};
const VIRAMA = '्';
const NASAL = new Set(['ं', 'ँ']);
const NUKTA = '़';
const DIGITS = '०१२३४५६७८९';

export function devanagariToLatin(input: string): string {
  const chars = [...input.normalize('NFC')];
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    let ch = chars[i];
    if (chars[i + 1] === NUKTA) { ch += NUKTA; i++; }
    const next = chars[i + 1];
    if (CONSONANTS[ch] !== undefined) {
      out += CONSONANTS[ch];
      if (next === VIRAMA) { i++; continue; }
      if (next && MATRAS[next] !== undefined) { out += MATRAS[next]; i++; continue; }
      out += 'a'; // inherent vowel; trailing schwa is dropped in soundKey
    } else if (VOWELS[ch] !== undefined) out += VOWELS[ch];
    else if (MATRAS[ch] !== undefined) out += MATRAS[ch];
    else if (NASAL.has(ch)) out += 'n';
    else if (DIGITS.includes(ch)) out += String(DIGITS.indexOf(ch));
    else if (ch === VIRAMA) continue;
    else out += ch;
  }
  return out;
}

/** Loose phonetic key: lowercase Latin with long vowels, doubles and common spellings merged. */
export function soundKey(input: string): string {
  return devanagariToLatin(input)
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) =>
      w
        .replace(/ee|ii|y(?=$)/g, 'i')
        .replace(/oo|uu/g, 'u')
        .replace(/w/g, 'v')
        .replace(/z/g, 'j')
        .replace(/ph/g, 'f')
        .replace(/q/g, 'k')
        .replace(/([a-z])\1+/g, '$1')
        // Hindi drops most inherent "a" sounds (नमकीन = namkeen), and people spell them
        // inconsistently in Latin, so every non-initial "a" is ignored on both sides.
        .replace(/(?!^)a/g, ''),
    )
    .join(' ');
}

export function hasDevanagari(s: string): boolean {
  return /[ऀ-ॿ]/.test(s);
}

export type Searchable = { name: string; sku?: string | null; category?: string | null };

/** Matches name, SKU and category in both scripts. Plain substring match first, then sound match. */
export function matchesSearch(item: Searchable, query: string): 'exact' | 'sound' | null {
  const q = query.trim().toLowerCase();
  if (!q) return 'exact';
  const fields = [item.name, item.sku ?? '', item.category ?? ''];
  if (fields.some((f) => f.toLowerCase().includes(q))) return 'exact';
  const qk = soundKey(q);
  if (qk.replace(/ /g, '').length < 2) return null;
  if (fields.some((f) => soundKey(f).includes(qk))) return 'sound';
  return null;
}
