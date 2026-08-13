chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "open-ceac-panel") {
    return;
  }

  const windowId = sender.tab?.windowId;
  if (windowId == null) {
    sendResponse({ ok: false });
    return;
  }

  chrome.sidePanel.setOptions({
    windowId,
    path: "sidepanel.html",
    enabled: true,
  });
  chrome.sidePanel.open({ windowId }).then(
    () => sendResponse({ ok: true }),
    () => sendResponse({ ok: false }),
  );

  return true;
});
