const CEAC_URL = "https://ceac.state.gov/GenNIV/Default.aspx";

let ceacWindowId = null;

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === ceacWindowId) {
    ceacWindowId = null;
  }
});

function isCeacUrl(url) {
  return typeof url === "string" && /ceac\.state\.gov|\.state\.gov\/GenNIV/i.test(url);
}

async function findCeacTab() {
  if (ceacWindowId != null) {
    try {
      const tabs = await chrome.tabs.query({ windowId: ceacWindowId });
      const hit = tabs.find((tab) => isCeacUrl(tab.url || ""));
      if (hit?.id != null) {
        return hit;
      }
    } catch {
      ceacWindowId = null;
    }
  }

  const all = await chrome.tabs.query({});
  return all.find((tab) => isCeacUrl(tab.url || "")) || null;
}

async function openCeacWindow(bounds) {
  if (ceacWindowId != null) {
    try {
      await chrome.windows.update(ceacWindowId, {
        focused: true,
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
      });
      return { ok: true };
    } catch {
      ceacWindowId = null;
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

  ceacWindowId = created?.id ?? null;
  return { ok: Boolean(ceacWindowId) };
}

async function focusCeacWindow() {
  const tab = await findCeacTab();
  if (!tab?.windowId) {
    return { ok: false };
  }

  try {
    ceacWindowId = tab.windowId;
    await chrome.windows.update(tab.windowId, { focused: true });
    if (tab.id != null) {
      await chrome.tabs.update(tab.id, { active: true });
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
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
    // Aguarda a aba carregar o CEAC.
    for (let i = 0; i < 20; i += 1) {
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

  ceacWindowId = tab.windowId ?? ceacWindowId;

  try {
    await chrome.windows.update(tab.windowId, { focused: true });
    await chrome.tabs.update(tab.id, { active: true });
  } catch {
    // segue mesmo se o foco falhar
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "fill-ceac-fields",
      fields: payload.fields || [],
      pageId: payload.pageId || "",
      pageTitle: payload.pageTitle || "",
    });
    return response || { ok: false, error: "Sem resposta do CEAC" };
  } catch (error) {
    // Content script pode não estar injetado ainda — tenta injetar.
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

  if (message?.type === "open-ceac-panel") {
    if (windowId == null) {
      sendResponse({ ok: false });
      return;
    }

    openCeacPanel(windowId).then(sendResponse, () => sendResponse({ ok: false }));
    return true;
  }

  if (message?.type === "transfer-ceac-fields") {
    transferToCeac(message)
      .then(sendResponse, (error) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Falha na transferência",
        }),
      );
    return true;
  }
});
