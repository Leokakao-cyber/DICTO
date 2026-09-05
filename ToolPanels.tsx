import { useEffect, useRef, useState } from "react";
import {
  AlignLeft,
  Bold,
  Clipboard,
  Italic,
  Languages,
  List,
  ListOrdered,
  Mic,
  PenLine,
  Smile,
  Strikethrough,
  Underline,
} from "lucide-react";
import { EMOJI_CATEGORIES } from "@/lib/emojis";
import { aiRewrite, aiTranslate } from "@/lib/ai";
import { useKeyboard, type AppId } from "@/lib/keyboard-store";

function PanelHeader({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof Bold;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between px-3 pt-2 pb-1">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4" />
        {title}
      </div>
      {hint && <p className="text-[11px] text-fg-muted">{hint}</p>}
    </div>
  );
}

export function AppsPanel() {
  const setApp = useKeyboard((s) => s.setApp);
  const setPanel = useKeyboard((s) => s.setPanel);
  const items: { id: AppId | PanelShortcut; label: string; hint: string }[] = [
    { id: "messages", label: "Messages", hint: "Chat composer" },
    { id: "notes", label: "Notes", hint: "Long-form writing" },
    { id: "email", label: "Mail", hint: "To, subject, body" },
    { id: "settings", label: "Settings", hint: "Keyboard preferences" },
    { id: "dictionary", label: "Dictionary", hint: "1M-word lookup" },
    { id: "ai", label: "AI Writer", hint: "Rewrite & grammar" },
    { id: "translator", label: "Translate", hint: "Any language pair" },
    { id: "clipboard", label: "Clipboard", hint: "Pinned snippets" },
  ];
  return (
    <div className="panel-sheet">
      <PanelHeader icon={PenLine} title="Apps" hint="Works with every field in DICTO" />
      <div className="grid grid-cols-4 gap-2 overflow-y-auto px-3 pb-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="flex flex-col items-start gap-1 rounded-lg bg-[var(--key-bg)] p-2 text-left"
            onClick={() => {
              if (
                item.id === "messages" ||
                item.id === "notes" ||
                item.id === "email" ||
                item.id === "settings"
              ) {
                setApp(item.id);
                setPanel(null);
              } else {
                setPanel(item.id);
              }
            }}
          >
            <span className="text-xs font-semibold">{item.label}</span>
            <span className="text-[10px] leading-tight text-fg-muted">{item.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

type PanelShortcut = "dictionary" | "ai" | "translator" | "clipboard";

export function FormatPanel() {
  const wrapSelection = useKeyboard((s) => s.wrapSelection);
  const insertText = useKeyboard((s) => s.insertText);
  const actions = [
    { id: "bold", label: "Bold", icon: Bold, run: () => wrapSelection("**", "**") },
    { id: "italic", label: "Italic", icon: Italic, run: () => wrapSelection("*", "*") },
    { id: "under", label: "Underline", icon: Underline, run: () => wrapSelection("<u>", "</u>") },
    { id: "strike", label: "Strike", icon: Strikethrough, run: () => wrapSelection("~~", "~~") },
    { id: "ul", label: "Bullets", icon: List, run: () => insertText("\n- ", { literal: true }) },
    { id: "ol", label: "Numbers", icon: ListOrdered, run: () => insertText("\n1. ", { literal: true }) },
    { id: "quote", label: "Align", icon: AlignLeft, run: () => insertText("\n> ", { literal: true }) },
  ];
  return (
    <div className="panel-sheet">
      <PanelHeader icon={Bold} title="Text formatting" hint="Applies to the selected text" />
      <div className="grid grid-cols-4 gap-2 px-3 pb-3">
        {actions.map(({ id, label, icon: Icon, run }) => (
          <button
            key={id}
            type="button"
            className="flex flex-col items-center gap-2 rounded-lg bg-[var(--key-bg)] py-3"
            onClick={run}
          >
            <Icon className="size-5" />
            <span className="text-[11px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ClipboardPanel() {
  const clips = useKeyboard((s) => s.clipboard);
  const pasteClip = useKeyboard((s) => s.pasteClip);
  const clearClipboard = useKeyboard((s) => s.clearClipboard);
  const copySelectionOrAll = useKeyboard((s) => s.copySelectionOrAll);
  return (
    <div className="panel-sheet">
      <PanelHeader icon={Clipboard} title="Clipboard" hint="Last 30 clips" />
      <div className="flex gap-2 px-3 pb-2">
        <button
          type="button"
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg"
          onClick={copySelectionOrAll}
        >
          Copy current
        </button>
        <button
          type="button"
          className="rounded-md bg-[var(--key-mod)] px-3 py-1.5 text-xs font-semibold"
          onClick={clearClipboard}
        >
          Clear
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {clips.length === 0 && (
          <p className="text-sm text-fg-muted">Copied text will appear here.</p>
        )}
        <div className="flex flex-col gap-2">
          {clips.map((c) => (
            <button
              key={c.id}
              type="button"
              className="rounded-md bg-[var(--key-bg)] px-3 py-2 text-left text-sm"
              onClick={() => pasteClip(c.text)}
            >
              {c.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const LANGS = [
  "Auto",
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Italian",
  "Hindi",
  "Arabic",
  "Japanese",
  "Korean",
  "Chinese",
];

export function TranslatorPanel() {
  const source = useKeyboard((s) => s.fields["panel.source"].text);
  const result = useKeyboard((s) => s.translatorResult);
  const setTranslatorResult = useKeyboard((s) => s.setTranslatorResult);
  const settings = useKeyboard((s) => s.settings);
  const patchSettings = useKeyboard((s) => s.patchSettings);
  const insertText = useKeyboard((s) => s.insertText);
  const focusField = useKeyboard((s) => s.focusField);
  const composerField = useKeyboard((s) => s.composerField);
  const setPanel = useKeyboard((s) => s.setPanel);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    focusField("panel.source", "panel");
  }, [focusField]);

  async function run() {
    setBusy(true);
    setError(null);
    const res = await aiTranslate({
      data: {
        text: source,
        from: settings.translateFrom,
        to: settings.translateTo,
      },
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setTranslatorResult(res.text);
  }

  return (
    <div className="panel-sheet">
      <PanelHeader icon={Languages} title="Translator" hint="Own workspace, like Translate" />
      <div className="flex gap-2 px-3 pb-1">
        <select
          className="flex-1 rounded-md bg-[var(--key-bg)] px-2 py-1 text-xs"
          value={settings.translateFrom}
          onChange={(e) => patchSettings({ translateFrom: e.target.value })}
        >
          {LANGS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <select
          className="flex-1 rounded-md bg-[var(--key-bg)] px-2 py-1 text-xs"
          value={settings.translateTo}
          onChange={(e) => patchSettings({ translateTo: e.target.value })}
        >
          {LANGS.filter((l) => l !== "Auto").map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 px-3 pb-2">
        <div className="overflow-y-auto rounded-md bg-[var(--key-bg)] p-2 text-sm">
          {source || <span className="text-fg-subtle">Type here to translate</span>}
        </div>
        <div className="overflow-y-auto rounded-md bg-[var(--key-bg)] p-2 text-sm">
          {busy ? "Translating…" : result || "Translation"}
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        </div>
      </div>
      <div className="flex gap-2 px-3 pb-2">
        <button
          type="button"
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg"
          onClick={() => void run()}
        >
          Translate
        </button>
        <button
          type="button"
          className="rounded-md bg-[var(--key-mod)] px-3 py-1.5 text-xs font-semibold"
          disabled={!result}
          onClick={() => {
            focusField(composerField, "composer");
            insertText(result + " ", { literal: true });
            setPanel(null);
          }}
        >
          Insert
        </button>
      </div>
    </div>
  );
}

export function EmojiPanel() {
  const insertText = useKeyboard((s) => s.insertText);
  const recent = useKeyboard((s) => s.recentEmoji);
  const [tab, setTab] = useState("smileys");
  const cats = EMOJI_CATEGORIES.map((c) =>
    c.id === "recent" ? { ...c, glyphs: recent } : c,
  );
  const current = cats.find((c) => c.id === tab) ?? cats[1]!;
  return (
    <div className="panel-sheet">
      <PanelHeader icon={Smile} title="Emoji" />
      <div className="flex gap-1 overflow-x-auto px-2 pb-1">
        {cats.map((c) => (
          <button
            key={c.id}
            type="button"
            className="word-chip shrink-0"
            style={
              tab === c.id
                ? { background: "var(--key-enter)", color: "var(--key-enter-fg)" }
                : undefined
            }
            onClick={() => setTab(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        <div className="grid grid-cols-8 gap-1">
          {current.glyphs.map((g, i) => (
            <button
              key={`${g}-${i}`}
              type="button"
              className="grid aspect-square place-items-center rounded-md text-xl"
              onClick={() => insertText(g, { literal: true })}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function VoicePanel() {
  const insertText = useKeyboard((s) => s.insertText);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    return () => {
      recRef.current?.stop();
    };
  }, []);

  function toggle() {
    const SR =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;
    if (!SR) {
      setError("Voice typing needs a browser with speech recognition.");
      return;
    }
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      let final = "";
      let live = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (!res) continue;
        if (res.isFinal) final += res[0]?.transcript ?? "";
        else live += res[0]?.transcript ?? "";
      }
      if (final) insertText(final, { literal: true });
      setInterim(live);
    };
    rec.onerror = () => {
      setError("Microphone was blocked or unavailable.");
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
    setError(null);
  }

  return (
    <div className="panel-sheet items-center justify-center gap-3 px-6">
      <PanelHeader icon={Mic} title="Voice typing" />
      <button
        type="button"
        className="grid size-16 place-items-center rounded-full bg-accent text-accent-fg"
        style={listening ? { transform: "scale(1.06)" } : undefined}
        onClick={toggle}
        aria-label={listening ? "Stop voice typing" : "Start voice typing"}
      >
        <Mic className="size-7" />
      </button>
      <p className="text-center text-sm text-fg-muted">
        {listening ? interim || "Listening…" : "Tap the mic and speak"}
      </p>
      {error && <p className="text-center text-xs text-danger">{error}</p>}
    </div>
  );
}

export function AiWriterPanel() {
  const source = useKeyboard((s) => s.fields["panel.source"].text);
  const composer = useKeyboard((s) => s.fields[s.composerField].text);
  const setFieldText = useKeyboard((s) => s.setFieldText);
  const focusField = useKeyboard((s) => s.focusField);
  const composerField = useKeyboard((s) => s.composerField);
  const insertText = useKeyboard((s) => s.insertText);
  const setPanel = useKeyboard((s) => s.setPanel);
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!source) setFieldText("panel.source", composer);
    focusField("panel.source", "panel");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(
    mode: "grammar" | "rewrite" | "improve" | "formal" | "casual" | "shorter" | "longer",
  ) {
    setBusy(true);
    setError(null);
    const res = await aiRewrite({ data: { text: source || composer, mode } });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOut(res.text);
  }

  return (
    <div className="panel-sheet">
      <PanelHeader icon={PenLine} title="AI Writer" hint="Grammar, rewrite, improve" />
      <div className="flex gap-1 overflow-x-auto px-3 pb-1">
        {(
          [
            ["grammar", "Grammar"],
            ["improve", "Improve"],
            ["rewrite", "Rewrite"],
            ["formal", "Formal"],
            ["casual", "Casual"],
            ["shorter", "Shorter"],
            ["longer", "Longer"],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            className="word-chip shrink-0"
            onClick={() => void run(mode)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 px-3 pb-2">
        <div className="overflow-y-auto rounded-md bg-[var(--key-bg)] p-2 text-sm">
          {source || composer || <span className="text-fg-subtle">Text to improve</span>}
        </div>
        <div className="overflow-y-auto rounded-md bg-[var(--key-bg)] p-2 text-sm">
          {busy ? "Writing…" : out || "Suggestion"}
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        </div>
      </div>
      <div className="flex gap-2 px-3 pb-2">
        <button
          type="button"
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg"
          disabled={!out}
          onClick={() => {
            setFieldText(composerField, out);
            focusField(composerField, "composer");
            setPanel(null);
          }}
        >
          Replace text
        </button>
        <button
          type="button"
          className="rounded-md bg-[var(--key-mod)] px-3 py-1.5 text-xs font-semibold"
          disabled={!out}
          onClick={() => {
            focusField(composerField, "composer");
            insertText(out + " ", { literal: true });
            setPanel(null);
          }}
        >
          Insert
        </button>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    SpeechRecognition?: { new (): SpeechRecognition };
    webkitSpeechRecognition?: { new (): SpeechRecognition };
  }
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    onresult: ((ev: SpeechRecognitionEvent) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
  }
  interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }
}
