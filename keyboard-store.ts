import { create } from "zustand";
import { persist } from "zustand/middleware";
import { closestWord } from "@/lib/autocorrect";
import { haptic } from "@/lib/haptics";
import { playKeySound } from "@/lib/sounds";
import { suggestWords } from "@/lib/suggest";
import type { LanguageId } from "@/lib/layouts";
import { uid } from "@/lib/utils";

export type Panel =
  | null
  | "apps"
  | "format"
  | "dictionary"
  | "clipboard"
  | "translator"
  | "emoji"
  | "voice"
  | "ai";

export type LayoutMode = "letters" | "symbols" | "symbols2";
export type ShiftState = "off" | "once" | "lock";
export type AppId = "messages" | "notes" | "email" | "settings";
export type ThemeId = "system" | "light" | "dark" | "black" | "paper";
export type KbSize = "small" | "medium" | "large";
export type SoundStyle = "click" | "soft" | "mechanical";
export type InputTarget = "composer" | "panel";
export type SettingsSection =
  | "home"
  | "languages"
  | "preferences"
  | "themes"
  | "sound"
  | "gestures"
  | "correction"
  | "dictionary"
  | "voice"
  | "translator"
  | "ai"
  | "clipboard"
  | "privacy"
  | "about"
  | "size";

export type Field = { text: string; start: number; end: number };

export type ClipItem = { id: string; text: string; at: number };
export type PersonalWord = { word: string; shortcut: string };

export type KbSettings = {
  theme: ThemeId;
  numberRow: boolean;
  autoCap: boolean;
  autoCorrect: boolean;
  doubleSpacePeriod: boolean;
  suggestions: boolean;
  swipe: boolean;
  swipeTrail: boolean;
  sound: boolean;
  soundStyle: SoundStyle;
  soundVolume: number;
  haptic: boolean;
  hapticIntensity: number;
  keyPopup: boolean;
  longPressMs: number;
  size: KbSize;
  language: LanguageId;
  enabledLanguages: LanguageId[];
  keyBorders: boolean;
  oneHanded: "off" | "left" | "right";
  showEmojiKey: boolean;
  voiceAutoPunctuate: boolean;
  translateFrom: string;
  translateTo: string;
  aiTone: "rewrite" | "formal" | "casual" | "shorter" | "longer";
  grammarChip: boolean;
  keypressPopup: boolean;
};

const DEFAULT_SETTINGS: KbSettings = {
  theme: "light",
  numberRow: true,
  autoCap: true,
  autoCorrect: true,
  doubleSpacePeriod: true,
  suggestions: true,
  swipe: true,
  swipeTrail: true,
  sound: true,
  soundStyle: "click",
  soundVolume: 0.55,
  haptic: true,
  hapticIntensity: 0.45,
  keyPopup: true,
  longPressMs: 380,
  size: "medium",
  language: "en",
  enabledLanguages: ["en", "es", "fr"],
  keyBorders: false,
  oneHanded: "off",
  showEmojiKey: true,
  voiceAutoPunctuate: true,
  translateFrom: "Auto",
  translateTo: "Spanish",
  aiTone: "rewrite",
  grammarChip: true,
  keypressPopup: true,
};

export const FIELDS = {
  "messages.draft": { text: "", start: 0, end: 0 },
  "notes.title": { text: "Meeting notes", start: 13, end: 13 },
  "notes.body": {
    text: "Talking points:\n- ",
    start: 20,
    end: 20,
  },
  "email.to": { text: "", start: 0, end: 0 },
  "email.subject": { text: "", start: 0, end: 0 },
  "email.body": { text: "Hi,\n\n", start: 5, end: 5 },
  "panel.query": { text: "", start: 0, end: 0 },
  "panel.source": { text: "", start: 0, end: 0 },
} satisfies Record<string, Field>;

export type FieldId = keyof typeof FIELDS;

type Msg = { id: string; from: "me" | "them"; text: string; at: number };

type Store = {
  hydrated: boolean;
  setHydrated: () => void;
  settings: KbSettings;
  patchSettings: (p: Partial<KbSettings>) => void;
  resetSettings: () => void;
  app: AppId;
  setApp: (app: AppId) => void;
  settingsSection: SettingsSection;
  setSettingsSection: (s: SettingsSection) => void;
  panel: Panel;
  setPanel: (p: Panel) => void;
  layout: LayoutMode;
  setLayout: (l: LayoutMode) => void;
  shift: ShiftState;
  cycleShift: () => void;
  fields: Record<FieldId, Field>;
  activeField: FieldId;
  composerField: FieldId;
  focusField: (id: FieldId, target?: InputTarget) => void;
  inputTarget: InputTarget;
  lastCorrection: { from: string; to: string } | null;
  clipboard: ClipItem[];
  personalWords: PersonalWord[];
  addPersonalWord: (word: string, shortcut?: string) => void;
  removePersonalWord: (word: string) => void;
  recentEmoji: string[];
  messages: Msg[];
  translatorResult: string;
  setTranslatorResult: (t: string) => void;
  insertText: (raw: string, opts?: { literal?: boolean }) => void;
  backspace: () => void;
  enter: () => void;
  applySuggestion: (word: string, replacePrefix: boolean) => void;
  undoCorrection: () => void;
  wrapSelection: (before: string, after: string) => void;
  copySelectionOrAll: () => void;
  pasteClip: (text: string) => void;
  addClip: (text: string) => void;
  clearClipboard: () => void;
  sendMessage: () => void;
  suggestions: () => [string, string, string];
  currentText: () => string;
  setSelection: (start: number, end: number) => void;
  setFieldText: (id: FieldId, text: string) => void;
};

function feedback(s: KbSettings) {
  if (s.sound) playKeySound(s.soundStyle, s.soundVolume);
  if (s.haptic) haptic(s.hapticIntensity);
}

function shouldCap(before: string) {
  const t = before.replace(/[\s\u00a0]+$/g, "");
  if (!t) return true;
  return /[.!?…]$/.test(t);
}

function active(s: Store): Field {
  return s.fields[s.activeField];
}

function write(
  s: Store,
  text: string,
  start: number,
  end: number,
): Partial<Store> {
  return {
    fields: {
      ...s.fields,
      [s.activeField]: { text, start, end },
    },
    lastCorrection: s.lastCorrection,
  };
}

export const useKeyboard = create<Store>()(
  persist(
    (set, get) => ({
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      settings: DEFAULT_SETTINGS,
      patchSettings: (p) =>
        set((s) => ({ settings: { ...s.settings, ...p } })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
      app: "messages",
      setApp: (app) =>
        set(() => {
          const composer: FieldId =
            app === "messages"
              ? "messages.draft"
              : app === "notes"
                ? "notes.body"
                : app === "email"
                  ? "email.body"
                  : "messages.draft";
          return {
            app,
            panel: null,
            composerField: composer,
            activeField: composer,
            inputTarget: "composer",
            settingsSection: "home",
          };
        }),
      settingsSection: "home",
      setSettingsSection: (settingsSection) => set({ settingsSection }),
      panel: null,
      setPanel: (panel) =>
        set((s) => {
          if (panel === s.panel) {
            return {
              panel: null,
              activeField: s.composerField,
              inputTarget: "composer" as const,
            };
          }
          const usesQuery = panel === "dictionary";
          const usesSource = panel === "translator" || panel === "ai";
          const activeField: FieldId = usesQuery
            ? "panel.query"
            : usesSource
              ? "panel.source"
              : s.composerField;
          return {
            panel,
            layout: "letters" as const,
            activeField,
            inputTarget:
              usesQuery || usesSource ? ("panel" as const) : ("composer" as const),
          };
        }),
      layout: "letters",
      setLayout: (layout) => set({ layout, panel: null }),
      shift: "once",
      cycleShift: () =>
        set((s) => ({
          shift:
            s.shift === "off" ? "once" : s.shift === "once" ? "lock" : "off",
        })),
      fields: { ...FIELDS },
      activeField: "messages.draft",
      composerField: "messages.draft",
      inputTarget: "composer",
      focusField: (id, target = "composer") =>
        set((s) => ({
          activeField: id,
          inputTarget: target,
          composerField: target === "composer" ? id : s.composerField,
          shift:
            s.settings.autoCap && shouldCap(s.fields[id].text.slice(0, s.fields[id].start))
              ? "once"
              : s.shift,
        })),
      lastCorrection: null,
      clipboard: [],
      personalWords: [
        { word: "DICTO", shortcut: "dicto" },
      ],
      addPersonalWord: (word, shortcut = "") =>
        set((s) => ({
          personalWords: [
            { word: word.trim(), shortcut: shortcut.trim() },
            ...s.personalWords.filter(
              (p) => p.word.toLowerCase() !== word.trim().toLowerCase(),
            ),
          ].slice(0, 200),
        })),
      removePersonalWord: (word) =>
        set((s) => ({
          personalWords: s.personalWords.filter((p) => p.word !== word),
        })),
      recentEmoji: ["🙂", "👍", "🔥", "✨", "❤️"],
      messages: [
        {
          id: "m1",
          from: "them",
          text: "Can you send a cleaner version of that note?",
          at: Date.now() - 1000 * 60 * 12,
        },
        {
          id: "m2",
          from: "me",
          text: "On it — I'll rewrite it from the keyboard.",
          at: Date.now() - 1000 * 60 * 8,
        },
      ],
      translatorResult: "",
      setTranslatorResult: (translatorResult) => set({ translatorResult }),
      currentText: () => get().fields[get().activeField].text,
      suggestions: () => {
        const s = get();
        const text = s.fields[s.activeField].text.slice(
          0,
          s.fields[s.activeField].start,
        );
        if (s.lastCorrection) {
          return [
            s.lastCorrection.from,
            ...suggestWords(text, s.personalWords.map((p) => p.word)).slice(0, 2),
          ] as [string, string, string];
        }
        return suggestWords(
          text,
          s.personalWords.flatMap((p) =>
            p.shortcut ? [p.word, p.shortcut] : [p.word],
          ),
        );
      },
      setSelection: (start, end) =>
        set((s) => write(s, s.fields[s.activeField].text, start, end)),
      setFieldText: (id, text) =>
        set((s) => ({
          fields: {
            ...s.fields,
            [id]: { text, start: text.length, end: text.length },
          },
        })),
      insertText: (raw, opts) => {
        const s = get();
        feedback(s.settings);
        const field = active(s);
        let insert = raw;
        const before = field.text.slice(0, field.start);
        const after = field.text.slice(field.end);

        if (!opts?.literal && s.layout === "letters") {
          const shifted = s.shift !== "off";
          if (insert.length === 1 && /[a-z]/i.test(insert)) {
            insert = shifted ? insert.toUpperCase() : insert.toLowerCase();
          }
        }

        if (
          !opts?.literal &&
          insert === " " &&
          s.settings.doubleSpacePeriod &&
          before.endsWith(" ") &&
          !before.endsWith(". ")
        ) {
          const next = `${before.slice(0, -1)}. ${after}`;
          const caret = before.length;
          set({
            ...write(s, next, caret, caret),
            shift: s.settings.autoCap ? "once" : "off",
            lastCorrection: null,
          });
          return;
        }

        let nextBefore = before;
        let correction: Store["lastCorrection"] = null;
        if (
          !opts?.literal &&
          insert === " " &&
          s.settings.autoCorrect &&
          s.inputTarget === "composer"
        ) {
          const m = before.match(/([A-Za-z']+)$/);
          if (m) {
            const original = m[1]!;
            const shortcut = s.personalWords.find(
              (p) => p.shortcut && p.shortcut.toLowerCase() === original.toLowerCase(),
            );
            const fix = shortcut?.word ?? closestWord(original);
            if (fix && fix !== original) {
              nextBefore = before.slice(0, before.length - original.length) + fix;
              correction = { from: original, to: fix };
            }
          }
        }

        if (
          !opts?.literal &&
          s.settings.autoCap &&
          insert.length === 1 &&
          /[a-z]/i.test(insert) &&
          shouldCap(nextBefore)
        ) {
          insert = insert.toUpperCase();
        }

        const next = nextBefore + insert + after;
        const caret = nextBefore.length + insert.length;
        const shiftAfter =
          insert.length === 1 && /[A-Za-z]/.test(insert)
            ? s.shift === "lock"
              ? "lock"
              : "off"
            : insert === "." || insert === "!" || insert === "?"
              ? s.settings.autoCap
                ? "once"
                : s.shift
              : s.shift === "lock"
                ? "lock"
                : s.shift;

        set({
          ...write(s, next, caret, caret),
          shift: shiftAfter as ShiftState,
          lastCorrection: correction,
        });
      },
      backspace: () => {
        const s = get();
        feedback(s.settings);
        const field = active(s);
        if (field.start !== field.end) {
          const text =
            field.text.slice(0, field.start) + field.text.slice(field.end);
          set(write(s, text, field.start, field.start));
          return;
        }
        if (field.start === 0) return;
        const text =
          field.text.slice(0, field.start - 1) + field.text.slice(field.start);
        const caret = field.start - 1;
        set({ ...write(s, text, caret, caret), lastCorrection: null });
      },
      enter: () => {
        const s = get();
        if (s.app === "messages" && s.inputTarget === "composer") {
          get().sendMessage();
          return;
        }
        get().insertText("\n", { literal: true });
      },
      sendMessage: () => {
        const s = get();
        const draft = s.fields["messages.draft"].text.trim();
        if (!draft) return;
        set({
          messages: [
            ...s.messages,
            { id: uid(), from: "me", text: draft, at: Date.now() },
          ],
          fields: {
            ...s.fields,
            "messages.draft": { text: "", start: 0, end: 0 },
          },
          shift: s.settings.autoCap ? "once" : "off",
          lastCorrection: null,
        });
      },
      applySuggestion: (word, replacePrefix) => {
        const s = get();
        feedback(s.settings);
        if (s.lastCorrection && word === s.lastCorrection.from) {
          get().undoCorrection();
          return;
        }
        const field = active(s);
        const before = field.text.slice(0, field.start);
        const after = field.text.slice(field.end);
        let nextBefore = before;
        if (replacePrefix) {
          nextBefore = before.replace(/[^\s]*$/, "");
        } else if (!before.endsWith(" ") && before.length > 0) {
          nextBefore = before + " ";
        }
        const spacer = word.endsWith(" ") ? "" : " ";
        const next = nextBefore + word + spacer + after;
        const caret = (nextBefore + word + spacer).length;
        set({
          ...write(s, next, caret, caret),
          lastCorrection: null,
          shift: "off",
        });
      },
      undoCorrection: () => {
        const s = get();
        if (!s.lastCorrection) return;
        const field = active(s);
        const { from, to } = s.lastCorrection;
        const idx = field.text.lastIndexOf(to);
        if (idx === -1) {
          set({ lastCorrection: null });
          return;
        }
        const text =
          field.text.slice(0, idx) + from + field.text.slice(idx + to.length);
        const caret = idx + from.length;
        set({ ...write(s, text, caret, caret), lastCorrection: null });
      },
      wrapSelection: (b, a) => {
        const s = get();
        const field = active(s);
        const sel = field.text.slice(field.start, field.end) || "text";
        const start = field.start;
        const next =
          field.text.slice(0, field.start) + b + sel + a + field.text.slice(field.end);
        const caret = start + b.length + sel.length + a.length;
        set(write(s, next, caret, caret));
      },
      copySelectionOrAll: () => {
        const s = get();
        const field = s.fields[s.composerField];
        const text =
          field.start !== field.end
            ? field.text.slice(field.start, field.end)
            : field.text;
        if (text) get().addClip(text);
      },
      pasteClip: (text) => get().insertText(text, { literal: true }),
      addClip: (text) => {
        const t = text.trim();
        if (!t) return;
        set((s) => ({
          clipboard: [
            { id: uid(), text: t, at: Date.now() },
            ...s.clipboard.filter((c) => c.text !== t),
          ].slice(0, 30),
        }));
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          void navigator.clipboard.writeText(t).catch(() => undefined);
        }
      },
      clearClipboard: () => set({ clipboard: [] }),
    }),
    {
      name: "dicto-kb",
      skipHydration: true,
      partialize: (s) => ({
        settings: s.settings,
        clipboard: s.clipboard,
        personalWords: s.personalWords,
        recentEmoji: s.recentEmoji,
        fields: s.fields,
        messages: s.messages,
        app: s.app,
        composerField: s.composerField,
      }),
    },
  ),
);

export function resolvedTheme(theme: ThemeId): "light" | "dark" | "black" | "paper" {
  if (theme === "system") {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }
  return theme;
}
