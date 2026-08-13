window.addEventListener("message", (event) => {
  if (event.source !== window) {
    return;
  }

  if (event.data?.type === "CP_VISTOS_OPEN_CEAC_WINDOW") {
    chrome.runtime.sendMessage({
      type: "open-ceac-window",
      left: event.data.left,
      top: event.data.top,
      width: event.data.width,
      height: event.data.height,
    });
  }

  if (event.data?.type === "CP_VISTOS_FOCUS_CEAC") {
    chrome.runtime.sendMessage({ type: "focus-ceac-window" });
  }

  if (event.data?.type === "CP_VISTOS_OPEN_CEAC_PANEL") {
    chrome.runtime.sendMessage({ type: "open-ceac-panel" });
  }

  if (event.data?.type === "CP_VISTOS_CEAC_EXT_PING") {
    window.postMessage({ type: "CP_VISTOS_CEAC_EXT", ready: true }, "*");
  }
});

window.postMessage({ type: "CP_VISTOS_CEAC_EXT", ready: true }, "*");
