export function haptic(intensity: number) {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  const ms = Math.round(4 + intensity * 18);
  try {
    navigator.vibrate(ms);
  } catch {
    /* ignore */
  }
}
