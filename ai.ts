import { createServerFn } from "@tanstack/react-start";

type ChatOk = { ok: true; text: string };
type ChatErr = { ok: false; error: string };

async function chat(
  system: string,
  user: string,
  maxTokens = 400,
): Promise<ChatOk | ChatErr> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "AI is not available in this environment" };
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: 0.3,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) return { ok: false, error: `xAI API error ${res.status}` };
  const body = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return { ok: true, text: body.choices[0]?.message.content?.trim() ?? "" };
}

export const aiRewrite = createServerFn({ method: "POST" })
  .validator(
    (input: {
      text: string;
      mode: "grammar" | "rewrite" | "improve" | "formal" | "casual" | "shorter" | "longer";
    }) => input,
  )
  .handler(async ({ data }) => {
    const text = data.text.slice(0, 2000);
    if (!text.trim()) return { ok: false as const, error: "Nothing to rewrite" };
    const instructions: Record<typeof data.mode, string> = {
      grammar:
        "Fix grammar, spelling, and punctuation. Preserve meaning and language. Return only the corrected text.",
      rewrite:
        "Rewrite clearly and naturally while preserving meaning. Return only the rewritten text.",
      improve:
        "Improve clarity, flow, and word choice. Keep the same language and intent. Return only the improved text.",
      formal:
        "Rewrite in a polished, professional tone. Return only the rewritten text.",
      casual:
        "Rewrite in a friendly, conversational tone. Return only the rewritten text.",
      shorter: "Make this more concise. Return only the shortened text.",
      longer:
        "Expand slightly with useful detail, without fluff. Return only the expanded text.",
    };
    return chat(
      "You are DICTO, a writing assistant inside a mobile keyboard. Never add quotes, labels, or commentary.",
      `${instructions[data.mode]}\n\n${text}`,
      500,
    );
  });

export const aiTranslate = createServerFn({ method: "POST" })
  .validator((input: { text: string; from: string; to: string }) => input)
  .handler(async ({ data }) => {
    const text = data.text.slice(0, 2000);
    if (!text.trim()) return { ok: false as const, error: "Nothing to translate" };
    return chat(
      "You are DICTO Translate. Return only the translation, no quotes or notes.",
      `Translate from ${data.from} to ${data.to}:\n\n${text}`,
      500,
    );
  });

export const aiDefine = createServerFn({ method: "POST" })
  .validator((input: { word: string }) => input)
  .handler(async ({ data }) => {
    const word = data.word.trim().slice(0, 64);
    if (!word) return { ok: false as const, error: "Enter a word" };
    const result = await chat(
      'You are DICTO Dictionary. Reply with compact JSON only: {"word":"","phonetic":"","senses":[{"pos":"","definition":"","example":"","synonyms":[],"antonyms":[]}],"synonyms":[],"antonyms":[]}. Max 3 senses. No markdown.',
      `Define the English word: ${word}`,
      500,
    );
    if (!result.ok) return result;
    try {
      const json = JSON.parse(result.text.replace(/```json|```/g, "").trim()) as {
        word: string;
        phonetic?: string;
        senses: {
          pos: string;
          definition: string;
          example?: string;
          synonyms?: string[];
          antonyms?: string[];
        }[];
        synonyms?: string[];
        antonyms?: string[];
      };
      return { ok: true as const, entry: json };
    } catch {
      return { ok: false as const, error: "Could not parse definition" };
    }
  });
