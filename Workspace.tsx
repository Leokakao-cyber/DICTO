import { useEffect, useRef } from "react";
import type { FieldId } from "@/lib/keyboard-store";
import { useKeyboard } from "@/lib/keyboard-store";
import { SettingsApp } from "@/components/settings/SettingsApp";

function Field({
  id,
  rows = 1,
  placeholder,
  className,
}: {
  id: FieldId;
  rows?: number;
  placeholder?: string;
  className?: string;
}) {
  const field = useKeyboard((s) => s.fields[id]);
  const focusField = useKeyboard((s) => s.focusField);
  const setSelection = useKeyboard((s) => s.setSelection);
  const active = useKeyboard((s) => s.activeField === id);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.value !== field.text) el.value = field.text;
    if (active && document.activeElement === el) {
      if (el.selectionStart !== field.start || el.selectionEnd !== field.end) {
        el.setSelectionRange(field.start, field.end);
      }
    }
  }, [field, active]);

  return (
    <textarea
      ref={ref}
      rows={rows}
      inputMode="none"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      placeholder={placeholder}
      className={`composer-field ${className ?? ""}`}
      defaultValue={field.text}
      onFocus={() => focusField(id, "composer")}
      onSelect={(e) => {
        const t = e.currentTarget;
        setSelection(t.selectionStart ?? 0, t.selectionEnd ?? 0);
      }}
    />
  );
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[11px] font-medium tabular-nums text-fg-muted">
      <span>9:41</span>
      <span className="font-semibold tracking-[0.18em] text-fg">DICTO</span>
      <span>100%</span>
    </div>
  );
}

function AppTabs() {
  const app = useKeyboard((s) => s.app);
  const setApp = useKeyboard((s) => s.setApp);
  const tabs = [
    { id: "messages" as const, label: "Messages" },
    { id: "notes" as const, label: "Notes" },
    { id: "email" as const, label: "Mail" },
    { id: "settings" as const, label: "Settings" },
  ];
  return (
    <div className="grid grid-cols-4 border-b border-border">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          className="relative py-2 text-xs font-medium text-fg-muted"
          style={app === t.id ? { color: "var(--color-fg)" } : undefined}
          onClick={() => setApp(t.id)}
        >
          {t.label}
          {app === t.id && (
            <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-accent" />
          )}
        </button>
      ))}
    </div>
  );
}

function MessagesApp() {
  const messages = useKeyboard((s) => s.messages);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages.length]);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border px-4 py-2">
        <p className="text-xs text-fg-muted">Chat with</p>
        <p className="text-sm font-semibold">Alex Rivera</p>
      </div>
      <div ref={scroller} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {messages.map((m) => (
          <div key={m.id} className={m.from === "me" ? "bubble-me" : "bubble-them"}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="border-t border-border px-3 py-2">
        <Field id="messages.draft" rows={2} placeholder="Message" />
      </div>
    </div>
  );
}

function NotesApp() {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
      <Field
        id="notes.title"
        rows={1}
        placeholder="Title"
        className="text-xl font-semibold"
      />
      <Field
        id="notes.body"
        rows={12}
        placeholder="Start writing"
        className="min-h-0 flex-1 text-sm leading-relaxed"
      />
    </div>
  );
}

function MailApp() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-1 border-b border-border px-4 py-2">
        <label className="flex items-center gap-2 text-xs text-fg-muted">
          To
          <Field id="email.to" rows={1} placeholder="name@studio.com" className="text-sm" />
        </label>
        <label className="flex items-center gap-2 text-xs text-fg-muted">
          Subject
          <Field
            id="email.subject"
            rows={1}
            placeholder="Follow-up"
            className="text-sm font-medium text-fg"
          />
        </label>
      </div>
      <div className="min-h-0 flex-1 px-4 py-3">
        <Field
          id="email.body"
          rows={10}
          placeholder="Write your email"
          className="h-full text-sm leading-relaxed"
        />
      </div>
    </div>
  );
}

export function Workspace() {
  const app = useKeyboard((s) => s.app);
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-bg-elevated">
      <StatusBar />
      <AppTabs />
      {app === "messages" && <MessagesApp />}
      {app === "notes" && <NotesApp />}
      {app === "email" && <MailApp />}
      {app === "settings" && (
        <div className="min-h-0 flex-1">
          <SettingsApp />
        </div>
      )}
    </div>
  );
}
