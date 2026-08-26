import { CEAC_URL } from "@/lib/ds160-ceac";

const CEAC_WINDOW_NAME = "cp-vistos-ceac";

let ceacWindow: Window | null = null;

export function getCeacWindow() {
  if (ceacWindow && ceacWindow.closed) {
    ceacWindow = null;
  }

  return ceacWindow;
}

export function openCeacOverElement(
  element: HTMLElement,
  options?: { useExtension?: boolean },
) {
  const rect = element.getBoundingClientRect();
  const chromeTop =
    window.outerHeight > window.innerHeight
      ? Math.round(window.outerHeight - window.innerHeight)
      : 0;
  const left = Math.max(0, Math.round(window.screenX + rect.left));
  const top = Math.max(0, Math.round(window.screenY + chromeTop + rect.top));
  const width = Math.max(420, Math.round(rect.width));
  const height = Math.max(400, Math.round(rect.height));

  const useExtension = Boolean(options?.useExtension || isCeacExtensionPresent());

  window.postMessage(
    {
      type: "CP_VISTOS_OPEN_CEAC_WINDOW",
      left,
      top,
      width,
      height,
    },
    "*",
  );

  if (useExtension) {
    return null;
  }

  const existing = getCeacWindow();
  if (existing) {
    existing.focus();
    return existing;
  }

  ceacWindow = window.open(
    CEAC_URL,
    CEAC_WINDOW_NAME,
    `width=${width},height=${height},left=${left},top=${top}`,
  );

  return ceacWindow;
}

export function closeCeacWindow() {
  window.postMessage({ type: "CP_VISTOS_CLOSE_CEAC" }, "*");

  const target = getCeacWindow();
  if (target && !target.closed) {
    try {
      target.close();
    } catch {
      // ignore
    }
  }

  ceacWindow = null;
}

/** Abre o CEAC em janela do navegador (popup), não em nova aba. */
export function openCeacInBrowserWindow() {
  if (isCeacExtensionPresent()) {
    const width = Math.min(1280, Math.round((window.screen.availWidth || 1280) * 0.9));
    const height = Math.min(900, Math.round((window.screen.availHeight || 900) * 0.9));
    const left = Math.max(0, Math.round(((window.screen.availWidth || width) - width) / 2));
    const top = Math.max(0, Math.round(((window.screen.availHeight || height) - height) / 2));
    window.postMessage(
      {
        type: "CP_VISTOS_OPEN_CEAC_WINDOW",
        left,
        top,
        width,
        height,
      },
      "*",
    );
    return null;
  }

  const width = Math.min(1280, Math.round((window.screen.availWidth || 1280) * 0.9));
  const height = Math.min(900, Math.round((window.screen.availHeight || 900) * 0.9));
  const left = Math.max(0, Math.round(((window.screen.availWidth || width) - width) / 2));
  const top = Math.max(0, Math.round(((window.screen.availHeight || height) - height) / 2));

  return window.open(
    CEAC_URL,
    "cp-vistos-ceac-external",
    `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
  );
}

export function focusCeacWindow() {
  for (const ms of [0, 120, 350]) {
    window.setTimeout(() => {
      window.postMessage({ type: "CP_VISTOS_FOCUS_CEAC" }, "*");
      const target = getCeacWindow();
      if (!target || target.closed) {
        return;
      }
      try {
        target.focus();
      } catch {
        // ignore
      }
    }, ms);
  }
}

export function isCeacExtensionPresent() {
  if (typeof document === "undefined") {
    return false;
  }
  return Boolean(document.documentElement.getAttribute("data-cp-vistos-ceac-ext"));
}

export function getCeacExtensionVersion() {
  if (typeof document === "undefined") {
    return null;
  }
  return document.documentElement.getAttribute("data-cp-vistos-ceac-ext");
}

export type CeacTransferField = {
  id: string;
  label: string;
  value: string;
};

export type CeacTransferResult = {
  ok: boolean;
  filled: number;
  skipped: number;
  error?: string | null;
};

/** Envia os campos da página atual para a extensão preencher no CEAC aberto. */
export function transferFieldsToCeac(input: {
  fields: CeacTransferField[];
  pageId: string;
  pageTitle: string;
}): Promise<CeacTransferResult> {
  if (!isCeacExtensionPresent()) {
    return Promise.resolve({
      ok: false,
      filled: 0,
      skipped: 0,
      error:
        "Extensão CP Vistos não detectada. Instale/atualize extensions/ceac-frame, recarregue a extensão e dê Ctrl+F5 nesta página.",
    });
  }

  const requestId = `ceac-transfer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve({
        ok: false,
        filled: 0,
        skipped: 0,
        error:
          "Extensão não respondeu. Recarregue a extensão CP Vistos (chrome://extensions) e esta página, e abra o CEAC.",
      });
    }, 15000);

    function onMessage(event: MessageEvent) {
      if (event.source !== window) {
        return;
      }
      if (event.data?.type !== "CP_VISTOS_TRANSFER_CEAC_RESULT") {
        return;
      }
      if (event.data.requestId && event.data.requestId !== requestId) {
        return;
      }

      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      resolve({
        ok: Boolean(event.data.ok),
        filled: Number(event.data.filled) || 0,
        skipped: Number(event.data.skipped) || 0,
        error: event.data.error ?? null,
      });
    }

    window.addEventListener("message", onMessage);
    window.postMessage(
      {
        type: "CP_VISTOS_TRANSFER_CEAC",
        requestId,
        fields: input.fields,
        pageId: input.pageId,
        pageTitle: input.pageTitle,
      },
      "*",
    );
  });
}
