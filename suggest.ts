export type Lexicon = {
  words: string[];
  freq: number[];
  rank: Map<string, number>;
  byLen: Map<number, string[]>;
};

let lexicon: Lexicon | null = null;
let loading: Promise<Lexicon> | null = null;

export async function loadLexicon(): Promise<Lexicon> {
  if (lexicon) return lexicon;
  if (loading) return loading;
  loading = (async () => {
    const res = await fetch("/dict/suggest.json");
    const data = (await res.json()) as { words: string[]; freq: number[] };
    const rank = new Map<string, number>();
    const byLen = new Map<number, string[]>();
    data.words.forEach((w, i) => {
      rank.set(w, i);
      const list = byLen.get(w.length);
      if (list) list.push(w);
      else byLen.set(w.length, [w]);
    });
    lexicon = { words: data.words, freq: data.freq, rank, byLen };
    return lexicon;
  })();
  return loading;
}

export function getLexicon() {
  return lexicon;
}

const NEXT: Record<string, string[]> = {
  the: ["first", "same", "best", "only", "new"],
  a: ["new", "great", "little", "few", "good"],
  i: ["am", "will", "have", "think", "would"],
  we: ["are", "will", "have", "can", "should"],
  you: ["are", "can", "will", "have", "should"],
  to: ["the", "be", "see", "make", "get"],
  and: ["the", "I", "then", "also", "we"],
  is: ["the", "a", "not", "this", "it"],
  in: ["the", "a", "this", "my", "our"],
  for: ["the", "a", "you", "this", "me"],
  of: ["the", "a", "this", "my", "our"],
  that: ["is", "was", "the", "I", "we"],
  it: ["is", "was", "will", "can", "would"],
  on: ["the", "my", "this", "a", "our"],
  with: ["the", "you", "my", "a", "our"],
  this: ["is", "was", "will", "one", "time"],
  can: ["you", "I", "we", "be", "not"],
  will: ["be", "you", "I", "not", "have"],
  please: ["let", "send", "review", "confirm", "see"],
  thank: ["you", "you!", "you."],
  thanks: ["for", "so", "again"],
  looking: ["forward", "at", "into"],
  let: ["me", "us", "you"],
  how: ["are", "is", "about", "much", "long"],
  what: ["is", "are", "do", "about", "if"],
};

function completions(prefix: string, lex: Lexicon, limit: number): string[] {
  if (!prefix) return [];
  const p = prefix.toLowerCase();
  const out: string[] = [];
  const start = Math.max(1, p.length);
  for (let len = start; len <= Math.min(22, p.length + 12); len++) {
    const bucket = lex.byLen.get(len);
    if (!bucket) continue;
    for (const w of bucket) {
      if (w.startsWith(p) && w !== p) {
        out.push(w);
        if (out.length >= limit) return out;
      }
    }
  }
  return out;
}

export function suggestWords(
  text: string,
  extra: string[] = [],
): [string, string, string] {
  const lex = lexicon;
  const trimmed = text.replace(/\u00a0/g, " ");
  const m = trimmed.match(/([^\s]+)$/);
  const prefix = m ? m[1] : "";
  const before = trimmed.slice(0, trimmed.length - prefix.length);
  const prev = before.trim().split(/\s+/).filter(Boolean).pop()?.toLowerCase();
  const next = prev ? NEXT[prev.replace(/[^a-z']/g, "")] ?? [] : [];

  const extraHits = extra.filter((w) =>
    prefix ? w.toLowerCase().startsWith(prefix.toLowerCase()) : true,
  );

  if (!prefix) {
    const base = [...extraHits, ...next, "the", "I", "to", "a", "you"];
    const uniq = [...new Set(base.map((w) => w))];
    return [uniq[0] ?? "the", uniq[1] ?? "I", uniq[2] ?? "to"];
  }

  const comps = lex ? completions(prefix, lex, 8) : [];
  const mixed = [...extraHits, ...comps];
  if (/^[A-Z]/.test(prefix)) {
    for (let i = 0; i < mixed.length; i++) {
      mixed[i] = mixed[i]!.charAt(0).toUpperCase() + mixed[i]!.slice(1);
    }
  }
  const uniq = [...new Set(mixed)];
  while (uniq.length < 3) {
    uniq.push(prefix);
  }
  return [uniq[0]!, uniq[1]!, uniq[2]!];
}

export function matchSwipe(pathKeys: string[]): string | null {
  const lex = lexicon;
  if (!lex || pathKeys.length < 2) return null;
  const keys = pathKeys.map((k) => k.toLowerCase());
  const first = keys[0]!;
  const last = keys[keys.length - 1]!;
  const seq = keys.join("");
  let best: { w: string; score: number } | null = null;
  const minL = Math.max(2, Math.min(keys.length - 3, keys.length));
  const maxL = Math.min(22, keys.length + 1);
  for (let len = minL; len <= maxL; len++) {
    const bucket = lex.byLen.get(len);
    if (!bucket) continue;
    for (const w of bucket) {
      if (w[0] !== first || w[w.length - 1] !== last) continue;
      if (!isSubsequence(w, seq)) continue;
      const rank = lex.rank.get(w) ?? 20000;
      const lenDelta = Math.abs(w.length - keys.length);
      const score = rank + lenDelta * 80;
      if (!best || score < best.score) best = { w, score };
    }
  }
  return best?.w ?? null;
}

function isSubsequence(word: string, seq: string) {
  let i = 0;
  for (let s = 0; s < seq.length && i < word.length; s++) {
    if (seq[s] === word[i]) i++;
  }
  return i === word.length;
}
