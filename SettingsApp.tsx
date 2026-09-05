import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LANGUAGES } from "@/lib/layouts";
import {
  useKeyboard,
  type KbSize,
  type SettingsSection,
  type SoundStyle,
  type ThemeId,
} from "@/lib/keyboard-store";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

const NAV: { id: SettingsSection; label: string; hint: string }[] = [
  { id: "languages", label: "Languages", hint: "Layouts & input languages" },
  { id: "preferences", label: "Preferences", hint: "Keys, layout, number row" },
  { id: "size", label: "Keyboard size", hint: "Height and one-handed mode" },
  { id: "correction", label: "Text correction", hint: "Auto-cap, auto-correct" },
  { id: "gestures", label: "Glide typing", hint: "Swipe path & trail" },
  { id: "themes", label: "Theme", hint: "Light, dark, paper, black" },
  { id: "sound", label: "Sound & vibration", hint: "Clicks and haptics" },
  { id: "dictionary", label: "Personal dictionary", hint: "Shortcuts & saved words" },
  { id: "clipboard", label: "Clipboard", hint: "History & privacy" },
  { id: "voice", label: "Voice typing", hint: "Speech input" },
  { id: "translator", label: "Translator", hint: "Default language pair" },
  { id: "ai", label: "AI Writer", hint: "Grammar and rewrite" },
  { id: "privacy", label: "Privacy", hint: "On-device storage" },
  { id: "about", label: "About DICTO", hint: "Version 1.0" },
];

export function SettingsApp() {
  const section = useKeyboard((s) => s.settingsSection);
  const setSection = useKeyboard((s) => s.setSettingsSection);

  if (section !== "home") {
    return (
      <div className="flex h-full flex-col">
        <header className="flex items-center gap-1 border-b border-border px-2 py-2">
          <button
            type="button"
            className="grid size-10 place-items-center rounded-md"
            onClick={() => setSection("home")}
            aria-label="Back"
          >
            <ChevronLeft className="size-5" />
          </button>
          <h1 className="text-base font-semibold">
            {NAV.find((n) => n.id === section)?.label ?? "Settings"}
          </h1>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
          <SectionBody id={section} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-4 py-3">
        <p className="text-xs font-semibold tracking-[0.14em] text-fg-muted uppercase">
          DICTO
        </p>
        <h1 className="text-xl font-semibold">Settings</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left border-b border-border"
            onClick={() => setSection(item.id)}
          >
            <span>
              <span className="block text-sm font-medium">{item.label}</span>
              <span className="block text-xs text-fg-muted">{item.hint}</span>
            </span>
            <ChevronRight className="size-4 text-fg-subtle" />
          </button>
        ))}
      </div>
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="settings-row">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-fg-muted">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionBody({ id }: { id: SettingsSection }) {
  const settings = useKeyboard((s) => s.settings);
  const patch = useKeyboard((s) => s.patchSettings);
  const reset = useKeyboard((s) => s.resetSettings);
  const personal = useKeyboard((s) => s.personalWords);
  const addPersonalWord = useKeyboard((s) => s.addPersonalWord);
  const removePersonalWord = useKeyboard((s) => s.removePersonalWord);
  const clips = useKeyboard((s) => s.clipboard);
  const clearClipboard = useKeyboard((s) => s.clearClipboard);

  if (id === "languages") {
    return (
      <>
        {LANGUAGES.map((lang) => {
          const on = settings.enabledLanguages.includes(lang.id);
          const active = settings.language === lang.id;
          return (
            <div key={lang.id} className="settings-row">
              <button
                type="button"
                className="min-w-0 text-left"
                onClick={() => patch({ language: lang.id })}
              >
                <p className="text-sm font-medium">
                  {lang.native}
                  {active ? " · current" : ""}
                </p>
                <p className="text-xs text-fg-muted">{lang.label}</p>
              </button>
              <Switch
                checked={on}
                onCheckedChange={(checked) => {
                  const enabled = checked
                    ? [...new Set([...settings.enabledLanguages, lang.id])]
                    : settings.enabledLanguages.filter((x) => x !== lang.id);
                  patch({
                    enabledLanguages: enabled.length ? enabled : ["en"],
                    language: !checked && active ? "en" : settings.language,
                  });
                }}
              />
            </div>
          );
        })}
      </>
    );
  }

  if (id === "preferences") {
    return (
      <>
        <Row label="Number row" hint="Always show 1–0 above the letters">
          <Switch
            checked={settings.numberRow}
            onCheckedChange={(v) => patch({ numberRow: v })}
          />
        </Row>
        <Row label="Emoji key" hint="Replace comma with emoji switch">
          <Switch
            checked={settings.showEmojiKey}
            onCheckedChange={(v) => patch({ showEmojiKey: v })}
          />
        </Row>
        <Row label="Suggestion strip">
          <Switch
            checked={settings.suggestions}
            onCheckedChange={(v) => patch({ suggestions: v })}
          />
        </Row>
        <Row label="Key borders">
          <Switch
            checked={settings.keyBorders}
            onCheckedChange={(v) => patch({ keyBorders: v })}
          />
        </Row>
        <Row label="Popup on keypress">
          <Switch
            checked={settings.keypressPopup}
            onCheckedChange={(v) => patch({ keypressPopup: v })}
          />
        </Row>
        <Row label="Long-press delay" hint={`${settings.longPressMs} ms`} />
        <Slider
          min={200}
          max={700}
          step={20}
          value={[settings.longPressMs]}
          onValueChange={([v]) => patch({ longPressMs: v ?? 380 })}
        />
      </>
    );
  }

  if (id === "size") {
    return (
      <>
        <p className="py-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
          Height
        </p>
        {(["small", "medium", "large"] as KbSize[]).map((size) => (
          <button
            key={size}
            type="button"
            className="settings-row capitalize"
            onClick={() => patch({ size })}
          >
            <span className="text-sm font-medium">{size}</span>
            {settings.size === size && <span className="text-xs text-accent">On</span>}
          </button>
        ))}
        <p className="pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
          One-handed
        </p>
        {(["off", "left", "right"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            className="settings-row capitalize"
            onClick={() => patch({ oneHanded: mode })}
          >
            <span className="text-sm font-medium">{mode === "off" ? "Off" : mode}</span>
            {settings.oneHanded === mode && <span className="text-xs text-accent">On</span>}
          </button>
        ))}
      </>
    );
  }

  if (id === "correction") {
    return (
      <>
        <Row label="Auto-capitalization" hint="Capitalize the start of sentences">
          <Switch
            checked={settings.autoCap}
            onCheckedChange={(v) => patch({ autoCap: v })}
          />
        </Row>
        <Row label="Auto-correction" hint="Fix nearby misspellings on space">
          <Switch
            checked={settings.autoCorrect}
            onCheckedChange={(v) => patch({ autoCorrect: v })}
          />
        </Row>
        <Row label="Double-space period">
          <Switch
            checked={settings.doubleSpacePeriod}
            onCheckedChange={(v) => patch({ doubleSpacePeriod: v })}
          />
        </Row>
        <Row label="Grammar chip" hint="Offer AI grammar from the writer">
          <Switch
            checked={settings.grammarChip}
            onCheckedChange={(v) => patch({ grammarChip: v })}
          />
        </Row>
      </>
    );
  }

  if (id === "gestures") {
    return (
      <>
        <Row label="Glide typing" hint="Swipe across letters to type a word">
          <Switch
            checked={settings.swipe}
            onCheckedChange={(v) => patch({ swipe: v })}
          />
        </Row>
        <Row label="Show swipe trail">
          <Switch
            checked={settings.swipeTrail}
            onCheckedChange={(v) => patch({ swipeTrail: v })}
          />
        </Row>
      </>
    );
  }

  if (id === "themes") {
    const themes: { id: ThemeId; label: string }[] = [
      { id: "system", label: "System" },
      { id: "light", label: "Light" },
      { id: "dark", label: "Dark" },
      { id: "black", label: "Black" },
      { id: "paper", label: "Paper" },
    ];
    return (
      <>
        {themes.map((t) => (
          <button
            key={t.id}
            type="button"
            className="settings-row"
            onClick={() => patch({ theme: t.id })}
          >
            <span className="text-sm font-medium">{t.label}</span>
            {settings.theme === t.id && <span className="text-xs text-accent">On</span>}
          </button>
        ))}
      </>
    );
  }

  if (id === "sound") {
    return (
      <>
        <Row label="Sound on keypress">
          <Switch
            checked={settings.sound}
            onCheckedChange={(v) => patch({ sound: v })}
          />
        </Row>
        <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
          Sound style
        </p>
        {(["click", "soft", "mechanical"] as SoundStyle[]).map((st) => (
          <button
            key={st}
            type="button"
            className="settings-row capitalize"
            onClick={() => patch({ soundStyle: st })}
          >
            <span className="text-sm font-medium">{st}</span>
            {settings.soundStyle === st && <span className="text-xs text-accent">On</span>}
          </button>
        ))}
        <Row label="Volume" hint={`${Math.round(settings.soundVolume * 100)}%`} />
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={[settings.soundVolume]}
          onValueChange={([v]) => patch({ soundVolume: v ?? 0.5 })}
        />
        <Row label="Haptic feedback">
          <Switch
            checked={settings.haptic}
            onCheckedChange={(v) => patch({ haptic: v })}
          />
        </Row>
        <Row label="Haptic intensity" />
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={[settings.hapticIntensity]}
          onValueChange={([v]) => patch({ hapticIntensity: v ?? 0.45 })}
        />
      </>
    );
  }

  if (id === "dictionary") {
    return (
      <PersonalDict
        words={personal}
        onAdd={addPersonalWord}
        onRemove={removePersonalWord}
      />
    );
  }

  if (id === "clipboard") {
    return (
      <>
        <Row label="Saved clips" hint={`${clips.length} items`} />
        <button
          type="button"
          className="mt-2 w-full rounded-md bg-bg-subtle py-2 text-sm font-medium"
          onClick={clearClipboard}
        >
          Clear clipboard
        </button>
        <ul className="mt-3 space-y-2">
          {clips.map((c) => (
            <li key={c.id} className="rounded-md bg-bg-subtle px-3 py-2 text-sm">
              {c.text}
            </li>
          ))}
        </ul>
      </>
    );
  }

  if (id === "voice") {
    return (
      <Row label="Auto-punctuation" hint="Insert periods from speech pauses">
        <Switch
          checked={settings.voiceAutoPunctuate}
          onCheckedChange={(v) => patch({ voiceAutoPunctuate: v })}
        />
      </Row>
    );
  }

  if (id === "translator") {
    return (
      <>
        <Row label="Translate from" hint={settings.translateFrom} />
        <Row label="Translate to" hint={settings.translateTo} />
        <p className="pt-2 text-xs text-fg-muted">
          Change the pair inside the translator panel. Defaults are stored here.
        </p>
      </>
    );
  }

  if (id === "ai") {
    return (
      <>
        <p className="py-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
          Default rewrite tone
        </p>
        {(["rewrite", "formal", "casual", "shorter", "longer"] as const).map((tone) => (
          <button
            key={tone}
            type="button"
            className="settings-row capitalize"
            onClick={() => patch({ aiTone: tone })}
          >
            <span className="text-sm font-medium">{tone}</span>
            {settings.aiTone === tone && <span className="text-xs text-accent">On</span>}
          </button>
        ))}
      </>
    );
  }

  if (id === "privacy") {
    return (
      <>
        <p className="py-3 text-sm leading-relaxed text-fg-muted">
          Preferences, clipboard, drafts, and personal words stay on this device.
          AI rewrite and translate run only when you tap an action.
        </p>
        <button
          type="button"
          className="w-full rounded-md bg-bg-subtle py-2 text-sm font-medium"
          onClick={reset}
        >
          Reset all settings
        </button>
      </>
    );
  }

  if (id === "about") {
    return (
      <div className="space-y-3 py-4">
        <p className="font-serif text-3xl">DICTO</p>
        <p className="text-sm text-fg-muted">
          The productivity keyboard. Dictionary, grammar, translation, and
          writing tools — without leaving the keys.
        </p>
        <p className="text-xs text-fg-subtle">Version 1.0.0</p>
      </div>
    );
  }

  return null;
}

function PersonalDict({
  words,
  onAdd,
  onRemove,
}: {
  words: { word: string; shortcut: string }[];
  onAdd: (word: string, shortcut?: string) => void;
  onRemove: (word: string) => void;
}) {
  return (
    <div className="space-y-3 py-2">
      <p className="text-xs text-fg-muted">
        Saved words are offered in suggestions and used as shortcuts.
      </p>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const word = String(fd.get("word") ?? "").trim();
          const shortcut = String(fd.get("shortcut") ?? "").trim();
          if (word) onAdd(word, shortcut);
          e.currentTarget.reset();
        }}
      >
        <input
          name="word"
          placeholder="Word"
          className="h-11 rounded-md border border-border bg-bg-elevated px-3 text-sm"
        />
        <input
          name="shortcut"
          placeholder="Shortcut (optional)"
          className="h-11 rounded-md border border-border bg-bg-elevated px-3 text-sm"
        />
        <button
          type="submit"
          className="h-11 rounded-md bg-accent text-sm font-semibold text-accent-fg"
        >
          Add word
        </button>
      </form>
      <ul>
        {words.map((w) => (
          <li key={w.word} className="settings-row">
            <span>
              <span className="block text-sm">{w.word}</span>
              {w.shortcut && (
                <span className="block text-xs text-fg-muted">{w.shortcut}</span>
              )}
            </span>
            <button
              type="button"
              className="text-xs font-medium text-danger"
              onClick={() => onRemove(w.word)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
