import {
  BookOpen,
  Clipboard,
  Grid2x2,
  Languages,
  Mic,
  Settings,
  Smile,
  Type,
} from "lucide-react";
import type { Panel } from "@/lib/keyboard-store";
import { useKeyboard } from "@/lib/keyboard-store";

const ITEMS: { id: Panel | "settings"; label: string; icon: typeof BookOpen }[] = [
  { id: "apps", label: "Apps", icon: Grid2x2 },
  { id: "format", label: "Text formatting", icon: Type },
  { id: "dictionary", label: "Dictionary", icon: BookOpen },
  { id: "clipboard", label: "Clipboard", icon: Clipboard },
  { id: "translator", label: "Translator", icon: Languages },
  { id: "emoji", label: "Emoji", icon: Smile },
  { id: "voice", label: "Voice input", icon: Mic },
];

export function Toolbar() {
  const panel = useKeyboard((s) => s.panel);
  const setPanel = useKeyboard((s) => s.setPanel);
  const setApp = useKeyboard((s) => s.setApp);

  return (
    <div className="kb-toolbar" role="toolbar" aria-label="DICTO tools">
      {ITEMS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-label={label}
          data-on={panel === id ? "true" : "false"}
          onClick={() => setPanel(id as Panel)}
        >
          <Icon className="size-5" strokeWidth={1.75} />
        </button>
      ))}
      <button
        type="button"
        aria-label="Settings"
        onClick={() => setApp("settings")}
      >
        <Settings className="size-5" strokeWidth={1.75} />
      </button>
    </div>
  );
}
