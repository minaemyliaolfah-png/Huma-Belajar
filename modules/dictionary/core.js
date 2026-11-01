(function (root) {
  const normalize = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("id")
      .replace(/\s+/g, " ")
      .trim();
  function merge(base, overrides) {
    const map = new Map(base.map((e) => [e.id, e]));
    overrides.forEach((e) => {
      if (e.id) {
        const original = map.get(e.id) || {};
        const combined = { ...original, ...e };
        // Versi spreadsheet lama dapat belum memiliki arti bantu Inggris.
        if (
          !e.inggris &&
          original.inggris &&
          e.status_verifikasi !== "Terverifikasi" &&
          !e.id_usulan_terakhir
        ) {
          combined.inggris = original.inggris;
          combined.status_inggris = original.status_inggris;
          combined.asal_inggris = original.asal_inggris;
        }
        map.set(e.id, combined);
      }
    });
    return [...map.values()].sort(
      (a, b) =>
        a.dayak.localeCompare(b.dayak, "id") ||
        a.indo.localeCompare(b.indo, "id"),
    );
  }
  function search(entries, q, letter = "", verified = false) {
    const term = normalize(q);
    return entries.filter(
      (e) =>
        (!term ||
          [e.dayak, e.indo, e.inggris, e.kategori].some((x) =>
            normalize(x).includes(term),
          )) &&
        (!letter || normalize(e.dayak).startsWith(letter)) &&
        (!verified || e.status_verifikasi === "Terverifikasi"),
    );
  }
  function lookup(entries, q, language = "dayak") {
    const term = normalize(q);
    if (!term) return [];
    return entries.filter(
      (e) =>
        normalize(e[language]) === term ||
        (language !== "dayak" &&
          String(e[language] || "")
            .split(/[;,]/)
            .some((x) => normalize(x) === term)),
    );
  }
  function stats(entries) {
    return {
      entries: entries.length,
      words: new Set(entries.map((e) => normalize(e.dayak))).size,
      english: entries.filter((e) => String(e.inggris || "").trim()).length,
      verified: entries.filter((e) => e.status_verifikasi === "Terverifikasi")
        .length,
    };
  }
  const api = { normalize, merge, search, lookup, stats };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.HumaDictionaryCore = api;
})(typeof window !== "undefined" ? window : globalThis);
