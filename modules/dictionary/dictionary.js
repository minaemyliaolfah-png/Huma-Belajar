window.HumaDictionary = (() => {
  "use strict";
  const Core = window.HumaDictionaryCore,
    corpus = window.HUMA_DICTIONARY_CORPUS;
  let menuClient = null;
  function signIn() {
    return `<section class="dk-form-panel"><span class="dk-overline">AKUN KAMUS</span><h2>Masuk kontributor / kurator</h2><p>Gunakan akun yang terdaftar pada kamus ini.</p><form id="dk-login-form">${field("username", "Nama pengguna")}${field("password", "Kata sandi", "", "password")}<button class="dk-button" type="submit" ${busy ? "disabled" : ""}>Masuk kamus →</button></form>${btn("contribute", "Belum punya akun? Daftar kontributor", "ghost")}</section>`;
  }
  const esc = (v) =>
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
  let activeView = false,
    requestSerial = 0;
  let root,
    context,
    userKey = "",
    tab = "words",
    query = "",
    letter = "",
    page = 1,
    verifiedOnly = false,
    language = "dayak",
    translationQuery = "",
    formTarget = null,
    message = "",
    error = "",
    busy = false,
    loaded = false,
    english = {},
    reviewId = null,
    peoplePage = 1;
  let remote = {
    contributors: [],
    profile: null,
    proposals: [],
    stats: { menunggu: 0, diterima: 0 },
    entries: [],
  };
  let local = { contributors: [], proposals: [], entries: [] };
  try {
    const v = JSON.parse(
      localStorage.getItem("huma-dictionary-demo") || "null",
    );
    if (
      v &&
      Array.isArray(v.contributors) &&
      Array.isArray(v.proposals) &&
      Array.isArray(v.entries)
    )
      local = v;
  } catch {}
  const btn = (action, label, cls = "", extra = "") =>
    `<button type="button" class="dk-button ${cls}" data-dk="${action}" ${extra}>${label}</button>`;
  const curator = () =>
    context?.user && ["Admin", "Kurator"].includes(context.user.role);
  const profile = () =>
    context?.demo
      ? local.contributors.find((c) => c.user_id === context.user?.id)
      : remote.profile;
  const proposals = () =>
    context?.demo
      ? local.proposals.filter(
          (p) => curator() || p.contributor_id === profile()?.id,
        )
      : remote.proposals;
  const contributors = () =>
    context?.demo ? local.contributors : remote.contributors;
  const entries = () =>
    Core.merge(
      corpus.entries,
      context?.demo
        ? [
            ...(window.HumaDictionaryDemo?.entries(local, corpus) || []),
            ...local.entries.map((e) => ({ ...e, demo: true })),
          ]
        : [...(context?.data || []), ...remote.entries],
    );
  const uid = (prefix) =>
    prefix +
    "-" +
    (globalThis.crypto?.randomUUID?.() ||
      Date.now() + "-" + Math.random().toString(36).slice(2));
  function persist() {
    try {
      localStorage.setItem("huma-dictionary-demo", JSON.stringify(local));
    } catch {
      message =
        "Penyimpanan browser tidak tersedia. Perubahan contoh hanya bertahan di sesi ini.";
    }
  }
  function updateLocalCounts() {
    local.contributors.forEach(
      (c) =>
        (c.diterima = local.proposals.filter(
          (p) => p.contributor_id === c.id && p.status === "Diterima",
        ).length),
    );
  }
  async function refresh() {
    if (context.demo) {
      loaded = true;
      render();
      return;
    }
    const requestKey = userKey,
      ticket = ++requestSerial;
    busy = true;
    error = "";
    render();
    try {
      const response = await context.api("getDictionaryState");
      if (requestKey !== userKey || ticket !== requestSerial) return;
      remote = response;
      loaded = true;
    } catch (e) {
      if (requestKey === userKey && ticket === requestSerial) error = e.message;
    } finally {
      if (requestKey === userKey && ticket === requestSerial) {
        busy = false;
        render();
      }
    }
  }
  function field(name, label, value = "", type = "text", required = true) {
    return `<label class="dk-field">${label}${required ? " *" : ""}${type === "textarea" ? `<textarea name="${name}" ${required ? "required" : ""} maxlength="2000">${esc(value)}</textarea>` : `<input name="${name}" type="${type}" value="${type === "password" ? "" : esc(value)}" ${required ? "required" : ""} ${type === "password" ? 'minlength="8" maxlength="128" autocomplete="new-password"' : 'maxlength="' + (name === "dayak" ? 120 : name === "nama" ? 80 : 2000) + '"'}>`}</label>`;
  }
  function sourceLink(e) {
    if (!curator()) return "";
    return e.halaman_pdf
      ? `<a href="assets/kamus-ngaju-indonesia.pdf#page=${Number(e.halaman_pdf)}" target="_blank" rel="noopener">Lihat rujukan ↗</a>`
      : "";
  }
  function status(e) {
    return `<span class="dk-badge ${e.status_verifikasi === "Terverifikasi" ? "verified" : ""}">${esc(e.status_verifikasi || "Belum ditinjau")}${e.demo && e.status_verifikasi === "Terverifikasi" ? " · contoh" : ""}</span>`;
  }
  function wordCard(e) {
    const person = contributors().find((c) => c.id === e.id_kontributor);
    return `<article class="dk-entry"><div class="dk-entry-head"><div><span class="dk-overline">DAYAK NGAJU</span><h3>${esc(e.dayak)}</h3></div>${status(e)}</div><div class="dk-meanings"><div><span>INDONESIA</span><p>${esc(e.indo)}</p></div><div><span>ENGLISH</span><p class="${e.inggris ? "" : "dk-empty-meaning"}">${esc(e.inggris || "Belum diisi")}</p>${e.status_inggris && e.status_inggris !== "Ditinjau kurator" ? '<small class="dk-english-note">Padanan bantu · perlu tinjauan</small>' : ""}</div></div><div class="dk-entry-foot"><span>${esc(e.kategori || "Umum")}${person ? " · " + esc(person.nama) : ""}</span>${btn("correct", "Usulkan koreksi", "ghost", `data-id="${esc(e.id)}"`)}</div>${curator() && e.kutipan ? `<details class="dk-excerpt"><summary>Catatan rujukan</summary><p>${esc(e.kutipan)}</p>${sourceLink(e)}<small>Periksa rujukan sebelum menerima koreksi.</small></details>` : ""}</article>`;
  }
  function wordList() {
    const all = Core.search(entries(), query, letter, verifiedOnly),
      max = Math.max(1, Math.ceil(all.length / 16));
    page = Math.min(page, max);
    return `<div class="dk-toolbar"><input id="dk-search" class="dk-search" type="search" aria-label="Cari kata atau arti" placeholder="Cari kata Ngaju, arti Indonesia, atau Inggris…" value="${esc(query)}"><label class="dk-check"><input id="dk-verified" type="checkbox" ${verifiedOnly ? "checked" : ""}> Hanya terverifikasi</label></div><div class="dk-alphabet" aria-label="Filter huruf awal">${["", ..."abcdefghijklmnopqrstuvwxyz"].map((l) => btn("letter", l.toUpperCase() || "Semua", letter === l ? "active" : "ghost", `data-letter="${l}" aria-pressed="${letter === l}"`)).join("")}</div><div class="dk-results-meta"><span>${all.length.toLocaleString("id-ID")} entri ditemukan</span><span>Halaman ${page} / ${max}</span></div><div class="dk-word-grid">${
      all
        .slice((page - 1) * 16, page * 16)
        .map(wordCard)
        .join("") ||
      '<div class="dk-empty"><h3>Entri belum ditemukan</h3><p>Coba kata kunci lain atau ajukan kosakata baru.</p></div>'
    }</div><div class="dk-pagination">${btn("prev", "← Sebelumnya", "ghost", page === 1 ? "disabled" : "")}<span>${page} / ${max}</span>${btn("next", "Berikutnya →", "ghost", page === max ? "disabled" : "")}</div>`;
  }
  function translate() {
    const matches = Core.lookup(entries(), translationQuery, language);
    return `<section class="dk-translator"><div><span class="dk-overline">JEMBATAN TIGA BAHASA</span><h2>Temukan padanan katanya.</h2><p>Terjemahan kata atau ungkapan dicari dari entri kamus. Arti yang sama bisa memiliki lebih dari satu padanan.</p></div><form id="dk-translate-form"><label class="dk-field">Bahasa asal<select id="dk-language" name="language"><option value="dayak" ${language === "dayak" ? "selected" : ""}>Dayak Ngaju</option><option value="indo" ${language === "indo" ? "selected" : ""}>Indonesia</option><option value="inggris" ${language === "inggris" ? "selected" : ""}>Inggris</option></select></label><label class="dk-field">Kata atau ungkapan<input name="word" required maxlength="150" placeholder="Contoh: abas" value="${esc(translationQuery)}"></label><button type="submit" class="dk-button">Cari padanan →</button></form></section>${translationQuery ? `<div class="dk-results-meta">${matches.length} padanan tepat untuk “${esc(translationQuery)}”</div>${matches.length ? matches.map((e) => `<section class="dk-translate-result">${wordCard(e)}${!e.inggris ? `<div class="dk-machine">${english[e.id] ? `<span class="dk-badge">TERJEMAHAN MESIN · BELUM DITINJAU</span><p>${esc(english[e.id])}</p>${btn("propose-english", "Usulkan hasil Inggris untuk ditinjau", "ghost", `data-id="${e.id}"`)}` : `<p>Padanan Inggris belum tersedia. Kontributor dapat mengisinya untuk ditinjau kurator.</p>${btn("machine", "Bantu terjemahkan arti Indonesia ke Inggris", "ghost", `data-id="${e.id}" ${busy ? "disabled" : ""}`)}`}</div>` : ""}</section>`).join("") : `<div class="dk-empty"><h3>Belum ada padanan tepat.</h3><p>Fitur ini mencari kata/ungkapan dalam kamus, bukan menerjemahkan kalimat bebas. Coba bentuk dasar atau tambah entri melalui Kontribusi.</p>${btn("contribute", "Usulkan kosakata baru")}</div>`}` : '<p class="dk-help">Cari padanan kata Ngaju, Indonesia, dan Inggris. Padanan bantu yang tersedia dapat diajukan untuk ditinjau atau dikoreksi bersama kurator.</p>'}`;
  }
  function people() {
    const list = contributors();
    const max = Math.max(1, Math.ceil(list.length / 12));
    peoplePage = Math.min(peoplePage, max);
    return `<div class="dk-section-heading"><div><h2>Kontributor kamus</h2><p>${list.length} profil yang ikut merawat kosakata.</p></div>${btn("contribute", profile() ? "Tambah kosakata +" : "Daftar kontributor →")}</div><div class="dk-people">${
      list
        .slice((peoplePage - 1) * 12, peoplePage * 12)
        .map(
          (c) =>
            `<article class="dk-person"><div class="dk-avatar">${esc(c.nama.slice(0, 1).toUpperCase())}</div><h3>${esc(c.nama)}</h3><p>${esc(c.bio || "Kontributor kosakata Dayak Ngaju.")}</p><span class="dk-badge verified">${Number(c.diterima) || 0} usulan diterima</span>${c.synthetic ? '<span class="dk-demo-label">Profil contoh</span>' : ""}</article>`,
        )
        .join("") ||
      '<div class="dk-empty"><h3>Jadilah kontributor pertama.</h3><p>Tambahkan arti, lengkapi padanan, atau bantu koreksi kosakata.</p></div>'
    }</div><div class="dk-pagination">${btn("people-prev", "← Sebelumnya", "ghost", peoplePage === 1 ? "disabled" : "")}<span>${peoplePage} / ${max}</span>${btn("people-next", "Berikutnya →", "ghost", peoplePage === max ? "disabled" : "")}</div>`;
  }
  function contribution() {
    const p = profile(),
      user = context.user;
    if (!p)
      return `<section class="dk-form-panel"><span class="dk-overline">TUMBUH BERSAMA</span><h2>${user ? "Aktifkan profil kontributor" : "Daftar sebagai kontributor"}</h2><p>Nama tampilan dan bio akan muncul pada daftar kontributor. Setiap usulan menunggu persetujuan kurator.</p>${!user && !context.demo ? `<p class="dk-help">Sudah punya akun Huma Belajar? ${btn("login", "Masuk akun", "ghost")}</p>` : ""}<form id="dk-register-form">${field("nama", "Nama tampilan", user?.nama || "")}${field("bio", "Bio singkat", "", "textarea", false)}${!user && !context.demo ? field("username", "Nama pengguna") + field("password", "Kata sandi (minimal 8 karakter)", "", "password") : ""}${context.demo ? '<div class="dk-warning">Mode contoh: pendaftaran dan usulan disimpan di browser perangkat ini. Tidak memerlukan kata sandi.</div>' : ""}<button class="dk-button" type="submit" ${busy ? "disabled" : ""}>${busy ? "Memproses…" : "Daftar kontributor →"}</button></form></section>`;
    const target = formTarget && entries().find((e) => e.id === formTarget.id),
      model = formTarget?.values || target || {};
    return `<section class="dk-form-panel"><span class="dk-overline">KONTRIBUSI ${esc(p.nama)}</span><h2>${target ? "Usulkan koreksi arti" : "Tambahkan kosakata"}</h2><p>${target ? "Tuliskan arti yang menurut Anda tepat, lalu sertakan alasan atau sumber. Entri yang tampil tetap menunggu keputusan kurator." : "Isi kata Dayak Ngaju beserta arti Indonesia. Bahasa Inggris boleh dilengkapi jika diketahui."}</p>${target ? `<div class="dk-before"><strong>Arti saat ini: ${esc(target.dayak)}</strong><p>Indonesia: ${esc(target.indo)}</p><p>Inggris: ${esc(target.inggris || "Belum diisi")}</p>${sourceLink(target)}</div>` : ""}<form id="dk-proposal-form">${field("dayak", "Kata / ungkapan Dayak Ngaju", model.dayak || "")}${field("indo", "Arti Indonesia", model.indo || "", "textarea")}${field("inggris", "Arti Inggris", model.inggris || "", "textarea", false)}${field("kategori", "Kategori / kelas kata", model.kategori || "Umum")}${field("alasan", "Alasan dan sumber (minimal 10 karakter)", model.alasan || "", "textarea")}<div class="dk-form-actions">${btn("new-word", target ? "Batal koreksi" : "Kosongkan", "ghost")}<button class="dk-button" type="submit" ${busy ? "disabled" : ""}>${busy ? "Mengirim…" : "Kirim ke kurator →"}</button></div></form></section>`;
  }
  function ownProposals() {
    return `<div class="dk-section-heading"><div><h2>Perjalanan kontribusimu</h2><p>Pantau keputusan kurator dan catatan perbaikannya.</p></div>${btn("contribute", "Tambah usulan +")}</div>${
      !context.user
        ? '<div class="dk-empty"><h3>Masuk untuk melihat usulanmu.</h3></div>'
        : proposals()
            .filter((p) => p.contributor_id === profile()?.id)
            .map(
              (p) =>
                `<article class="dk-proposal"><div class="dk-entry-head"><h3>${esc(p.dayak)}</h3><span class="dk-badge ${p.status === "Diterima" ? "verified" : ""}">${esc(p.status)}</span></div><small>${p.jenis} · ${new Date(p.diajukan).toLocaleDateString("id-ID")}</small><p>Indonesia: ${esc(p.indo)}</p><p>Inggris: ${esc(p.inggris || "Belum diisi")}</p>${p.catatan ? `<div class="dk-before">Catatan kurator: ${esc(p.catatan)}</div>` : ""}</article>`,
            )
            .join("") ||
          '<div class="dk-empty"><h3>Belum ada usulan.</h3><p>Mulai dengan menambahkan kata atau mengusulkan koreksi.</p></div>'
    }`;
  }
  function moderation() {
    if (tab === "signin") return signIn();
    if (!curator())
      return '<div class="dk-empty">Halaman ini khusus kurator dan guru.</div>';
    const list = proposals().filter((p) => p.status === "Menunggu");
    return `<div class="dk-section-heading"><div><h2>Meja kurasi</h2><p>Bandingkan arti, periksa sumber, lalu terima atau tolak usulan.</p></div><span class="dk-badge">${list.length} menunggu</span></div>${
      list
        .map((p) => {
          const before = entries().find((e) => e.id === p.target_id),
            contributor = contributors().find((c) => c.id === p.contributor_id);
          return `<article class="dk-review"><div class="dk-entry-head"><div><small>${esc(p.jenis)} · ${esc(contributor?.nama || "Kontributor")}</small><h3>${esc(p.dayak)}</h3></div><span class="dk-badge">Menunggu</span></div><div class="dk-compare"><div><span class="dk-overline">SAAT INI</span><p>${esc(before?.dayak || "Entri baru")}</p><p>Indonesia: ${esc(before?.indo || "—")}</p><p>Inggris: ${esc(before?.inggris || "Belum diisi")}</p>${before ? sourceLink(before) : ""}</div><div><span class="dk-overline">USULAN</span><p>${esc(p.dayak)}</p><p>Indonesia: ${esc(p.indo)}</p><p>Inggris: ${esc(p.inggris || "Belum diisi")}</p><p>Kategori: ${esc(p.kategori)}</p></div></div><div class="dk-before"><strong>Alasan / sumber kontributor</strong><p>${esc(p.alasan)}</p></div><form class="dk-review-form" data-id="${esc(p.id)}"><label class="dk-field">Catatan kurator (wajib jika menolak)<textarea name="note" maxlength="2000"></textarea></label><div class="dk-form-actions"><button class="dk-button danger" type="submit" name="decision" value="Ditolak" ${busy ? "disabled" : ""}>Tolak</button><button class="dk-button" type="submit" name="decision" value="Diterima" ${busy ? "disabled" : ""}>Terima & terbitkan ✓</button></div></form></article>`;
        })
        .join("") ||
      '<div class="dk-empty"><h3>Antrean sudah bersih.</h3><p>Usulan baru akan muncul di sini.</p></div>'
    }`;
  }
  function render() {
    if (!activeView || !root?.isConnected) return;
    const s = Core.stats(entries());
    const pending = context.demo
      ? local.proposals.filter((p) => p.status === "Menunggu").length
      : remote.stats.menunggu;
    const tabs = [
      ["words", "Daftar kata"],
      ["translate", "Terjemahkan"],
      ["people", "Kontributor"],
      ["contribute", "Kontribusi +"],
      ["mine", "Usulan saya"],
      ...(curator() ? [["review", "Kurasi"]] : []),
    ];
    if (tab === "review" && !curator()) tab = "words";
    root.innerHTML = `<div class="dk-app"><section class="dk-hero"><div><span class="dk-overline">WARISAN KATA, DIRAWAT BERSAMA</span><h1>Kamus Dayak Ngaju.<br>Jembatan tiga bahasa.</h1><p>Telusuri kata, temukan makna, dan bantu merawat bahasa kita.</p></div><div class="dk-hero-art" aria-hidden="true"><span>Ngaju</span><b>↔</b><span>Indonesia</span><b>↔</b><span>English</span></div></section><div class="dk-stats">${[
      [s.entries.toLocaleString("id-ID"), "Entri & subentri"],
      [s.words.toLocaleString("id-ID"), "Bentuk kata unik"],
      [s.english.toLocaleString("id-ID"), "Arti Inggris terisi"],
      [s.verified.toLocaleString("id-ID"), "Entri terverifikasi"],
      [contributors().length, "Kontributor"],
      [pending, "Usulan menunggu"],
    ]
      .map(([n, t]) => `<div><strong>${n}</strong><span>${t}</span></div>`)
      .join(
        "",
      )}</div><div class="dk-community"><div class="dk-community-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="7" r="3"/><path d="M2 21v-3c0-6 14-6 14 0v3M16 4c5 0 5 6 0 6m2 3c4 0 4 4 4 8"/></svg></div><div><strong>Satu kata dari kamu, pengetahuan untuk semua.</strong><p>Tambahkan kosakata, lengkapi arti Indonesia dan Inggris, lalu rawat ketepatannya bersama kurator.</p></div>${btn("contribute", "Ikut berkontribusi →", "ghost")}</div>${context.demo ? '<div class="dk-warning">Pratinjau komunitas: angka partisipasi dan profil pada mode ini menggunakan data contoh untuk mencoba alur kontribusi dan kurasi.</div>' : ""}${message ? `<div class="dk-alert good" role="status">${esc(message)}</div>` : ""}${error ? `<div class="dk-alert" role="alert">${esc(error)} ${btn("refresh", "Coba sambungkan lagi", "ghost")}</div>` : ""}${menuClient ? `<div class="dk-account">${context.user ? `${esc(context.user.nama)} · ${esc(context.user.role)} ${btn("menu-logout", "Keluar kamus", "ghost")}` : btn("menu-login", "Masuk kamus", "ghost")}</div>` : ""}<nav class="dk-tabs" aria-label="Menu kamus">${tabs.map(([id, title]) => btn("tab", title, tab === id ? "active" : "ghost", `data-tab="${id}" aria-pressed="${tab === id}"`)).join("")}</nav>${busy ? '<p class="dk-help" role="status">Menghubungi server…</p>' : ""}<section class="dk-content">${tab === "words" ? wordList() : tab === "translate" ? translate() : tab === "people" ? people() : tab === "contribute" ? contribution() : tab === "mine" ? ownProposals() : moderation()}</section><details class="dk-reference"><summary>Rujukan & lisensi</summary><p>Data rujukan: ${esc(corpus.source.attribution || "Anthony Suryanyahu dkk., 2013")}.</p><p><a href="https://repositori.kemendikdasmen.go.id/2897/" target="_blank" rel="noopener">Publikasi rujukan ↗</a> · <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener">CC BY-NC 4.0 ↗</a></p><p>Padanan Inggris dilengkapi melalui bantuan terjemahan dan tetap terbuka untuk tinjauan kurator.</p></details>${context.demo && !curator() ? `<p class="dk-help">Untuk mencoba alur kurasi: ${btn("demo-curator", "Coba sebagai kurator", "ghost")}</p>` : ""}</div>`;
  }
  function go(next) {
    tab = next;
    error = "";
    message = "";
    render();
    root.querySelector(".dk-tabs")?.scrollIntoView({ block: "start" });
  }
  async function click(e) {
    const b = e.target.closest("[data-dk]");
    if (!b || !root.contains(b) || b.disabled) return;
    const a = b.dataset.dk;
    if (a === "menu-login") {
      context.onLogin();
      return;
    }
    if (a === "menu-logout" && menuClient) {
      try {
        await menuClient.logout();
        context.user = null;
        tab = "words";
        userKey = "";
        mount(root, context);
      } catch (err) {
        error = err.message;
        render();
      }
      return;
    }
    if (a === "people-prev" || a === "people-next") {
      peoplePage += a === "people-next" ? 1 : -1;
      render();
      root
        .querySelector(".dk-section-heading")
        ?.scrollIntoView({ block: "start" });
      return;
    }
    if (a === "tab") {
      go(b.dataset.tab);
      return;
    }
    if (a === "letter") {
      letter = b.dataset.letter;
      page = 1;
      render();
      return;
    }
    if (a === "prev" || a === "next") {
      page += a === "next" ? 1 : -1;
      render();
      root.querySelector(".dk-toolbar")?.scrollIntoView({ block: "start" });
      return;
    }
    if (a === "refresh") {
      await refresh();
      return;
    }
    if (a === "login") {
      context.onLogin();
      return;
    }
    if (a === "contribute" || a === "new-word") {
      formTarget = null;
      go("contribute");
      return;
    }
    if (a === "demo-curator") {
      context.onDemoCurator();
      return;
    }
    if (a === "correct" || a === "propose-english") {
      const target = entries().find((x) => x.id === b.dataset.id);
      formTarget = {
        id: target.id,
        snapshot: { ...target },
        values: {
          ...target,
          ...(a === "propose-english"
            ? {
                inggris: english[target.id],
                alasan:
                  "Bantuan terjemahan mesin dari arti Indonesia; mohon periksa kecocokan makna.",
              }
            : {}),
        },
      };
      go("contribute");
      return;
    }
    if (a === "machine") {
      if (context.demo) {
        error =
          "Terjemahan mesin memerlukan backend Apps Script kamus yang terhubung. Anda tetap dapat mengisi usulan Inggris secara manual.";
        render();
        return;
      }
      if (!context.user) {
        context.onLogin();
        return;
      }
      busy = true;
      error = "";
      render();
      try {
        const r = await context.api("translateDictionaryEnglish", {
          id: b.dataset.id,
        });
        english[b.dataset.id] = r.text;
      } catch (err) {
        error = err.message;
      } finally {
        busy = false;
        render();
      }
    }
  }
  async function submit(e) {
    if (
      !root.contains(e.target) ||
      (![
        "dk-register-form",
        "dk-proposal-form",
        "dk-translate-form",
        "dk-login-form",
      ].includes(e.target.id) &&
        !e.target.matches(".dk-review-form"))
    )
      return;
    e.preventDefault();
    if (busy) return;
    const form = e.target,
      data = Object.fromEntries(new FormData(form));
    if (form.id === "dk-translate-form") {
      language = data.language;
      translationQuery = data.word.trim();
      error = "";
      render();
      return;
    }
    busy = true;
    error = "";
    message = "";
    const submitter = e.submitter?.value;
    const reviewTarget = form.dataset.id;
    const original = form.id;
    const targetSnapshot =
      formTarget &&
      (formTarget.snapshot || entries().find((x) => x.id === formTarget.id));
    try {
      if (original === "dk-login-form") {
        const result = await menuClient.login(data);
        context.onSignedIn(result);
        context.user = result.user;
        tab = ["Admin", "Kurator"].includes(result.user.role)
          ? "review"
          : "contribute";
        message = "Berhasil masuk ke kamus.";
        await refresh();
      } else if (original === "dk-register-form") {
        if (context.demo) {
          if (!context.user) {
            const user = {
              id: uid("DEMO-CONTRIB"),
              nama: data.nama,
              role: "Kontributor",
              kelas: "-",
            };
            context.onSignedIn({ user, token: "" });
            context.user = user;
          }
          if (!profile())
            local.contributors.push({
              id: uid("C"),
              user_id: context.user.id,
              nama: data.nama,
              bio: data.bio,
              diterima: 0,
              joined: new Date().toISOString(),
            });
          persist();
        } else if (context.user) {
          await context.api("joinContributor", data);
        } else {
          const r = await context.api("registerContributor", data);
          context.onSignedIn(r);
          context.user = r.user;
        }
        message =
          "Profil kontributor aktif. Anda dapat mengirim kosakata atau usulan koreksi.";
        if (!context.demo) await refresh();
      } else if (original === "dk-proposal-form") {
        if (data.alasan.trim().length < 10)
          throw new Error("Sertakan alasan atau sumber minimal 10 karakter.");
        const body = {
          ...data,
          jenis: targetSnapshot ? "Koreksi" : "Tambah",
          target_id: targetSnapshot?.id || "",
          base: targetSnapshot
            ? {
                dayak: targetSnapshot.dayak,
                indo: targetSnapshot.indo,
                inggris: targetSnapshot.inggris || "",
                kategori: targetSnapshot.kategori,
              }
            : null,
        };
        if (context.demo) {
          if (!profile())
            throw new Error("Daftar sebagai kontributor terlebih dahulu.");
          if (
            local.proposals.filter(
              (p) =>
                p.contributor_id === profile().id && p.status === "Menunggu",
            ).length >= 10
          )
            throw new Error("Maksimal 10 usulan menunggu.");
          local.proposals.push({
            ...body,
            id: uid("P"),
            contributor_id: profile().id,
            status: "Menunggu",
            diajukan: new Date().toISOString(),
            catatan: "",
            baseline: targetSnapshot
              ? JSON.stringify([
                  targetSnapshot.dayak,
                  targetSnapshot.indo,
                  targetSnapshot.inggris || "",
                  targetSnapshot.kategori,
                ])
              : "",
          });
          persist();
        } else await context.api("submitDictionaryProposal", body);
        formTarget = null;
        tab = "mine";
        message = "Usulan masuk antrean kurator. Arti kamus belum berubah.";
        if (!context.demo) await refresh();
      } else {
        if (!curator()) throw new Error("Akses kurator diperlukan.");
        if (!["Diterima", "Ditolak"].includes(submitter))
          throw new Error("Pilih keputusan kurator.");
        if (submitter === "Ditolak" && data.note.trim().length < 5)
          throw new Error("Sertakan alasan penolakan minimal lima karakter.");
        if (context.demo) {
          const p = local.proposals.find((p) => p.id === reviewTarget);
          if (!p || p.status !== "Menunggu")
            throw new Error("Usulan sudah ditinjau.");
          if (submitter === "Diterima") {
            const before = entries().find((x) => x.id === p.target_id);
            if (
              before &&
              p.baseline !==
                JSON.stringify([
                  before.dayak,
                  before.indo,
                  before.inggris || "",
                  before.kategori,
                ])
            )
              throw new Error("Entri telah berubah sejak usulan diajukan.");
            const entry = {
              ...before,
              id: before?.id || uid("K"),
              dayak: p.dayak,
              indo: p.indo,
              inggris: p.inggris,
              kategori: p.kategori,
              status_verifikasi: "Terverifikasi",
              status_inggris: p.inggris ? "Ditinjau kurator" : "Belum diisi",
              asal_inggris: p.inggris ? "Usulan kontributor" : "",
              id_kontributor: p.contributor_id,
              sumber: before?.sumber || "Kontribusi komunitas",
            };
            local.entries = local.entries.filter((x) => x.id !== entry.id);
            local.entries.push(entry);
          }
          p.status = submitter;
          p.catatan = data.note;
          p.ditinjau = new Date().toISOString();
          updateLocalCounts();
          persist();
        } else
          await context.api("reviewDictionaryProposal", {
            id: reviewTarget,
            decision: submitter,
            note: data.note,
          });
        message =
          submitter === "Diterima"
            ? "Usulan diterima dan entri kamus telah diperbarui."
            : "Usulan ditolak. Catatan tersedia pada Usulan saya.";
        if (!context.demo) await refresh();
      }
    } catch (err) {
      if (original === "dk-proposal-form")
        formTarget = {
          id: formTarget?.id || null,
          snapshot: targetSnapshot,
          values: data,
        };
      error = err.message;
    } finally {
      busy = false;
      render();
    }
  }
  function input(e) {
    if (e.target.id === "dk-search") {
      const position = e.target.selectionStart;
      query = e.target.value;
      page = 1;
      render();
      const input = root.querySelector("#dk-search");
      input.focus();
      input.setSelectionRange(position, position);
    }
    if (e.target.id === "dk-verified") {
      verifiedOnly = e.target.checked;
      page = 1;
      render();
    }
  }
  function mount(container, options) {
    activeView = true;
    const ownUrl = window.HUMA_CONFIG?.dictionaryApiUrl;
    if (ownUrl) {
      menuClient = window.HumaMenuAPI.create("kamus", ownUrl);
      options = {
        ...options,
        demo: false,
        user: menuClient.user,
        data: [],
        api: menuClient.api,
        onSignedIn(result) {
          menuClient.setSession(result);
          context.user = result.user;
          userKey = "live:" + result.user.id;
        },
        onLogin() {
          tab = "signin";
          error = "";
          message = "";
          render();
        },
      };
    }
    context = options;
    if (
      context.demo &&
      !local.participationVersion &&
      window.HumaDictionaryDemo
    ) {
      window.HumaDictionaryDemo.seed(local, corpus);
      updateLocalCounts();
      persist();
    }
    if (root !== container) {
      root = container;
      root.addEventListener("click", (e) => {
        if (e.target.closest("[data-dk]")) click(e);
      });
      root.addEventListener("submit", submit);
      root.addEventListener("input", input);
      root.addEventListener("change", (e) => {
        if (e.target.id === "dk-verified") input(e);
      });
    }
    const key =
      (context.demo ? "demo" : "live") + ":" + (context.user?.id || "guest");
    const changed = userKey !== key;
    userKey = key;
    if (changed) {
      busy = false;
      formTarget = null;
      message = "";
      error = "";
      remote = {
        contributors: [],
        profile: null,
        proposals: [],
        stats: { menunggu: 0, diterima: 0 },
        entries: [],
      };
    }
    render();
    if (changed && !context.demo) refresh();
  }
  return {
    mount,
    setActive(value) {
      activeView = value;
    },
  };
})();
