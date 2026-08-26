/**
 * Ponte entre o painel DS-160 (cpvistos) e o service worker da extensão.
 * v1.4.0 — handshake via DOM attribute + postMessage, respostas sempre garantidas.
 */

const EXT_VERSION = "1.4.0";

function markReady() {
  try {
    document.documentElement.setAttribute("data-cp-vistos-ceac-ext", EXT_VERSION);
    document.documentElement.setAttribute("data-cp-vistos-ext-id", chrome.runtime.id);
  } catch {
    // ignore
  }
  window.postMessage(
    { type: "CP_VISTOS_CEAC_EXT", ready: true, version: EXT_VERSION },
    "*",
  );
}

function postTransferResult(requestId, payload) {
  window.postMessage(
    {
      type: "CP_VISTOS_TRANSFER_CEAC_RESULT",
      requestId: requestId || null,
      ok: Boolean(payload?.ok),
      filled: payload?.filled ?? 0,
      skipped: payload?.skipped ?? 0,
      details: payload?.details || [],
      error: payload?.error || null,
    },
    "*",
  );
}

function sendRuntime(message) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        const err = chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message));
          return;
        }
        resolve(response);
      });
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

window.addEventListener("message", (event) => {
  if (event.source !== window) {
    return;
  }

  const data = event.data;
  if (!data || typeof data.type !== "string") {
    return;
  }

  if (data.type === "CP_VISTOS_OPEN_CEAC_WINDOW") {
    void sendRuntime({
      type: "open-ceac-window",
      left: data.left,
      top: data.top,
      width: data.width,
      height: data.height,
    }).catch(() => {});
    return;
  }

  if (data.type === "CP_VISTOS_FOCUS_CEAC") {
    void sendRuntime({ type: "focus-ceac-window" }).catch(() => {});
    return;
  }

  if (data.type === "CP_VISTOS_CLOSE_CEAC") {
    void sendRuntime({ type: "close-ceac-window" }).catch(() => {});
    return;
  }

  if (data.type === "CP_VISTOS_OPEN_CEAC_PANEL") {
    void sendRuntime({ type: "open-ceac-panel" }).catch(() => {});
    return;
  }

  if (data.type === "CP_VISTOS_CEAC_EXT_PING") {
    markReady();
    return;
  }

  if (data.type === "CP_VISTOS_TRANSFER_CEAC") {
    const requestId = data.requestId || null;
    void sendRuntime({
      type: "transfer-ceac-fields",
      fields: data.fields || [],
      pageId: data.pageId || "",
      pageTitle: data.pageTitle || "",
    })
      .then((response) => {
        postTransferResult(requestId, {
          ok: Boolean(response?.ok),
          filled: response?.filled ?? 0,
          skipped: response?.skipped ?? 0,
          details: response?.details || [],
          error: response?.error || null,
        });
        // Reafirma o foco no CEAC após a transferência.
        void sendRuntime({ type: "focus-ceac-window" }).catch(() => {});
      })
      .catch((error) => {
        postTransferResult(requestId, {
          ok: false,
          filled: 0,
          skipped: 0,
          error:
            error instanceof Error
              ? error.message
              : "Extensão não respondeu. Recarregue a extensão CP Vistos (chrome://extensions) e esta página.",
        });
      });
  }
});

markReady();
