export type DictSense = {
  pos: string;
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
};

export type DictEntry = {
  word: string;
  phonetic?: string;
  audio?: string;
  senses: DictSense[];
  synonyms: string[];
  antonyms: string[];
  source: "free-dict" | "ai";
};

type Meta = {
  count: number;
  maxLen: number;
  minLen: number;
  lengthCharStart: Record<string, number>;
  lengthCounts: Record<string, number>;
};

let blob: string | null = null;
let meta: Meta | null = null;
let blobPromise: Promise<string> | null = null;

export async function loadMeta(): Promise<Meta> {
  if (meta) return meta;
  const res = await fetch("/dict/meta.json");
  meta = (await res.json()) as Meta;
  return meta;
}

async function decompressGzip(buffer: ArrayBuffer): Promise<string> {
  if (typeof DecompressionStream !== "undefined") {
    const stream = new Response(buffer).body;
    if (!stream) throw new Error("No stream");
    const ds = stream.pipeThrough(new DecompressionStream("gzip"));
    return await new Response(ds).text();
  }
  throw new Error("gzip not supported");
}

export async function loadWordBlob(): Promise<string> {
  if (blob) return blob;
  if (blobPromise) return blobPromise;
  blobPromise = (async () => {
    await loadMeta();
    const res = await fetch("/dict/words.txt.gz");
    const buf = await res.arrayBuffer();
    blob = await decompressGzip(buf);
    return blob;
  })();
  return blobPromise;
}

function sliceLength(text: string, m: Meta, len: number): string[] {
  const start = m.lengthCharStart[String(len)];
  if (start === undefined) return [];
  const nextLen = Object.keys(m.lengthCharStart)
    .map(Number)
    .sort((a, b) => a - b)
    .find((l) => l > len);
  const end = nextLen === undefined ? text.length : m.lengthCharStart[String(nextLen)]!;
  const chunk = text.slice(start, end);
  return chunk.split("\n").filter(Boolean);
}

export async function wordsByLength(len: number, offset = 0, limit = 80) {
  const [text, m] = await Promise.all([loadWordBlob(), loadMeta()]);
  const all = sliceLength(text, m, len);
  return {
    total: all.length,
    words: all.slice(offset, offset + limit),
  };
}

export async function searchWords(query: string, limit = 60): Promise<string[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const [text, m] = await Promise.all([loadWordBlob(), loadMeta()]);
  const out: string[] = [];
  const startLen = q.length;
  for (let len = startLen; len <= m.maxLen && out.length < limit; len++) {
    const list = sliceLength(text, m, len);
    for (const w of list) {
      if (w.startsWith(q)) {
        out.push(w);
        if (out.length >= limit) break;
      }
    }
  }
  return out;
}

export async function lookupFreeDictionary(word: string): Promise<DictEntry | null> {
  const res = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
  );
  if (!res.ok) return null;
  const json = (await res.json()) as Array<{
    word: string;
    phonetic?: string;
    phonetics?: { text?: string; audio?: string }[];
    meanings?: {
      partOfSpeech?: string;
      synonyms?: string[];
      antonyms?: string[];
      definitions?: {
        definition?: string;
        example?: string;
        synonyms?: string[];
        antonyms?: string[];
      }[];
    }[];
  }>;
  const first = json[0];
  if (!first) return null;
  const audio = first.phonetics?.find((p) => p.audio)?.audio;
  const phonetic =
    first.phonetic || first.phonetics?.find((p) => p.text)?.text;
  const senses: DictSense[] = [];
  const syn = new Set<string>();
  const ant = new Set<string>();
  for (const meaning of first.meanings ?? []) {
    for (const def of meaning.definitions ?? []) {
      if (!def.definition) continue;
      const s = def.synonyms ?? [];
      const a = def.antonyms ?? [];
      s.forEach((x) => syn.add(x));
      a.forEach((x) => ant.add(x));
      (meaning.synonyms ?? []).forEach((x) => syn.add(x));
      (meaning.antonyms ?? []).forEach((x) => ant.add(x));
      senses.push({
        pos: meaning.partOfSpeech || "unknown",
        definition: def.definition,
        example: def.example,
        synonyms: s,
        antonyms: a,
      });
    }
  }
  if (!senses.length) return null;
  return {
    word: first.word,
    phonetic,
    audio,
    senses,
    synonyms: [...syn],
    antonyms: [...ant],
    source: "free-dict",
  };
}
