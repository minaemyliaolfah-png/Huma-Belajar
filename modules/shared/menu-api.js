/* Sesi per endpoint, agar token database yang berbeda tidak tercampur. */
window.HumaMenuAPI = (() => {
  const clients = new Map();
  function create(name, url) {
    const identity = name + ":" + url;
    if (clients.has(identity)) return clients.get(identity);
    const key = "huma-menu-session-" + name;
    let session = null;
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) || "null");
      if (saved?.url === url) session = saved;
    } catch {}
    function setSession(result) {
      session = result?.user
        ? { url, user: result.user, token: result.token }
        : null;
      try {
        if (session) sessionStorage.setItem(key, JSON.stringify(session));
        else sessionStorage.removeItem(key);
      } catch {}
    }
    async function api(action, body = {}) {
      const controller = new AbortController(),
        timer = setTimeout(() => controller.abort(), 25000);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          redirect: "follow",
          body: JSON.stringify({
            action,
            ...body,
            token: session?.token || "",
          }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Server menu belum dapat dihubungi.");
        let value;
        try {
          value = await response.json();
        } catch {
          throw new Error(
            "Respons server tidak sesuai. Periksa URL deployment /exec.",
          );
        }
        if (value.status !== "success") {
          if (value.code === "AUTH") setSession(null);
          const e = new Error(value.message || "Permintaan belum berhasil.");
          e.code = value.code;
          throw e;
        }
        return value;
      } catch (e) {
        if (e.name === "AbortError")
          throw new Error("Server terlalu lama merespons. Coba lagi.");
        throw e;
      } finally {
        clearTimeout(timer);
      }
    }
    const client = {
      api,
      setSession,
      get user() {
        return session?.user || null;
      },
      async login(credentials) {
        const result = await api("login", credentials);
        setSession(result);
        return result;
      },
      async logout() {
        try {
          await api("logout");
        } finally {
          setSession(null);
        }
      },
    };
    clients.set(identity, client);
    return client;
  }
  return { create };
})();
