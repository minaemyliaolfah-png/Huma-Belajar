/* Latihan subbab native: bank Soal_JSON, pilihan, nilai dan pembahasan di SPA. */
window.HumaLessonPractice = (() => {
  const C = window.HumaLessonQuizCore,
    cache = new Map(),
    esc = (v) =>
      String(v ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      );
  function version(raw) {
    let h = 2166136261;
    for (const char of raw) {
      h ^= char.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }
  function state(item, user) {
    const bank = C.parse(item.soal_json);
    if (!bank) return null;
    const key =
      "huma-subquiz:" +
      user +
      ":" +
      item.id_subbab +
      ":" +
      version(item.soal_json);
    if (!cache.has(key)) {
      let saved = {};
      try {
        saved = JSON.parse(sessionStorage.getItem(key) || "{}");
      } catch {}
      const answers = {};
      bank.soal.forEach((q) => {
        if (Object.hasOwn(q.pilihan, saved?.answers?.[q.id]))
          answers[q.id] = saved.answers[q.id];
      });
      cache.set(key, {
        key,
        bank,
        answers,
        checked:
          !!saved?.checked && Object.keys(answers).length === bank.soal.length,
      });
    }
    return cache.get(key);
  }
  function persist(s) {
    try {
      sessionStorage.setItem(
        s.key,
        JSON.stringify({ answers: s.answers, checked: s.checked }),
      );
    } catch {}
  }
  function body(s) {
    const { bank, answers, checked } = s,
      answered = Object.keys(answers).length,
      result = checked ? C.grade(bank, answers) : null;
    return `<header class="lq-heading"><div><span class="eyebrow">LATIHAN SUBBAB</span><h2>${esc(bank.judul || "Uji pemahamanmu")}</h2><p>${esc(bank.petunjuk || "Pilih satu jawaban paling tepat pada setiap soal, lalu periksa hasilnya.")}</p></div><span class="tag">${bank.soal.length} soal</span></header>${result ? `<section class="lq-result" role="status" tabindex="-1"><div><span>NILAI LATIHAN</span><strong>${result.score}</strong></div><p>${result.correct} dari ${result.total} jawaban benar.<br>Baca pembahasan untuk memahami jawabanmu.</p><button type="button" class="button small light" data-lq="reset">Coba lagi ↻</button></section>` : ""}<div class="lq-tracker"><span id="lq-count">${answered} dari ${bank.soal.length} soal terjawab</span><progress id="lq-progress" value="${answered}" max="${bank.soal.length}" aria-label="Jumlah soal terjawab"></progress></div>${bank.bacaan ? `<section class="lq-passage"><h3>Bacaan untuk menjawab soal</h3><p>${esc(bank.bacaan)}</p></section>` : ""}<form id="lq-form"><div class="lq-questions">${bank.soal
      .map(
        (q, i) =>
          `<fieldset class="lq-question"><legend>SOAL ${i + 1}</legend>${q.bacaan ? `<p class="lq-passage">${esc(q.bacaan)}</p>` : ""}<h3>${esc(q.pertanyaan)}</h3>${Object.entries(
            q.pilihan,
          )
            .map(
              ([key, text]) =>
                `<label class="lq-option ${checked && key === q.jawaban ? "correct" : checked && answers[q.id] === key ? "incorrect" : ""}"><input type="radio" name="soal-${q.id}" value="${key}" data-question="${q.id}" required ${answers[q.id] === key ? "checked" : ""} ${checked ? "disabled" : ""}><b>${key}</b><span>${esc(text)}</span></label>`,
            )
            .join(
              "",
            )}${checked ? `<div class="lq-feedback ${answers[q.id] === q.jawaban ? "correct" : "incorrect"}"><strong>${answers[q.id] === q.jawaban ? "✓ Jawaban tepat" : "○ Jawaban belum tepat"} · Kunci: ${q.jawaban}</strong>${q.pembahasan ? `<p>${esc(q.pembahasan)}</p>` : ""}</div>` : ""}</fieldset>`,
      )
      .join(
        "",
      )}</div>${!checked ? '<button class="button lq-submit" type="submit">Periksa jawaban & lihat nilai ✓</button>' : ""}</form><p class="lq-local-note">Latihan mandiri. Jawaban tersimpan sementara di browser; nilai belum dikirim ke rekap guru.</p>`;
  }
  function html(item, user = "guest") {
    if (!item.soal_json?.trim())
      return '<div class="empty"><h3>Latihan sedang disiapkan</h3><p>Guru belum menambahkan soal untuk subbab ini.</p></div>';
    try {
      return (
        '<section id="lesson-quiz" class="lq-app">' +
        body(state(item, user)) +
        "</section>"
      );
    } catch (e) {
      return `<section class="paper"><h2>Latihan belum dapat ditampilkan</h2><p>Bank soal perlu diperiksa oleh guru.</p><p class="helper">${esc(e.message)}</p></section>`;
    }
  }
  function mount(container, item, user = "guest") {
    const root = container.querySelector("#lesson-quiz");
    if (!root) return;
    let s;
    try {
      s = state(item, user);
    } catch {
      return;
    }
    root.addEventListener("change", (e) => {
      const input = e.target;
      if (!input.matches("input[data-question]") || s.checked) return;
      const q = s.bank.soal.find((q) => q.id === input.dataset.question);
      if (!q || !Object.hasOwn(q.pilihan, input.value)) return;
      s.answers[q.id] = input.value;
      persist(s);
      root.querySelector("#lq-count").textContent =
        Object.keys(s.answers).length +
        " dari " +
        s.bank.soal.length +
        " soal terjawab";
      root.querySelector("#lq-progress").value = Object.keys(s.answers).length;
    });
    root.addEventListener("submit", (e) => {
      if (e.target.id !== "lq-form") return;
      e.preventDefault();
      if (s.checked || Object.keys(s.answers).length !== s.bank.soal.length)
        return;
      s.checked = true;
      persist(s);
      root.innerHTML = body(s);
      root.querySelector(".lq-result").focus({ preventScroll: true });
      root
        .querySelector(".lq-result")
        .scrollIntoView({ behavior: "smooth", block: "center" });
    });
    root.addEventListener("click", (e) => {
      if (!e.target.closest('[data-lq="reset"]')) return;
      s.answers = {};
      s.checked = false;
      persist(s);
      root.innerHTML = body(s);
      root.querySelector("input")?.focus({ preventScroll: true });
    });
  }
  return { html, mount };
})();
