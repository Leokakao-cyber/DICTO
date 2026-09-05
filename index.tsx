import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Keyboard, Languages, PenLine } from "lucide-react";
import { PhoneShell } from "@/components/phone/PhoneShell";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex min-h-dvh max-w-6xl items-center justify-center gap-16 px-6 py-8">
        <section className="hidden max-w-md lg:block">
          <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
            Productivity keyboard
          </p>
          <h1 className="mt-3 font-serif text-5xl leading-tight tracking-tight">
            DICTO
          </h1>
          <p className="mt-4 text-base leading-relaxed text-fg-muted">
            Familiar like Gboard. Built to help you write better — dictionary,
            grammar, rewrite, and translation, all from the keys.
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            <Rail icon={BookOpen} title="Million-word dictionary" body="Look up meaning, usage, synonyms, and antonyms without leaving the keyboard." />
            <Rail icon={PenLine} title="AI Writer" body="Fix grammar, rewrite tone, or tighten a sentence in one tap." />
            <Rail icon={Languages} title="Translator" body="Its own workspace, then insert the result back into your message." />
            <Rail icon={Keyboard} title="Everyday keys" body="Swipe typing, number row, clipboard, voice, themes, sounds, and haptics." />
          </ul>
        </section>
        <PhoneShell />
      </div>
    </main>
  );
}

function Rail({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof BookOpen;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid size-9 place-items-center rounded-lg bg-bg-subtle text-accent">
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block font-medium">{title}</span>
        <span className="block text-fg-muted">{body}</span>
      </span>
    </li>
  );
}
