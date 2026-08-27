/**
 * Ponte entre o painel DS-160 (cpvistos) e o service worker da extensão.
 * v1.5.3 — janela no tamanho do quadro; transfer fail-fast ~8s; pin pausado.
 */

const EXT_VERSION = "1.5.3";

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

function sendRuntime(message, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      reject(new Error("Tempo esgotado aguardando a extensão (service worker)."));
    }, timeoutMs);

    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        const err = chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message));
          return;
        }
        resolve(response);
      });
    } catch (error) {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

async function sendRuntimeWithRetry(message, attempts = 2) {
  let lastError = null;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await sendRuntime(message, 8000);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 150 + i * 200));
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Extensão não respondeu após novas tentativas.");
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
    })
      .then(() => sendRuntime({ type: "pin-ceac-window", ms: 60000 }))
      .catch(() => {});
    return;
  }

  if (data.type === "CP_VISTOS_FOCUS_CEAC") {
    void sendRuntime({ type: "focus-ceac-window" }).catch(() => {});
    return;
  }

  if (data.type === "CP_VISTOS_PIN_CEAC") {
    void sendRuntime({ type: "pin-ceac-window", ms: 15000 }).catch(() => {});
    return;
  }

  if (data.type === "CP_VISTOS_UNPIN_CEAC") {
    void sendRuntime({ type: "unpin-ceac-window" }).catch(() => {});
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
    void (async () => {
      try {
        await sendRuntime({ type: "unpin-ceac-window" }).catch(() => {});
        const response = await sendRuntimeWithRetry({
          type: "transfer-ceac-fields",
          fields: data.fields || [],
          pageId: data.pageId || "",
          pageTitle: data.pageTitle || "",
        });
        postTransferResult(requestId, {
          ok: Boolean(response?.ok),
          filled: response?.filled ?? 0,
          skipped: response?.skipped ?? 0,
          details: response?.details || [],
          error: response?.error || null,
        });
      } catch (error) {
        postTransferResult(requestId, {
          ok: false,
          filled: 0,
          skipped: 0,
          error:
            error instanceof Error
              ? error.message
              : "Extensão não respondeu. Recarregue a extensão CP Vistos (chrome://extensions) e esta página.",
        });
      } finally {
        void sendRuntime({ type: "pin-ceac-window", ms: 20000 }).catch(() => {});
      }
    })();
  }
});

markReady();
