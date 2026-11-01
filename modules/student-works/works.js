window.HumaWorks = (() => {
  const C = window.HumaWorksCore,
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
  let root,
    context,
    client = null,
    key = "",
    activeView = false,
    request = 0,
    items = [],
    query = "",
    type = "",
    view = "gallery",
    editing = null,
    busy = false,
    error = "",
    message = "";
  let local = [];
  try {
    const v = JSON.parse(localStorage.getItem("huma-student-works") || "[]");
    if (Array.isArray(v)) local = v;
  } catch {}
  const manager = () => context?.user?.role === "Admin";
  const btn = (action, text, cls = "", extra = "") =>
    `<button type="button" class="sw-button ${cls}" data-sw="${action}" ${extra}>${text}</button>`;
  const glyph = (kind) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${kind === "Video" ? '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m10 8 6 4-6 4Z"/>' : kind === "Gambar" ? '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="2"/><path d="m3 17 6-6 5 5 3-3 4 4"/>' : '<path d="m9 15 6-6m-6-3 2-2a5 5 0 0 1 7 7l-2 2m-7-2-3 3a5 5 0 0 0 7 7l2-2"/>'}</svg>`;
  function persist() {
    try {
      localStorage.setItem("huma-student-works", JSON.stringify(local));
    } catch {
      message =
        "Penyimpanan browser tidak tersedia. Data contoh hanya bertahan di sesi ini.";
    }
  }
  async function refresh() {
    if (context.demo) {
      items = local;
      render();
      return;
    }
    const serial = ++request,
      identity = key;
    busy = true;
    error = "";
    render();
    try {
      const data = await context.api("getStudentWorks");
      if (serial === request && identity === key) items = data.works;
    } catch (e) {
      if (serial === request && identity === key) {
        error = e.message;
        if (e.code === "AUTH" && client) {
          context.user = null;
          view = "login";
          items = [];
        }
      }
    } finally {
      if (serial === request && identity === key) {
        busy = false;
        render();
      }
    }
  }
  function field(name, label, value = "", kind = "text", required = true) {
    return `<label class="sw-field">${label}${required ? " *" : ""}${kind === "textarea" ? `<textarea name="${name}" maxlength="5000" ${required ? "required" : ""}>${esc(value)}</textarea>` : `<input name="${name}" type="${kind}" value="${kind === "password" ? "" : esc(value)}" ${required ? "required" : ""} maxlength="2000" ${kind === "password" ? 'autocomplete="current-password"' : ""}>`}</label>`;
  }
  function form() {
    const w = editing || { jenis: "Gambar", status: "Draft" };
    return `<section class="sw-editor"><div class="sw-section-head"><div><span class="sw-kicker">RUANG PENGELOLA</span><h2>${w.id ? "Edit karya" : "Tambahkan karya siswa"}</h2></div>${btn("cancel", "Kembali", "ghost")}</div><p>Isi identitas siswa dan tautan medianya. Gunakan Draft untuk menyimpan persiapan, lalu pilih Terbit saat siap ditampilkan.</p><form id="sw-edit-form">${field("judul", "Judul karya", w.judul)}<div class="sw-form-grid">${field("nama", "Nama siswa / kelompok", w.nama)}${field("kelas", "Kelas", w.kelas)}</div><div class="sw-form-grid"><label class="sw-field">Jenis karya<select name="jenis">${["Gambar", "Video", "Tautan"].map((t) => `<option ${w.jenis === t ? "selected" : ""}>${t}</option>`).join("")}</select></label><label class="sw-field">Status publikasi<select name="status">${["Draft", "Terbit", "Arsip"].map((t) => `<option ${w.status === t ? "selected" : ""}>${t}</option>`).join("")}</select></label></div>${field("url", "Tautan gambar / YouTube / karya", w.url)}<p class="sw-help">Gunakan HTTPS. Gambar juga dapat memakai berkas lokal repository seperti assets/karya/poster.jpg. Video menggunakan YouTube. Pastikan media dapat diakses oleh siswa.</p>${field("thumbnail", "Tautan gambar sampul (opsional)", w.thumbnail, "text", false)}${field("deskripsi", "Cerita singkat tentang karya", w.deskripsi, "textarea", false)}<div class="sw-actions">${btn("cancel", "Batal", "ghost")}<button class="sw-button" type="submit" ${busy ? "disabled" : ""}>${busy ? "Menyimpan…" : "Simpan karya ✓"}</button></div></form></section>`;
  }
  function login() {
    return `<section class="sw-editor sw-login"><span class="sw-kicker">AKUN PENGELOLA</span><h2>Masuk untuk mengelola karya</h2><p>Gunakan akun guru pengelola galeri.</p><form id="sw-login-form">${field("username", "Nama pengguna")}${field("password", "Kata sandi", "", "password")}<button class="sw-button" type="submit" ${busy ? "disabled" : ""}>Masuk galeri →</button></form>${btn("cancel", "Kembali ke galeri", "ghost")}</section>`;
  }
  function card(w) {
    const thumb =
      w.thumbnail ||
      (w.jenis === "Gambar"
        ? w.url
        : w.jenis === "Video" && C.video(w.url)
          ? "https://i.ytimg.com/vi/" + C.video(w.url) + "/hqdefault.jpg"
          : "");
    return `<article class="sw-card"><button class="sw-cover ${w.jenis === "Video" ? "video" : w.jenis === "Tautan" ? "link" : ""}" data-sw="open" data-id="${esc(w.id)}" aria-label="Lihat ${esc(w.judul)}">${thumb ? `<img src="${esc(C.image(thumb))}" alt="Sampul ${esc(w.judul)}" loading="lazy">` : ""}<span class="sw-cover-icon">${glyph(w.jenis)}</span><span class="sw-kind">${esc(w.jenis)}</span></button><div class="sw-card-body"><div class="sw-meta"><span>${esc(w.kelas)}</span>${manager() ? `<span class="sw-status ${w.status === "Terbit" ? "published" : ""}">${esc(w.status)}</span>` : ""}</div><h3>${esc(w.judul)}</h3><p class="sw-author">Oleh ${esc(w.nama)}</p><p class="sw-description">${esc(w.deskripsi || "Sebuah langkah kecil untuk berani berkarya.")}</p><div class="sw-card-bottom">${btn("open", "Lihat karya ↗", "ghost", `data-id="${esc(w.id)}"`)}${manager() ? btn("edit", "Edit", "ghost", `data-id="${esc(w.id)}"`) : ""}</div>${manager() && w.status !== "Arsip" ? btn("archive", "Arsipkan", "text", `data-id="${esc(w.id)}"`) : ""}</div></article>`;
  }
  function render() {
    if (!activeView || !root?.isConnected) return;
    const published = items.filter((w) => w.status === "Terbit"),
      list = C.filter(items, query, type, manager());
    root.innerHTML = `<div class="sw-app"><section class="sw-hero"><div><span class="sw-kicker">PANGGUNG UNTUK IDE DAN CERITA</span><h1>Karya kecil.<br>Suara yang berarti.</h1><p>Ruang untuk mengapresiasi gambar, tulisan, dan video karya siswa.<br>Setiap karya punya cerita yang layak dibagikan.</p></div><div class="sw-art" aria-hidden="true"><span>${glyph("Gambar")}</span><span>${glyph("Video")}</span><span>${glyph("Tautan")}</span></div></section><div class="sw-stats"><div><strong>${published.length}</strong><span>Karya terbit</span></div><div><strong>${new Set(published.map((w) => w.nama)).size}</strong><span>Siswa / kelompok berkarya</span></div><div><strong>${new Set(published.map((w) => w.kelas)).size}</strong><span>Kelas berpartisipasi</span></div></div>${context.demo ? '<p class="sw-notice">Mode contoh: karya yang ditambahkan disimpan di browser ini. Hubungkan paket Apps Script Karya Siswa untuk galeri bersama.</p>' : ""}${message ? `<div class="sw-alert good" role="status">${esc(message)}</div>` : ""}${error ? `<div class="sw-alert" role="alert">${esc(error)} ${btn("retry", "Coba lagi", "ghost")}</div>` : ""}<div class="sw-section-head"><div><h2>${manager() ? "Kelola galeri karya" : "Galeri karya siswa"}</h2><p>${manager() ? "Anda dapat melihat karya Draft, Terbit, dan Arsip." : "Apresiasi ide, keterampilan, dan keberanian untuk mencoba."}</p></div><div class="sw-actions">${manager() ? btn("add", "+ Tambah karya") : btn("manage", "Kelola karya", "ghost")}${client && manager() ? btn("logout", "Keluar galeri", "ghost") : ""}</div></div>${
      view === "edit" && manager()
        ? form()
        : view === "login"
          ? login()
          : `<div class="sw-toolbar"><div class="sw-filters">${[
              ["", "Semua"],
              ["Gambar", "Gambar"],
              ["Video", "Video"],
              ["Tautan", "Tautan"],
            ]
              .map(([id, label]) =>
                btn(
                  "filter",
                  label,
                  type === id ? "active" : "ghost",
                  `data-type="${id}" aria-pressed="${type === id}"`,
                ),
              )
              .join(
                "",
              )}</div><input class="sw-search" id="sw-search" type="search" aria-label="Cari karya siswa" placeholder="Cari judul, nama, atau kelas…" value="${esc(query)}"></div>${busy ? '<p class="sw-help" role="status">Memuat galeri…</p>' : ""}<div class="sw-grid">${list.map(card).join("") || `<div class="sw-empty"><span>${glyph("Gambar")}</span><h3>${query || type ? "Karya belum ditemukan" : "Panggung ini menunggu karya pertamamu."}</h3><p>${query || type ? "Coba kata kunci atau kategori lain." : "Guru dapat menambahkan gambar, tautan tulisan, atau video YouTube melalui Kelola karya."}</p>${manager() ? btn("add", "Tambahkan karya pertama +") : ""}</div>`}</div>`
    }<dialog id="sw-dialog"><div id="sw-dialog-content"></div></dialog></div>`;
  }
  function open(w) {
    const safe = C.url(w.url);
    if (!safe) {
      error = "Tautan karya belum valid.";
      render();
      return;
    }
    const id = C.video(safe);
    root.querySelector("#sw-dialog-content").innerHTML =
      `<div class="sw-section-head"><div><h2>${esc(w.judul)}</h2><p>${esc(w.nama)} · ${esc(w.kelas)}</p></div>${btn("close", "×", "ghost", 'aria-label="Tutup karya"')}</div>${w.jenis === "Gambar" ? `<img class="sw-view-image" src="${esc(C.image(safe))}" alt="${esc(w.judul)}">` : w.jenis === "Video" && id ? `<iframe class="sw-video" title="${esc(w.judul)}" src="https://www.youtube-nocookie.com/embed/${id}" allow="fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe>` : `<div class="sw-link-view">${glyph("Tautan")}<p>Karya ini tersedia melalui tautan berikut.</p></div>`}<p class="sw-view-description">${esc(w.deskripsi || "")}</p><a class="sw-button" href="${esc(safe)}" target="_blank" rel="noopener noreferrer">Buka karya asli ↗</a>`;
    root.querySelector("#sw-dialog").showModal();
  }
  async function click(e) {
    const b = e.target.closest("[data-sw]");
    if (!b || !root.contains(b) || b.disabled) return;
    const a = b.dataset.sw;
    if (a === "close") {
      root.querySelector("#sw-dialog").close();
      root.querySelector("#sw-dialog-content").innerHTML = "";
      return;
    }
    if (a === "retry") {
      await refresh();
      return;
    }
    if (a === "manage") {
      if (client) {
        view = "login";
        render();
      } else if (context.demo) {
        context.onDemoAdmin();
      } else context.onLogin();
      return;
    }
    if (a === "logout") {
      try {
        await client.logout();
        context.user = null;
        items = [];
        view = "gallery";
        key = "";
        await refresh();
      } catch (err) {
        error = err.message;
        render();
      }
      return;
    }
    if (a === "filter") {
      type = b.dataset.type;
      render();
      return;
    }
    if (a === "cancel") {
      view = "gallery";
      editing = null;
      error = "";
      render();
      return;
    }
    if (a === "add" || a === "edit") {
      if (!manager()) return;
      editing =
        a === "edit" ? { ...items.find((w) => w.id === b.dataset.id) } : null;
      view = "edit";
      message = "";
      error = "";
      render();
      root.querySelector(".sw-editor")?.scrollIntoView({ block: "start" });
      return;
    }
    const work = items.find((w) => w.id === b.dataset.id);
    if (!work) return;
    if (a === "open") {
      open(work);
      return;
    }
    if (a === "archive" && manager()) {
      busy = true;
      try {
        if (context.demo) {
          work.status = "Arsip";
          persist();
        } else await context.api("archiveStudentWork", { id: work.id });
        message =
          "Karya diarsipkan. Anda dapat menerbitkannya kembali melalui Edit.";
        await refresh();
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
      !["sw-edit-form", "sw-login-form"].includes(e.target.id) ||
      !root.contains(e.target)
    )
      return;
    e.preventDefault();
    if (busy) return;
    const form = e.target,
      payload = Object.fromEntries(new FormData(form));
    busy = true;
    error = "";
    try {
      if (form.id === "sw-login-form") {
        const r = await client.login(payload);
        context.user = r.user;
        if (!manager())
          throw new Error("Akun ini tidak memiliki akses pengelola karya.");
        view = "gallery";
        key = "live:" + r.user.id;
        await refresh();
      } else {
        if (!manager())
          throw new Error("Hanya guru yang dapat mengelola karya.");
        if (
          !C.url(payload.url) ||
          (payload.thumbnail && !C.url(payload.thumbnail))
        )
          throw new Error(
            "Gunakan tautan HTTPS atau path assets/karya/ yang valid.",
          );
        if (payload.jenis === "Video" && !C.video(payload.url))
          throw new Error("Gunakan tautan video YouTube yang valid.");
        if (context.demo) {
          const id =
            editing?.id ||
            "DEMO-W-" + (globalThis.crypto?.randomUUID?.() || Date.now());
          const work = {
            ...editing,
            ...payload,
            id,
            diperbarui: new Date().toISOString(),
          };
          local = local.filter((w) => w.id !== id);
          local.unshift(work);
          persist();
        } else
          await context.api("saveStudentWork", {
            id: editing?.id || "",
            payload,
          });
        editing = null;
        view = "gallery";
        message =
          payload.status === "Terbit"
            ? "Karya diterbitkan di galeri."
            : "Karya tersimpan sebagai " + payload.status + ".";
        await refresh();
      }
    } catch (err) {
      error = err.message;
      if (form.id === "sw-edit-form") editing = { ...editing, ...payload };
    } finally {
      busy = false;
      render();
    }
  }
  function mount(container, options) {
    activeView = true;
    const own = window.HUMA_CONFIG?.worksApiUrl;
    client = own ? window.HumaMenuAPI.create("karya", own) : null;
    context = client
      ? { ...options, user: client.user, demo: false, api: client.api }
      : options;
    if (root !== container) {
      root = container;
      root.addEventListener("click", (e) => {
        if (e.target.closest("[data-sw]")) click(e);
      });
      root.addEventListener("submit", submit);
      root.addEventListener("input", (e) => {
        if (e.target.id === "sw-search") {
          const position = e.target.selectionStart;
          query = e.target.value;
          render();
          const field = root.querySelector("#sw-search");
          field.focus();
          field.setSelectionRange(position, position);
        }
      });
      root.addEventListener(
        "error",
        (e) => {
          if (e.target.tagName === "IMG" && root.contains(e.target)) {
            e.target.hidden = true;
          }
        },
        true,
      );
    }
    const identity =
        (context.demo ? "demo" : "live") + ":" + (context.user?.id || "guest"),
      changed = key !== identity;
    if (changed) {
      key = identity;
      items = [];
      error = "";
      message = "";
      editing = null;
      view = "gallery";
    }
    render();
    if (changed) refresh();
  }
  return {
    mount,
    setActive(value) {
      activeView = value;
    },
  };
})();
