import { useEffect, useMemo, useState } from "react";
import { BookOpen, Copy, LoaderCircle, Volume2 } from "lucide-react";
import {
  loadMeta,
  lookupFreeDictionary,
  searchWords,
  wordsByLength,
  type DictEntry,
} from "@/lib/dictionary";
import { aiDefine } from "@/lib/ai";
import { useKeyboard } from "@/lib/keyboard-store";

const cache = new Map<string, DictEntry>();

export function DictionaryPanel() {
  const query = useKeyboard((s) => s.fields["panel.query"].text);
  const insertText = useKeyboard((s) => s.insertText);
  const addClip = useKeyboard((s) => s.addClip);
  const focusField = useKeyboard((s) => s.focusField);
  const composerField = useKeyboard((s) => s.composerField);
  const setPanel = useKeyboard((s) => s.setPanel);

  const [metaCount, setMetaCount] = useState(1_000_000);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [len, setLen] = useState(1);
  const [browse, setBrowse] = useState<string[]>([]);
  const [hits, setHits] = useState<string[]>([]);
  const [entry, setEntry] = useState<DictEntry | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "missing">("idle");
  const [indexReady, setIndexReady] = useState(false);

  useEffect(() => {
    focusField("panel.query", "panel");
    void loadMeta().then((m) => {
      setMetaCount(m.count);
      setCounts(m.lengthCounts);
    });
  }, [focusField]);

  useEffect(() => {
    let cancelled = false;
    void wordsByLength(len, 0, 80).then((r) => {
      if (!cancelled) {
        setBrowse(r.words);
        setIndexReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [len]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(() => {
      void searchWords(q, 50).then((words) => {
        if (!cancelled) setHits(words);
      });
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [query]);

  async function define(word: string) {
    const key = word.toLowerCase();
    setStatus("loading");
    if (cache.has(key)) {
      setEntry(cache.get(key)!);
      setStatus("idle");
      return;
    }
    const free = await lookupFreeDictionary(word);
    if (free) {
      cache.set(key, free);
      setEntry(free);
      setStatus("idle");
      return;
    }
    const ai = await aiDefine({ data: { word } });
    if (ai.ok && "entry" in ai && ai.entry) {
      const mapped: DictEntry = {
        word: ai.entry.word || word,
        phonetic: ai.entry.phonetic,
        senses: (ai.entry.senses ?? []).map((s) => ({
          pos: s.pos,
          definition: s.definition,
          example: s.example,
          synonyms: s.synonyms ?? [],
          antonyms: s.antonyms ?? [],
        })),
        synonyms: ai.entry.synonyms ?? [],
        antonyms: ai.entry.antonyms ?? [],
        source: "ai",
      };
      if (mapped.senses.length) {
        cache.set(key, mapped);
        setEntry(mapped);
        setStatus("idle");
        return;
      }
    }
    setEntry(null);
    setStatus("missing");
  }

  function insertWord(word: string) {
    focusField(composerField, "composer");
    insertText(word + " ", { literal: true });
    setPanel(null);
  }

  const list = query.trim() ? hits : browse;
  const lengthKeys = useMemo(
    () =>
      Object.keys(counts)
        .map(Number)
        .sort((a, b) => a - b),
    [counts],
  );

  return (
    <div className="panel-sheet">
      <div className="flex items-center justify-between px-2 pt-1 pb-1">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <BookOpen className="size-4" />
          Dictionary
        </div>
        <p className="text-xs text-fg-muted tabular-nums">
          {metaCount.toLocaleString()} words
        </p>
      </div>
      <p className="px-2 pb-1 text-[11px] text-fg-muted">
        Search is independent of your message. Insert when you are ready.
      </p>
      <div className="mx-2 mb-1 rounded-md bg-[var(--key-bg)] px-3 py-2 text-sm">
        {query || <span className="text-fg-subtle">Type a word to look up</span>}
        <span className="ml-px inline-block h-4 w-px animate-pulse bg-accent align-middle" />
      </div>
      <div className="flex gap-1 overflow-x-auto px-2 pb-1">
        {lengthKeys.slice(0, 16).map((n) => (
          <button
            key={n}
            type="button"
            className="word-chip shrink-0"
            data-on={len === n ? "true" : "false"}
            style={
              len === n
                ? { background: "var(--key-enter)", color: "var(--key-enter-fg)" }
                : undefined
            }
            onClick={() => {
              setLen(n);
              setEntry(null);
            }}
          >
            {n} {n === 1 ? "letter" : "letters"}
          </button>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-5 gap-2 px-2 pb-2">
        <div className="col-span-2 overflow-y-auto overscroll-contain">
          {!indexReady && (
            <p className="px-1 py-2 text-xs text-fg-muted">Loading index…</p>
          )}
          {list.map((w) => (
            <button
              key={w}
              type="button"
              className="block w-full truncate rounded-sm px-1 py-1 text-left text-sm hover:bg-[var(--key-mod)]"
              onClick={() => void define(w)}
            >
              {w}
            </button>
          ))}
        </div>
        <div className="col-span-3 overflow-y-auto overscroll-contain rounded-md bg-[var(--key-bg)] p-2">
          {status === "loading" && (
            <div className="flex items-center gap-2 text-xs text-fg-muted">
              <LoaderCircle className="size-3.5 animate-spin" />
              Looking up
            </div>
          )}
          {status === "missing" && (
            <p className="text-xs text-fg-muted">No definition found.</p>
          )}
          {entry && (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-serif text-xl leading-tight">{entry.word}</p>
                  {entry.phonetic && (
                    <p className="text-xs text-fg-muted">{entry.phonetic}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {entry.audio && (
                    <button
                      type="button"
                      className="grid size-8 place-items-center rounded-md bg-[var(--key-mod)]"
                      aria-label="Play pronunciation"
                      onClick={() => {
                        const a = new Audio(entry.audio);
                        void a.play();
                      }}
                    >
                      <Volume2 className="size-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="grid size-8 place-items-center rounded-md bg-[var(--key-mod)]"
                    aria-label="Copy definition"
                    onClick={() =>
                      addClip(
                        `${entry.word}${entry.phonetic ? " " + entry.phonetic : ""} — ${entry.senses[0]?.definition ?? ""}`,
                      )
                    }
                  >
                    <Copy className="size-4" />
                  </button>
                </div>
              </div>
              {entry.senses.slice(0, 3).map((sense, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                    {sense.pos}
                  </p>
                  <p className="font-serif text-sm leading-snug">{sense.definition}</p>
                  {sense.example && (
                    <p className="text-xs italic text-fg-muted">“{sense.example}”</p>
                  )}
                </div>
              ))}
              {entry.synonyms.length > 0 && (
                <p className="text-xs">
                  <span className="text-fg-muted">Synonyms · </span>
                  {entry.synonyms.slice(0, 8).join(", ")}
                </p>
              )}
              {entry.antonyms.length > 0 && (
                <p className="text-xs">
                  <span className="text-fg-muted">Antonyms · </span>
                  {entry.antonyms.slice(0, 8).join(", ")}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg"
                  onClick={() => insertWord(entry.word)}
                >
                  Insert word
                </button>
                <button
                  type="button"
                  className="rounded-md bg-[var(--key-mod)] px-3 py-1.5 text-xs font-semibold"
                  onClick={() =>
                    addClip(entry.senses[0]?.definition ?? entry.word)
                  }
                >
                  Copy meaning
                </button>
              </div>
            </div>
          )}
          {!entry && status === "idle" && (
            <p className="font-serif text-sm text-fg-muted">
              Words are listed from the shortest to the longest. Tap any entry.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
