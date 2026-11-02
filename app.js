"use strict";
const $ = (s, root = document) => root.querySelector(s);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const attr = esc;
const store = {
  get(k, f = null) {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? f;
    } catch {
      return f;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      toast(
        "Penyimpanan browser tidak tersedia. Progres contoh hanya bertahan selama halaman ini terbuka.",
      );
    }
  },
};
const demo = !window.HUMA_CONFIG.apiUrl;
let session;
try {
  session = JSON.parse(sessionStorage.getItem("huma-session") || "null");
} catch {
  session = null;
}
if (session?.demo !== demo) session = null;
const state = {
  data: {
    bab: [],
    subbab: [],
    kamus: [],
    tka: [],
    game: [],
    progress: [],
    rekap_progress: [],
    users: [],
  },
  user: session?.user || null,
  token: session?.token || "",
  kelas: store.get("huma-class", ""),
  query: "",
  adminType: "Bab",
  loading: true,
  error: "",
  quiz: null,
  game: null,
};
const icons = {
  video:
    '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m10 8 6 4-6 4Z"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  book: '<path d="M12 5c-3-2-7-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-7-1-10 1Zm0 0v15"/>',
  test: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 10h6m-6 4h6m-6 4h3"/>',
  game: '<path d="M7 7h10c3 0 5 9 4 11s-3 1-6-2H9c-3 3-5 4-6 2S4 7 7 7Z"/><path d="M7 10v5m-2-2.5h4m7-1.5h.01m2 3h.01"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7h14M5 17h14"/>',
  chart: '<path d="M4 3v18h17M8 16v-5m5 5V7m5 9V4"/>',
  leaf: '<path d="M5 20C2 8 10 3 21 3c0 12-6 18-16 17Zm0 0L16 8M9 15h7M13 11V6"/>',
  pen: '<path d="m5 16-2 5 5-2L21 6l-5-5L3 14m10-10 5 5M3 21l5-2"/>',
  story: '<path d="M5 3h14v18H5zM8 7h8m-8 4h8m-8 4h5"/>',
  users:
    '<circle cx="9" cy="8" r="3"/><path d="M2 21v-3c0-5 14-5 14 0v3M16 5c5 0 5 6 0 6m2 3c4 0 4 4 4 7"/>',
};
function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.book}</svg>`;
}
const pages = [
  ["beranda", "Beranda", "home"],
  ["materi", "Materi Belajar", "book"],
  ["tka", "Latihan TKA", "test"],
  ["game", "Zona Game", "game"],
  ["kamus", "Kamus 3 Bahasa", "globe"],
  ["karya", "Karya Siswa", "pen"],
  ["progres", "Progres Saya", "chart"],
];
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ($("#toast").hidden = true), 5000);
}
function safeURL(value) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" ? u.href : "";
  } catch {
    return "";
  }
}
function driveFileId(value) {
  const safe = safeURL(value);
  if (!safe) return "";
  const url = new URL(safe);
  if (url.hostname !== "drive.google.com") return "";
  const id =
    url.pathname.match(/\/file\/d\/([\w-]+)/)?.[1] ||
    url.searchParams.get("id") ||
    "";
  return /^[\w-]+$/.test(id) ? id : "";
}
function materialImageURL(value) {
  const id = driveFileId(value);
  return id
    ? "https://drive.google.com/thumbnail?id=" + id + "&sz=w1600"
    : safeURL(value);
}
function embedURL(value) {
  const url = safeURL(value);
  if (!url) return "";
  const u = new URL(url);
  let id = "";
  if (
    [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "youtube-nocookie.com",
      "www.youtube-nocookie.com",
    ].includes(u.hostname)
  ) {
    id =
      u.searchParams.get("v") ||
      u.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] ||
      "";
  }
  if (u.hostname === "youtu.be") id = u.pathname.slice(1);
  if (/^[\w-]{11}$/.test(id))
    return "https://www.youtube-nocookie.com/embed/" + id;
  const driveId = driveFileId(url);
  if (driveId) return "https://drive.google.com/file/d/" + driveId + "/preview";
  if (u.hostname === "docs.google.com" && u.pathname.startsWith("/forms/")) {
    if (u.pathname.endsWith("/viewform"))
      u.searchParams.set("embedded", "true");
    return u.href;
  }
  if (
    u.hostname === "docs.google.com" &&
    !u.pathname.includes("/d/e/") &&
    !/\/pub(?:html)?$/.test(u.pathname)
  ) {
    const document = u.pathname.match(
      /^\/(document|presentation|spreadsheets)\/d\/([\w-]+)(?:\/|$)/,
    );
    if (document) {
      if (u.searchParams.get("rtpof") === "true")
        return "https://drive.google.com/file/d/" + document[2] + "/preview";
      return (
        "https://docs.google.com/" +
        document[1] +
        "/d/" +
        document[2] +
        (document[1] === "presentation" ? "/embed" : "/preview")
      );
    }
  }
  return url;
}
function remember() {
  try {
    if (state.user)
      sessionStorage.setItem(
        "huma-session",
        JSON.stringify({ user: state.user, token: state.token, demo }),
      );
    else sessionStorage.removeItem("huma-session");
  } catch {}
}
async function api(action, payload = {}) {
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(window.HUMA_CONFIG.apiUrl, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, token: state.token, ...payload }),
      signal: controller.signal,
    });
    if (!res.ok)
      throw new Error("Server belum dapat dihubungi. Coba beberapa saat lagi.");
    let json;
    try {
      json = await res.json();
    } catch {
      throw new Error(
        "Respons server tidak valid. Periksa deployment Apps Script.",
      );
    }
    if (json.status !== "success") {
      if (json.code === "AUTH") {
        state.user = null;
        state.token = "";
        remember();
        state.data.progress = [];
        state.data.rekap_progress = [];
        state.data.users = [];
        shell();
      }
      throw new Error(json.message || "Permintaan belum berhasil.");
    }
    return json;
  } catch (error) {
    if (error.name === "AbortError")
      throw new Error(
        "Server terlalu lama merespons. Periksa koneksi lalu coba lagi.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
async function load() {
  state.loading = true;
  state.error = "";
  render();
  try {
    if (demo) {
      state.data = structuredClone(window.HUMA_DEMO);
      const saved = state.user
        ? store.get("huma-demo-progress-" + state.user.id, [])
        : [];
      state.data.progress = Array.isArray(saved)
        ? saved.filter((id) => typeof id === "string")
        : [];
    } else {
      const result = await api("getDataApp");
      state.data = result.data;
      if (state.user) {
        state.user = result.user;
        remember();
      }
    }
  } catch (e) {
    state.error = e.message;
  } finally {
    state.loading = false;
    shell();
    render();
  }
}
function route() {
  const parts = location.hash.slice(1).split("/");
  let id = "";
  try {
    id = decodeURIComponent(parts[1] || "");
  } catch {}
  return {
    page: parts[0] || "beranda",
    id,
    section: [
      "materi",
      "mpi",
      "rangkuman",
      "unduh",
      "latihan",
    ].includes(parts[2])
      ? parts[2]
      : "materi",
  };
}
let sidebarCollapsed = store.get("huma-sidebar-collapsed", false) === true;
function syncSidebar() {
  $("#sidebar").classList.toggle("is-collapsed", sidebarCollapsed);
  const button = $("#sidebar-toggle");
  button.ariaExpanded = String(!sidebarCollapsed);
  button.ariaLabel = sidebarCollapsed ? "Buka sidebar" : "Kecilkan sidebar";
  button.title = button.ariaLabel;
  button.textContent = sidebarCollapsed ? "›" : "‹";
}
$("#sidebar-toggle").addEventListener("click", () => {
  sidebarCollapsed = !sidebarCollapsed;
  syncSidebar();
  try {
    localStorage.setItem(
      "huma-sidebar-collapsed",
      JSON.stringify(sidebarCollapsed),
    );
  } catch {
    // Sidebar tetap dapat digunakan ketika penyimpanan browser dibatasi.
  }
});
function shell() {
  syncSidebar();
  document.querySelector("#school-name").textContent =
    window.HUMA_CONFIG.schoolName || "Bahasa Indonesia · SMA / MA";
  const current = route().page;
  $("#nav").innerHTML = [
    ...pages,
    ...(state.user?.role === "Admin" ? [["guru", "Panel Guru", "users"]] : []),
  ]
    .map(
      ([id, label, ico]) =>
        `<a href="#${id}" aria-label="${label}" title="${label}" class="nav-link ${current === id || (current === "ular-tangga" && id === "game") || (["bab", "belajar"].includes(current) && id === "materi") ? "active" : ""}" ${current === id ? 'aria-current="page"' : ""}>${icon(ico)}<span>${label}</span></a>`,
    )
    .join("");
  $("#auth").textContent = state.user
    ? state.user.nama.split(" ")[0] + " · Keluar"
    : "Masuk akun ↗";
  const ownMenu =
    (current === "kamus" && window.HUMA_CONFIG.dictionaryApiUrl) ||
    (current === "karya" && window.HUMA_CONFIG.worksApiUrl);
  $("#connection").textContent = ownMenu
    ? "Database menu aktif"
    : demo
      ? "Mode contoh"
      : state.error
        ? "Belum terhubung"
        : "Terhubung ke kelas";
  $("#connection").classList.toggle(
    "live",
    !!ownMenu || (!demo && !state.error),
  );
  $("#notice").hidden =
    current === "ular-tangga" ||
    !!ownMenu ||
    (!demo && !state.error) ||
    (current === "kamus" && demo && !state.error);
  $("#notice").classList.toggle("error", !!state.error);
  $("#notice").textContent = state.error
    ? state.error
    : "Anda sedang menjelajahi mode contoh. Materi dan progres di sini belum terhubung ke kelas Anda.";
  const title =
    pages.find((p) => p[0] === current)?.[1] ||
    {
      bab: "Daftar Subbab",
      belajar: "Ruang Belajar",
      guru: "Panel Guru",
      latihan: "Latihan Membaca",
      bermain: "Kata Baku",
      "ular-tangga": "Petualangan Kata",
    }[current] ||
    "Beranda";
  $("#breadcrumb").innerHTML = `Ruang belajar / <b>${title}</b>`;
}
function normalizeClass(value) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  const match = /^(?:kelas\s*)?(XII|XI|X|12|11|10)$/i.exec(text);
  if (match) return "Kelas " + ({ 10: "X", 11: "XI", 12: "XII" }[match[1]] || match[1].toUpperCase());
  return /^semua\s+kelas$/i.test(text) ? "Semua Kelas" : text;
}
function availableClasses() {
  const classes = [...new Set(state.data.bab.map((b) => normalizeClass(b.kelas)))]
    .filter((v) => v && v !== "Semua Kelas");
  if (!classes.length && state.data.bab.some((b) => normalizeClass(b.kelas) === "Semua Kelas"))
    classes.push(state.user?.role === "Siswa" && normalizeClass(state.user.kelas) || "Semua Kelas");
  return classes.sort((a, b) => a.localeCompare(b, "id", { numeric: true }));
}
function syncClassSelection() {
  const classes = availableClasses();
  const selected = normalizeClass(state.kelas);
  state.kelas = classes.includes(selected) ? selected :
    classes.includes(normalizeClass(state.user?.kelas)) ? normalizeClass(state.user.kelas) : classes[0] || "";
  return classes;
}
function classSelect() {
  const classes = syncClassSelection();
  if (!classes.length) return '<select class="class-select" id="class-select" aria-label="Pilih kelas" disabled><option>Belum ada kelas</option></select>';
  return `<select class="class-select" id="class-select" aria-label="Pilih kelas">${classes
    .map(
      (k) =>
        `<option ${state.kelas === k ? "selected" : ""}>${esc(k)}</option>`,
    )
    .join("")}</select>`;
}
function classBabs() {
  syncClassSelection();
  return state.data.bab.filter(
    (b) => normalizeClass(b.kelas) === state.kelas || normalizeClass(b.kelas) === "Semua Kelas",
  );
}
function subsFor(id) {
  return state.data.subbab.filter((s) => s.id_bab === id);
}
function summary(babs = classBabs()) {
  const ids = new Set(babs.map((b) => b.id_bab));
  const list = state.data.subbab.filter((s) => ids.has(s.id_bab));
  const done = list.filter((s) =>
    state.data.progress.includes(s.id_subbab),
  ).length;
  return {
    total: list.length,
    done,
    pct: list.length ? Math.round((done / list.length) * 100) : 0,
  };
}
function heading(kicker, title, subtitle) {
  return `<div class="page-heading"><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${subtitle}</p></div>`;
}
function empty(title, desc, action = "") {
  return `<div class="empty"><h3>${title}</h3><p>${desc}</p>${action}</div>`;
}
function courseCard(b, index) {
  const s = summary([b]);
  const cover = chapterThumbnail(b);
  return `<article class="course"><a class="course-art chapter-art ${["", "peach", "lilac"][index % 3]}" href="#bab/${encodeURIComponent(b.id_bab)}" aria-label="Buka ${attr(b.nama)}"><span class="tag">${esc(normalizeClass(b.kelas))}</span>${icon(["leaf", "pen", "story"][index % 3])}${cover ? `<img class="chapter-thumbnail" src="${attr(cover)}" alt="" loading="lazy" decoding="async">` : ""}<span class="number">${String(index + 1).padStart(2, "0")}</span></a><div class="course-body"><div class="eyebrow">BAHASA INDONESIA · BAB ${String(index + 1).padStart(2, "0")}</div><h3><a href="#bab/${encodeURIComponent(b.id_bab)}">${esc(b.nama)}</a></h3><p>${esc(b.deskripsi)}</p><div class="course-meta"><span>${s.total} subbab</span><span>${s.done}/${s.total} selesai</span></div><div class="track" role="progressbar" aria-label="Progres ${attr(b.nama)}" aria-valuenow="${s.pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${s.pct}%"></span></div><div class="course-bottom"><span>${s.pct === 100 && s.total ? "✓ Tuntas" : "Belajar sesuai ritmemu"}</span><a href="#bab/${encodeURIComponent(b.id_bab)}">${s.done ? "Lanjutkan" : "Mulai belajar"} ↗</a></div></div></article>`;
}
function chapterThumbnail(chapter) {
  if (!chapter?.id_bab) return "";
  const value = window.HUMA_CONFIG.chapterThumbnails?.[chapter.id_bab] ||
    "assets/bab/" + encodeURIComponent(chapter.id_bab) + ".jpg";
  if (typeof value !== "string") return "";
  if (value.startsWith("assets/") && !/[\\?#]/.test(value)) {
    try {
      if (!decodeURIComponent(value).split("/").some((part) => part === ".." || part === ".")) return value;
    } catch {}
    return "";
  }
  return safeURL(value);
}
function home() {
  const prog = summary(),
    babs = classBabs();
  return `<div class="greeting"><div><h1>Halo, ${state.user ? esc(state.user.nama.split(" ")[0]) : "Sahabat Huma"} <span aria-hidden="true">☀</span></h1><p>Hari yang baik untuk belajar hal baru. Yuk, mulai!</p></div>${classSelect()}</div><section class="hero"><div class="hero-copy"><div class="eyebrow">RUANG BELAJAR BAHASA INDONESIA</div><h1>Belajar lebih dekat.<br><em>Melangkah lebih hebat.</em></h1><p>Dari memahami cerita hingga berani berkarya. Temukan cara belajarmu, satu langkah setiap hari.</p><div class="hero-actions"><a href="#materi" class="button">Jelajahi materi <span>↗</span></a><a href="#tka" class="text-link">Coba latihan TKA <span>→</span></a></div></div><img src="assets/learning.svg" alt="Ilustrasi buku dan layar belajar dengan tanda pencapaian"></section><section class="stats" aria-label="Ringkasan ruang belajar"><div class="stat"><span class="stat-icon">${icon("book")}</span><div><strong>${babs.length}<small>bab</small></strong><p>Materi untuk ${esc(state.kelas)}</p></div></div><div class="stat"><span class="stat-icon">${icon("test")}</span><div><strong>${prog.total}<small>subbab</small></strong><p>Siap untuk kamu jelajahi</p></div></div><div class="stat"><span class="stat-icon">${icon("chart")}</span><div><strong>${prog.done}<small>selesai</small></strong><p>Langkah kecil yang berarti</p></div></div></section><div class="dashboard-grid"><div><div class="section-head"><div><h2>Mulai perjalanan belajarmu</h2><p>Materi pilihan untuk ${esc(state.kelas)}</p></div><a class="text-link" href="#materi">Lihat semua →</a></div><div class="cards">${babs.slice(0, 2).map(courseCard).join("") || empty("Materi segera hadir", "Guru belum menambahkan materi untuk kelas ini.")}</div><div class="quick-grid">${[
    ["tka", "test", "Latihan TKA", "Asah pemahamanmu"],
    ["game", "game", "Belajar & bermain", "Tantang dirimu"],
    ["kamus", "globe", "Kamus 3 bahasa", "Jelajahi kata baru"],
  ]
    .map(
      ([r, i, t, d]) =>
        `<a href="#${r}" class="quick-card"><span class="stat-icon">${icon(i)}</span><div><strong>${t}</strong><p>${d}</p></div><span>↗</span></a>`,
    )
    .join(
      "",
    )}</div></div><aside class="dashboard-aside"><section class="side-card"><h3>Perjalanan belajarmu</h3><div class="progress-circle" style="--progress:${prog.pct}%"><div>${prog.pct}%<small>MATERI SELESAI</small></div></div><p>${state.user ? `${prog.done} dari ${prog.total} subbab sudah kamu pelajari.` : "Masuk untuk menyimpan setiap langkah belajarmu."}</p>${state.user ? '<a href="#progres" class="button light">Lihat progres saya →</a>' : '<button data-action="login" class="button light">Masuk & mulai belajar →</button>'}</section><section class="side-card challenge"><div class="eyebrow">✦ TANTANGAN KECIL</div><h3>“Aktivitas” atau<br>“aktifitas”?</h3><p>Yakin sudah tahu kata bakunya? Uji kepekaan bahasamu di Zona Game.</p><a class="text-link" href="#game">Terima tantangan →</a></section></aside></div>`;
}
function materials() {
  const q = state.query.toLowerCase();
  const list = classBabs().filter((b) =>
    (b.nama + " " + b.deskripsi).toLowerCase().includes(q),
  );
  return (
    heading(
      "SATU BAB, SATU LANGKAH BARU",
      "Materi belajar",
      "Pahami konsepnya, jelajahi medianya, lalu praktikkan.",
    ) +
    `<div class="toolbar">${classSelect()}<input class="search" id="search" type="search" placeholder="Cari bab atau topik…" aria-label="Cari materi" value="${attr(state.query)}"></div><div id="search-results" class="cards">${list.map(courseCard).join("") || empty("Materi tidak ditemukan", "Coba kata kunci atau kelas lainnya.")}</div>`
  );
}
function chapter(id) {
  const b = state.data.bab.find((b) => b.id_bab === id);
  if (!b)
    return empty(
      "Bab tidak ditemukan",
      "Materi mungkin telah diubah oleh guru.",
      '<a href="#materi" class="button">Kembali ke materi</a>',
    );
  const list = subsFor(id);
  return (
    `<a href="#materi" class="text-link">← Semua materi</a><br><br>` +
    heading(esc(b.kelas), esc(b.nama), esc(b.deskripsi)) +
    `<div class="lesson-layout"><section><div class="section-head"><h2>Langkah belajarmu</h2><span class="tag">${list.length} subbab</span></div><div class="lesson-list">${list.map((s, i) => `<a class="lesson-row" href="#belajar/${encodeURIComponent(s.id_subbab)}"><span class="step">${state.data.progress.includes(s.id_subbab) ? "✓" : String(i + 1).padStart(2, "0")}</span><div><strong>${esc(s.judul)}</strong><small>${state.data.progress.includes(s.id_subbab) ? "Sudah dipelajari" : "Baca, tonton, dan pahami"}</small></div><span>→</span></a>`).join("") || empty("Subbab belum tersedia", "Guru akan menambahkan materi di bab ini.")}</div></section><aside class="side-card"><div class="eyebrow">TEMAN BELAJARMU</div><h3>Pelan-pelan, yang penting paham.</h3><p style="text-align:left;margin-top:12px">Baca materi, catat hal penting, dan tandai selesai setelah kamu memahaminya.</p>${safeURL(b.pdf_bse) ? bookPreview(b) : '<p style="margin-top:16px">Buku BSE belum ditambahkan.</p>'}</aside></div>`
  );
}
const mediaTypes = [
  ["link_youtube", "Video pembelajaran"],
  ["link_pdf", "Berkas unduh materi (PDF / dokumen)"],
  ["link_mpi", "Media interaktif"],
  ["link_web", "Bacaan pendukung"],
  ["link_gambar", "Rangkuman gambar"],
  ["link_soal", "Latihan soal (Google Forms / web)"],
];
function bookPreview(chapter) {
  const url = safeURL(chapter?.pdf_bse);
  if (!url) return "";
  const id = driveFileId(url);
  const download = id
    ? "https://drive.google.com/uc?export=download&id=" + id
    : url;
  const cover = id
    ? `<span class="book-placeholder" aria-hidden="true">${icon("book")}<b>BUKU PENDAMPING</b></span><img class="book-thumbnail" src="https://drive.google.com/thumbnail?id=${attr(id)}&amp;sz=w480" alt="Sampul buku ${attr(chapter.nama)}" loading="lazy">`
    : `<iframe class="book-mini-view" src="${attr(embedURL(url))}" title="Pratinjau kecil buku ${attr(chapter.nama)}" loading="lazy" tabindex="-1" aria-hidden="true" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  return `<div class="book-card"><div class="eyebrow">BUKU PENDAMPING</div><a class="book-cover" href="${attr(url)}" target="_blank" rel="noopener noreferrer" aria-label="Buka buku ${attr(chapter.nama)}">${cover}<span class="book-cover-label">Lihat buku ↗</span></a><h3>${esc(chapter.nama)}</h3><p class="book-description">Baca sebagai pendamping materi pada bab ini.</p><div class="book-actions"><a class="button small light" href="${attr(url)}" target="_blank" rel="noopener noreferrer">Buka buku ↗</a><a class="text-link" href="${attr(download)}" target="_blank" rel="noopener noreferrer" download>Unduh ↓</a></div></div>`;
}
function inlineLessonMedia(item, key, label) {
  const url = safeURL(item[key]);
  if (!url) return "";
  const video = key === "link_youtube",
    image = key === "link_gambar",
    pdf = key === "link_pdf";
  const title = label + " — " + item.judul;
  const media = image
    ? `<a class="lesson-image-link" href="${attr(url)}" target="_blank" rel="noopener noreferrer"><img class="lesson-image" src="${attr(materialImageURL(url))}" alt="${attr(title)}" loading="lazy"><span class="lesson-image-fallback" hidden>Gambar belum dapat ditampilkan. Buka gambar asli ↗</span></a>`
    : `<iframe class="lesson-embed ${video ? "lesson-video" : pdf ? "lesson-pdf" : "lesson-interactive"}" src="${attr(embedURL(url))}" title="${attr(title)}" ${video ? "" : 'loading="lazy"'} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-downloads" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  return `<section class="lesson-media" aria-labelledby="media-${key}"><header class="lesson-media-head"><div class="lesson-media-label"><span class="lesson-media-icon">${icon(video ? "video" : image ? "pen" : "book")}</span><h2 id="media-${key}">${label}</h2></div><a class="text-link" href="${attr(url)}" target="_blank" rel="noopener noreferrer" aria-label="Buka ${attr(title)} di tab baru">Buka di tab baru ↗</a></header>${media}${!video && !image ? '<p class="lesson-embed-help">Jika pratinjau tidak tersedia, gunakan Buka di tab baru untuk mengakses materi.</p>' : ""}</section>`;
}
function materialDownloadURL(value) {
  const url = safeURL(value);
  if (!url) return "";
  const drive = driveFileId(url);
  if (drive) return "https://drive.google.com/uc?export=download&id=" + drive;
  const u = new URL(url),
    doc =
      u.hostname === "docs.google.com" &&
      u.pathname.match(/^\/document\/d\/([\w-]+)(?:\/|$)/);
  if (doc && doc[1] !== "e")
    return u.searchParams.get("rtpof") === "true"
      ? "https://drive.google.com/uc?export=download&id=" + doc[1]
      : "https://docs.google.com/document/d/" + doc[1] + "/export?format=pdf";
  return url;
}
const lessonSections = [
  ["materi", "Materi", "book"],
  ["mpi", "MPI", "game"],
  ["rangkuman", "Rangkuman", "pen"],
  ["unduh", "Unduh Materi", "story"],
  ["latihan", "Latihan Soal", "test"],
];
function lessonSectionContent(s, section) {
  if (section === "mpi")
    return safeURL(s.link_mpi)
      ? inlineLessonMedia(s, "link_mpi", "Media pembelajaran interaktif")
      : empty(
          "Media interaktif segera hadir",
          "Guru belum menambahkan MPI untuk subbab ini.",
        );
  if (section === "rangkuman")
    return safeURL(s.link_gambar)
      ? inlineLessonMedia(s, "link_gambar", "Rangkuman visual")
      : empty(
          "Rangkuman segera hadir",
          "Guru belum menambahkan rangkuman untuk subbab ini.",
        );
  if (section === "unduh")
    return safeURL(s.link_pdf)
      ? '<div class="lesson-download-bar"><div><strong>Berkas materi subbab</strong><p>Baca pratinjau atau simpan berkas untuk belajar kembali.</p></div><a class="button small" href="' +
          attr(materialDownloadURL(s.link_pdf)) +
          '" target="_blank" rel="noopener noreferrer" download>Unduh materi ↓</a></div>' +
          inlineLessonMedia(s, "link_pdf", "Pratinjau berkas materi")
      : empty(
          "Berkas belum tersedia",
          "Guru belum menambahkan berkas unduhan untuk subbab ini.",
        );
  if (section === "latihan")
    return window.HumaLessonPractice
      ? window.HumaLessonPractice.html(s, state.user?.id || "guest")
      : empty(
          "Latihan sedang disiapkan",
          "Guru belum menambahkan soal untuk subbab ini.",
        );
  const notes = window.HumaLessonMaterial
    ? window.HumaLessonMaterial.html(s)
    : s.isi
      ? '<section class="paper lesson-notes"><div class="prose">' +
        esc(s.isi) +
        "</div></section>"
      : "";
  const reading = safeURL(s.link_web)
    ? inlineLessonMedia(s, "link_web", "Bacaan pendukung")
    : "";
  const video = safeURL(s.link_youtube)
    ? inlineLessonMedia(s, "link_youtube", "Video pembelajaran")
    : "";
  return (
    video + notes + reading ||
    empty(
      "Bacaan materi sedang disiapkan",
      "Guru belum menambahkan video atau bacaan untuk subbab ini.",
    )
  );
}

function lesson(id) {
  const s = state.data.subbab.find((s) => s.id_subbab === id);
  if (!s)
    return empty(
      "Materi tidak ditemukan",
      "Kembali ke daftar untuk memilih materi.",
      '<a class="button" href="#materi">Daftar materi</a>',
    );
  const b = state.data.bab.find((b) => b.id_bab === s.id_bab),
    section = route().section,
    done = state.data.progress.includes(id);
  const navigation =
    '<nav class="lesson-tabs" aria-label="Bagian subbab">' +
    lessonSections
      .map(
        ([key, label, glyph]) =>
          '<a id="section-' +
          key +
          '" href="#belajar/' +
          encodeURIComponent(id) +
          "/" +
          key +
          '" class="lesson-tab ' +
          (section === key ? "active" : "") +
          '" ' +
          (section === key ? 'aria-current="page"' : "") +
          ">" +
          icon(glyph) +
          "<span>" +
          label +
          "</span></a>",
      )
      .join("") +
    "</nav>";
  const side =
    '<aside class="lesson-aside"><section class="side-card"><div class="eyebrow">PERJALANAN BELAJARMU</div><h3>Dalam bab ini</h3><div class="lesson-list">' +
    subsFor(s.id_bab)
      .map(
        (item) =>
          '<a class="resource" href="#belajar/' +
          encodeURIComponent(item.id_subbab) +
          '" ' +
          (item.id_subbab === id ? 'aria-current="page"' : "") +
          ">" +
          esc(item.judul) +
          " " +
          (state.data.progress.includes(item.id_subbab) ? "✓" : "→") +
          "</a>",
      )
      .join("") +
    "</div></section>" +
    (safeURL(b?.pdf_bse)
      ? '<section class="side-card">' + bookPreview(b) + "</section>"
      : "") +
    "</aside>";
  const completion =
    '<section class="lesson-completion"><div><strong>Selesai memahami materi?</strong><p>Tandai langkah belajarmu setelah membaca dan berlatih.</p></div><button class="button ' +
    (done ? "light" : "") +
    '" data-action="complete" data-id="' +
    attr(id) +
    '" ' +
    (done ? "disabled" : "") +
    ">" +
    (done
      ? "✓ Sudah selesai dipelajari"
      : state.user
        ? "Tandai selesai ✓"
        : "Masuk untuk menyimpan progres") +
    "</button></section>";
  return (
    '<a href="#bab/' +
    encodeURIComponent(s.id_bab) +
    '" class="text-link">← ' +
    esc(b?.nama || "Daftar subbab") +
    "</a><br><br>" +
    heading(
      esc(b?.kelas || "MATERI"),
      esc(s.judul),
      "Pahami materi, lihat rangkuman, lalu uji pemahamanmu.",
    ) +
    navigation +
    '<div class="lesson-layout lesson-study-layout"><article class="lesson-content" aria-label="' +
    lessonSections.find((t) => t[0] === section)[1] +
    '" aria-labelledby="section-' +
    section +
    '">' +
    lessonSectionContent(s, section) +
    completion +
    "</article>" +
    side +
    "</div>"
  );
}

function catalog(type) {
  const isGame = type === "game";
  const list = state.data[type].filter((x) =>
    (x.judul + " " + x.deskripsi)
      .toLowerCase()
      .includes(state.query.toLowerCase()),
  );
  return (
    heading(
      isGame ? "BELAJAR SAMBIL BERMAIN" : "BERLATIH, PAHAMI, ULANGI",
      isGame ? "Zona game" : "Latihan TKA",
      isGame
        ? "Setiap jawaban adalah kesempatan untuk belajar hal baru."
        : "Bangun kemampuan membaca dan penalaran Bahasa Indonesia.",
    ) +
    `<section class="feature-banner ${isGame ? "game-banner" : ""}"><div><span class="tag">${isGame ? "GAME BAWAAN" : "LATIHAN PEMANASAN · 5 SOAL"}</span><h2>${isGame ? "Pilih kata baku. Kumpulkan poin!" : "Mulai dari pemahaman bacaan"}</h2><p>${isGame ? "Lima tantangan singkat untuk mengasah pilihan katamu. Bisa dimainkan tanpa akun." : "Latihan mandiri dengan pembahasan. Ini contoh latihan literasi, bukan simulasi resmi TKA. Hasil latihan ini hanya ditampilkan di perangkat."}</p></div><button class="button" data-action="${isGame ? "start-game" : "start-quiz"}">${isGame ? "Main sekarang" : "Mulai latihan"} →</button></section><div class="section-head"><div><h2>${isGame ? "Game dari guru" : "Paket latihan dari guru"}</h2><p>${isGame ? "Permainan interaktif pilihan kelasmu." : "Buka paket yang telah disiapkan guru."}</p></div></div><div class="toolbar"><input id="search" class="search" type="search" aria-label="Cari ${isGame ? "game" : "latihan"}" placeholder="Cari ${isGame ? "game" : "paket latihan"}…" value="${attr(state.query)}"></div><div id="search-results" class="cards">${list.map((x, i) => `<article class="course"><div class="course-art ${isGame ? "lilac" : "peach"}">${icon(isGame ? "game" : "test")}<span class="number">${String(i + 1).padStart(2, "0")}</span></div><div class="course-body"><h3>${esc(x.judul)}</h3><p>${esc(x.deskripsi)}</p><button class="button small" data-action="catalog-media" data-id="${attr(x.id)}" data-kind="${type}">Buka ${isGame ? "game" : "latihan"} ↗</button></div></article>`).join("") || empty(isGame ? "Game pilihan segera hadir" : "Paket latihan belum ditambahkan", `Sambil menunggu, coba ${isGame ? "game kata baku" : "latihan pemanasan"} di atas.`)}</div>`
  );
}
function dictionary() {
  const list = state.data.kamus.filter((k) =>
    [k.dayak, k.indo, k.inggris, k.kategori]
      .join(" ")
      .toLowerCase()
      .includes(state.query.toLowerCase()),
  );
  return (
    heading(
      "AKAR BUDAYA, JENDELA DUNIA",
      "Satu kata, tiga bahasa",
      "Jelajahi kosakata Dayak, Indonesia, dan Inggris bersama.",
    ) +
    `<div class="toolbar"><input id="search" class="search" type="search" aria-label="Cari kosakata" placeholder="Cari kata dalam tiga bahasa…" value="${attr(state.query)}"><span class="tag">${list.length} kosakata</span></div><div id="search-results">${list.length ? `<div class="table-wrap"><table><thead><tr><th>DAYAK</th><th>INDONESIA</th><th>ENGLISH</th><th>KATEGORI</th></tr></thead><tbody>${list.map((k) => `<tr><td><strong>${esc(k.dayak)}</strong></td><td>${esc(k.indo)}</td><td>${esc(k.inggris)}</td><td><span class="tag">${esc(k.kategori)}</span></td></tr>`).join("")}</tbody></table></div>` : empty("Kata belum ditemukan", "Coba ejaan atau kata kunci yang lain.")}</div><p class="helper">Kosakata mengikuti isian guru. Ragam bahasa Dayak dapat berbeda antarwilayah; konfirmasikan penggunaan dengan pengajar setempat.</p>`
  );
}
function progress() {
  if (!state.user)
    return (
      heading(
        "SETIAP LANGKAH BERARTI",
        "Progres belajarmu",
        "Simpan perjalananmu dan lanjutkan dari tempat terakhir.",
      ) +
      empty(
        "Kenali pencapaianmu",
        "Masuk ke akun untuk melihat materi yang sudah kamu selesaikan.",
        '<button data-action="login" class="button">Masuk akun →</button>',
      )
    );
  const p = summary();
  return (
    heading(
      "SETIAP LANGKAH BERARTI",
      "Lihat seberapa jauh kamu melangkah",
      demo
        ? "Progres contoh tersimpan di browser ini, terpisah dari akun kelas."
        : "Progres materi tersimpan di Google Sheets setelah server mengonfirmasi.",
    ) +
    `<div class="toolbar">${classSelect()}<span class="tag">${p.done} / ${p.total} subbab selesai · ${p.pct}%</span></div><div class="cards">${classBabs().map(courseCard).join("") || empty("Belum ada materi", "Pilih kelas lain atau hubungi guru.")}</div>`
  );
}
function quiz() {
  const q = state.quiz;
  if (!q)
    return empty(
      "Siap mencoba latihan?",
      "Lima soal membaca, lengkap dengan pembahasannya.",
      '<button class="button" data-action="start-quiz">Mulai latihan</button>',
    );
  if (q.finished)
    return `<div class="practice paper"><div class="eyebrow">LATIHAN SELESAI</div><h1>Terima kasih sudah berlatih!</h1><div class="result-score">${q.score * 20}<small style="font-size:20px"> / 100</small></div><p>${q.score} dari 5 jawaban benar. Pelajari pembahasannya, lalu coba lagi untuk memperkuat pemahaman.</p><p class="helper">Hasil latihan mandiri ini tidak dikirim ke rekap guru.</p><div class="modal-actions"><a class="button light" href="#tka">Kembali</a><button class="button" data-action="start-quiz">Coba lagi ↻</button></div></div>`;
  const item = window.HUMA_QUESTIONS[q.index];
  return `<div class="practice"><a href="#tka" class="text-link">← Kembali ke latihan</a><br><br><article class="paper"><div class="section-head"><span class="tag">SOAL ${q.index + 1} DARI 5</span><span class="helper">Pemahaman bacaan</span></div><div class="track"><span style="width:${q.index * 20}%"></span></div><div class="question-text">${esc(item.text)}</div><h3>${esc(item.q)}</h3><div class="options">${item.options.map((o, i) => `<button data-action="answer" data-index="${i}" class="option ${q.selected === i ? "selected" : ""} ${q.checked && i === item.answer ? "correct" : ""} ${q.checked && q.selected === i && i !== item.answer ? "wrong" : ""}" ${q.checked ? "disabled" : ""}><span>${String.fromCharCode(65 + i)}</span>${esc(o)}</button>`).join("")}</div>${q.checked ? `<div class="feedback"><strong>${q.selected === item.answer ? "Tepat sekali!" : "Belum tepat, yuk pahami."}</strong><p>${esc(item.why)}</p></div>` : ""}<div class="quiz-footer"><span class="helper">Tidak dibatasi waktu. Utamakan pemahaman.</span><button class="button" data-action="${q.checked ? "next-question" : "check-answer"}" ${q.selected === null ? "disabled" : ""}>${q.checked ? (q.index === 4 ? "Lihat hasil" : "Soal berikutnya") : "Periksa jawaban"} →</button></div></article></div>`;
}
const words = [
  ["aktivitas", "aktifitas", "Bentuk baku: aktivitas."],
  ["risiko", "resiko", "Bentuk baku: risiko."],
  ["praktik", "praktek", "Bentuk baku: praktik."],
  ["izin", "ijin", "Bentuk baku: izin."],
  ["nasihat", "nasehat", "Bentuk baku: nasihat."],
];
function game() {
  const g = state.game;
  if (!g)
    return empty(
      "Tantangan kata baku",
      "Pilih bentuk kata yang baku.",
      '<button data-action="start-game" class="button">Mulai bermain</button>',
    );
  if (g.index === 5)
    return `<div class="practice paper"><div class="eyebrow">TANTANGAN SELESAI</div><h1>${g.score === 5 ? "Peka kata, hebat!" : "Satu permainan, pengetahuan baru."}</h1><div class="result-score">${g.score * 20}<small style="font-size:20px"> poin</small></div><p>${g.score} dari 5 kata kamu jawab dengan tepat. Hasil permainan ini hanya untuk latihan di perangkatmu.</p><div class="modal-actions"><a class="button light" href="#game">Zona game</a><button data-action="start-game" class="button">Main lagi ↻</button></div></div>`;
  const pair = words[g.index],
    options = g.order ? pair.slice(0, 2).reverse() : pair.slice(0, 2);
  return `<div class="practice paper"><div class="section-head"><span class="tag">KATA ${g.index + 1} / 5</span><strong>${g.score * 20} poin</strong></div><h1>Mana kata yang baku?</h1><p>Pilih satu jawaban yang menurutmu tepat.</p><div class="word-options">${options.map((w) => `<button class="option ${g.answered ? (w === pair[0] ? "correct" : w === g.choice ? "wrong" : "") : ""}" data-action="word" data-word="${w}" ${g.answered ? "disabled" : ""}>${w}</button>`).join("")}</div>${g.answered ? `<div class="feedback">${g.choice === pair[0] ? "✓ Tepat! +20 poin." : "Belum tepat. Tidak apa-apa, sekarang kamu tahu."} ${pair[2]}</div><button data-action="next-word" class="button">${g.index === 4 ? "Lihat hasil" : "Kata berikutnya"} →</button>` : '<p class="helper">Tidak perlu terburu-buru. Pikirkan ejaannya.</p>'}</div>`;
}
const forms = {
  Bab: {
    label: "Bab",
    key: "bab",
    id: "id_bab",
    fields: [
      ["kelas", "Kelas", "class"],
      ["nama", "Nama bab", "text", true],
      ["deskripsi", "Deskripsi", "textarea"],
      ["pdf_bse", "Tautan buku BSE", "url"],
    ],
  },
  SubBab: {
    label: "Subbab",
    key: "subbab",
    id: "id_subbab",
    fields: [
      ["id_bab", "Bab induk", "chapter", true],
      ["judul", "Judul subbab", "text", true],
      ["isi", "Isi materi teks biasa (opsional)", "textarea"],
      ["materi_json", "Materi terstruktur (Materi_JSON)", "textarea"],
      ...mediaTypes
        .filter(([k]) => k !== "link_soal")
        .map(([k, l]) => [k, l, "url"]),
      ["soal_json", "Bank latihan subbab (Soal_JSON)", "textarea"],
    ],
  },
  TKA: {
    label: "Latihan TKA",
    key: "tka",
    id: "id",
    fields: [
      ["judul", "Judul paket", "text", true],
      ["deskripsi", "Deskripsi", "textarea"],
      ["link", "Tautan latihan", "url", true],
    ],
  },
  Game: {
    label: "Game",
    key: "game",
    id: "id",
    fields: [
      ["judul", "Judul game", "text", true],
      ["deskripsi", "Deskripsi", "textarea"],
      ["link", "Tautan game", "url", true],
    ],
  },
  Kamus: {
    label: "Kosakata",
    key: "kamus",
    id: "id",
    fields: [
      ["dayak", "Dayak", "text", true],
      ["indo", "Indonesia", "text", true],
      ["inggris", "Inggris", "text"],
      ["kategori", "Kategori", "text"],
    ],
  },
  Siswa: {
    label: "Siswa",
    key: "users",
    id: "id",
    fields: [
      ["username", "Nama pengguna", "text", true],
      ["password", "Kata sandi baru (minimal 8 karakter)", "password"],
      ["nama", "Nama lengkap", "text", true],
      ["kelas", "Kelas", "class"],
    ],
  },
};
function admin() {
  if (state.user?.role !== "Admin")
    return empty(
      "Ruang khusus guru",
      "Masuk dengan akun guru untuk mengelola kelas.",
      '<button data-action="login" class="button">Masuk akun</button>',
    );
  const type = state.adminType;
  const rekap = type === "Rekap";
  const f = forms[type];
  const list = rekap ? state.data.rekap_progress : state.data[f.key];
  return (
    heading(
      "KELOLA RUANG BELAJAR",
      "Panel guru",
      "Kelola bahan ajar, akun siswa, dan pantau progres materi.",
    ) +
    `<div class="admin-hint">${demo ? "Mode contoh: perubahan pengelolaan hanya bertahan selama halaman terbuka. Masuk melalui backend Anda untuk menyimpan data kelas." : "Perubahan tersimpan ke Spreadsheet setelah dikonfirmasi server. Kata sandi siswa tidak ditampilkan kembali."}</div><div class="toolbar"><div class="pills">${[...Object.keys(forms).filter((t) => t !== "Kamus" || !window.HUMA_CONFIG.dictionaryApiUrl), "Rekap"].map((t) => `<button class="pill ${t === type ? "active" : ""}" data-action="admin-tab" data-kind="${t}">${t === "SubBab" ? "Subbab" : t}</button>`).join("")}</div>${rekap ? '<button class="button small light" data-action="export">Unduh rekap CSV ↓</button>' : `<button class="button small" data-action="edit" data-kind="${type}">+ Tambah ${f.label.toLowerCase()}</button>`}</div>${rekap ? `<div class="table-wrap"><table><thead><tr><th>SISWA</th><th>KELAS</th><th>SUBBAB SELESAI</th><th>PROGRES</th><th>PEMBARUAN</th></tr></thead><tbody>${list.map((r) => `<tr><td>${esc(r.nama)}</td><td>${esc(r.kelas)}</td><td>${r.selesai.length}</td><td>${r.persentase}%</td><td>${esc(r.waktu || "Belum belajar")}</td></tr>`).join("") || '<tr><td colspan="5">Belum ada siswa atau progres.</td></tr>'}</tbody></table></div><p class="helper">Rekap ini mencatat penyelesaian materi. Nilai Google Forms atau platform game tetap dikelola pada platform masing-masing.</p>` : `<div class="table-wrap"><table><thead><tr><th>${type === "Siswa" ? "NAMA / AKUN" : "JUDUL / KATA"}</th><th>KETERANGAN</th><th>TINDAKAN</th></tr></thead><tbody>${list.map((x) => `<tr><td><strong>${esc(x.nama || x.judul || x.dayak)}</strong>${type === "Siswa" ? `<br>${esc(x.username)}` : ""}</td><td>${esc(x.kelas || x.indo || x.deskripsi?.slice(0, 70) || state.data.bab.find((b) => b.id_bab === x.id_bab)?.nama || "—")}</td><td><button class="button small light" data-action="edit" data-kind="${type}" data-id="${attr(x[f.id])}">Edit</button><button class="text-link" data-action="delete" data-kind="${type}" data-id="${attr(x[f.id])}">Hapus</button></td></tr>`).join("") || '<tr><td colspan="3">Belum ada data. Tambahkan melalui tombol di atas.</td></tr>'}</tbody></table></div>`}`
  );
}
function render() {
  shell();
  window.HumaDictionary?.setActive(false);
  window.HumaWorks?.setActive(false);
  const isTka = route().page === "tka";
  const isSnake = route().page === "ular-tangga";
  $("#snake-panel").hidden = !isSnake;
  $("#tka-panel").hidden = !isTka;
  $("#main").hidden = isTka || isSnake;
  if (isSnake && !$("#snake-frame")) {
    const frame = document.createElement("iframe");
    frame.id = "snake-frame";
    frame.title = "Ular Tangga Bahasa Indonesia — Petualangan Kata";
    frame.src = "modules/games/petualangan-kata/index.html";
    frame.addEventListener("load", () =>
      frame.contentWindow.postMessage(
        { type: "HUMA_VISIBILITY", visible: route().page === "ular-tangga" },
        location.origin === "null" ? "*" : location.origin,
      ),
    );
    $("#snake-mount").append(frame);
  }
  $("#snake-frame")?.contentWindow?.postMessage(
    { type: "HUMA_VISIBILITY", visible: isSnake },
    location.origin === "null" ? "*" : location.origin,
  );
  if (isSnake) {
    document.title = "Petualangan Kata — Huma Belajar";
    return;
  }
  if (isTka) {
    if (!$("#tka-frame")) {
      const frame = document.createElement("iframe");
      frame.id = "tka-frame";
      frame.title = "Try Out TKA Bahasa Indonesia";
      frame.src = "modules/tka/index.html";
      $("#tka-mount").append(frame);
    }
    document.title = "Latihan TKA — Huma Belajar";
    return;
  }
  if (route().page === "game") {
    window.HumaGames.mount($("#main"), state.data.game, {
      onOpenSnake() {
        location.hash = "ular-tangga";
      },
    });
    document.title = "Zona Game — Huma Belajar";
    return;
  }
  if (route().page === "karya") {
    window.HumaWorks.mount($("#main"), {
      user: state.user,
      demo,
      api,
      onLogin: loginModal,
      onDemoAdmin() {
        state.user = {
          id: "DEMO-GURU",
          nama: "Guru Huma",
          kelas: "Semua Kelas",
          role: "Admin",
        };
        state.token = "";
        remember();
        render();
      },
    });
    document.title = "Karya Siswa — Huma Belajar";
    return;
  }
  if (route().page === "kamus") {
    window.HumaDictionary.mount($("#main"), {
      user: state.user,
      demo,
      data: state.data.kamus,
      api,
      onLogin: loginModal,
      onSignedIn(result) {
        state.user = result.user;
        state.token = result.token;
        remember();
        shell();
      },
      onDemoCurator() {
        state.user = {
          id: "DEMO-GURU",
          nama: "Guru Huma",
          kelas: "Semua Kelas",
          role: "Admin",
        };
        state.token = "";
        remember();
        render();
      },
    });
    document.title = "Kamus Dayak Ngaju — Huma Belajar";
    return;
  }
  if (state.loading) {
    $("#main").innerHTML =
      '<div class="skeleton" role="status" aria-label="Memuat materi"></div>';
    return;
  }
  if (state.error) {
    $("#main").innerHTML = empty(
      "Ruang belajar belum dapat dimuat",
      esc(state.error),
      '<button class="button" data-action="retry">Coba lagi ↻</button>',
    );
    return;
  }
  const r = route();
  const views = {
    beranda: home,
    materi: materials,
    bab: () => chapter(r.id),
    belajar: () => lesson(r.id),
    tka: () => catalog("tka"),
    game: () => catalog("game"),
    kamus: dictionary,
    progres: progress,
    guru: admin,
    latihan: quiz,
    bermain: game,
  };
  $("#main").innerHTML = (
    views[r.page] ||
    (() =>
      empty(
        "Halaman tidak ditemukan",
        "Kembali ke ruang belajar.",
        '<a href="#beranda" class="button">Beranda</a>',
      ))
  )();
  if (r.page === "belajar" && r.section === "latihan") {
    const lessonItem = state.data.subbab.find(
      (item) => item.id_subbab === r.id,
    );
    if (lessonItem)
      window.HumaLessonPractice?.mount(
        $("#main"),
        lessonItem,
        state.user?.id || "guest",
      );
  }
  document.title =
    ($("#main h1")?.textContent || "Ruang Belajar") + " — Huma Belajar";
}
function openModal(title, content) {
  $("#modal-content").innerHTML =
    `<div class="modal-head"><h2>${esc(title)}</h2><button class="close" data-action="close" aria-label="Tutup dialog">×</button></div>${content}`;
  if (!$("#modal").open) $("#modal").showModal();
}
function loginModal() {
  openModal(
    "Selamat datang kembali",
    `<p style="margin-bottom:20px">${demo ? "Jelajahi contoh sebagai siswa atau guru. Tidak diperlukan akun asli." : "Masuk dengan akun yang diberikan oleh guru."}</p>${demo ? '<div class="modal-actions"><button class="button light" data-action="demo-teacher">Coba sebagai guru</button><button class="button" data-action="demo-student">Coba sebagai siswa →</button></div>' : `<form id="login-form"><label class="field">Nama pengguna<input name="username" required autocomplete="username" maxlength="64"></label><label class="field">Kata sandi<input name="password" type="password" required autocomplete="current-password" maxlength="128"></label><p class="form-error" role="alert"></p><button class="button" type="submit">Masuk ke ruang belajar →</button><p class="helper">Lupa kata sandi? Hubungi guru untuk mengatur ulang.</p></form>`}`,
  );
}
function viewer(title, url, image = false) {
  const safe = safeURL(url);
  if (!safe) {
    toast("Tautan materi belum valid. Hubungi guru.");
    return;
  }
  openModal(
    title,
    `<p class="helper">Jika pratinjau tidak muncul, buka materi di tab baru. Beberapa platform membatasi tampilan di dalam aplikasi.</p><a class="button small light" style="margin-top:10px" target="_blank" rel="noopener noreferrer" href="${attr(safe)}">Buka di tab baru ↗</a>${image ? `<img class="reader-image" src="${attr(safe)}" alt="${attr(title)}">` : `<iframe class="reader" title="${attr(title)}" src="${attr(embedURL(safe))}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation" referrerpolicy="strict-origin-when-cross-origin" allow="fullscreen" allowfullscreen></iframe>`}`,
  );
}
function editModal(type, id) {
  if (state.user?.role !== "Admin") return;
  const f = forms[type];
  const item = state.data[f.key].find((x) => x[f.id] === id) || {};
  openModal(
    (id ? "Edit " : "Tambah ") + f.label,
    `<form id="edit-form" data-kind="${type}" data-id="${attr(id || "")}">${f.fields
      .map(([k, label, input, required]) => {
        const val = input === "class" ? normalizeClass(item[k]) : item[k] || "";
        const options =
          input === "class"
            ? [
                "Kelas X",
                "Kelas XI",
                "Kelas XII",
                ...(type === "Bab" ? ["Semua Kelas"] : []),
                ...(val ? [val] : []),
              ]
                .filter((v, i, a) => a.indexOf(v) === i)
                .map((v) => [v, v])
            : input === "chapter"
              ? state.data.bab.map((b) => [b.id_bab, b.kelas + " — " + b.nama])
              : null;
        return `<label class="field">${label}${required ? " *" : ""}${options ? `<select name="${k}" required>${options.map(([value, text]) => `<option value="${attr(value)}" ${value === val ? "selected" : ""}>${esc(text)}</option>`).join("")}</select>` : input === "textarea" ? `<textarea name="${k}" maxlength="20000">${esc(val)}</textarea>` : `<input name="${k}" type="${input}" value="${input === "password" ? "" : attr(val)}" ${required || (input === "password" && !id) ? "required" : ""} ${input === "password" ? 'minlength="8" autocomplete="new-password"' : 'maxlength="2000"'} ${input === "url" ? 'placeholder="https://…"' : ""}>`}${input === "password" && id ? "<small>Kosongkan untuk mempertahankan kata sandi.</small>" : ""}</label>`;
      })
      .join(
        "",
      )}<p class="form-error" role="alert"></p><div class="modal-actions"><button class="button light" type="button" data-action="close">Batal</button><button class="button" type="submit">Simpan ${f.label.toLowerCase()} ✓</button></div></form>`,
  );
}
async function mutate(action, payload) {
  if (!demo) return api(action, payload);
  if (state.user?.role !== "Admin") throw new Error("Akses guru diperlukan.");
  const { type, id } = payload,
    f = forms[type],
    list = state.data[f.key];
  if (action === "deleteItem") {
    if (type === "Bab" && subsFor(id).length)
      throw new Error("Hapus subbab di dalam bab ini terlebih dahulu.");
    state.data[f.key] = list.filter((x) => x[f.id] !== id);
    if (type === "SubBab")
      state.data.progress = state.data.progress.filter((x) => x !== id);
    return;
  }
  const value = { ...payload.payload, [f.id]: id || "DEMO-" + Date.now() };
  delete value.password;
  const index = list.findIndex((x) => x[f.id] === id);
  if (index >= 0) list[index] = { ...list[index], ...value };
  else list.push(value);
}
async function complete(id, button) {
  if (!state.user) {
    loginModal();
    return;
  }
  button.disabled = true;
  try {
    if (demo) {
      if (!state.data.progress.includes(id)) state.data.progress.push(id);
      store.set("huma-demo-progress-" + state.user.id, state.data.progress);
    } else {
      const res = await api("updateProgress", { id_subbab: id });
      state.data.progress = res.progress;
    }
    render();
    toast("Satu langkah lagi selesai. Kerja bagus!");
  } catch (e) {
    button.disabled = false;
    toast(e.message);
  }
}
function csvExport() {
  const rows = [
    ["Nama", "Kelas", "Subbab selesai", "Persentase", "Terakhir diperbarui"],
    ...state.data.rekap_progress.map((r) => [
      r.nama,
      r.kelas,
      r.selesai.join(", "),
      r.persentase,
      r.waktu,
    ]),
  ];
  const csv =
    "\uFEFF" +
    rows
      .map((r) =>
        r
          .map(
            (v) =>
              '"' +
              String(v ?? "")
                .replace(/^[=+\-@\t\r]/, "'$&")
                .replace(/"/g, '""') +
              '"',
          )
          .join(","),
      )
      .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "rekap-huma-belajar.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
document.addEventListener("click", async (e) => {
  if (e.target.closest(".skip")) {
    e.preventDefault();
    document
      .querySelector(
        route().page === "tka"
          ? "#tka-panel"
          : route().page === "ular-tangga"
            ? "#snake-panel"
            : "#main",
      )
      .focus();
    return;
  }
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const { action, id, kind } = el.dataset;
  try {
    if (action === "close") {
      $("#modal").close();
      return;
    }
    if (action === "login") {
      loginModal();
      return;
    }
    if (action.startsWith("demo-")) {
      state.user =
        action === "demo-teacher"
          ? {
              id: "DEMO-GURU",
              nama: "Guru Huma",
              role: "Admin",
              kelas: "Semua Kelas",
            }
          : {
              id: "DEMO-SISWA",
              nama: "Sahabat Huma",
              role: "Siswa",
              kelas: state.kelas,
            };
      state.token = "";
      remember();
      $("#modal").close();
      await load();
      toast("Selamat datang di ruang contoh.");
      return;
    }
    if (action === "retry") {
      await load();
      return;
    }
    if (action === "complete") {
      await complete(id, el);
      return;
    }
    if (action === "media") {
      const s = state.data.subbab.find((x) => x.id_subbab === id);
      viewer(s.judul, s[kind], kind === "link_gambar");
      return;
    }
    if (action === "book") {
      const b = state.data.bab.find((x) => x.id_bab === id);
      viewer(b.nama, b.pdf_bse);
      return;
    }
    if (action === "catalog-media") {
      const x = state.data[kind].find((x) => x.id === id);
      viewer(x.judul, x.link);
      return;
    }
    if (action === "start-quiz") {
      state.quiz = {
        index: 0,
        selected: null,
        checked: false,
        score: 0,
        finished: false,
      };
      location.hash = "latihan";
      render();
      return;
    }
    if (action === "answer") {
      if (!state.quiz.checked) state.quiz.selected = Number(el.dataset.index);
      render();
      return;
    }
    if (action === "check-answer") {
      const q = state.quiz;
      if (q.selected === null || q.checked) return;
      q.checked = true;
      if (q.selected === window.HUMA_QUESTIONS[q.index].answer) q.score++;
      render();
      return;
    }
    if (action === "next-question") {
      const q = state.quiz;
      if (!q.checked) return;
      if (q.index === 4) q.finished = true;
      else {
        q.index++;
        q.selected = null;
        q.checked = false;
      }
      render();
      return;
    }
    if (action === "start-game") {
      state.game = {
        index: 0,
        score: 0,
        answered: false,
        order: Math.random() > 0.5,
      };
      location.hash = "bermain";
      render();
      return;
    }
    if (action === "word") {
      const g = state.game;
      if (g.answered) return;
      g.answered = true;
      g.choice = el.dataset.word;
      if (g.choice === words[g.index][0]) g.score++;
      render();
      return;
    }
    if (action === "next-word") {
      const g = state.game;
      if (!g.answered) return;
      g.index++;
      g.answered = false;
      g.order = Math.random() > 0.5;
      render();
      return;
    }
    if (action === "admin-tab") {
      state.adminType = kind;
      render();
      return;
    }
    if (action === "edit") {
      editModal(kind, id);
      return;
    }
    if (action === "delete") {
      const f = forms[kind];
      const item = state.data[f.key].find((x) => x[f.id] === id);
      openModal(
        "Hapus " + f.label.toLowerCase() + "?",
        `<p>${esc(item.nama || item.judul || item.dayak)} akan dihapus dari ruang belajar.${kind === "Siswa" ? " Akun dan progres siswa ini juga akan dihapus." : ""}</p><p class="form-error" role="alert"></p><div class="modal-actions"><button class="button light" data-action="close">Batal</button><button class="button danger" data-action="confirm-delete" data-kind="${kind}" data-id="${attr(id)}">Ya, hapus</button></div>`,
      );
      return;
    }
    if (action === "confirm-delete") {
      el.disabled = true;
      try {
        await mutate("deleteItem", { type: kind, id });
        $("#modal").close();
        if (!demo) await load();
        else render();
        toast("Data berhasil dihapus.");
      } catch (err) {
        el.disabled = false;
        $("#modal .form-error").textContent = err.message;
      }
      return;
    }
    if (action === "export") csvExport();
  } catch (err) {
    toast(err.message);
  }
});
document.addEventListener("submit", async (e) => {
  if (!["login-form", "edit-form"].includes(e.target.id)) return;
  e.preventDefault();
  const form = e.target;
  const button = $("[type=submit]", form);
  button.disabled = true;
  $(".form-error", form).textContent = "";
  try {
    const payload = Object.fromEntries(new FormData(form));
    if (form.id === "login-form") {
      const r = await api("login", payload);
      state.user = r.user;
      state.token = r.token;
      if (r.user.role === "Siswa") state.kelas = r.user.kelas;
      remember();
      $("#modal").close();
      await load();
      toast("Selamat datang, " + r.user.nama + ".");
    } else {
      for (const [k, v] of Object.entries(payload)) {
        if (
          forms[form.dataset.kind].fields.find((f) => f[0] === k)?.[2] ===
            "url" &&
          v &&
          !safeURL(v)
        )
          throw new Error("Gunakan tautan HTTPS yang valid.");
      }
      await mutate("saveItem", {
        type: form.dataset.kind,
        id: form.dataset.id,
        payload,
      });
      $("#modal").close();
      if (!demo) await load();
      else render();
      toast("Data berhasil disimpan.");
    }
  } catch (err) {
    $(".form-error", form).textContent = err.message;
  } finally {
    button.disabled = false;
  }
});
document.addEventListener("change", (e) => {
  if (e.target.id === "class-select") {
    state.kelas = e.target.value;
    store.set("huma-class", state.kelas);
    render();
  }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "search") {
    const position = e.target.selectionStart;
    state.query = e.target.value;
    render();
    const input = $("#search");
    input.focus();
    try {
      input.setSelectionRange(position, position);
    } catch {}
  }
});
$("#auth").addEventListener("click", () => {
  if (!state.user) return loginModal();
  openModal(
    "Keluar dari akun?",
    `<p>Progres yang sudah disimpan tetap tersedia ketika kamu masuk kembali.</p><div class="modal-actions"><button class="button light" data-action="close">Batal</button><button class="button" id="logout">Keluar</button></div>`,
  );
  $("#logout").onclick = async () => {
    try {
      if (!demo) await api("logout");
      state.user = null;
      state.token = "";
      remember();
      $("#modal").close();
      location.hash = "beranda";
      await load();
    } catch (e) {
      toast(e.message);
    }
  };
});
$("#modal").addEventListener("close", () => {
  $("#modal-content").innerHTML = "";
});
window.addEventListener("hashchange", () => {
  state.query = "";
  render();
  window.scrollTo(0, 0);
  $(
    route().page === "tka"
      ? "#tka-panel"
      : route().page === "ular-tangga"
        ? "#snake-panel"
        : "#main",
  ).focus({
    preventScroll: true,
  });
});
document.addEventListener(
  "error",
  (event) => {
    const image = event.target;
    if (image?.classList?.contains("book-thumbnail") || image?.classList?.contains("chapter-thumbnail")) image.hidden = true;
    if (image?.classList?.contains("lesson-image")) {
      image.hidden = true;
      const fallback = image.parentElement.querySelector(
        ".lesson-image-fallback",
      );
      if (fallback) fallback.hidden = false;
    }
  },
  true,
);
load();
