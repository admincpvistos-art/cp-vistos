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
  if (ceacWindowId == null) {
    return { ok: false };
  }

  try {
    await chrome.windows.update(ceacWindowId, { focused: true });
    return { ok: true };
  } catch {
    ceacWindowId = null;
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
});
