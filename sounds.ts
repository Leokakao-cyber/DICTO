type Style = "click" | "soft" | "mechanical";

let ctx: AudioContext | null = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function playKeySound(style: Style, volume: number) {
  const ac = getCtx();
  if (!ac || volume <= 0) return;
  if (ac.state === "suspended") void ac.resume();
  const t = ac.currentTime;
  const gain = ac.createGain();
  gain.connect(ac.destination);
  const v = Math.max(0, Math.min(1, volume)) * 0.18;

  if (style === "soft") {
    const o = ac.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(180, t + 0.04);
    gain.gain.setValueAtTime(v * 0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(gain);
    o.start(t);
    o.stop(t + 0.06);
    return;
  }

  if (style === "mechanical") {
    const buffer = ac.createBuffer(1, ac.sampleRate * 0.03, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1800;
    src.connect(bp);
    bp.connect(gain);
    const o = ac.createOscillator();
    o.type = "square";
    o.frequency.setValueAtTime(140, t);
    o.connect(gain);
    gain.gain.setValueAtTime(v, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    src.start(t);
    o.start(t);
    o.stop(t + 0.025);
    src.stop(t + 0.03);
    return;
  }

  const o = ac.createOscillator();
  o.type = "square";
  o.frequency.setValueAtTime(760, t);
  o.frequency.exponentialRampToValueAtTime(220, t + 0.018);
  gain.gain.setValueAtTime(v, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  o.connect(gain);
  o.start(t);
  o.stop(t + 0.035);
}
