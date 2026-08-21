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
  const left = Math.max(0, Math.round(window.screenX + rect.left));
  const top = Math.max(0, Math.round(window.screenY + rect.top));
  const width = Math.max(480, Math.round(rect.width));
  const height = Math.max(520, Math.round(rect.height));

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

  if (options?.useExtension) {
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

export function focusCeacWindow() {
  window.postMessage({ type: "CP_VISTOS_FOCUS_CEAC" }, "*");

  const target = getCeacWindow();
  if (!target) {
    return;
  }

  window.setTimeout(() => {
    try {
      target.focus();
    } catch {
      // o browser pode bloquear focus em outra janela
    }
  }, 80);
}
