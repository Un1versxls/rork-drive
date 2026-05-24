/**
 * Short, readable, stable user code derived from any identifier we
 * have for the account (Supabase user id, Apple user id, or email).
 *
 * Format: DRIVE-XXXXXX (6 char base32-ish alphabet, no ambiguous chars).
 * Same input always yields the same output, so signing in on another
 * device gives the user the same code.
 */

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L

function fnv1a(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick the most stable identifier we can find for this account. */
export function pickUserCodeSeed(opts: {
  userId?: string | null;
  appleUserId?: string | null;
  email?: string | null;
}): string | null {
  if (opts.userId && opts.userId.trim()) return `u:${opts.userId.trim()}`;
  if (opts.appleUserId && opts.appleUserId.trim()) return `a:${opts.appleUserId.trim()}`;
  if (opts.email && opts.email.trim()) return `e:${opts.email.trim().toLowerCase()}`;
  return null;
}

/** Deterministic DRIVE-XXXXXX code from a seed string. */
export function generateUserCode(seed: string): string {
  const hash = fnv1a(`drive::${seed}`);
  const rand = mulberry32(hash);
  let out = "";
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(rand() * ALPHABET.length);
    out += ALPHABET[idx];
  }
  return `DRIVE-${out}`;
}

/** Combined helper used by the UI layer. Returns null if no seed yet. */
export function userCodeFor(opts: {
  userId?: string | null;
  appleUserId?: string | null;
  email?: string | null;
}): string | null {
  const seed = pickUserCodeSeed(opts);
  if (!seed) return null;
  return generateUserCode(seed);
}
