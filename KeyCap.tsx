import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowUp,
  CornerDownLeft,
  Delete,
  Smile,
} from "lucide-react";
import type { KeyDef } from "@/lib/layouts";
import { cn } from "@/lib/utils";

type Props = {
  def: KeyDef;
  shift: "off" | "once" | "lock";
  pressed: boolean;
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>, def: KeyDef) => void;
  onPointerEnter: (def: KeyDef) => void;
};

export function KeyCap({ def, shift, pressed, onPointerDown, onPointerEnter }: Props) {
  const shifted = shift !== "off";
  const label =
    def.kind === "char" && def.label.length === 1 && /[a-z]/i.test(def.label)
      ? shifted
        ? def.label.toUpperCase()
        : def.label.toLowerCase()
      : def.label;

  return (
    <button
      type="button"
      className={cn("keycap", def.kind === "space" && "tracking-widest")}
      data-kind={def.kind ?? "char"}
      data-pressed={pressed ? "true" : "false"}
      data-shift-on={def.kind === "shift" && shifted ? "true" : "false"}
      data-key={def.id}
      style={{ "--flex": def.flex ?? 1 } as CSSProperties}
      aria-label={def.kind === "char" ? label : def.id}
      onPointerDown={(e) => onPointerDown(e, def)}
      onPointerEnter={() => onPointerEnter(def)}
    >
      {def.kind === "shift" ? (
        <ArrowUp
          className="size-5"
          strokeWidth={shift === "lock" ? 2.8 : 2}
        />
      ) : def.kind === "backspace" ? (
        <Delete className="size-5" />
      ) : def.kind === "enter" ? (
        <CornerDownLeft className="size-5" />
      ) : def.kind === "space" ? (
        "space"
      ) : def.id === "emoji-key" ? (
        <Smile className="size-5" />
      ) : (
        label
      )}
    </button>
  );
}
