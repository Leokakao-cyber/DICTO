import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  bottomRow,
  letterRows,
  NUMBER_ROW,
  SYMBOL2_ROWS,
  SYMBOL_ROWS,
  type KeyDef,
} from "@/lib/layouts";
import { loadLexicon, matchSwipe, suggestWords } from "@/lib/suggest";
import { useKeyboard } from "@/lib/keyboard-store";
import { KeyCap } from "@/components/keyboard/KeyCap";
import { Toolbar } from "@/components/keyboard/Toolbar";
import { DictionaryPanel } from "@/components/keyboard/DictionaryPanel";
import {
  AiWriterPanel,
  AppsPanel,
  ClipboardPanel,
  EmojiPanel,
  FormatPanel,
  TranslatorPanel,
  VoicePanel,
} from "@/components/keyboard/ToolPanels";

type Point = { x: number; y: number; key?: string };

export function DictoKeyboard() {
  const layout = useKeyboard((s) => s.layout);
  const setLayout = useKeyboard((s) => s.setLayout);
  const panel = useKeyboard((s) => s.panel);
  const setPanel = useKeyboard((s) => s.setPanel);
  const shift = useKeyboard((s) => s.shift);
  const cycleShift = useKeyboard((s) => s.cycleShift);
  const insertText = useKeyboard((s) => s.insertText);
  const backspace = useKeyboard((s) => s.backspace);
  const enter = useKeyboard((s) => s.enter);
  const applySuggestion = useKeyboard((s) => s.applySuggestion);
  const settings = useKeyboard((s) => s.settings);
  const lastCorrection = useKeyboard((s) => s.lastCorrection);
  const fieldText = useKeyboard((s) => s.fields[s.activeField].text);
  const fieldStart = useKeyboard((s) => s.fields[s.activeField].start);
  const personalWords = useKeyboard((s) => s.personalWords);

  const suggestions = suggestWords(
    fieldText.slice(0, fieldStart),
    personalWords.flatMap((p) => (p.shortcut ? [p.word, p.shortcut] : [p.word])),
  );
  const displaySuggestions: [string, string, string] = lastCorrection
    ? [lastCorrection.from, suggestions[0], suggestions[1]]
    : suggestions;

  const shellRef = useRef<HTMLDivElement>(null);
  const [pressed, setPressed] = useState<string | null>(null);
  const [popup, setPopup] = useState<{
    chars: string[];
    x: number;
    y: number;
    pick: number;
  } | null>(null);
  const [trail, setTrail] = useState<Point[]>([]);
  const swipeKeys = useRef<string[]>([]);
  const swipe = useRef(false);
  const startPt = useRef<Point | null>(null);
  const longTimer = useRef<number | null>(null);
  const currentDef = useRef<KeyDef | null>(null);

  useEffect(() => {
    void loadLexicon();
  }, []);

  const clearTimer = () => {
    if (longTimer.current) {
      window.clearTimeout(longTimer.current);
      longTimer.current = null;
    }
  };

  const handleKey = useCallback(
    (def: KeyDef, char?: string) => {
      if (def.kind === "shift") {
        cycleShift();
        return;
      }
      if (def.kind === "backspace") {
        backspace();
        return;
      }
      if (def.kind === "enter") {
        enter();
        return;
      }
      if (def.id === "sym") {
        setLayout("symbols");
        return;
      }
      if (def.id === "abc") {
        setLayout("letters");
        return;
      }
      if (def.id === "sym2") {
        setLayout("symbols2");
        return;
      }
      if (def.id === "sym1") {
        setLayout("symbols");
        return;
      }
      if (def.kind === "space") {
        insertText(" ");
        return;
      }
      const ch = char ?? def.code ?? def.label;
      insertText(ch);
    },
    [backspace, cycleShift, enter, insertText, setLayout],
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>, def: KeyDef) => {
    e.preventDefault();
    (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
    currentDef.current = def;
    swipe.current = false;
    swipeKeys.current = def.kind === "char" ? [def.id] : [];
    startPt.current = { x: e.clientX, y: e.clientY, key: def.id };
    setPressed(def.id);
    setTrail([{ x: e.clientX, y: e.clientY, key: def.id }]);
    clearTimer();
    if (def.longPress?.length && settings.keyPopup) {
      const target = e.currentTarget;
      longTimer.current = window.setTimeout(() => {
        const rect = target.getBoundingClientRect();
        const shell = shellRef.current?.getBoundingClientRect();
        setPopup({
          chars: def.longPress ?? [],
          x: rect.left + rect.width / 2 - (shell?.left ?? 0),
          y: rect.top - (shell?.top ?? 0),
          pick: 0,
        });
      }, settings.longPressMs);
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!startPt.current) return;
    const dx = e.clientX - startPt.current.x;
    const dy = e.clientY - startPt.current.y;
    if (!swipe.current && Math.hypot(dx, dy) > 18 && settings.swipe) {
      swipe.current = true;
      clearTimer();
      setPopup(null);
    }
    if (swipe.current && settings.swipeTrail) {
      setTrail((t) => [...t.slice(-48), { x: e.clientX, y: e.clientY }]);
    }
    if (popup) {
      const idx = Math.max(
        0,
        Math.min(popup.chars.length - 1, Math.round(dx / 28) + popup.pick),
      );
      if (idx !== popup.pick) setPopup({ ...popup, pick: idx });
    }
  };

  const onPointerEnterKey = (def: KeyDef) => {
    if (!startPt.current) return;
    if (swipe.current && def.kind === "char") {
      const last = swipeKeys.current[swipeKeys.current.length - 1];
      if (last !== def.id) swipeKeys.current.push(def.id);
      setPressed(def.id);
    }
  };

  const onPointerUp = () => {
    const def = currentDef.current;
    clearTimer();
    if (popup && def) {
      handleKey(def, popup.chars[popup.pick]);
    } else if (swipe.current && settings.swipe) {
      const word = matchSwipe(swipeKeys.current);
      if (word) insertText(word + " ", { literal: true });
      else if (def) handleKey(def);
    } else if (def) {
      handleKey(def);
    }
    setPressed(null);
    setPopup(null);
    setTrail([]);
    startPt.current = null;
    currentDef.current = null;
    swipe.current = false;
    swipeKeys.current = [];
  };

  const rows =
    layout === "letters"
      ? letterRows(settings.language)
      : layout === "symbols"
        ? SYMBOL_ROWS
        : SYMBOL2_ROWS;

  const pad =
    settings.oneHanded === "left"
      ? "0 18% 0 0"
      : settings.oneHanded === "right"
        ? "0 0 0 18%"
        : undefined;

  return (
    <div
      ref={shellRef}
      className="kb-shell relative"
      style={{ paddingInline: pad }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <Toolbar />
      {settings.suggestions && (
        <div className="sug-bar">
          {displaySuggestions.map((word, i) => (
            <button
              key={`${word}-${i}`}
              type="button"
              onClick={() =>
                applySuggestion(word, !(lastCorrection && i === 0))
              }
            >
              {lastCorrection && i === 0 ? (
                <span className="text-fg-muted">{word}</span>
              ) : (
                word
              )}
            </button>
          ))}
        </div>
      )}

      {panel === "apps" && <AppsPanel />}
      {panel === "format" && <FormatPanel />}
      {panel === "dictionary" && <DictionaryPanel />}
      {panel === "clipboard" && <ClipboardPanel />}
      {panel === "translator" && <TranslatorPanel />}
      {panel === "emoji" && <EmojiPanel />}
      {panel === "voice" && <VoicePanel />}
      {panel === "ai" && <AiWriterPanel />}

      {!panel && (
        <>
          {settings.numberRow && layout === "letters" && (
            <div className="kb-row">
              {NUMBER_ROW.map((k) => (
                <KeyCap
                  key={k.id}
                  def={k}
                  shift="off"
                  pressed={pressed === k.id}
                  onPointerDown={onPointerDown}
                  onPointerEnter={onPointerEnterKey}
                />
              ))}
            </div>
          )}
          {rows.map((row, i) => (
            <div
              key={i}
              className="kb-row"
              style={i === 1 && layout === "letters" ? { paddingInline: "3%" } : undefined}
            >
              {row.map((k) => (
                <KeyCap
                  key={k.id}
                  def={k}
                  shift={shift}
                  pressed={pressed === k.id}
                  onPointerDown={onPointerDown}
                  onPointerEnter={onPointerEnterKey}
                />
              ))}
            </div>
          ))}
          <div className="kb-row">
            {bottomRow(layout === "letters" ? "letters" : "symbols").flatMap((k) => {
              const node = (
                <KeyCap
                  key={k.id}
                  def={k}
                  shift={shift}
                  pressed={pressed === k.id}
                  onPointerDown={onPointerDown}
                  onPointerEnter={onPointerEnterKey}
                />
              );
              if (k.id === "sym" && settings.showEmojiKey && layout === "letters") {
                return [
                  node,
                  <KeyCap
                    key="emoji-key"
                    def={{
                      id: "emoji-key",
                      label: "emoji",
                      kind: "mod",
                      flex: 0.85,
                    }}
                    shift={shift}
                    pressed={pressed === "emoji-key"}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      setPanel("emoji");
                    }}
                    onPointerEnter={() => undefined}
                  />,
                ];
              }
              return [node];
            })}
          </div>
        </>
      )}

      {popup && (
        <div className="key-popup" style={{ left: popup.x, top: popup.y }}>
          {popup.chars.map((ch, i) => (
            <button key={ch} type="button" data-on={i === popup.pick ? "true" : "false"}>
              {ch}
            </button>
          ))}
        </div>
      )}

      {pressed && settings.keypressPopup && !swipe.current && layout === "letters" && (
        <PreviewFor pressed={pressed} shift={shift} />
      )}

      {trail.length > 1 && settings.swipeTrail && <SwipeTrail points={trail} />}
    </div>
  );
}

function PreviewFor({
  pressed,
  shift,
}: {
  pressed: string;
  shift: "off" | "once" | "lock";
}) {
  if (pressed.length !== 1) return null;
  const label = shift !== "off" ? pressed.toUpperCase() : pressed;
  return (
    <div className="preview-bubble" style={{ left: "50%", top: 48 }}>
      {label}
    </div>
  );
}

function SwipeTrail({ points }: { points: Point[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = "rgba(47, 111, 143, 0.85)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = p.x - rect.left;
      const y = p.y - rect.top;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [points]);
  return <canvas ref={ref} className="swipe-canvas" />;
}
