window.HumaLessonMaterial = (() => {
  const C = window.HumaLessonMaterialCore,
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
  const paragraphs = (text) =>
    String(text || "")
      .split(/\n\s*\n/)
      .filter((p) => p.trim())
      .map((p) => "<p>" + esc(p) + "</p>")
      .join("");
  const list = (items) =>
    "<ul>" + items.map((t) => "<li>" + esc(t) + "</li>").join("") + "</ul>";
  function html(item) {
    if (!item.materi_json?.trim())
      return item.isi
        ? '<article class="lm-article"><header class="lm-heading"><span class="eyebrow">BACAAN MATERI</span><h2>' +
            esc(item.judul) +
            '</h2></header><div class="lm-body">' +
            paragraphs(item.isi) +
            "</div></article>"
        : "";
    try {
      const data = C.parse(item.materi_json);
      return (
        '<article class="lm-article"><header class="lm-heading"><span class="eyebrow">BACAAN MATERI · BAHASA INDONESIA</span><h2>' +
        esc(data.judul || item.judul) +
        '</h2><p>Pelajari konsepnya, pahami contoh, lalu lanjutkan ke latihan.</p></header><div class="lm-body">' +
        (data.tujuan.length
          ? '<section class="lm-goals"><h3>Setelah belajar, kamu dapat…</h3>' +
            list(data.tujuan) +
            "</section>"
          : "") +
        (data.pengantar
          ? '<div class="lm-intro">' + paragraphs(data.pengantar) + "</div>"
          : "") +
        data.bagian
          .map(
            (b, i) =>
              '<section class="lm-section"><div class="lm-section-head"><span>' +
              String(i + 1).padStart(2, "0") +
              "</span><h3>" +
              esc(b.judul) +
              "</h3></div>" +
              paragraphs(b.isi) +
              (b.poin.length ? list(b.poin) : "") +
              (b.contoh
                ? '<aside class="lm-example"><strong>CONTOH</strong>' +
                  paragraphs(b.contoh) +
                  "</aside>"
                : "") +
              "</section>",
          )
          .join("") +
        (data.ringkasan.length
          ? '<section class="lm-summary"><h3>Yang perlu kamu ingat</h3>' +
            list(data.ringkasan) +
            "</section>"
          : "") +
        "</div></article>"
      );
    } catch (e) {
      return (
        '<section class="paper"><h2>Materi belum dapat ditampilkan</h2><p>Isi materi perlu diperiksa oleh guru.</p><p class="helper">' +
        esc(e.message) +
        "</p></section>"
      );
    }
  }
  return { html };
})();
