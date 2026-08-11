# Pendências — Dashboard Financeiro

Última atualização: 2026-08-11

## Em aberto

### 1. Importação histórica de recebimentos (Excel)
- **Status:** pendente
- **Descrição:** Alimentar o check-list de recebimentos e os totais com dados anteriores a 11/08/2026 a partir da planilha Excel.
- **Dependência:** upload do arquivo Excel pelo usuário.
- **Ação prevista:** mapear colunas (nome, data, valor, situação), criar/atualizar `FinanceEntry` e validar totais.

### 2. Importação histórica de pagamentos/gastos
- **Status:** pendente
- **Descrição:** Preencher automaticamente o check-list de **Pagamentos** com gastos anteriores (funcionários, envios, etc.) com base nos dados fornecidos pelo admin.
- **Dependência:** envio da lista/planilha de gastos históricos.
- **Ação prevista:** criar registros em `FinanceExpense` (nome, descrição, valor, data) e recalcular totais líquidos.

### 3. Ajuste fino de datas históricas
- **Status:** pendente
- **Descrição:** No import, garantir que `paidAt` use a data real do movimento (não a data do upload), para mês / 6 meses / ano / líquido ficarem corretos.
- **Dependência:** itens 1 e 2.

### 4. Conferência de clientes já existentes vs planilha de recebimentos
- **Status:** pendente
- **Descrição:** Cruzar clientes cadastrados com linhas da planilha (nome/e-mail/CPF) para evitar duplicidade.
- **Dependência:** item 1.

## Já resolvido neste ciclo

- [x] Página `/perfil/financeiro` (somente admins allowlist)
- [x] Menu **Financeiro** abaixo de **Clientes**
- [x] Cards de recebimentos: mês (filtro), 6 meses, 1 ano, total geral
- [x] Cards líquidos: total líquido mês (filtro) e total líquido desde o início
- [x] Removido card “últimos 30 dias”
- [x] Check-list de recebimentos (auto no cadastro + valor/status)
- [x] Seção **Pagamentos** (lançamento manual: nome, descrição, valor)
- [x] Modelo `FinanceExpense` no banco

## Como continuar

1. Enviar planilha de recebimentos históricos.
2. Enviar lista/planilha de pagamentos/gastos históricos.
3. Marcar os itens correspondentes como resolvidos após o import.
