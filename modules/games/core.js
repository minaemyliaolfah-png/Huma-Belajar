(function (root) {
  "use strict";
  function shuffle(items, rng = Math.random) {
    const a = items.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function scramble(word, rng = Math.random) {
    const a = shuffle([...word], rng);
    if (a.join("") === word && new Set(word).size > 1) a.push(a.shift());
    return a;
  }
  const jumps = { 3: 14, 8: 19, 16: 27, 22: 32, 17: 6, 25: 13, 31: 20, 35: 24 };
  function move(position, die) {
    if (!Number.isInteger(die) || die < 1 || die > 6)
      throw new Error("Dadu tidak valid");
    const land = Math.min(36, position + die);
    return { land, to: jumps[land] || land };
  }
  function grid(words) {
    const cells = {};
    words.forEach((w) =>
      [...w.word].forEach((letter, i) => {
        const r = w.r + (w.dir === "down" ? i : 0),
          c = w.c + (w.dir === "across" ? i : 0),
          key = r + "," + c;
        if (cells[key] && cells[key].letter !== letter)
          throw new Error("Persilangan TTS tidak cocok");
        cells[key] ??= { r, c, letter };
        if (i === 0) cells[key].n = w.n;
      }),
    );
    return cells;
  }
  function wordStatus(word, guesses) {
    const wrong = guesses.filter((x) => !word.includes(x)).length;
    return {
      wrong,
      won: [...word].every((x) => guesses.includes(x)),
      lost: wrong >= 6,
    };
  }
  const api = { shuffle, scramble, move, grid, wordStatus, jumps };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.HumaGameCore = api;
})(typeof window !== "undefined" ? window : globalThis);
