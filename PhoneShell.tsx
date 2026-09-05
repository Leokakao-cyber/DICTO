import { useEffect } from "react";
import { DictoKeyboard } from "@/components/keyboard/DictoKeyboard";
import { Workspace } from "@/components/apps/Workspace";
import { resolvedTheme, useKeyboard } from "@/lib/keyboard-store";

export function PhoneShell() {
  const theme = useKeyboard((s) => s.settings.theme);
  const size = useKeyboard((s) => s.settings.size);
  const borders = useKeyboard((s) => s.settings.keyBorders);
  const hydrated = useKeyboard((s) => s.hydrated);
  const setHydrated = useKeyboard((s) => s.setHydrated);

  useEffect(() => {
    void useKeyboard.persist.rehydrate();
    setHydrated();
  }, [setHydrated]);

  useEffect(() => {
    const resolved = resolvedTheme(theme);
    const kb = resolved === "light" ? "light" : resolved;
    document.documentElement.dataset.theme = resolved === "paper" ? "paper" : resolved;
    document.documentElement.dataset.kb = kb;
    document.documentElement.dataset.size = size;
    document.documentElement.dataset.borders = borders ? "on" : "off";
  }, [theme, size, borders, hydrated]);

  return (
    <div className="device-frame">
      <Workspace />
      <DictoKeyboard />
    </div>
  );
}
