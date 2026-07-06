/**
 * Repair common UTF-8 mojibake stored when multi-byte punctuation / emoji were
 * saved through a broken import or legacy connection encoding.
 *
 * Order: longest corrupted sequences first.
 */
const MOJIBAKE_REPLACEMENTS = [
  ['≡ƒÅ╖∩╕Å', '🏷️'],
  ['ΓÜû∩╕Å', '⚖️'],
  ['≡ƒôª', '📦'],
  ['≡ƒîì', '🌍'],
  ['≡ƒòÉ', '🕐'],
  ['≡ƒôì', '📍'],
  ['ΓÇö', '—'],
  ['ΓÇô', '–'],
  ['ΓåÆ', '→'],
  ['Γåù', '↗'],
  ['ΓÇÖ', "'"],
  ['ΓÇ£', '"'],
  ['ΓÇ¥', '"'],
  ['┬╖', '·'],
];

const MOJIBAKE_MARKERS = /Γ|≡|┬╖|┬|∩╕Å|ƒ/;

/** @param {unknown} text */
export function repairMojibakeText(text) {
  if (typeof text !== 'string' || !text || !MOJIBAKE_MARKERS.test(text)) return text;
  let out = text;
  for (const [bad, good] of MOJIBAKE_REPLACEMENTS) {
    if (out.includes(bad)) out = out.split(bad).join(good);
  }
  return out;
}

/** Deep-repair string leaves inside JSON-like props blobs. */
export function repairMojibakeDeep(value) {
  if (typeof value === 'string') return repairMojibakeText(value);
  if (Array.isArray(value)) return value.map((item) => repairMojibakeDeep(item));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = repairMojibakeDeep(nested);
    }
    return out;
  }
  return value;
}

export { MOJIBAKE_REPLACEMENTS, MOJIBAKE_MARKERS };
