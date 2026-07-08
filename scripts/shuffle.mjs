/**
 * scripts/shuffle.mjs — Fisher–Yates compartido (tests + referencia para core/quiz.ts).
 * Mantener el algoritmo en sync con shuffleArray en _dist/js/app/core/quiz.ts.
 */
export function shuffleArray(arr, rng = Math.random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}
