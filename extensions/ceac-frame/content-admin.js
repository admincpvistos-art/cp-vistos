/**
 * Ponte entre o painel DS-160 (cpvistos) e o service worker da extensão.
 */
window.addEventListener("message", (event) => {
  if (event.source !== window) {
    return;
  }

  const data = event.data;
  if (!data || typeof data.type !== "string") {
    return;
  }

  if (data.type === "CP_VISTOS_OPEN_CEAC_WINDOW") {
    chrome.runtime.sendMessage({
      type: "open-ceac-window",
      left: data.left,
      top: data.top,
      width: data.width,
      height: data.height,
    });
    return;
  }

  if (data.type === "CP_VISTOS_FOCUS_CEAC") {
    chrome.runtime.sendMessage({ type: "focus-ceac-window" });
    return;
  }

  if (data.type === "CP_VISTOS_OPEN_CEAC_PANEL") {
    chrome.runtime.sendMessage({ type: "open-ceac-panel" });
    return;
  }

  if (data.type === "CP_VISTOS_CEAC_EXT_PING") {
    window.postMessage({ type: "CP_VISTOS_CEAC_EXT", ready: true, version: "1.3.0" }, "*");
    return;
  }

  if (data.type === "CP_VISTOS_TRANSFER_CEAC") {
    chrome.runtime.sendMessage(
      {
        type: "transfer-ceac-fields",
        fields: data.fields || [],
        pageId: data.pageId || "",
        pageTitle: data.pageTitle || "",
      },
      (response) => {
        const err = chrome.runtime.lastError;
        window.postMessage(
          {
            type: "CP_VISTOS_TRANSFER_CEAC_RESULT",
            requestId: data.requestId || null,
            ok: !err && Boolean(response?.ok),
            filled: response?.filled ?? 0,
            skipped: response?.skipped ?? 0,
            details: response?.details || [],
            error: err?.message || response?.error || null,
          },
          "*",
        );
      },
    );
  }
});

window.postMessage({ type: "CP_VISTOS_CEAC_EXT", ready: true, version: "1.3.0" }, "*");
