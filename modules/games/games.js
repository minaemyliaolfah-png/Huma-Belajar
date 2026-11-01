/* UI dan sesi game Bahasa Indonesia. Tidak mengirim nilai ke server. */
window.HumaGames = (() => {
  "use strict";
  const C = window.HumaGameCore,
    D = window.HUMA_GAME_DATA;
  const escape = (v) =>
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
  const descriptions = [
    {
      id: "peribahasa",
      title: "Jejak Peribahasa",
      tag: "MAKNA & UNGKAPAN",
      desc: "Temukan makna di balik kata-kata bijak Nusantara.",
      info: "6 soal · Solo",
      color: "mint",
      glyph: "book",
    },
    {
      id: "hangman",
      title: "Selamatkan Lentera",
      tag: "TEBAK HURUF",
      desc: "Tebak istilah bahasa sebelum enam cahaya padam.",
      info: "1 kata · Solo",
      color: "amber",
      glyph: "bulb",
    },
    {
      id: "anagram",
      title: "Laboratorium Kata",
      tag: "ANAGRAM",
      desc: "Susun huruf yang berantakan menjadi istilah yang tepat.",
      info: "5 kata · Solo",
      color: "violet",
      glyph: "tiles",
    },
    {
      id: "tts",
      title: "Silang Sastra",
      tag: "TEKA-TEKI SILANG",
      desc: "Isi kotak yang saling berpotongan lewat petunjuk sastra.",
      info: "4 petunjuk · Solo",
      color: "blue",
      glyph: "grid",
    },
    {
      id: "ular",
      title: "Petualangan Kata",
      tag: "ULAR TANGGA",
      desc: "Petualangan majas dan peribahasa dengan papan 100 petak.",
      info: "Solo / 2–6 pemain",
      color: "amber",
      glyph: "stairs",
    },
    {
      id: "duel",
      title: "Tarik Tambang Kata",
      tag: "DUEL BAHASA",
      desc: "Satu jawaban benar, satu tarikan menuju kemenangan.",
      info: "2 pemain · Bergantian",
      color: "rose",
      glyph: "duel",
    },
    {
      id: "space",
      title: "Armada Bahasa",
      tag: "MISI ANTARIKSA",
      desc: "Jawab soal untuk menembak meteor. Jaga tiga perisai!",
      info: "8 soal · Solo",
      color: "night",
      glyph: "rocket",
    },
    {
      id: "baku",
      title: "Detektif Kata Baku",
      tag: "EJAAN",
      desc: "Pilih ejaan yang tepat dan bongkar kata pengecoh.",
      info: "6 soal · Solo",
      color: "mint",
      glyph: "search",
    },
  ];
  const shapes = {
    book: '<path d="M12 5C8 3 5 3 2 4v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-7-1-10 1Zm0 0v15"/>',
    bulb: '<path d="M8 16c0-3-3-4-3-8a7 7 0 0 1 14 0c0 4-3 5-3 8Zm0 3h8m-6 3h4"/>',
    tiles:
      '<rect x="2" y="3" width="9" height="9" rx="2"/><rect x="13" y="12" width="9" height="9" rx="2"/><path d="m4 10 2-5 2 5m-3-2h2m9 7h3l-3 4h3"/>',
    grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18m6-18v18M3 9h18M3 15h18"/>',
    stairs: '<path d="M3 21v-6h6V9h6V3h6M4 7l5-5m-5 0h5v5"/>',
    duel: '<circle cx="4" cy="6" r="2"/><circle cx="20" cy="6" r="2"/><path d="m2 21 2-8 4 2 4-4 4 4 4-2 2 8M4 8v5m16-5v5M2 12h20"/>',
    rocket:
      '<path d="M9 15 5 11C8 4 14 2 21 3c1 7-1 13-8 16l-4-4ZM5 11l-3 3 5 1m6 4 1 3 3-5M7 18l-4 3"/><circle cx="15" cy="8" r="2"/>',
    search: '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
  };
  shapes.target =
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>';
  const ico = (name) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[name] || shapes.book}</svg>`;
  let onOpenSnake = null;
  let root = null,
    active = null,
    menu = true,
    filter = "semua",
    external = [],
    confirmRestart = false;
  let scores = {};
  try {
    const v = JSON.parse(localStorage.getItem("huma-arcade-v1") || "{}");
    if (v && typeof v === "object" && !Array.isArray(v)) scores = v;
  } catch {}
  let saveFailed = false;
  function button(action, label, cls = "", extra = "") {
    return `<button type="button" class="ag-button ${cls}" data-ag="${action}" ${extra}>${label}</button>`;
  }
  function remember() {
    if (active.recorded) return;
    active.recorded = true;
    const best = Number(scores[active.id]) || 0;
    scores[active.id] = Math.max(best, active.score || 0);
    try {
      localStorage.setItem("huma-arcade-v1", JSON.stringify(scores));
    } catch {
      saveFailed = true;
    }
  }
  function newGame(id) {
    const g = {
      id,
      index: 0,
      score: 0,
      selected: null,
      checked: false,
      finished: false,
      feedback: "",
      review: [],
    };
    if (["peribahasa", "baku", "space", "duel", "ular"].includes(id)) {
      const bank =
        id === "peribahasa"
          ? D.proverbs
          : id === "baku"
            ? D.language.slice(0, 6)
            : [...D.language, ...D.proverbs];
      g.questions = C.shuffle(bank).slice(
        0,
        id === "space" ? 8 : id === "duel" ? 10 : id === "ular" ? 30 : 6,
      );
    }
    if (id === "space") g.shields = 3;
    if (id === "duel") {
      g.points = [0, 0];
      g.turn = 0;
    }
    if (id === "ular") {
      g.positions = [1, 1];
      g.points = [0, 0];
      g.turn = 0;
      g.die = null;
    }
    if (id === "hangman") {
      g.word = C.shuffle(D.words)[0];
      g.guesses = [];
    }
    if (id === "anagram") {
      g.words = C.shuffle(D.words).slice(0, 5);
      g.tiles = C.scramble(g.words[0][0]);
      g.used = [];
      g.mistakes = 0;
    }
    if (id === "tts") {
      g.cells = C.grid(D.crossword);
      g.values = {};
      g.errors = [];
      g.direction = "across";
      g.revealed = false;
    }
    active = g;
    menu = false;
    confirmRestart = false;
    render();
    revealStart();
  }
  function header() {
    const d = descriptions.find((x) => x.id === active.id);
    return `<div class="ag-play-head">${button("menu", "← Koleksi game", "ghost")}<span>${escape(d.tag)}</span>${button("restart", "Ulangi", "ghost")}</div><div class="ag-title-line"><div><h1>${escape(d.title)}</h1><p>${escape(d.info)}</p></div><span class="ag-score">${active.score} <small>poin</small></span></div>${confirmRestart ? `<div class="ag-feedback"><strong>Mulai ulang permainan ini?</strong><p>Jawaban pada permainan yang sedang berjalan akan diganti.</p>${button("confirm-restart", "Ya, mulai ulang")}${button("cancel-restart", "Lanjut bermain", "ghost")}</div>` : ""}`;
  }
  function catalog() {
    const list = descriptions.filter(
      (x) =>
        filter === "semua" ||
        (filter === "duel") === ["ular", "duel"].includes(x.id),
    );
    return `<section class="ag-hero"><div><span class="ag-kicker">HUMA ARCADE / BAHASA INDONESIA</span><h1>Main sebentar.<br>Paham lebih banyak.</h1><p>Jelajahi makna, susun kata, dan tantang temanmu.<br>Setiap permainan membawa pengetahuan baru.</p><div class="ag-hero-tags"><span>8 permainan</span><span>Solo & dua pemain</span><span>Tanpa batas waktu</span></div></div><div class="ag-hero-art" aria-hidden="true"><div class="ag-orbit"></div><div class="ag-float one">A</div><div class="ag-float two">Ba</div><div class="ag-float three">Ca</div><div class="ag-center">${ico("tiles")}</div><span class="ag-star">✦</span></div></section>${active && !active.finished ? `<div class="ag-resume"><div><strong>Permainanmu masih tersimpan di sesi ini</strong><p>${escape(descriptions.find((d) => d.id === active.id).title)} · lanjut dari langkah terakhir.</p></div>${button("resume", "Lanjutkan →")}</div>` : ""}<div class="ag-section"><h2>Pilih petualanganmu</h2><div class="ag-filters" aria-label="Filter permainan">${[
      ["semua", "Semua game"],
      ["solo", "Solo"],
      ["duel", "Dua pemain"],
    ]
      .map(([id, t]) =>
        button(
          "filter",
          t,
          filter === id ? "chosen" : "ghost",
          `data-id="${id}" aria-pressed="${filter === id}"`,
        ),
      )
      .join(
        "",
      )}</div></div><div class="ag-cards">${list.map((d, i) => `<article class="ag-card"><div class="ag-cover ${d.color}"><span class="ag-card-no">0${descriptions.indexOf(d) + 1}</span><div class="ag-cover-icon">${ico(d.glyph)}</div><span class="ag-cover-star">✦</span></div><div class="ag-card-body"><span class="ag-kicker">${d.tag}</span><h3>${d.title}</h3><p>${d.desc}</p><div class="ag-card-info"><span>${d.info}</span><span>${d.id === "ular" && onOpenSnake ? "Papan 100 petak" : "Rekor " + (Number(scores[d.id]) || 0)}</span></div>${button("start", "Main sekarang <span>↗</span>", "", `data-id="${d.id}"`)}</div></article>`).join("")}</div><p class="ag-footnote">Rekor tersimpan di browser perangkat ini, bukan di rekap nilai guru. Permainan aktif bertahan saat berpindah menu, tetapi dimulai ulang jika halaman ditutup atau di-refresh.</p>${
      external.length
        ? `<section class="ag-external"><h2>Game tambahan dari guru</h2>${external
            .map((x) => {
              let url = "";
              try {
                const u = new URL(x.link);
                if (u.protocol === "https:") url = u.href;
              } catch {}
              return url
                ? `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(x.judul)} <span>↗</span></a>`
                : "";
            })
            .join("")}</section>`
        : ""
    }`;
  }
  function quizPanel() {
    const g = active,
      q = g.questions[g.index];
    const isBoard = g.id === "ular",
      isDuel = g.id === "duel",
      proverb = D.proverbs.includes(q);
    return `<div class="ag-question"><div class="ag-question-meta"><span>${isBoard ? `GILIRAN ${g.index + 1} / 30` : `SOAL ${g.index + 1} / ${g.questions.length}`}</span><span>${escape(proverb ? "Peribahasa" : q[0])}</span></div>${isBoard && !g.die ? `<h3>Giliran pemain ${g.turn + 1}</h3><p>Lempar dadu, lalu jawab soal. Pion maju hanya jika jawaban benar.</p>${button("roll", "Lempar dadu ⚄")}` : `${isBoard || isDuel ? `<span class="ag-player p${g.turn}">PEMAIN ${g.turn + 1}${isBoard ? " · DADU " + g.die : ""}</span>` : ""}${proverb ? `<blockquote>“${escape(q[0])}”</blockquote>` : ""}<h3>${escape(q[1])}</h3><div class="ag-options">${q[2].map((option, i) => button("answer", `<b>${String.fromCharCode(65 + i)}</b><span>${escape(option)}</span>`, `${g.selected === i ? "selected" : ""} ${g.checked && i === q[3] ? "correct" : ""} ${g.checked && g.selected === i && i !== q[3] ? "wrong" : ""}`, `data-index="${i}" ${g.checked ? "disabled" : ""}`)).join("")}</div>${g.checked ? `<div class="ag-feedback ${g.selected === q[3] ? "good" : "bad"}" role="status"><strong>${g.selected === q[3] ? "Jawaban tepat!" : "Belum tepat. Yuk, pahami."}</strong><p>${escape(q[4])}</p>${g.feedback ? `<p>${escape(g.feedback)}</p>` : ""}</div>${button("next", willFinish() ? "Lihat hasil →" : isBoard || isDuel ? "Giliran berikutnya →" : "Soal berikutnya →")}` : button("check", "Periksa jawaban →", "", g.selected === null ? "disabled" : "")}`}</div>`;
  }
  function willFinish() {
    const g = active;
    return (
      g.index + 1 >= g.questions.length ||
      (g.id === "space" && g.shields === 0) ||
      (g.id === "ular" && g.positions.includes(36)) ||
      (g.id === "duel" && Math.abs(g.points[0] - g.points[1]) >= 5)
    );
  }
  function board() {
    const g = active;
    let cells = "";
    for (let row = 5; row >= 0; row--)
      for (let col = 0; col < 6; col++) {
        const n = row * 6 + (row % 2 ? 6 - col : col + 1),
          jump = C.jumps[n];
        cells += `<div class="ag-square ${jump ? (jump > n ? "ladder" : "snake") : ""} ${n === 36 ? "finish" : ""}"><span>${n}</span>${jump ? `<small>${jump > n ? "↗" : "↘"} ${jump}</small>` : n === 36 ? "<small>FINIS</small>" : ""}<div>${g.positions.map((pos, i) => (pos === n ? `<b class="ag-pawn p${i}" aria-label="Pemain ${i + 1} di petak ${n}">${i + 1}</b>` : "")).join("")}</div></div>`;
      }
    return `<div class="ag-two-col"><aside><div class="ag-board">${cells}</div><div class="ag-board-legend"><span>↗ Tangga: naik</span><span>↘ Ular: turun</span></div><p class="ag-help">Dua pemain bergantian di perangkat yang sama. Jawaban salah: tetap di tempat. Mencapai atau melewati 36 menang. Maksimal 30 giliran; jika belum finis, posisi tertinggi menang.</p><div class="ag-player-scores"><span>P1 · petak ${g.positions[0]}</span><span>P2 · petak ${g.positions[1]}</span></div></aside>${quizPanel()}</div>`;
  }
  function duel() {
    const g = active,
      diff = g.points[0] - g.points[1];
    return `<div class="ag-rope-scene"><div class="ag-rope-person">${ico("duel")}<strong>PEMAIN 1 · ${g.points[0]}</strong></div><div class="ag-rope"><span style="left:${50 - diff * 8}%">⚑</span><i></i></div><div class="ag-rope-person">${ico("duel")}<strong>PEMAIN 2 · ${g.points[1]}</strong></div></div><p class="ag-help">Bergantian menjawab di satu perangkat. Jawaban benar menarik tali ke sisi pemain. Unggul 5 tarikan atau terbanyak setelah 10 soal memenangkan duel.</p>${quizPanel()}`;
  }
  function space() {
    const g = active;
    return `<div class="ag-space ${g.checked ? (g.selected === g.questions[g.index][3] ? "hit" : "damage") : ""}"><div class="ag-space-hud"><span>MISI ${g.index + 1} / 8</span><span>PERISAI ${"◆".repeat(g.shields)}${"◇".repeat(3 - g.shields)}</span></div><div class="ag-ship">${ico("rocket")}</div><div class="ag-laser"></div><div class="ag-meteor">${g.checked && g.selected === g.questions[g.index][3] ? "✧" : "⬡"}</div><p>Jawab benar untuk menghancurkan meteor. Salah menjawab mengurangi satu perisai.</p></div>${quizPanel()}`;
  }
  function hangman() {
    const g = active,
      [word, clue] = g.word,
      status = C.wordStatus(word, g.guesses);
    return `<div class="ag-word-stage"><div class="ag-lanterns" aria-label="${6 - status.wrong} cahaya tersisa">${Array.from({ length: 6 }, (_, i) => `<span class="${i < 6 - status.wrong ? "lit" : ""}">${ico("bulb")}</span>`).join("")}</div><p class="ag-kicker">${6 - status.wrong} KESEMPATAN SALAH TERSISA</p><h3>${escape(clue)}</h3><div class="ag-word">${[...word].map((c) => `<span>${g.guesses.includes(c) || status.lost ? c : "_"}</span>`).join("")}</div><div class="ag-keyboard">${[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((c) => button("guess", c, g.guesses.includes(c) ? (word.includes(c) ? "correct" : "wrong") : "", `data-letter="${c}" ${g.guesses.includes(c) || status.won || status.lost ? "disabled" : ""}`)).join("")}</div><p class="ag-help">Klik huruf atau gunakan keyboard A–Z. Huruf yang sama tidak mengurangi kesempatan lagi.</p>${status.won || status.lost ? `<div class="ag-feedback ${status.won ? "good" : "bad"}" role="status"><strong>${status.won ? "Lentera berhasil diselamatkan!" : "Cahaya padam, pengetahuan bertambah."}</strong><p>Jawabannya: <b>${word}</b>. ${clue}</p></div>${button("finish", "Lihat hasil →")}` : ""}</div>`;
  }
  function anagram() {
    const g = active,
      [word, clue] = g.words[g.index];
    return `<div class="ag-word-stage"><span class="ag-kicker">KATA ${g.index + 1} / 5</span><h3>${escape(clue)}</h3><div class="ag-word ag-answer-slots" aria-label="Susunan jawaban">${Array.from({ length: word.length }, (_, i) => (g.used[i] !== undefined ? button("untile", g.tiles[g.used[i]], "", `data-index="${i}" aria-label="Hapus huruf ${g.tiles[g.used[i]]} posisi ${i + 1}" ${g.checked ? "disabled" : ""}`) : "<span>·</span>")).join("")}</div><div class="ag-tiles">${g.tiles.map((c, i) => button("tile", c, "", `data-index="${i}" ${g.used.includes(i) || g.checked ? "disabled" : ""}`)).join("")}</div><p class="ag-help">Pilih huruf secara berurutan. Klik huruf di jawaban untuk mengembalikannya.</p>${g.feedback ? `<div class="ag-feedback ${g.checked ? "good" : "bad"}" role="status">${escape(g.feedback)}</div>` : ""}<div class="ag-controls">${g.checked ? button("next-word", g.index === 4 ? "Lihat hasil →" : "Kata berikutnya →") : button("check-word", "Periksa susunan", "", g.used.length !== word.length ? "disabled" : "")}${!g.checked ? button("clear-word", "Kosongkan", "ghost") : ""}</div></div>`;
  }
  function crossword() {
    const g = active,
      cells = g.cells,
      rs = Object.values(cells).map((x) => x.r),
      cs = Object.values(cells).map((x) => x.c);
    let grid = "";
    for (let r = Math.min(...rs); r <= Math.max(...rs); r++)
      for (let c = Math.min(...cs); c <= Math.max(...cs); c++) {
        const key = r + "," + c,
          cell = cells[key];
        grid += cell
          ? `<label class="ag-cross-cell ${g.errors.includes(key) ? "invalid" : ""}">${cell.n ? `<small>${cell.n}</small>` : ""}<input data-cell="${key}" aria-label="Baris ${r - 2}, kolom ${c}, ${cell.n ? "awal petunjuk " + cell.n : ""}" maxlength="1" pattern="[A-Za-z]" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${escape(g.values[key] || "")}" ${g.finished ? "disabled" : ""}></label>`
          : '<div class="ag-cross-block" aria-hidden="true"></div>';
      }
    return `<div class="ag-two-col"><section><div class="ag-controls">${button("direction", "Arah: " + (g.direction === "across" ? "mendatar →" : "menurun ↓"), "ghost")}</div><div class="ag-crossword" style="--cols:${Math.max(...cs) - Math.min(...cs) + 1}">${grid}</div><p class="ag-help">Klik kotak lalu ketik satu huruf. Gunakan tombol arah di atas untuk berpindah otomatis. Huruf pada persilangan dipakai bersama.</p></section><section class="ag-clues">${[
      "across",
      "down",
    ]
      .map(
        (dir) =>
          `<h3>${dir === "across" ? "Mendatar →" : "Menurun ↓"}</h3>${D.crossword
            .filter((w) => w.dir === dir)
            .map(
              (w) =>
                `<p><b>${w.n}.</b> ${escape(w.clue)} <small>(${w.word.length} huruf)</small></p>`,
            )
            .join("")}`,
      )
      .join(
        "",
      )}${g.feedback ? `<div class="ag-feedback" role="status">${escape(g.feedback)}</div>` : ""}${button("check-cross", "Periksa TTS")}${button("reveal-cross", "Tampilkan jawaban", "ghost")}<p class="ag-help">TTS benar: 100 poin. Jika membuka jawaban: 0 poin.</p></section></div>`;
  }
  function results() {
    const g = active;
    remember();
    let title = "Satu permainan, pengetahuan baru.",
      detail = "";
    if (g.id === "duel" || g.id === "ular") {
      const a = g.id === "ular" ? g.positions : g.points;
      title =
        a[0] === a[1]
          ? "Pertandingan berakhir seri!"
          : `Pemain ${a[0] > a[1] ? 1 : 2} menang!`;
      detail =
        g.id === "ular"
          ? `Posisi akhir: P1 di ${a[0]}, P2 di ${a[1]}.`
          : `Tarikan benar: P1 ${a[0]}, P2 ${a[1]}.`;
    } else if (g.id === "space") {
      title = g.shields
        ? "Misi armada selesai!"
        : "Perisai habis. Siap belajar lagi?";
      detail = `${g.score / 10} meteor dihancurkan.`;
    } else if (g.id === "hangman")
      detail = `Kata hari ini: ${g.word[0]}. ${g.word[1]}`;
    else if (g.id === "tts")
      detail = g.revealed
        ? "Jawaban ditampilkan untuk dipelajari."
        : "Semua persilangan terisi dengan tepat.";
    else detail = "Pelajari pembahasan dan coba tantangan berikutnya.";
    return `<div class="ag-result"><span class="ag-kicker">PERMAINAN SELESAI</span><div class="ag-medal">${ico("target")}</div><h2>${title}</h2><div class="ag-result-score">${g.score}<small> poin${["duel", "ular"].includes(g.id) ? " bersama" : ""}</small></div><p>${escape(detail)}</p><p class="ag-help">${saveFailed ? "Penyimpanan browser tidak tersedia. Rekor hanya bertahan di sesi ini." : "Rekor lokal game ini: " + scores[g.id] + " poin. Tidak dikirim sebagai nilai ujian."}</p><div class="ag-controls">${button("confirm-restart", "Main lagi ↻")}${button("menu", "Pilih game lain", "ghost")}</div></div>${g.id === "tts" ? `<div class="ag-review"><h3>Jawaban TTS</h3>${D.crossword.map((w) => `<p>${w.n} ${w.dir === "across" ? "mendatar" : "menurun"}: <b>${w.word}</b> — ${w.clue}</p>`).join("")}</div>` : ""}${g.review.length ? `<div class="ag-review"><h3>Bekal dari permainanmu</h3>${g.review.map((r) => `<details><summary>${r.correct ? "✓" : "○"} ${escape(r.q[0] + ": " + r.q[1])}</summary><p>Jawabanmu: ${escape(r.q[2][r.answer])}. Jawaban tepat: <b>${escape(r.q[2][r.q[3]])}</b>.</p><p>${escape(r.q[4])}</p></details>`).join("")}</div>` : ""}`;
  }
  function render() {
    if (!root || !root.isConnected) return;
    root.innerHTML = `<div class="ag-app">${menu ? catalog() : header() + (active.finished ? results() : active.id === "hangman" ? hangman() : active.id === "anagram" ? anagram() : active.id === "tts" ? crossword() : active.id === "ular" ? board() : active.id === "duel" ? duel() : active.id === "space" ? space() : quizPanel())}</div>`;
  }
  function check() {
    const g = active;
    if (g.checked || g.selected === null) return;
    const q = g.questions[g.index],
      ok = g.selected === q[3];
    g.checked = true;
    g.review.push({ q, answer: g.selected, correct: ok });
    if (ok) g.score += 10;
    if (g.id === "space" && !ok) g.shields--;
    if (g.id === "duel" && ok) g.points[g.turn]++;
    if (g.id === "ular" && ok) {
      const old = g.positions[g.turn],
        m = C.move(old, g.die);
      g.positions[g.turn] = m.to;
      g.points[g.turn]++;
      g.feedback = `Pemain ${g.turn + 1}: ${old} → ${m.land}${m.land !== m.to ? (m.to > m.land ? " · naik tangga ke " : " · turun ular ke ") + m.to : ""}.`;
    }
    if (g.id === "ular" && !ok)
      g.feedback = "Pion tetap di tempat. Kesempatan berikutnya untuk lawan.";
  }
  function revealStart() {
    root?.scrollIntoView?.({ block: "start" });
    root?.focus?.({ preventScroll: true });
  }
  function finish() {
    active.finished = true;
    render();
    revealStart();
  }
  function handle(e) {
    const b = e.target.closest("[data-ag]");
    if (!b || !root.contains(b) || b.disabled) return;
    const a = b.dataset.ag,
      g = active;
    if (a === "start") {
      if (b.dataset.id === "ular" && onOpenSnake) {
        onOpenSnake();
        return;
      }
      if (g && !g.finished && g.id === b.dataset.id) {
        menu = false;
        render();
        revealStart();
        return;
      }
      newGame(b.dataset.id);
      return;
    }
    if (a === "filter") {
      filter = b.dataset.id;
      render();
      return;
    }
    if (a === "menu") {
      menu = true;
      confirmRestart = false;
      render();
      revealStart();
      return;
    }
    if (a === "resume") {
      menu = false;
      render();
      revealStart();
      return;
    }
    if (!g) return;
    if (a === "restart") {
      confirmRestart = true;
      render();
      return;
    }
    if (a === "cancel-restart") {
      confirmRestart = false;
      render();
      return;
    }
    if (a === "confirm-restart") {
      newGame(g.id);
      return;
    }
    if (g.finished) return;
    if (a === "answer" && !g.checked) {
      g.selected = Number(b.dataset.index);
    }
    if (a === "check") check();
    if (a === "next" && g.checked) {
      if (willFinish()) {
        finish();
        return;
      }
      g.index++;
      g.checked = false;
      g.selected = null;
      g.feedback = "";
      if (g.id === "duel" || g.id === "ular") g.turn = 1 - g.turn;
      if (g.id === "ular") g.die = null;
    }
    if (a === "roll" && !g.die) g.die = 1 + Math.floor(Math.random() * 6);
    if (a === "guess") {
      const status = C.wordStatus(g.word[0], g.guesses),
        c = b.dataset.letter;
      if (!status.won && !status.lost && !g.guesses.includes(c)) {
        g.guesses.push(c);
        const s = C.wordStatus(g.word[0], g.guesses);
        if (s.won) g.score = (6 - s.wrong) * 10 + 40;
      }
    }
    if (a === "finish") {
      finish();
      return;
    }
    if (a === "tile" && !g.checked) {
      const i = Number(b.dataset.index);
      if (!g.used.includes(i)) g.used.push(i);
      g.feedback = "";
    }
    if (a === "untile" && !g.checked) {
      g.used.splice(Number(b.dataset.index), 1);
      g.feedback = "";
    }
    if (a === "clear-word" && !g.checked) {
      g.used = [];
      g.feedback = "";
    }
    if (a === "check-word" && !g.checked) {
      if (g.used.length !== g.words[g.index][0].length) return;
      const right =
        g.used.map((i) => g.tiles[i]).join("") === g.words[g.index][0];
      if (right) {
        g.checked = true;
        const points = Math.max(5, 20 - g.mistakes * 5);
        g.score += points;
        g.feedback = `Tepat! ${g.words[g.index][0]} · +${points} poin.`;
      } else {
        g.mistakes++;
        g.feedback =
          "Susunannya belum tepat. Baca kembali petunjuk dan atur ulang hurufnya.";
      }
    }
    if (a === "next-word" && g.checked) {
      if (g.index === 4) {
        finish();
        return;
      }
      g.index++;
      g.tiles = C.scramble(g.words[g.index][0]);
      g.used = [];
      g.checked = false;
      g.feedback = "";
      g.mistakes = 0;
    }
    if (a === "direction")
      g.direction = g.direction === "across" ? "down" : "across";
    if (a === "check-cross") {
      g.errors = Object.keys(g.cells).filter(
        (k) => (g.values[k] || "") !== g.cells[k].letter,
      );
      if (!g.errors.length) {
        g.score = 100;
        finish();
        return;
      }
      g.feedback = `Masih ada ${g.errors.length} kotak kosong atau belum tepat. Kotak tersebut ditandai dengan garis merah.`;
    }
    if (a === "reveal-cross") {
      g.revealed = true;
      g.score = 0;
      finish();
      return;
    }
    render();
  }
  function input(e) {
    if (!active || active.id !== "tts" || !e.target.matches("[data-cell]"))
      return;
    const field = e.target,
      key = field.dataset.cell,
      value = field.value
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(-1);
    field.value = value;
    active.values[key] = value;
    field.parentElement.classList.remove("invalid");
    if (value) {
      const [r, c] = key.split(",").map(Number),
        next = active.direction === "down" ? `${r + 1},${c}` : `${r},${c + 1}`;
      root.querySelector(`[data-cell="${next}"]`)?.focus();
    }
  }
  function mount(container, items = [], options = {}) {
    onOpenSnake = options.onOpenSnake || null;
    if (root !== container) {
      root = container;
      root.addEventListener("click", handle);
      root.addEventListener("input", input);
      root.addEventListener("keydown", (e) => {
        if (
          e.target.matches("[data-cell]") &&
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
        ) {
          e.preventDefault();
          const [r, c] = e.target.dataset.cell.split(",").map(Number);
          const delta = {
            ArrowUp: [-1, 0],
            ArrowDown: [1, 0],
            ArrowLeft: [0, -1],
            ArrowRight: [0, 1],
          }[e.key];
          root
            .querySelector(`[data-cell="${r + delta[0]},${c + delta[1]}"]`)
            ?.focus();
        }
      });
    }
    external = items;
    render();
  }
  document.addEventListener("keydown", (e) => {
    if (
      !root ||
      root.hidden ||
      menu ||
      active?.id !== "hangman" ||
      active.finished ||
      e.ctrlKey ||
      e.altKey ||
      e.metaKey ||
      e.target.closest("input,textarea,select,dialog")
    )
      return;
    if (/^[a-z]$/i.test(e.key)) {
      const key = root.querySelector(`[data-letter="${e.key.toUpperCase()}"]`);
      if (key && !key.disabled) {
        e.preventDefault();
        key.click();
      }
    }
  });
  return { mount };
})();
