window.addEventListener("message", (event) => {
  if (event.source !== window) {
    return;
  }

  if (event.data?.type === "CP_VISTOS_OPEN_CEAC_PANEL") {
    chrome.runtime.sendMessage({ type: "open-ceac-panel" });
  }
});

window.postMessage({ type: "CP_VISTOS_CEAC_EXT", ready: true }, "*");
