/**
 * Preenche campos da página atual do CEAC com o pacote enviado pelo admin.
 * Não avança páginas e não toca em captcha — só injeta valores.
 */

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isVisible(el) {
  if (!(el instanceof HTMLElement)) {
    return false;
  }
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function labelTextFor(el) {
  const parts = [];

  if (el.id) {
    const byFor = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (byFor) {
      parts.push(byFor.textContent || "");
    }
  }

  const wrapLabel = el.closest("label");
  if (wrapLabel) {
    parts.push(wrapLabel.textContent || "");
  }

  const td = el.closest("td, th");
  if (td) {
    const prev = td.previousElementSibling;
    if (prev) {
      parts.push(prev.textContent || "");
    }
    const row = td.parentElement;
    if (row) {
      const firstCell = row.querySelector("td, th");
      if (firstCell && firstCell !== td) {
        parts.push(firstCell.textContent || "");
      }
    }
  }

  const aria = el.getAttribute("aria-label") || el.getAttribute("title") || "";
  if (aria) {
    parts.push(aria);
  }

  const name = el.getAttribute("name") || el.id || "";
  if (name) {
    parts.push(name.replace(/[_-]+/g, " "));
  }

  return normalize(parts.join(" "));
}

function setNativeValue(el, value) {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
  if (descriptor?.set) {
    descriptor.set.call(el, value);
  } else {
    el.value = value;
  }
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new Event("blur", { bubbles: true }));
}

function scoreMatch(haystack, needle) {
  if (!haystack || !needle) {
    return 0;
  }
  if (haystack === needle) {
    return 100;
  }
  if (haystack.includes(needle)) {
    return 80;
  }
  const needleParts = needle.split(" ").filter((part) => part.length > 2);
  if (!needleParts.length) {
    return 0;
  }
  const hits = needleParts.filter((part) => haystack.includes(part)).length;
  return Math.round((hits / needleParts.length) * 60);
}

function collectControls() {
  return Array.from(
    document.querySelectorAll("input, select, textarea"),
  ).filter((el) => {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement)) {
      return false;
    }
    if (!isVisible(el)) {
      return false;
    }
    if (el instanceof HTMLInputElement) {
      const type = (el.type || "text").toLowerCase();
      if (["hidden", "submit", "button", "image", "file", "reset"].includes(type)) {
        return false;
      }
    }
    if (el.disabled || el.readOnly) {
      return false;
    }
    return true;
  });
}

function fillSelect(select, value) {
  const wanted = normalize(value);
  let best = null;
  let bestScore = 0;

  for (const option of Array.from(select.options)) {
    const text = normalize(option.textContent || "");
    const val = normalize(option.value || "");
    const score = Math.max(scoreMatch(text, wanted), scoreMatch(val, wanted));
    if (score > bestScore) {
      bestScore = score;
      best = option;
    }
  }

  if (!best || bestScore < 40) {
    return false;
  }

  select.value = best.value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function fillRadioOrCheckbox(controls, labelNeedle, value) {
  const wanted = normalize(value);
  const yes = wanted === "yes" || wanted === "y" || wanted === "sim";
  const no = wanted === "no" || wanted === "n" || wanted === "nao";

  const candidates = controls.filter((el) => {
    if (!(el instanceof HTMLInputElement)) {
      return false;
    }
    if (el.type !== "radio" && el.type !== "checkbox") {
      return false;
    }
    return scoreMatch(labelTextFor(el), labelNeedle) >= 40;
  });

  if (!candidates.length) {
    return false;
  }

  for (const el of candidates) {
    const around = normalize(
      `${labelTextFor(el)} ${el.value} ${el.getAttribute("aria-label") || ""}`,
    );
    const matchYes = yes && (around.includes("yes") || around.includes("sim") || el.value === "Y");
    const matchNo = no && (around.includes("no") || around.includes("nao") || el.value === "N");
    const matchValue = scoreMatch(around, wanted) >= 50;

    if (matchYes || matchNo || matchValue) {
      el.checked = true;
      el.dispatchEvent(new Event("click", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
  }

  return false;
}

function tryFillDateParts(controls, value, labelNeedle) {
  const match = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) {
    return false;
  }

  const [, mm, dd, yyyy] = match;
  const monthNames = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];

  const related = controls.filter((el) => scoreMatch(labelTextFor(el), labelNeedle) >= 25);
  if (!related.length) {
    return false;
  }

  let filled = 0;
  for (const el of related) {
    const meta = labelTextFor(el);
    if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) {
      if (meta.includes("month") || meta.includes("mes")) {
        if (el instanceof HTMLSelectElement) {
          if (fillSelect(el, monthNames[Number(mm) - 1] || mm) || fillSelect(el, mm)) {
            filled += 1;
          }
        } else {
          setNativeValue(el, mm);
          filled += 1;
        }
      } else if (meta.includes("day") || meta.includes("dia")) {
        if (el instanceof HTMLSelectElement) {
          if (fillSelect(el, dd)) {
            filled += 1;
          }
        } else {
          setNativeValue(el, dd);
          filled += 1;
        }
      } else if (meta.includes("year") || meta.includes("ano")) {
        if (el instanceof HTMLSelectElement) {
          if (fillSelect(el, yyyy)) {
            filled += 1;
          }
        } else {
          setNativeValue(el, yyyy);
          filled += 1;
        }
      }
    }
  }

  return filled >= 2;
}

function fillOneField(controls, field) {
  const value = String(field.value || "").trim();
  if (!value || value === "—") {
    return { ok: false, reason: "vazio" };
  }

  const labelNeedle = normalize(`${field.label || ""} ${field.id || ""}`);

  if (tryFillDateParts(controls, value, labelNeedle)) {
    return { ok: true, reason: "data" };
  }

  if (fillRadioOrCheckbox(controls, labelNeedle, value)) {
    return { ok: true, reason: "radio" };
  }

  let best = null;
  let bestScore = 0;
  for (const el of controls) {
    if (el instanceof HTMLInputElement && (el.type === "radio" || el.type === "checkbox")) {
      continue;
    }
    const score = scoreMatch(labelTextFor(el), labelNeedle);
    if (score > bestScore) {
      bestScore = score;
      best = el;
    }
  }

  if (!best || bestScore < 40) {
    return { ok: false, reason: "sem match" };
  }

  if (best instanceof HTMLSelectElement) {
    return fillSelect(best, value)
      ? { ok: true, reason: "select" }
      : { ok: false, reason: "opção" };
  }

  setNativeValue(best, value);
  return { ok: true, reason: "texto" };
}

function showToast(message, ok) {
  const id = "cp-vistos-ceac-toast";
  document.getElementById(id)?.remove();
  const node = document.createElement("div");
  node.id = id;
  node.textContent = message;
  node.style.cssText = [
    "position:fixed",
    "z-index:2147483647",
    "right:16px",
    "bottom:16px",
    "max-width:360px",
    "padding:12px 14px",
    "border-radius:10px",
    "font:600 13px/1.35 Segoe UI,Arial,sans-serif",
    "box-shadow:0 8px 24px rgba(0,0,0,.25)",
    ok ? "background:#0b3a6e;color:#fff" : "background:#7f1d1d;color:#fff",
  ].join(";");
  document.documentElement.appendChild(node);
  setTimeout(() => node.remove(), 4500);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "fill-ceac-fields") {
    return;
  }

  const fields = Array.isArray(message.fields) ? message.fields : [];
  const controls = collectControls();
  let filled = 0;
  let skipped = 0;
  const details = [];

  for (const field of fields) {
    const result = fillOneField(controls, field);
    if (result.ok) {
      filled += 1;
      details.push({ id: field.id, ok: true, how: result.reason });
    } else {
      skipped += 1;
      details.push({ id: field.id, ok: false, how: result.reason });
    }
  }

  const ok = filled > 0;
  const title = message.pageTitle ? ` (${message.pageTitle})` : "";
  showToast(
    ok
      ? `CP Vistos: ${filled} campo(s) preenchido(s)${title}. ${skipped} sem correspondência.`
      : `CP Vistos: nenhum campo bateu com esta tela do CEAC${title}. Confira se está na página certa.`,
    ok,
  );

  sendResponse({ ok, filled, skipped, details });
  return true;
});
