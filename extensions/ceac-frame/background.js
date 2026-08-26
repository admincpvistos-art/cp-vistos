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

async function bringCeacToFront(tab) {
  if (!tab?.windowId) {
    return { ok: false };
  }

  await rememberWindowId(tab.windowId);

  try {
    await chrome.windows.update(tab.windowId, {
      focused: true,
      drawAttention: true,
      state: "normal",
    });
    if (tab.id != null) {
      await chrome.tabs.update(tab.id, { active: true });
    }
    // Segunda tentativa curta — o clique no CP Vistos tira o foco.
    await new Promise((resolve) => setTimeout(resolve, 80));
    await chrome.windows.update(tab.windowId, { focused: true, drawAttention: true });
    return { ok: true };
  } catch {
    return { ok: false };
  }
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
      // Chrome às vezes ignora o primeiro resize — reaplica.
      await chrome.windows.update(ceacWindowId, applyBounds);
      const tab = await findCeacTab();
      if (tab) {
        await bringCeacToFront(tab);
      }
      return { ok: true };
    } catch {
      await rememberWindowId(null);
    }
  }

  const created = await chrome.windows.create({
    url: CEAC_URL,
    type: "normal",
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
  return { ok: Boolean(ceacWindowId) };
}

async function focusCeacWindow() {
  const tab = await findCeacTab();
  if (!tab) {
    return { ok: false };
  }
  return bringCeacToFront(tab);
}

async function closeCeacWindow() {
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
    return {
      ok: false,
      error: "Abra o CEAC primeiro (botão Abrir CEAC neste quadro).",
    };
  }

  await bringCeacToFront(tab);

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "fill-ceac-fields",
      fields: payload.fields || [],
      pageId: payload.pageId || "",
      pageTitle: payload.pageTitle || "",
    });
    await bringCeacToFront(tab);
    return response || { ok: false, error: "Sem resposta do CEAC" };
  } catch (error) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content-ceac.js"],
      });
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: "fill-ceac-fields",
        fields: payload.fields || [],
        pageId: payload.pageId || "",
        pageTitle: payload.pageTitle || "",
      });
      await bringCeacToFront(tab);
      return response || { ok: false, error: "Sem resposta do CEAC" };
    } catch (injectError) {
      return {
        ok: false,
        error:
          injectError instanceof Error
            ? injectError.message
            : "Não foi possível injetar no CEAC. Recarregue a aba do CEAC e tente de novo.",
      };
    }
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
