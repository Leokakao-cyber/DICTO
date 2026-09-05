export type KeyDef = {
  id: string;
  label: string;
  code?: string;
  flex?: number;
  kind?: "char" | "mod" | "enter" | "space" | "backspace" | "shift";
  longPress?: string[];
  sub?: string;
};

export const LONG_PRESS: Record<string, string[]> = {
  a: ["à", "á", "â", "ä", "æ", "ã", "å", "ā"],
  e: ["è", "é", "ê", "ë", "ē", "ė", "ę"],
  i: ["ì", "í", "î", "ï", "ī"],
  o: ["ò", "ó", "ô", "ö", "õ", "ø", "ō", "œ"],
  u: ["ù", "ú", "û", "ü", "ū"],
  y: ["ÿ"],
  n: ["ñ", "ń"],
  c: ["ç", "ć", "č"],
  s: ["ś", "š", "ß"],
  l: ["ł"],
  z: ["ž", "ź", "ż"],
  d: ["ď"],
  t: ["ť"],
  g: ["ğ"],
  "!": ["¡"],
  "?": ["¿"],
  "'": ["‘", "’", "‚", "‹", "›"],
  '"': ["“", "”", "„", "«", "»"],
  "-": ["—", "–", "·"],
  $: ["€", "£", "¥", "₹", "₩"],
  ".": ["…", "•"],
};

function row(letters: string): KeyDef[] {
  return letters.split("").map((ch) => ({
    id: ch,
    label: ch,
    code: ch,
    kind: "char" as const,
    longPress: LONG_PRESS[ch],
  }));
}

export type LanguageId = "en" | "es" | "fr" | "de" | "pt" | "it";

export const LANGUAGES: {
  id: LanguageId;
  label: string;
  native: string;
  region: string;
}[] = [
  { id: "en", label: "English", native: "English (US)", region: "US" },
  { id: "es", label: "Spanish", native: "Español", region: "ES" },
  { id: "fr", label: "French", native: "Français", region: "FR" },
  { id: "de", label: "German", native: "Deutsch", region: "DE" },
  { id: "pt", label: "Portuguese", native: "Português", region: "BR" },
  { id: "it", label: "Italian", native: "Italiano", region: "IT" },
];

export function letterRows(lang: LanguageId): KeyDef[][] {
  if (lang === "fr") {
    return [
      row("azertyuiop"),
      row("qsdfghjklm"),
      [
        { id: "shift", label: "shift", kind: "shift", flex: 1.35 },
        ...row("wxcvbn"),
        { id: "backspace", label: "back", kind: "backspace", flex: 1.35 },
      ],
    ];
  }
  if (lang === "de") {
    return [
      row("qwertzuiopü"),
      row("asdfghjklöä"),
      [
        { id: "shift", label: "shift", kind: "shift", flex: 1.35 },
        ...row("yxcvbnm"),
        { id: "backspace", label: "back", kind: "backspace", flex: 1.35 },
      ],
    ];
  }
  const top =
    lang === "es" ? "qwertyuiop" : lang === "pt" ? "qwertyuiop" : "qwertyuiop";
  const mid =
    lang === "es" ? "asdfghjklñ" : lang === "it" ? "asdfghjkl" : "asdfghjkl";
  const bot = lang === "pt" ? "zxcvbnmç" : "zxcvbnm";
  return [
    row(top),
    row(mid),
    [
      { id: "shift", label: "shift", kind: "shift", flex: 1.4 },
      ...row(bot),
      { id: "backspace", label: "back", kind: "backspace", flex: 1.4 },
    ],
  ];
}

export const NUMBER_ROW: KeyDef[] = "1234567890".split("").map((ch) => ({
  id: `n-${ch}`,
  label: ch,
  code: ch,
  kind: "char",
}));

export const SYMBOL_ROWS: KeyDef[][] = [
  row("1234567890"),
  [
    { id: "@", label: "@", code: "@", kind: "char" },
    { id: "#", label: "#", code: "#", kind: "char" },
    { id: "$", label: "$", code: "$", kind: "char", longPress: LONG_PRESS.$ },
    { id: "_", label: "_", code: "_", kind: "char" },
    { id: "&", label: "&", code: "&", kind: "char" },
    { id: "-", label: "-", code: "-", kind: "char", longPress: LONG_PRESS["-"] },
    { id: "+", label: "+", code: "+", kind: "char" },
    { id: "(", label: "(", code: "(", kind: "char" },
    { id: ")", label: ")", code: ")", kind: "char" },
    { id: "/", label: "/", code: "/", kind: "char" },
  ],
  [
    { id: "sym2", label: "=\\<", kind: "mod", flex: 1.35 },
    { id: "*", label: "*", code: "*", kind: "char" },
    { id: '"', label: '"', code: '"', kind: "char", longPress: LONG_PRESS['"'] },
    { id: "'", label: "'", code: "'", kind: "char", longPress: LONG_PRESS["'"] },
    { id: ":", label: ":", code: ":", kind: "char" },
    { id: ";", label: ";", code: ";", kind: "char" },
    { id: "!", label: "!", code: "!", kind: "char", longPress: LONG_PRESS["!"] },
    { id: "?", label: "?", code: "?", kind: "char", longPress: LONG_PRESS["?"] },
    { id: "backspace", label: "back", kind: "backspace", flex: 1.35 },
  ],
];

export const SYMBOL2_ROWS: KeyDef[][] = [
  [
    { id: "~", label: "~", code: "~", kind: "char" },
    { id: "`", label: "`", code: "`", kind: "char" },
    { id: "|", label: "|", code: "|", kind: "char" },
    { id: "•", label: "•", code: "•", kind: "char" },
    { id: "√", label: "√", code: "√", kind: "char" },
    { id: "π", label: "π", code: "π", kind: "char" },
    { id: "÷", label: "÷", code: "÷", kind: "char" },
    { id: "×", label: "×", code: "×", kind: "char" },
    { id: "¶", label: "¶", code: "¶", kind: "char" },
    { id: "∆", label: "∆", code: "∆", kind: "char" },
  ],
  [
    { id: "£", label: "£", code: "£", kind: "char" },
    { id: "¢", label: "¢", code: "¢", kind: "char" },
    { id: "€", label: "€", code: "€", kind: "char" },
    { id: "¥", label: "¥", code: "¥", kind: "char" },
    { id: "^", label: "^", code: "^", kind: "char" },
    { id: "°", label: "°", code: "°", kind: "char" },
    { id: "=", label: "=", code: "=", kind: "char" },
    { id: "{", label: "{", code: "{", kind: "char" },
    { id: "}", label: "}", code: "}", kind: "char" },
    { id: "\\", label: "\\", code: "\\", kind: "char" },
  ],
  [
    { id: "sym1", label: "?123", kind: "mod", flex: 1.35 },
    { id: "©", label: "©", code: "©", kind: "char" },
    { id: "®", label: "®", code: "®", kind: "char" },
    { id: "™", label: "™", code: "™", kind: "char" },
    { id: "✓", label: "✓", code: "✓", kind: "char" },
    { id: "[", label: "[", code: "[", kind: "char" },
    { id: "]", label: "]", code: "]", kind: "char" },
    { id: "<", label: "<", code: "<", kind: "char" },
    { id: ">", label: ">", code: ">", kind: "char" },
    { id: "backspace", label: "back", kind: "backspace", flex: 1.35 },
  ],
];

export function bottomRow(mode: "letters" | "symbols"): KeyDef[] {
  return [
    {
      id: mode === "letters" ? "sym" : "abc",
      label: mode === "letters" ? "?123" : "ABC",
      kind: "mod",
      flex: 1.25,
    },
    { id: ",", label: ",", code: ",", kind: "char", flex: 0.9 },
    { id: "space", label: "space", kind: "space", flex: 4.4 },
    {
      id: ".",
      label: ".",
      code: ".",
      kind: "char",
      flex: 0.9,
      longPress: LONG_PRESS["."],
    },
    { id: "enter", label: "enter", kind: "enter", flex: 1.35 },
  ];
}
