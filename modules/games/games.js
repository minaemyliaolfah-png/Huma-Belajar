/* Koleksi game lokal; ubah index.html di folder masing-masing untuk memperbarui game. */
window.HumaGames = (() => {
  "use strict";
  const games = [
    ["ular-tangga", "01-Ular-Tangga", "Ular Tangga", "MAJAS & PERIBAHASA", "Lempar dadu, jelajahi papan, dan taklukkan tantangan bahasa.", "mint", '<path d="M5 32V22h10V12h10V3h10M8 9l5-5m-5 0h5v5"/><circle cx="30" cy="26" r="7"/><path d="M28 24h.01m4 4h.01"/>'],
    ["balon-kata", "02-Balon-Kata", "Balon Kata", "TANTANGAN KOSAKATA", "Bermain dengan kata di arena balon yang penuh warna.", "peach", '<ellipse cx="14" cy="13" rx="9" ry="11"/><ellipse cx="31" cy="18" rx="7" ry="9"/><path d="m12 24 2-2 2 2m-2 0c-5 6 6 7 0 14m15-11 2-2 2 2m-2 0v10M10 8l2-2"/>'],
    ["pabrik-kata", "03-Pabrik-Kata", "Pabrik Kata", "ARENA ANAGRAM", "Rakit huruf menjadi kata dan hidupkan mesin pabrikmu.", "violet", '<rect x="2" y="5" width="17" height="18" rx="3"/><rect x="22" y="17" width="17" height="18" rx="3"/><path d="m6 18 4-9 4 9m-6-3h5m14 7h7l-7 8h7M3 31h13m-3-3 3 3-3 3"/>'],
    ["teka-teki-silang", "04-Teka-Teki-Silang", "Teka-Teki Silang", "TAMAN KATA", "Baca petunjuk dan isi setiap persilangan dengan kata yang tepat.", "blue", '<rect x="3" y="3" width="34" height="34" rx="4"/><path d="M14 3v34m12-34v34M3 14h34M3 26h34"/><path d="M15 15h10v10H15z" fill="currentColor" stroke="none"/>'],
    ["tarik-tambang", "05-Tarik-Tambang", "Tarik Tambang", "DUEL BAHASA", "Ajak teman beradu jawaban dan tarik tim menuju kemenangan.", "rose", '<circle cx="9" cy="8" r="4"/><circle cx="31" cy="8" r="4"/><path d="m3 36 5-16 7 4 5-6 5 6 7-4 5 16M9 12v8m22-8v8M2 19h36M18 16l4 6"/>'],
    ["galaksi-bahasa", "06-Galaksi-Bahasa", "Galaksi Bahasa", "MISI ANTARIKSA", "Jelajahi luar angkasa sambil menuntaskan misi Bahasa Indonesia.", "night", '<path d="m15 26-7-7C13 7 24 2 37 3c1 13-4 24-16 29l-6-6ZM8 19l-5 6 10 1m8 6 2 6 7-10M12 31l-8 6"/><circle cx="27" cy="13" r="4"/>'],
    ["millionaire-bahasa", "07-Millionaire-Bahasa", "Millionaire Bahasa", "KURSI PANAS LITERASI", "Taklukkan lima belas pertanyaan menuju hadiah virtual tertinggi.", "amber", '<path d="m20 2 6 12 13 2-10 9 2 13-11-6-11 6 2-13-10-9 13-2Z"/>'],
    ["family-100", "08-Family-100", "Family 100", "ADU KOMPAK ANTARTIM", "Tebak jawaban di papan dan kumpulkan poin bersama timmu.", "blue", '<rect x="3" y="7" width="34" height="27" rx="4"/><path d="M7 14h26M7 21h26M7 28h26M13 11v20"/>'],
    ["ranking-1", "09-Ranking-1", "Ranking 1", "BERTAHAN JADI JUARA", "Uji pengetahuanmu dan bertahan hingga babak terakhir.", "mint", '<path d="m4 13 8 7 8-14 8 14 8-7-4 22H8Zm5 16h22"/><circle cx="20" cy="4" r="2"/>'],
    ["jeopardy", "10-Jeopardy", "Jeopardy Bahasa", "PILIH KATEGORI & POIN", "Pilih petunjuk, jawab tantangan, dan atur strategi poin tim.", "violet", '<rect x="2" y="4" width="36" height="32" rx="3"/><path d="M14 4v32m12-32v32M2 15h36M2 26h36"/>'],
  ].map(([id,folder,title,tag,desc,color,shape])=>({id,folder,title,tag,desc,color,shape}));
  const icon = g => `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${g.shape}</svg>`;
  let current = "", mountedRoot = null;
  function setActive(active) {
    if (active) return;
    if (document.fullscreenElement?.id === "arcade-player") document.exitFullscreen?.().catch(() => {});
    // Unload on departure so hidden games cannot keep timers and sound running.
    if (current) mountedRoot?.querySelector("#arcade-player")?.remove();
    current = "";
    document.body.classList.remove("arcade-active");
  }
  function mount(root, { id = "", user = null } = {}) {
    const scores = window.HumaGameScores;
    scores.setUser(user);
    const g = games.find(g => g.id === id);
    if (g && current === g.id && root.querySelector("#arcade-frame")) return;
    setActive(false);
    mountedRoot = root;
    if (id === "klasemen") { scores.mountLeaderboard(root,games); return; }
    if (g && !scores.hasProfile()) {
      root.innerHTML = `<a class="text-link" href="#game">← Zona Game</a><section class="paper ag-profile-gate"><span class="ag-kicker">SEBELUM BERMAIN</span><h1>${g.title}</h1><p>Isi identitas untuk mencatat hasil permainan ke klasemen.</p>${scores.formHTML(true)}</section>`;
      scores.bindForm(root,()=>mount(root,{id,user}));
      return;
    }
    if (!g) {
      root.innerHTML = `<section class="ag-hero"><div><span class="ag-kicker">HUMA ARCADE / BAHASA INDONESIA</span><h1>Main, jelajahi,<br>temukan kata.</h1><p>Sepuluh arena untuk mengasah bahasa.<br>Pilih petualanganmu dan mulai bermain!</p><span class="ag-count">10 permainan interaktif</span></div><div class="ag-hero-art" aria-hidden="true"><span>A</span><span>Ba</span><span>✦</span></div></section><div class="ag-gallery-tools"><a class="button small" href="#game/klasemen">🏆 Klasemen online</a></div>${scores.formHTML()}<div class="ag-sync"><span data-game-sync role="status"></span><button type="button" class="text-link" data-game-retry>Kirim ulang</button></div><div class="ag-section"><h2>Pilih permainanmu</h2><p>Dari susun kata hingga misi antariksa.</p></div><div class="ag-grid">${games.map((game,i)=>`<article class="ag-card"><div class="ag-art ${game.color}"><span class="ag-number">${String(i+1).padStart(2,"0")}</span>${icon(game)}<span class="ag-spark" aria-hidden="true">✦</span></div><div class="ag-card-body"><span class="ag-kicker">${game.tag}</span><h3>${game.title}</h3><p>${game.desc}</p><a class="button small" href="#game/${game.id}">Main sekarang <span aria-hidden="true">→</span></a></div></article>`).join("")}</div>`;
      scores.bindForm(root); scores.bindSync(root);
      document.title = "Zona Game — Huma Belajar";
      return;
    }
    current = g.id;
    document.body.classList.add("arcade-active");
    root.innerHTML = `<section id="arcade-player" aria-label="${g.title}"><div class="ag-player-bar"><a class="text-link" href="#game">← Zona Game</a><strong>${g.title}</strong><a class="text-link ag-online-rank" href="#game/klasemen">Klasemen</a><button class="button small light" type="button" id="arcade-fullscreen">Layar penuh ⛶</button></div><div class="ag-player-sync"><span data-game-sync role="status"></span><button type="button" class="text-link" data-game-retry>Kirim ulang</button></div><iframe id="arcade-frame" data-game="${g.id}" title="${g.title} — Bahasa Indonesia" src="modules/games/${g.folder}/index.html?v=20261103-scores" allow="fullscreen; autoplay" allowfullscreen></iframe></section>`;
    scores.bindSync(root);
    root.querySelector("#arcade-fullscreen").onclick = async () => {
      const panel = root.querySelector("#arcade-player");
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await panel.requestFullscreen();
      } catch { root.querySelector("#arcade-fullscreen").textContent = "Gunakan layar penuh browser"; }
    };
    document.title = `${g.title} — Huma Belajar`;
  }
  return { mount, setActive };
})();
