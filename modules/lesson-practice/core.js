/* Validasi bank soal yang dipakai bersama oleh browser dan Apps Script. */
function validateLessonQuiz_(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === "")
    return null;
  if (typeof raw !== "string" || raw.length > 20000)
    throw new Error(
      "Soal_JSON harus berupa teks JSON, maksimal 20.000 karakter.",
    );
  let bank;
  try {
    bank = JSON.parse(raw);
  } catch {
    throw new Error(
      "Soal_JSON belum valid. Periksa tanda kutip, koma, dan kurung pada template.",
    );
  }
  function text(value, name, max, required) {
    if (value === undefined && !required) return "";
    if (
      typeof value !== "string" ||
      (required && !value.trim()) ||
      value.length > max
    )
      throw new Error(
        name +
          " harus berupa teks" +
          (required ? " yang tidak kosong" : "") +
          ", maksimal " +
          max +
          " karakter.",
      );
    return value.trim();
  }
  if (
    !bank ||
    Array.isArray(bank) ||
    !Array.isArray(bank.soal) ||
    bank.soal.length < 1 ||
    bank.soal.length > 50
  )
    throw new Error(
      "Isi daftar soal sebanyak 1–50 butir; misalnya 10 soal per subbab.",
    );
  return {
    judul: text(bank.judul, "Judul latihan", 160, false),
    petunjuk: text(bank.petunjuk, "Petunjuk", 1000, false),
    bacaan: text(bank.bacaan, "Bacaan bersama", 6000, false),
    soal: bank.soal.map(function (q, index) {
      const label = "Soal " + (index + 1);
      if (
        !q ||
        typeof q !== "object" ||
        Array.isArray(q) ||
        !q.pilihan ||
        typeof q.pilihan !== "object" ||
        Array.isArray(q.pilihan)
      )
        throw new Error(label + ": pilihan harus berisi A, B, C, D (atau E).");
      const keys = Object.keys(q.pilihan);
      if (
        keys.length < 2 ||
        keys.length > 5 ||
        keys.some(function (k) {
          return !/^[A-E]$/.test(k);
        })
      )
        throw new Error(
          label + ": gunakan 2–5 pilihan dengan huruf A sampai E.",
        );
      const pilihan = {};
      keys.sort().forEach(function (k) {
        pilihan[k] = text(q.pilihan[k], label + " pilihan " + k, 1000, true);
      });
      if (
        typeof q.jawaban !== "string" ||
        !Object.prototype.hasOwnProperty.call(pilihan, q.jawaban)
      )
        throw new Error(
          label + ": jawaban harus salah satu huruf pilihan, misalnya B.",
        );
      return {
        id: String(index + 1),
        pertanyaan: text(q.pertanyaan, label + " pertanyaan", 2000, true),
        bacaan: text(q.bacaan, label + " bacaan", 4000, false),
        pilihan: pilihan,
        jawaban: q.jawaban,
        pembahasan: text(q.pembahasan, label + " pembahasan", 3000, false),
      };
    }),
  };
}
if (typeof module !== "undefined" && module.exports)
  module.exports = {
    parse: validateLessonQuiz_,
    grade: function (bank, answers) {
      const total = bank.soal.length,
        correct = bank.soal.filter(function (q) {
          return answers[q.id] === q.jawaban;
        }).length;
      return {
        correct: correct,
        total: total,
        score: Math.round((100 * correct) / total),
      };
    },
  };
if (typeof window !== "undefined")
  window.HumaLessonQuizCore = {
    parse: validateLessonQuiz_,
    grade: function (bank, answers) {
      const total = bank.soal.length,
        correct = bank.soal.filter((q) => answers[q.id] === q.jawaban).length;
      return { correct, total, score: Math.round((100 * correct) / total) };
    },
  };
