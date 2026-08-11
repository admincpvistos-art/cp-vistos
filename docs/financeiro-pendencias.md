# Pendências — Dashboard Financeiro

Última atualização: 2026-08-11

## Em aberto

### 1. Importação histórica via planilha Excel
- **Status:** pendente
- **Descrição:** Alimentar o checklist e os totais com dados anteriores a 11/08/2026 a partir da planilha Excel fornecida pelo admin.
- **Dependência:** upload do arquivo Excel pelo usuário.
- **Ação prevista:** mapear colunas (nome, data, valor, situação), criar/atualizar `FinanceEntry` e validar totais.

### 2. Base financeira complementar para filtros
- **Status:** pendente
- **Descrição:** Receber o restante dos dados financeiros da empresa (além do checklist de clientes) para enriquecer filtros e demonstrativos.
- **Dependência:** envio dos dados pelo admin.
- **Ação prevista:** avaliar se cabem em `FinanceEntry` ou se exige modelo adicional (despesas, categorias, etc.).

### 3. Ajuste fino de datas de pagamento históricas
- **Status:** pendente
- **Descrição:** No import Excel, garantir que `paidAt` use a data real do pagamento (não a data do upload), para os cards de 30 dias / 6 meses / ano / mês ficarem corretos.
- **Dependência:** item 1.

### 4. Conferência de clientes já existentes vs planilha
- **Status:** pendente
- **Descrição:** Cruzar clientes já cadastrados no sistema com linhas da planilha (por nome/e-mail/CPF) para evitar duplicidade no checklist.
- **Dependência:** item 1.

## Já resolvido neste ciclo

- [x] Página `/perfil/financeiro` (somente `cpassessoriavistos@gmail.com` e `admin@cpvistos.com`)
- [x] Menu **Financeiro** abaixo de **Clientes** nas ferramentas de administração
- [x] Cards: mês (com filtro), 30 dias, 6 meses, 1 ano, total geral
- [x] Checklist automático no cadastro de cliente (`createClient`)
- [x] Backfill automático de clientes antigos sem linha financeira (na primeira carga da página)
- [x] Campo de valor manual → status Pago/Pendente automático
- [x] Busca por nome, filtro por mês de cadastro, ordenação crescente/decrescente

## Como continuar

1. Enviar a planilha Excel neste chat.
2. Marcar o item correspondente como resolvido após o import.
3. Repetir para qualquer dado financeiro extra.
