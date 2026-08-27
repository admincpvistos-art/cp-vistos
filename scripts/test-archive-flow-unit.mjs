/**
 * Teste unitário do fluxo de arquivamento (sem Mongo).
 * node scripts/test-archive-flow-unit.mjs
 */
import assert from "assert";

const SERVICE_TO_CATEGORY = {
  primeiro_visto: "american_visa",
  renovacao: "renovacao",
  passaporte: "passport",
  esta: "e_ta",
};

function archiveNameGroupKey(name, group) {
  const n = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
  const g = group
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
  if (!n || !g) return "";
  return `${n}|${g}`;
}

function createStore() {
  return {
    acompanhamento: [],
    arquivados: [],
  };
}

function archiveClient(store, id, services) {
  const row = store.acompanhamento.find(
    (item) => item.id === id && item.source === "imported",
  );
  if (!row) {
    throw new Error("Cliente não encontrado");
  }
  if (!services?.length) {
    throw new Error("Marque ao menos um serviço");
  }

  const categories = [];
  const nameGroupKey = archiveNameGroupKey(row.name, row.group);

  for (const service of services) {
    const category = SERVICE_TO_CATEGORY[service];
    if (!category) throw new Error(`Serviço inválido: ${service}`);
    const exists = store.arquivados.some(
      (item) =>
        item.sourceAcompanhamentoId === id && item.category === category,
    );
    if (!exists) {
      store.arquivados.push({
        id: `arch-${id}-${category}`,
        category,
        name: row.name,
        group: row.group,
        services: [service],
        sourceAcompanhamentoId: id,
        sourceUserId: row.userId || null,
      });
    }
    categories.push(category);
  }

  const removeIds = new Set([id]);
  if (row.userId) {
    for (const item of store.acompanhamento) {
      if (item.userId === row.userId && item.source === "imported") {
        removeIds.add(item.id);
      }
    }
  }
  if (nameGroupKey) {
    for (const item of store.acompanhamento) {
      if (
        item.source === "imported" &&
        archiveNameGroupKey(item.name, item.group) === nameGroupKey
      ) {
        removeIds.add(item.id);
      }
    }
  }

  store.acompanhamento = store.acompanhamento.filter((item) => !removeIds.has(item.id));

  const stillActive = store.acompanhamento.filter((item) => {
    if (item.source !== "imported") return false;
    if (row.userId && item.userId === row.userId) return true;
    if (nameGroupKey && archiveNameGroupKey(item.name, item.group) === nameGroupKey) {
      return true;
    }
    return false;
  });
  if (stillActive.length) {
    throw new Error("Cliente ainda no Acompanhamento");
  }

  return { categories, removedIds: Array.from(removeIds) };
}

const store = createStore();
store.acompanhamento.push(
  {
    id: "c1",
    name: "OLIVIA GOMES",
    group: "JEFFERSON RIBEIRO",
    userId: "u1",
    source: "imported",
  },
  {
    id: "c1-dup",
    name: "OLIVIA GOMES",
    group: "JEFFERSON RIBEIRO",
    userId: null,
    source: "imported",
  },
  {
    id: "c2",
    name: "OUTRO CLIENTE",
    group: "JEFFERSON RIBEIRO",
    userId: "u2",
    source: "imported",
  },
);

const result = archiveClient(store, "c1", ["primeiro_visto", "passaporte"]);
assert.deepStrictEqual(result.categories.sort(), ["american_visa", "passport"]);
assert.strictEqual(
  store.acompanhamento.filter((item) => item.source === "imported").length,
  1,
);
assert.strictEqual(
  store.acompanhamento.find((item) => item.id === "c2")?.source,
  "imported",
);
assert.strictEqual(store.arquivados.length, 2);

console.log("OK test-archive-flow-unit: delete + nome/grupo + multi-serviço");
