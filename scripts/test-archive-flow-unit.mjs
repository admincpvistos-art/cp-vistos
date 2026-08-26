/**
 * Teste unitário do fluxo de arquivamento (sem Mongo).
 * Simula: create snapshots por serviço → remove do ativo → bloqueia recriação.
 * node scripts/test-archive-flow-unit.mjs
 */
import assert from "assert";

const SERVICE_TO_CATEGORY = {
  primeiro_visto: "american_visa",
  renovacao: "renovacao",
  passaporte: "passport",
  esta: "e_ta",
};

function createStore() {
  return {
    acompanhamento: [],
    arquivados: [],
  };
}

function archiveClient(store, id, services) {
  const row = store.acompanhamento.find((item) => item.id === id);
  if (!row) {
    throw new Error("Cliente não encontrado");
  }
  if (!services?.length) {
    throw new Error("Marque ao menos um serviço");
  }

  const categories = [];
  for (const service of services) {
    const category = SERVICE_TO_CATEGORY[service];
    if (!category) {
      throw new Error(`Serviço inválido: ${service}`);
    }
    const exists = store.arquivados.some(
      (item) => item.sourceAcompanhamentoId === id && item.category === category,
    );
    if (!exists) {
      store.arquivados.push({
        id: `arch-${id}-${category}`,
        category,
        name: row.name,
        services: [service],
        sourceAcompanhamentoId: id,
        sourceUserId: row.userId || null,
      });
    }
    categories.push(category);
  }

  // Transferência definitiva: remove do Acompanhamento (como deleteMany).
  store.acompanhamento = store.acompanhamento.filter((item) => item.id !== id);

  if (store.acompanhamento.some((item) => item.id === id)) {
    throw new Error("Cliente ainda no Acompanhamento");
  }
  if (!store.arquivados.some((item) => item.sourceAcompanhamentoId === id)) {
    throw new Error("Cliente não apareceu em Arquivados");
  }
  return { categories };
}

function ensureAcompanhamento(store, user) {
  if (store.acompanhamento.some((item) => item.userId === user.id)) {
    return false;
  }
  if (store.arquivados.some((item) => item.sourceUserId === user.id)) {
    return false; // não recria
  }
  store.acompanhamento.push({
    id: `new-${user.id}`,
    name: user.name,
    userId: user.id,
    services: ["primeiro_visto"],
  });
  return true;
}

// --- casos ---
const store = createStore();
store.acompanhamento.push({
  id: "c1",
  name: "CLIENTE TESTE E2E",
  userId: "u1",
  services: ["primeiro_visto", "passaporte"],
});
store.acompanhamento.push({
  id: "c2",
  name: "OUTRO",
  userId: "u2",
  services: ["esta"],
});

const result = archiveClient(store, "c1", ["primeiro_visto", "passaporte"]);
assert.deepStrictEqual(result.categories.sort(), ["american_visa", "passport"]);
assert.strictEqual(store.acompanhamento.length, 1);
assert.strictEqual(store.acompanhamento[0].id, "c2");
assert.strictEqual(store.arquivados.length, 2);
assert.ok(store.arquivados.every((row) => row.name === "CLIENTE TESTE E2E"));

// Não recria após arquivar
assert.strictEqual(ensureAcompanhamento(store, { id: "u1", name: "CLIENTE TESTE E2E" }), false);
assert.strictEqual(store.acompanhamento.length, 1);

// Erro sem serviço
assert.throws(() => archiveClient(store, "c2", []), /serviço/i);

// Arquiva um serviço
archiveClient(store, "c2", ["esta"]);
assert.strictEqual(store.acompanhamento.length, 0);
assert.ok(store.arquivados.some((row) => row.category === "e_ta"));

console.log("OK test-archive-flow-unit: transferência multi-serviço + anti-recriação");
