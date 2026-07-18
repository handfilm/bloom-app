/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
go('home');
updateStats();
initPin();
updateStorageBar();
// update storage bar every 30s
setInterval(updateStorageBar, 30000);
