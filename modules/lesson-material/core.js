/* Format materi bacaan, dipakai bersama browser dan Apps Script. */
function validateLessonMaterial_(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === "")
    return null;
  if (typeof raw !== "string" || raw.length > 20000)
    throw new Error(
      "Materi_JSON harus berupa teks JSON, maksimal 20.000 karakter.",
    );
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      "Materi_JSON belum valid. Periksa tanda kutip, koma, dan kurung pada template.",
    );
  }
  function text(v, name, max, required) {
    if (v === undefined && !required) return "";
    if (typeof v !== "string" || (required && !v.trim()) || v.length > max)
      throw new Error(
        name +
          " harus berupa teks" +
          (required ? " yang tidak kosong" : "") +
          ", maksimal " +
          max +
          " karakter.",
      );
    return v.trim();
  }
  function list(v, name, max) {
    if (v === undefined) return [];
    if (!Array.isArray(v) || v.length > max)
      throw new Error(
        name + " harus berupa daftar, maksimal " + max + " butir.",
      );
    return v.map(function (item) {
      return text(item, name, 1000, true);
    });
  }
  if (
    !data ||
    Array.isArray(data) ||
    !Array.isArray(data.bagian) ||
    !data.bagian.length ||
    data.bagian.length > 30
  )
    throw new Error("Isi bagian materi sebanyak 1–30 bagian.");
  return {
    judul: text(data.judul, "Judul materi", 200, false),
    tujuan: list(data.tujuan, "Tujuan pembelajaran", 10),
    pengantar: text(data.pengantar, "Pengantar", 5000, false),
    bagian: data.bagian.map(function (b, i) {
      const name = "Bagian " + (i + 1);
      if (!b || typeof b !== "object" || Array.isArray(b))
        throw new Error(name + " harus berupa objek materi.");
      const item = {
        judul: text(b.judul, name + " judul", 200, true),
        isi: text(b.isi, name + " isi", 10000, false),
        poin: list(b.poin, name + " poin", 20),
        contoh: text(b.contoh, name + " contoh", 5000, false),
      };
      if (!item.isi && !item.poin.length && !item.contoh)
        throw new Error(name + " perlu isi, poin, atau contoh.");
      return item;
    }),
    ringkasan: list(data.ringkasan, "Ringkasan", 20),
  };
}
if (typeof module !== "undefined" && module.exports)
  module.exports = { parse: validateLessonMaterial_ };
if (typeof window !== "undefined")
  window.HumaLessonMaterialCore = { parse: validateLessonMaterial_ };
