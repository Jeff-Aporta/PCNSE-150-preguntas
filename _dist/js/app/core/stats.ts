/**
 * core/stats.ts — persistencia de stats locales.
 */

const STATS_KEY = "william-quest:stats";

export type Stats = {
  lastScore?: number;
  totalAttempts: number;
};

export function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { totalAttempts: 0 };
    const parsed = JSON.parse(raw);
    return {
      lastScore: typeof parsed.lastScore === "number" ? parsed.lastScore : undefined,
      totalAttempts: typeof parsed.totalAttempts === "number" ? parsed.totalAttempts : 0,
    };
  } catch {
    return { totalAttempts: 0 };
  }
}

export function saveStats(score: number) {
  try {
    const cur = loadStats();
    localStorage.setItem(
      STATS_KEY,
      JSON.stringify({
        lastScore: score,
        totalAttempts: cur.totalAttempts + 1,
      })
    );
  } catch {
    /* ignore */
  }
}