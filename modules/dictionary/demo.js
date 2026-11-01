// Data partisipasi fiktif hanya untuk mode contoh. Tidak dikirim ke server.
window.HumaDictionaryDemo = (() => {
  const MAX_CONTRIBUTORS = 56,
    REVIEWED = 144,
    PENDING = 8;
  function seed(local, corpus) {
    if (local.participationVersion === 1) return;
    const remaining = Math.max(0, MAX_CONTRIBUTORS - local.contributors.length);
    for (let i = 0; i < remaining; i++) {
      const n = i + 1;
      local.contributors.push({
        id: "SAMPLE-C-" + String(n).padStart(2, "0"),
        user_id: "SAMPLE-USER-" + n,
        nama: "Kontributor " + String(n).padStart(2, "0"),
        bio: "Profil contoh partisipasi komunitas Huma Belajar.",
        synthetic: true,
        diterima: 0,
        joined: new Date(Date.now() - (i + 3) * 86400000).toISOString(),
      });
    }
    const profiles = local.contributors.filter((c) => c.synthetic);
    if (!profiles.length) {
      local.participationVersion = 1;
      return;
    }
    corpus.entries.slice(0, REVIEWED).forEach((e, i) => {
      const id = "SAMPLE-ACCEPTED-" + i;
      if (local.proposals.some((p) => p.id === id)) return;
      local.proposals.push({
        id,
        jenis: "Koreksi",
        target_id: e.id,
        contributor_id: profiles[i % profiles.length].id,
        dayak: e.dayak,
        indo: e.indo,
        inggris: e.inggris,
        kategori: e.kategori,
        alasan: "Contoh partisipasi: pelengkapan dan peninjauan padanan kata.",
        status: "Diterima",
        diajukan: new Date(
          Date.now() - ((i % 25) + 2) * 86400000,
        ).toISOString(),
        catatan: "Contoh keputusan kurator untuk pratinjau.",
        synthetic: true,
      });
    });
    corpus.entries.slice(200, 200 + PENDING).forEach((e, i) => {
      const id = "SAMPLE-PENDING-" + i;
      if (local.proposals.some((p) => p.id === id)) return;
      local.proposals.push({
        id,
        jenis: "Koreksi",
        target_id: e.id,
        contributor_id: profiles[i % profiles.length].id,
        dayak: e.dayak,
        indo: e.indo,
        inggris: e.inggris,
        kategori: e.kategori,
        alasan:
          "Data contoh untuk mencoba pemeriksaan padanan Indonesia dan Inggris.",
        status: "Menunggu",
        diajukan: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
        catatan: "",
        baseline: JSON.stringify([
          e.dayak,
          e.indo,
          e.inggris || "",
          e.kategori,
        ]),
        synthetic: true,
      });
    });
    local.participationVersion = 1;
  }
  function entries(local, corpus) {
    const byId = new Map(corpus.entries.map((e) => [e.id, e]));
    return local.proposals
      .filter((p) => p.synthetic && p.status === "Diterima")
      .map((p) => ({
        ...byId.get(p.target_id),
        id: p.target_id,
        dayak: p.dayak,
        indo: p.indo,
        inggris: p.inggris,
        kategori: p.kategori,
        status_verifikasi: "Terverifikasi",
        id_kontributor: p.contributor_id,
        status_inggris: "Contoh tinjauan",
        demo: true,
      }));
  }
  return { seed, entries };
})();
