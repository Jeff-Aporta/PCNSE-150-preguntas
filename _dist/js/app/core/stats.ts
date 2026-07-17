/**
 * core/stats.ts — persistencia de stats locales.
 */

const STATS_KEY = "pcnse-150:stats";

export type Stats = {
  lastScore?: number;
  totalAttempts: number;
};

export function loadStats(): Stats {
  try {
    // Migracion desde william-quest:stats → pcnse-150:stats (1 sola vez).
    let raw = localStorage.getItem(STATS_KEY);
    if (!raw) {
      const legacy = localStorage.getItem("william-quest:stats");
      if (legacy) {
        localStorage.setItem(STATS_KEY, legacy);
        localStorage.removeItem("william-quest:stats");
        raw = legacy;
      }
    }
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