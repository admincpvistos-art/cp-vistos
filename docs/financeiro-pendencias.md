# Pendências — Dashboard Financeiro, Serviços e Custos & Cadastro

Última atualização: 2026-08-11

## Em aberto

### 1. Importação Excel → Serviços e Custos + Financeiro
- **Status:** pendente
- **Descrição:** Upload de planilha Excel alimentando as colunas de **Serviços e Custos** (renovação, primeiro visto, reunião paga, monitoramento, passaporte, outros + comentário, data da viagem; situação = prioridade pela data da viagem) e, por sincronização, o check-list/totais do **Financeiro**. Gastos pontuais históricos também podem entrar como `FinanceExpense`.
- **Dependência:** upload do arquivo Excel pelo usuário.
- **Ação prevista:** mapear colunas, criar/atualizar `ServiceCost` + sync `FinanceEntry`, e opcionalmente `FinanceExpense`; validar totais.

### 2. Importação histórica de pagamentos/gastos
- **Status:** pendente (pode ser parte do item 1)
- **Descrição:** Preencher pagamentos com gastos anteriores (funcionários, envios, etc.).
- **Dependência:** envio da lista/planilha de gastos históricos.
- **Ação prevista:** criar registros em `FinanceExpense` (nome, descrição, valor, data) e recalcular totais líquidos.

### 3. Ajuste fino de datas históricas
- **Status:** pendente
- **Descrição:** No import, garantir que `paidAt` / datas de validade/limite usem a data real do movimento (não a data do upload).
- **Dependência:** itens 1 e 2.

### 4. Conferência de clientes já existentes vs planilha
- **Status:** pendente
- **Descrição:** Cruzar clientes cadastrados com linhas da planilha (nome/e-mail/CPF) para evitar duplicidade.
- **Dependência:** item 1.

### 5. Controle de acesso ao link de cadastro (`/cadastro`)
- **Status:** pendente
- **Descrição:** Hoje `/cadastro` é público. Precisamos impedir que curiosos com o link criem conta sem ter pago.
- **Sugestões (escolha uma ou combine):**
  1. **Convite por token (recomendado):** admin gera link único `/cadastro?invite=XYZ` após o pagamento; token de uso único e com expiração.
  2. **Código de pagamento:** cliente digita um código enviado no WhatsApp.
  3. **Lista de e-mails/CPFs liberados.**
  4. **Cadastro aberto + bloqueio de uso** até o financeiro marcar como pago.
- **Ação prevista:** implementar o fluxo escolhido + tela admin para gerar/revogar convites.

## Já resolvido neste ciclo

- [x] Página `/perfil/financeiro` (somente admins allowlist)
- [x] Página `/perfil/servicos-e-custos` (mesmos admins)
- [x] Menu **Serviços e Custos** e **Financeiro** abaixo de **Clientes**
- [x] Planilha editável (valores + datas) com sync da soma → `FinanceEntry`
- [x] Financeiro em modo leitura para valores e inserção de pagamentos
- [x] Gastos pontuais lançados em Serviços e Custos → `FinanceExpense`
- [x] Cards de recebimentos e totais líquidos
- [x] Página pública `/cadastro` + `registerClient` + linha financeira/serviço
- [x] Cadastro de grupo: titular completo + pessoas adicionais (nome/CPF)
- [x] Dependentes com linha própria e valores "-" ; pagamento segue o titular

## Como continuar

1. Enviar planilha Excel de serviços/custos e/ou pagamentos históricos.
2. Definir qual opção do item 5 (controle do `/cadastro`) preferem.
3. Marcar os itens correspondentes como resolvidos após o import/implementação.
