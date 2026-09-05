import { getLexicon } from "@/lib/suggest";

export function closestWord(input: string): string | null {
  const lex = getLexicon();
  if (!lex) return null;
  const w = input.toLowerCase().replace(/[^a-z']/g, "");
  if (!w || w.length < 2) return null;
  if (lex.rank.has(w)) return null;

  let best: { word: string; dist: number; rank: number } | null = null;
  const minL = Math.max(2, w.length - 1);
  const maxL = w.length + 1;
  for (let len = minL; len <= maxL; len++) {
    const bucket = lex.byLen.get(len);
    if (!bucket) continue;
    for (const cand of bucket) {
      if (cand[0] !== w[0] && cand.length === w.length) continue;
      const d = editDistance(w, cand, 2);
      if (d > 2) continue;
      const rank = lex.rank.get(cand) ?? 99999;
      if (
        !best ||
        d < best.dist ||
        (d === best.dist && rank < best.rank)
      ) {
        best = { word: cand, dist: d, rank };
      }
    }
  }
  if (!best) return null;
  if (best.dist === 0) return null;
  if (best.dist === 2 && best.rank > 4000) return null;
  return preserveCase(input, best.word);
}

function preserveCase(original: string, replacement: string) {
  if (original.toUpperCase() === original && original.length > 1) {
    return replacement.toUpperCase();
  }
  if (original[0] && original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function editDistance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const m = a.length;
  const n = b.length;
  let prev = new Array(n + 1);
  let cur = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    let rowMin = cur[0];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return max + 1;
    [prev, cur] = [cur, prev];
  }
  return prev[n];
}
