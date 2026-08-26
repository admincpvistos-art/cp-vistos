/**
 * Preenche campos da página atual do CEAC com o pacote enviado pelo admin.
 * v1.5.0 — aliases por id, dedupe de controles, DNA/Yes-No, frames ASP.NET.
 * Não avança páginas e não toca em captcha.
 */

if (window.__cpVistosCeacFillV15 && typeof window.__cpVistosRunFill === "function") {
  // já carregado neste frame
} else {
  window.__cpVistosCeacFillV15 = true;

  /** Fragmentos típicos de name/id do CEAC (ASP.NET). */
  const FIELD_ALIASES = {
    surnames: ["surname", "tbxsurname", "lastname", "familyname", "applsurname"],
    given: ["givenname", "tbxgiven", "given_name", "firstname", "applgiven"],
    native: ["nativealphabet", "fullname", "fullnamenative", "nafullname"],
    otherNamesQ: ["othername", "other_names", "usedothername", "alias"],
    otherNames: ["othername", "aliases", "maiden"],
    telecode: ["telecode"],
    sex: ["sex", "gender", "rblsex", "ddlsex"],
    marital: ["marital", "ddlmarital"],
    dob: ["dateofbirth", "dob", "birthdate", "ddlbirth"],
    birthCity: ["cityofbirth", "birthcity", "pobcity"],
    birthState: ["stateofbirth", "birthstate", "pobstate", "provinceofbirth"],
    birthCountry: ["countryofbirth", "birthcountry", "pobcountry"],
    nationality: ["nationality", "origincountry", "countryoforigin"],
    otherNatQ: ["othernationality", "othernat"],
    otherNat: ["othernationalitycountry", "othernatcountry"],
    otherNatPass: ["othernationalitypassport", "othernatpassport"],
    otherResQ: ["permanentresident", "othercountryresident"],
    otherRes: ["othercountryofresidence", "otherresidence"],
    nationalId: ["nationalid", "identificationnumber", "nationalidentification"],
    ssn: ["socialsecurity", "ussocial", "ssn"],
    itin: ["taxpayer", "itin", "ustax"],
    street: ["streetaddress", "homeaddress", "address1", "tbxstreet"],
    city: ["homecity", "tbxcity", "applcity"],
    state: ["homestate", "tbxstate", "applstate", "province"],
    postal: ["postal", "zipcode", "tbxzip", "zip"],
    country: ["homecountry", "addresscountry", "applcountry"],
    mailingQ: ["mailingaddress", "sameasmailing", "mailaddresssame"],
    primaryPhone: ["primaryphone", "homephone", "tbxphone", "cellphone"],
    secondaryPhone: ["secondaryphone", "otherphone"],
    workPhone: ["workphone", "businessphone"],
    email: ["email", "tbxemail", "emailaddress"],
    pptType: ["passporttype", "traveldocumenttype"],
    pptNumber: ["passportnumber", "tbxpassport", "pptnumber"],
    bookNumber: ["passportbook", "booknumber"],
    pptCountry: ["passportissued", "issuingcountry", "authorityissued"],
    pptCity: ["citywhereissued", "passportcity", "issuedcity"],
    pptState: ["statewhereissued", "passportstate", "issuedstate"],
    pptIssue: ["issuancedate", "issuedate", "passportissue"],
    pptExpire: ["expirationdate", "expiredate", "passportexpir"],
    lostQ: ["lostorstolen", "passportlost"],
    purpose: ["purposeoftrip", "visaclass", "ddlpurpose"],
    plansQ: ["specifictravel", "travelplans"],
    arriveDate: ["dateofarrival", "intendedarrival", "arrivaldate"],
    arriveCity: ["arrivalcity", "arrivecity"],
    departDate: ["dateofdeparture", "intendeddeparture", "departuredate"],
    length: ["lengthofstay", "intendedlength"],
    stayAddress: ["usstreet", "usaddress", "addressintheus"],
    stayCity: ["uscity", "cityintheus"],
    stayState: ["usstate", "stateintheus"],
    stayZip: ["uszip", "zipintheus"],
    payer: ["paying", "whopays", "personpaying"],
    othersQ: ["travelingwith", "otherpersonstraveling", "companions"],
    groupQ: ["partofgroup", "groupororganization"],
    groupName: ["groupname"],
    beenQ: ["beenintheus", "everbeeninus", "previousustravel"],
    visaQ: ["issuedusvisa", "everissuedvisa"],
    visaNumber: ["visanumber"],
  };

  const VALUE_MAP = {
    casado: "married",
    "casado(a)": "married",
    casada: "married",
    solteiro: "single",
    "solteiro(a)": "single",
    solteira: "single",
    divorciado: "divorced",
    "divorciado(a)": "divorced",
    divorciada: "divorced",
    viuvo: "widowed",
    "viuavo(a)": "widowed",
    "viuvo(a)": "widowed",
    viuva: "widowed",
    separado: "separated",
    "separado(a)": "separated",
    uniao: "common law marriage",
    "uniao estavel": "common law marriage",
    masculino: "male",
    feminino: "female",
    sim: "yes",
    nao: "no",
    male: "male",
    female: "female",
    yes: "yes",
    no: "no",
  };

  function normalize(text) {
    return String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function normalizeValue(value) {
    const raw = String(value || "").trim();
    const key = normalize(raw);
    if (VALUE_MAP[key]) {
      return VALUE_MAP[key];
    }
    // "Casado(a)" etc.
    for (const [from, to] of Object.entries(VALUE_MAP)) {
      if (key.includes(from)) {
        return to;
      }
    }
    return raw;
  }

  function isVisible(el) {
    if (!(el instanceof HTMLElement)) {
      return false;
    }
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function controlKey(el) {
    return `${el.tagName}:${el.name || ""}:${el.id || ""}:${el.type || ""}`;
  }

  function labelTextFor(el) {
    const parts = [];

    if (el.id) {
      try {
        const byFor = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (byFor) {
          parts.push(byFor.textContent || "");
        }
      } catch {
        // ignore invalid id
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
      // CEAC frequentemente coloca o rótulo na linha acima / célula à esquerda
      const table = td.closest("table");
      if (table) {
        const legend = td.closest("tr")?.querySelector(".label, .sublabel, span");
        if (legend) {
          parts.push(legend.textContent || "");
        }
      }
    }

    const aria = el.getAttribute("aria-label") || el.getAttribute("title") || "";
    if (aria) {
      parts.push(aria);
    }

    const name = el.getAttribute("name") || el.id || "";
    if (name) {
      parts.push(name.replace(/[_$]+/g, " "));
    }

    return normalize(parts.join(" "));
  }

  function nameIdBlob(el) {
    return normalize(`${el.name || ""} ${el.id || ""}`);
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
    if (haystack.includes(needle) || needle.includes(haystack)) {
      return 85;
    }
    const needleParts = needle.split(" ").filter((part) => part.length > 2);
    if (!needleParts.length) {
      return 0;
    }
    const hits = needleParts.filter((part) => haystack.includes(part)).length;
    return Math.round((hits / needleParts.length) * 70);
  }

  function aliasScore(el, fieldId) {
    const aliases = FIELD_ALIASES[fieldId];
    if (!aliases?.length) {
      return 0;
    }
    const blob = nameIdBlob(el);
    let best = 0;
    for (const alias of aliases) {
      const a = normalize(alias);
      if (!a) {
        continue;
      }
      if (blob.includes(a.replace(/\s/g, "")) || blob.includes(a)) {
        best = Math.max(best, 95);
      } else {
        best = Math.max(best, scoreMatch(blob, a));
      }
    }
    return best;
  }

  function collectControls() {
    return Array.from(document.querySelectorAll("input, select, textarea")).filter((el) => {
      if (
        !(
          el instanceof HTMLInputElement ||
          el instanceof HTMLSelectElement ||
          el instanceof HTMLTextAreaElement
        )
      ) {
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
    const wanted = normalize(normalizeValue(value));
    let best = null;
    let bestScore = 0;

    for (const option of Array.from(select.options)) {
      const text = normalize(option.textContent || "");
      const val = normalize(option.value || "");
      const score = Math.max(
        scoreMatch(text, wanted),
        scoreMatch(val, wanted),
        text.startsWith(wanted) || wanted.startsWith(text) ? 75 : 0,
      );
      if (score > bestScore) {
        bestScore = score;
        best = option;
      }
    }

    if (!best || bestScore < 35) {
      return false;
    }

    select.value = best.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function fillDoesNotApplyNear(controls, used, targetEl, value) {
    const wanted = normalize(normalizeValue(value));
    if (wanted !== "does not apply" && wanted !== "dna" && wanted !== "n a") {
      return false;
    }

    const pool = controls.filter((el) => {
      if (used.has(controlKey(el))) {
        return false;
      }
      if (!(el instanceof HTMLInputElement)) {
        return false;
      }
      if (el.type !== "checkbox" && el.type !== "radio") {
        return false;
      }
      const meta = `${labelTextFor(el)} ${nameIdBlob(el)}`;
      return (
        meta.includes("does not apply") ||
        meta.includes("na ") ||
        meta.includes("dna") ||
        nameIdBlob(el).includes("na_") ||
        nameIdBlob(el).includes("doesnotapply")
      );
    });

    // Prefer checkbox near the target (same row/table)
    let pick = pool[0];
    if (targetEl) {
      const row = targetEl.closest("tr");
      const near = pool.find((el) => row && row.contains(el));
      if (near) {
        pick = near;
      }
    }

    if (!pick) {
      return false;
    }

    pick.checked = true;
    pick.dispatchEvent(new Event("click", { bubbles: true }));
    pick.dispatchEvent(new Event("change", { bubbles: true }));
    used.add(controlKey(pick));
    return true;
  }

  function fillRadioOrCheckbox(controls, used, labelNeedle, value, fieldId) {
    const wanted = normalize(normalizeValue(value));
    const yes = wanted === "yes" || wanted === "y";
    const no = wanted === "no" || wanted === "n";

    const candidates = controls.filter((el) => {
      if (used.has(controlKey(el))) {
        return false;
      }
      if (!(el instanceof HTMLInputElement)) {
        return false;
      }
      if (el.type !== "radio" && el.type !== "checkbox") {
        return false;
      }
      const alias = aliasScore(el, fieldId);
      const labelScore = scoreMatch(labelTextFor(el), labelNeedle);
      return Math.max(alias, labelScore) >= 35;
    });

    if (!candidates.length) {
      return false;
    }

    for (const el of candidates) {
      const around = normalize(
        `${labelTextFor(el)} ${el.value} ${el.getAttribute("aria-label") || ""} ${nameIdBlob(el)}`,
      );
      const matchYes =
        yes &&
        (around.includes("yes") ||
          el.value === "Y" ||
          el.value === "y" ||
          el.value === "1" ||
          around.endsWith(" y") ||
          around.includes(" true"));
      const matchNo =
        no &&
        (around.includes("no") ||
          el.value === "N" ||
          el.value === "n" ||
          el.value === "0" ||
          around.includes(" false"));
      const matchValue = scoreMatch(around, wanted) >= 50;

      if (matchYes || matchNo || matchValue) {
        el.checked = true;
        el.dispatchEvent(new Event("click", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        used.add(controlKey(el));
        return true;
      }
    }

    // Grupo Yes/No: se só há 2 radios no grupo, escolhe pelo value Y/N
    const byName = new Map();
    for (const el of candidates) {
      const key = el.name || el.id;
      if (!byName.has(key)) {
        byName.set(key, []);
      }
      byName.get(key).push(el);
    }
    for (const group of byName.values()) {
      if (group.length < 2) {
        continue;
      }
      const pick = group.find((el) => {
        const v = String(el.value || "").toUpperCase();
        if (yes) {
          return v === "Y" || v === "YES" || v === "TRUE" || v === "1";
        }
        if (no) {
          return v === "N" || v === "NO" || v === "FALSE" || v === "0";
        }
        return false;
      });
      if (pick) {
        pick.checked = true;
        pick.dispatchEvent(new Event("click", { bubbles: true }));
        pick.dispatchEvent(new Event("change", { bubbles: true }));
        used.add(controlKey(pick));
        return true;
      }
    }

    return false;
  }

  function tryFillDateParts(controls, used, value, labelNeedle, fieldId) {
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

    const related = controls.filter((el) => {
      if (used.has(controlKey(el))) {
        return false;
      }
      const alias = aliasScore(el, fieldId);
      const labelScore = scoreMatch(labelTextFor(el), labelNeedle);
      const meta = `${labelTextFor(el)} ${nameIdBlob(el)}`;
      const looksDate =
        meta.includes("month") ||
        meta.includes("day") ||
        meta.includes("year") ||
        meta.includes("dob") ||
        meta.includes("birth") ||
        meta.includes("issu") ||
        meta.includes("expir");
      return looksDate && Math.max(alias, labelScore) >= 20;
    });

    if (!related.length) {
      return false;
    }

    let filled = 0;
    for (const el of related) {
      const meta = `${labelTextFor(el)} ${nameIdBlob(el)}`;
      if (meta.includes("month") || meta.includes("mes") || meta.includes("ddlmonth")) {
        if (el instanceof HTMLSelectElement) {
          if (fillSelect(el, monthNames[Number(mm) - 1] || mm) || fillSelect(el, mm)) {
            used.add(controlKey(el));
            filled += 1;
          }
        } else {
          setNativeValue(el, mm.padStart(2, "0"));
          used.add(controlKey(el));
          filled += 1;
        }
      } else if (meta.includes("day") || meta.includes("dia") || meta.includes("ddlday")) {
        if (el instanceof HTMLSelectElement) {
          if (fillSelect(el, dd) || fillSelect(el, String(Number(dd)))) {
            used.add(controlKey(el));
            filled += 1;
          }
        } else {
          setNativeValue(el, dd.padStart(2, "0"));
          used.add(controlKey(el));
          filled += 1;
        }
      } else if (meta.includes("year") || meta.includes("ano") || meta.includes("ddlyear")) {
        if (el instanceof HTMLSelectElement) {
          if (fillSelect(el, yyyy)) {
            used.add(controlKey(el));
            filled += 1;
          }
        } else {
          setNativeValue(el, yyyy);
          used.add(controlKey(el));
          filled += 1;
        }
      }
    }

    return filled >= 2;
  }

  function fillOneField(controls, used, field) {
    const value = String(field.value || "").trim();
    if (!value || value === "—") {
      return { ok: false, reason: "vazio" };
    }

    const fieldId = String(field.id || "");
    const labelNeedle = normalize(`${field.label || ""} ${fieldId}`);
    const displayValue = normalizeValue(value);

    if (tryFillDateParts(controls, used, value, labelNeedle, fieldId)) {
      return { ok: true, reason: "data" };
    }

    // DNA primeiro (checkbox), antes de tentar texto.
    if (fillDoesNotApplyNear(controls, used, null, displayValue)) {
      return { ok: true, reason: "dna" };
    }

    if (fillRadioOrCheckbox(controls, used, labelNeedle, displayValue, fieldId)) {
      return { ok: true, reason: "radio" };
    }

    let best = null;
    let bestScore = 0;
    for (const el of controls) {
      if (used.has(controlKey(el))) {
        continue;
      }
      if (el instanceof HTMLInputElement && (el.type === "radio" || el.type === "checkbox")) {
        continue;
      }
      const score = Math.max(
        aliasScore(el, fieldId),
        scoreMatch(labelTextFor(el), labelNeedle),
      );
      if (score > bestScore) {
        bestScore = score;
        best = el;
      }
    }

    if (!best || bestScore < 35) {
      return { ok: false, reason: "sem match" };
    }

    // Se valor é DNA e há checkbox ao lado, marca DNA em vez de escrever no input.
    if (fillDoesNotApplyNear(controls, used, best, displayValue)) {
      return { ok: true, reason: "dna" };
    }

    if (best instanceof HTMLSelectElement) {
      const ok = fillSelect(best, displayValue);
      if (ok) {
        used.add(controlKey(best));
      }
      return ok ? { ok: true, reason: "select" } : { ok: false, reason: "opção" };
    }

    setNativeValue(best, value);
    used.add(controlKey(best));
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
    setTimeout(() => node.remove(), 5000);
  }

  function runFill(message) {
    const fields = Array.isArray(message.fields) ? message.fields : [];
    const controls = collectControls();
    const used = new Set();
    let filled = 0;
    let skipped = 0;
    const details = [];

    for (const field of fields) {
      const result = fillOneField(controls, used, field);
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

    return {
      ok,
      filled,
      skipped,
      details,
      controlCount: controls.length,
    };
  }

  window.__cpVistosRunFill = runFill;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "ceac-probe") {
      const controls = collectControls();
      sendResponse({
        ok: true,
        controlCount: controls.length,
        href: location.href,
      });
      return true;
    }

    if (message?.type !== "fill-ceac-fields") {
      return;
    }

    try {
      sendResponse(runFill(message));
    } catch (error) {
      sendResponse({
        ok: false,
        filled: 0,
        skipped: 0,
        error: error instanceof Error ? error.message : "Falha ao preencher",
      });
    }
    return true;
  });
}
