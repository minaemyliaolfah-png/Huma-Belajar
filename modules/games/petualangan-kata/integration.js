// Komunikasi hanya dengan halaman induk pada asal yang sama.
window.addEventListener("message", (event) => {
  if (
    event.source !== parent ||
    event.origin !== location.origin ||
    event.data?.type !== "HUMA_VISIBILITY"
  )
    return;
  document.documentElement.dataset.humaHidden = event.data.visible ? "0" : "1";
  if (
    !event.data.visible &&
    typeof audioCtx !== "undefined" &&
    audioCtx?.state === "running"
  )
    audioCtx.suspend().catch(() => {});
});
