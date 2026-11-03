/* Dipanggil oleh hook start/finish pada masing-masing index.html game. */
(() => {
  "use strict";
  if (parent === window) return;
  const gameId = document.currentScript.dataset.game;
  const origin = location.origin;
  const nonce = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
  let run = 0, sent = false, since = Date.now(), profile = {};
  const post = data => parent.postMessage({ type: "HUMA_GAME", gameId, ...data }, origin);
  addEventListener("message", e => {
    if (e.source !== parent || e.origin !== origin || e.data?.type !== "HUMA_GAME_CONTEXT") return;
    profile = e.data.profile || {};
    const name = document.getElementById("nameInput");
    if (name && profile.name && /^(?:peserta|pemain|player)\s*0?1$/i.test(name.value.trim())) name.value = profile.name;
  });
  window.HumaGameBridge = {
    start() {
      run++; sent = false; since = Date.now();
      // Opening a low-positioned setup button must not leave the play screen scrolled down.
      requestAnimationFrame(()=>window.scrollTo(0,0));
    },
    finish(rows, meta = {}) {
      if (sent || !Array.isArray(rows) || !rows.length) return;
      const results = rows.map(row => {
        let name = String(row.name || "").trim();
        const slot = row.slot || 1;
        if (!name || (rows.length === 1 && /^(?:player|pemain|peserta)\s*0?1$/i.test(name))) {
          name = slot === 2 ? profile.secondName || profile.name + " · P2" : profile.name;
        }
        return {
          name: String(name || "Pemain").slice(0, 60), className: String(profile.className || "").slice(0, 40),
          score: Number(row.score), correct: row.correct == null ? null : Number(row.correct),
          total: row.total == null ? null : Number(row.total),
          duration: Math.max(0, Math.round(row.duration ?? meta.duration ?? (Date.now() - since) / 1000)),
          mode: String(meta.mode || "Standar").slice(0, 100), result: String(row.result || "Selesai").slice(0, 40),
        };
      });
      if (results.some(r => !Number.isFinite(r.score))) return;
      sent = true;
      post({ event: "result", attemptId: nonce + "-" + run, results });
    },
  };
  window.HumaGameBridge.start();
  post({ event: "ready" });
})();
