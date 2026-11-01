(function (root) {
  function url(value) {
    const s = String(value || "").trim();
    if (
      /^assets\/karya\/[a-zA-Z0-9._/-]+$/.test(s) &&
      !s.split("/").includes("..")
    )
      return s;
    try {
      const u = new URL(s);
      return u.protocol === "https:" ? u.href : "";
    } catch {
      return "";
    }
  }
  function video(value) {
    try {
      const u = new URL(value);
      let id = "";
      if (
        ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(u.hostname)
      )
        id =
          u.searchParams.get("v") ||
          u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] ||
          "";
      if (u.hostname === "youtu.be") id = u.pathname.slice(1);
      return /^[\w-]{11}$/.test(id) ? id : "";
    } catch {
      return "";
    }
  }
  function image(value) {
    const s = url(value);
    if (!s) return "";
    try {
      const u = new URL(s);
      if (u.hostname === "drive.google.com") {
        const id =
          u.pathname.match(/\/file\/d\/([\w-]+)/)?.[1] ||
          u.searchParams.get("id");
        if (id)
          return (
            "https://drive.google.com/thumbnail?id=" +
            encodeURIComponent(id) +
            "&sz=w1200"
          );
      }
    } catch {}
    return s;
  }
  function filter(items, q, type, manager) {
    const term = String(q || "")
      .toLowerCase()
      .trim();
    return items.filter(
      (w) =>
        (manager || w.status === "Terbit") &&
        (!type || w.jenis === type) &&
        (!term ||
          [w.judul, w.nama, w.kelas, w.deskripsi]
            .join(" ")
            .toLowerCase()
            .includes(term)),
    );
  }
  const api = { url, video, image, filter };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.HumaWorksCore = api;
})(typeof window !== "undefined" ? window : globalThis);
