const CEAC_URL = "https://ceac.state.gov/GenNIV/Default.aspx";
const STORAGE_KEY = "ceacWindowId";

let ceacWindowId = null;

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === ceacWindowId) {
    ceacWindowId = null;
    chrome.storage.session.set({ [STORAGE_KEY]: null }).catch(() => {});
  }
});

async function loadStoredWindowId() {
  if (ceacWindowId != null) {
    return ceacWindowId;
  }
  try {
    const stored = await chrome.storage.session.get(STORAGE_KEY);
    const id = stored?.[STORAGE_KEY];
    if (typeof id === "number") {
      ceacWindowId = id;
    }
  } catch {
    // storage.session pode falhar em versões antigas — ignora
  }
  return ceacWindowId;
}

async function rememberWindowId(id) {
  ceacWindowId = id ?? null;
  try {
    await chrome.storage.session.set({ [STORAGE_KEY]: ceacWindowId });
  } catch {
    // ignore
  }
}

function isCeacUrl(url) {
  return typeof url === "string" && /ceac\.state\.gov|\.state\.gov\/GenNIV/i.test(url);
}

async function findCeacTab() {
  await loadStoredWindowId();

  if (ceacWindowId != null) {
    try {
      const tabs = await chrome.tabs.query({ windowId: ceacWindowId });
      const hit = tabs.find((tab) => isCeacUrl(tab.url || ""));
      if (hit?.id != null) {
        return hit;
      }
    } catch {
      await rememberWindowId(null);
    }
  }

  const all = await chrome.tabs.query({});
  return all.find((tab) => isCeacUrl(tab.url || "")) || null;
}

let focusGeneration = 0;
let pinUntil = 0;
let pinTimer = null;

async function raiseWindow(windowId, tabId) {
  // Não força state:"normal" a cada raise — evita flicker / “sumir”.
  await chrome.windows.update(windowId, {
    focused: true,
    drawAttention: true,
  });
  if (tabId != null) {
    await chrome.tabs.update(tabId, { active: true });
  }
}

async function bringCeacToFront(tab, options = {}) {
  if (!tab?.windowId) {
    return { ok: false };
  }

  await rememberWindowId(tab.windowId);

  const persistent = Boolean(options.persistent);
  if (!persistent) {
    try {
      await raiseWindow(tab.windowId, tab.id);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  const generation = ++focusGeneration;
  const schedule = [0, 40, 100, 220, 400, 700];
  let ok = false;
  let lastAt = 0;
  try {
    for (const at of schedule) {
      if (generation !== focusGeneration) {
        return { ok };
      }
      const wait = Math.max(0, at - lastAt);
      lastAt = at;
      if (wait) {
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
      if (generation !== focusGeneration) {
        return { ok };
      }
      try {
        await raiseWindow(tab.windowId, tab.id);
        ok = true;
      } catch {
        // tenta de novo
      }
    }
    return { ok };
  } catch {
    return { ok: false };
  }
}

async function pinTick() {
  if (Date.now() > pinUntil) {
    if (pinTimer != null) {
      clearInterval(pinTimer);
      pinTimer = null;
    }
    return;
  }
  const tab = await findCeacTab();
  if (!tab?.windowId) {
    return;
  }
  try {
    await raiseWindow(tab.windowId, tab.id);
  } catch {
    // ignore
  }
}

function pinCeacWindow(ms = 8000) {
  pinUntil = Math.max(pinUntil, Date.now() + ms);
  if (pinTimer == null) {
    pinTimer = setInterval(() => {
      void pinTick();
    }, 900);
  }
  void pinTick();
  return { ok: true };
}

function unpinCeacWindow() {
  pinUntil = 0;
  if (pinTimer != null) {
    clearInterval(pinTimer);
    pinTimer = null;
  }
  return { ok: true };
}

async function openCeacWindow(bounds) {
  await loadStoredWindowId();

  const applyBounds = {
    focused: true,
    drawAttention: true,
    state: "normal",
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
    height: bounds.height,
  };

  if (ceacWindowId != null) {
    try {
      await chrome.windows.update(ceacWindowId, applyBounds);
      await chrome.windows.update(ceacWindowId, applyBounds);
      const tab = await findCeacTab();
      if (tab) {
        await bringCeacToFront(tab, { persistent: true });
      }
      pinCeacWindow(60000);
      return { ok: true };
    } catch {
      await rememberWindowId(null);
    }
  }

  const created = await chrome.windows.create({
    url: CEAC_URL,
    type: "popup",
    focused: true,
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
    height: bounds.height,
  });

  await rememberWindowId(created?.id ?? null);
  if (ceacWindowId != null) {
    try {
      await chrome.windows.update(ceacWindowId, applyBounds);
    } catch {
      // ignore
    }
  }
  pinCeacWindow(60000);
  return { ok: Boolean(ceacWindowId) };
}

async function focusCeacWindow() {
  pinCeacWindow(8000);
  const tab = await findCeacTab();
  if (!tab) {
    return { ok: false };
  }
  // Raise único — persistent aqui competia com o Transferir.
  return bringCeacToFront(tab, { persistent: false });
}

async function closeCeacWindow() {
  unpinCeacWindow();
  await loadStoredWindowId();
  if (ceacWindowId == null) {
    const tab = await findCeacTab();
    if (tab?.windowId != null) {
      await rememberWindowId(tab.windowId);
    }
  }
  if (ceacWindowId != null) {
    try {
      await chrome.windows.remove(ceacWindowId);
    } catch {
      // já fechada
    }
  }
  await rememberWindowId(null);
  return { ok: true };
}

async function openCeacPanel(windowId) {
  await chrome.sidePanel.setOptions({
    windowId,
    path: "sidepanel.html",
    enabled: true,
  });
  await chrome.sidePanel.open({ windowId });
  return { ok: true };
}

async function transferToCeac(payload) {
  // Pausa o pin para o fill não perder eventos de input no CEAC.
  unpinCeacWindow();

  let tab = await findCeacTab();

  if (!tab?.id) {
    await openCeacWindow({
      left: 80,
      top: 40,
      width: 980,
      height: 860,
    });
    for (let i = 0; i < 24; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      tab = await findCeacTab();
      if (tab?.id) {
        break;
      }
    }
  }

  if (!tab?.id) {
    pinCeacWindow(60000);
    return {
      ok: false,
      error: "Abra o CEAC primeiro (botão Abrir CEAC neste quadro).",
    };
  }

  await bringCeacToFront(tab, { persistent: false });
  await new Promise((resolve) => setTimeout(resolve, 80));

  const message = {
    type: "fill-ceac-fields",
    fields: payload.fields || [],
    pageId: payload.pageId || "",
    pageTitle: payload.pageTitle || "",
  };

  async function injectAllFrames() {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ["content-ceac.js"],
      });
    } catch {
      // frame cross-origin / já injetado
    }
  }

  async function pickBestFrameId() {
    try {
      const probes = await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: () => {
          const nodes = document.querySelectorAll(
            "input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea",
          );
          let visible = 0;
          for (const el of nodes) {
            const style = window.getComputedStyle(el);
            if (style.display === "none" || style.visibility === "hidden") {
              continue;
            }
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              visible += 1;
            }
          }
          return { count: visible, href: location.href };
        },
      });
      let best = null;
      for (const probe of probes || []) {
        const count = Number(probe?.result?.count) || 0;
        if (!best || count > best.count) {
          best = { frameId: probe.frameId, count };
        }
      }
      return best?.count > 0 ? best.frameId : 0;
    } catch {
      return 0;
    }
  }

  async function sendFill(frameId) {
    try {
      const direct = await chrome.scripting.executeScript({
        target: { tabId: tab.id, frameIds: [frameId] },
        func: (payload) => {
          if (typeof window.__cpVistosRunFill === "function") {
            return window.__cpVistosRunFill(payload);
          }
          return null;
        },
        args: [message],
      });
      const result = direct?.[0]?.result;
      if (result && typeof result === "object") {
        return result;
      }
    } catch {
      // cai no sendMessage
    }
    return chrome.tabs.sendMessage(tab.id, message, { frameId });
  }

  try {
    await injectAllFrames();
    const frameId = await pickBestFrameId();
    let response = null;
    try {
      response = await sendFill(frameId);
    } catch {
      await injectAllFrames();
      await new Promise((resolve) => setTimeout(resolve, 80));
      response = await sendFill(frameId);
    }

    pinCeacWindow(60000);
    await bringCeacToFront(tab, { persistent: false });

    if (!response) {
      return { ok: false, error: "Sem resposta do CEAC" };
    }
    if (!response.ok && response.filled === 0) {
      return {
        ok: false,
        filled: 0,
        skipped: response.skipped || 0,
        error:
          response.error ||
          "Nenhum campo correspondeu a esta tela do CEAC. Confira se está na página certa e tente de novo.",
      };
    }
    return response;
  } catch (error) {
    pinCeacWindow(60000);
    await bringCeacToFront(tab, { persistent: false });
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível transferir para o CEAC. Recarregue a aba do CEAC e a extensão.",
    };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const windowId = sender.tab?.windowId;

  if (message?.type === "open-ceac-window") {
    openCeacWindow({
      left: Number(message.left) || 0,
      top: Number(message.top) || 0,
      width: Math.max(480, Number(message.width) || 800),
      height: Math.max(520, Number(message.height) || 800),
    }).then(sendResponse, () => sendResponse({ ok: false }));
    return true;
  }

  if (message?.type === "focus-ceac-window") {
    focusCeacWindow().then(sendResponse, () => sendResponse({ ok: false }));
    return true;
  }

  if (message?.type === "pin-ceac-window") {
    sendResponse(pinCeacWindow(Number(message.ms) || 15000));
    return false;
  }

  if (message?.type === "unpin-ceac-window") {
    sendResponse(unpinCeacWindow());
    return false;
  }

  if (message?.type === "close-ceac-window") {
    closeCeacWindow().then(sendResponse, () => sendResponse({ ok: false }));
    return true;
  }

  if (message?.type === "open-ceac-panel") {
    const targetWindowId = windowId ?? message.windowId;
    if (targetWindowId == null) {
      chrome.windows.getCurrent().then((win) => {
        if (win?.id == null) {
          sendResponse({ ok: false });
          return;
        }
        openCeacPanel(win.id).then(sendResponse, () => sendResponse({ ok: false }));
      }, () => sendResponse({ ok: false }));
      return true;
    }

    openCeacPanel(targetWindowId).then(sendResponse, () => sendResponse({ ok: false }));
    return true;
  }

  if (message?.type === "transfer-ceac-fields") {
    transferToCeac(message).then(sendResponse, (error) =>
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Falha na transferência",
      }),
    );
    return true;
  }
});
