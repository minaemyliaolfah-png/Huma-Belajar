/* Koneksi khusus spreadsheet game. Tidak memakai token/database materi. */
window.HumaGameScores = (() => {
  "use strict";
  const KEY = "huma-game-outbox-v1", PROFILE = "huma-game-profile-v1";
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const read = (k,d) => {try{return JSON.parse(localStorage.getItem(k)) ?? d;}catch{return d;}};
  let profile = read(PROFILE, {}), queue = read(KEY, []), syncing = false, request = 0;
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) profile = {};
  queue = Array.isArray(queue) ? queue.filter(q=>q && typeof q.endpoint === "string" && q.payload && typeof q.payload.attemptId === "string" && Array.isArray(q.payload.results)) : [];
  const endpoint = () => String(window.HUMA_CONFIG.gamesApiUrl || "").trim();
  const write = (k,v) => {try{localStorage.setItem(k,JSON.stringify(v));return true;}catch{return false;}};
  function status(message) {
    document.querySelectorAll("[data-game-sync]").forEach(el => {el.textContent = message;});
  }
  function setUser(user) {
    if (user?.id && profile.owner !== user.id) {
      profile = {name:user.nama || "",className:user.kelas === "Semua Kelas" ? "" : user.kelas || "",owner:user.id};
      write(PROFILE,profile);
    }
  }
  function hasProfile() {return typeof profile.name === "string" && !!profile.name.trim() && typeof profile.className === "string" && !!profile.className.trim();}
  function formHTML(gate = false) {
    const form = `<form id="ag-profile"><div class="ag-profile-fields"><label>Nama pemain / tim<input name="name" maxlength="60" required value="${esc(profile.name)}" placeholder="Nama Anda"></label><label>Kelas<input name="className" maxlength="40" required value="${esc(profile.className)}" placeholder="Contoh: XII"></label><label>Pemain kedua (opsional)<input name="secondName" maxlength="60" value="${esc(profile.secondName)}" placeholder="Untuk Galaksi Bahasa berdua"></label></div><p class="helper">Game yang punya isian nama memakai nama di dalam game. Isi nama setiap pemain/tim sebelum memulai.</p><button class="button small" type="submit">${gate ? "Simpan dan bermain →" : "Simpan identitas"}</button><span id="ag-profile-message" role="status"></span></form>`;
    return gate ? form : `<details class="ag-profile"><summary>Identitas klasemen${hasProfile() ? " · " + esc(profile.name) + " / " + esc(profile.className) : " · isi nama dan kelas"}</summary>${form}</details>`;
  }
  function bindForm(root, next) {
    const form = root.querySelector("#ag-profile");
    if (!form) return;
    form.onsubmit = e => {
      e.preventDefault();
      const data = new FormData(form), name = String(data.get("name")).trim(), className = String(data.get("className")).trim();
      if (!name || !className) return;
      profile = {...profile,name,className,secondName:String(data.get("secondName") || "").trim()};
      const saved = write(PROFILE,profile);
      root.querySelector("#ag-profile-message").textContent = saved ? " Identitas tersimpan." : " Identitas berlaku selama halaman ini terbuka.";
      next?.();
    };
  }
  async function api(action,payload = {}) {
    const url = endpoint();
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) throw Error("Klasemen online belum dihubungkan. Isi gamesApiUrl setelah deployment Apps Script.");
    const controller = new AbortController(), timer = setTimeout(()=>controller.abort(),25000);
    try {
      const response = await fetch(url,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},redirect:"follow",body:JSON.stringify({action,...payload}),signal:controller.signal});
      if (!response.ok) throw Error("Server klasemen belum dapat dihubungi.");
      let data;try {data = await response.json();} catch {throw Error("Respons server klasemen tidak valid. Periksa URL /exec dan akses Siapa saja.");}
      if (data.status !== "success") throw Error(data.message || "Permintaan klasemen gagal.");
      return data;
    } catch(e) {if(e.name === "AbortError") throw Error("Server klasemen terlalu lama merespons.");throw e;}
    finally {clearTimeout(timer);}
  }
  async function sync() {
    if (syncing) return;
    if (!queue.length) {status(endpoint() ? "Hasil selesai akan tersimpan otomatis." : "Klasemen online belum dihubungkan.");return;}
    if (!endpoint()) {status(`${queue.length} hasil menunggu koneksi database game.`);return;}
    syncing = true;
    const attempted = new Set();
    try {
      // Bind unsent local results to the first configured endpoint; never reroute to a different database silently.
      for (const item of queue) if (!item.endpoint) item.endpoint = endpoint();
      write(KEY,queue);
      let lastError = "";
      for (const item of [...queue]) {
        if (item.endpoint !== endpoint()) continue;
        attempted.add(item.payload.attemptId);
        status("Menyimpan hasil ke klasemen…");
        try {
          await api("saveResults",item.payload);
          queue = queue.filter(q=>q.payload.attemptId !== item.payload.attemptId || q.endpoint !== item.endpoint);
          write(KEY,queue);
          status("Hasil tersimpan di Spreadsheet ✓");
        } catch(e) {lastError = e.message;}
      }
      if(queue.length)status(lastError ? `Belum terkirim: ${lastError} ${queue.length} hasil tetap dalam antrean. Tekan Kirim ulang.` : `${queue.length} hasil masih menunggu. Periksa URL database game.`);
    } catch(e) {status(`Belum terkirim: ${e.message} Hasil tetap dalam antrean. Tekan Kirim ulang.`);}
    finally {
      syncing = false;
      if (queue.some(q=>q.endpoint === endpoint() && !attempted.has(q.payload.attemptId))) sync();
    }
  }
  addEventListener("online",sync);
  addEventListener("message",e=>{
    const frame = document.querySelector("#arcade-frame"), data = e.data;
    if (!frame || e.source !== frame.contentWindow || e.origin !== location.origin || data?.type !== "HUMA_GAME" || data.gameId !== frame.dataset.game) return;
    if (data.event === "ready") {
      frame.contentWindow.postMessage({type:"HUMA_GAME_CONTEXT",profile},location.origin);return;
    }
    if (data.event !== "result" || !/^[\w-]{12,100}$/.test(data.attemptId || "") || !Array.isArray(data.results) || !data.results.length || data.results.length>60) return;
    if (queue.some(q=>q.payload.attemptId===data.attemptId)) return;
    const item = {endpoint:endpoint(),payload:{gameId:data.gameId,attemptId:data.attemptId,results:data.results}};
    queue.push(item);
    if (!write(KEY,queue)) status("Hasil ada di sesi ini; penyimpanan browser penuh. Jangan tutup halaman sebelum terkirim.");
    sync();
  });
  function bindSync(root) {root.querySelector("[data-game-retry]")?.addEventListener("click",sync);sync();}
  function mountLeaderboard(root,catalog) {
    document.title = "Klasemen Game — Huma Belajar";
    root.innerHTML = `<a class="text-link" href="#game">← Zona Game</a><div class="ag-section"><span class="ag-kicker">PRESTASI KELAS</span><h1>Klasemen game</h1><p>Skor terbaik setiap nama dan kelas. Pilih mode yang sama untuk membandingkan hasil.</p></div><form id="ag-rank-filter" class="ag-rank-filter"><label>Game<select name="gameId">${catalog.map(g=>`<option value="${g.id}">${g.title}</option>`).join("")}</select></label><label>Mode<select name="mode"><option value="">Semua mode</option></select></label><label>Kelas<input name="className" maxlength="40" placeholder="Semua kelas"></label><button class="button small" type="submit">Tampilkan</button></form><div class="ag-sync"><span data-game-sync role="status"></span><button type="button" class="text-link" data-game-retry>Kirim ulang</button></div><div id="ag-rank-results" aria-live="polite"></div>`;
    const form = root.querySelector("#ag-rank-filter"), box = root.querySelector("#ag-rank-results");
    let lastGame = "";
    async function show(e) {
      e?.preventDefault();
      const seq = ++request, gameId = form.elements.gameId.value;
      if (lastGame !== gameId) form.elements.mode.value = "";
      lastGame = gameId;
      const mode = form.elements.mode.value;
      box.innerHTML = '<p class="helper" role="status">Memuat klasemen…</p>';
      try {
        const data = await api("getLeaderboard",{gameId,mode,className:form.elements.className.value.trim()});
        if (seq !== request || !box.isConnected) return;
        form.elements.mode.innerHTML = '<option value="">Semua mode</option>' + (data.modes || []).map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join("");
        form.elements.mode.value = mode;
        const nativeWords = ["balon-kata","pabrik-kata"].includes(gameId);
        box.innerHTML = `<p class="helper">${Number(data.participants) || 0} pemain/tim · maksimal 100 peringkat ditampilkan${nativeWords ? " · urutan berdasarkan kata benar, lalu poin" : ""}.</p>` + (data.rows?.length ? `<div class="table-wrap"><table><thead><tr><th>PERINGKAT</th><th>NAMA / TIM</th><th>KELAS</th><th>SKOR</th><th>BENAR</th><th>MODE</th></tr></thead><tbody>${data.rows.map(r=>`<tr><td><strong>#${Number(r.rank)}</strong></td><td>${esc(r.name)}</td><td>${esc(r.className)}</td><td><strong>${Number(r.score).toLocaleString("id-ID")}</strong></td><td>${r.correct==null ? "—" : Number(r.correct)}</td><td>${esc(r.mode)}</td></tr>`).join("")}</tbody></table></div>` : '<div class="paper"><h2>Belum ada hasil</h2><p>Selesaikan permainan agar hasilnya muncul di sini.</p></div>');
      } catch(e) {if(seq===request && box.isConnected)box.innerHTML = `<div class="paper"><h2>Klasemen belum dapat dimuat</h2><p>${esc(e.message)}</p><button class="button small" type="button" id="ag-rank-retry">Coba lagi</button></div>`;box.querySelector("#ag-rank-retry")?.addEventListener("click",show);}
    }
    form.onsubmit = show;
    form.elements.gameId.onchange = show;
    bindSync(root);show();
  }
  return {setUser,hasProfile,formHTML,bindForm,bindSync,mountLeaderboard,getProfile:()=>({...profile})};
})();
