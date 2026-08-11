# Pendências — Dashboard Financeiro & Cadastro

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

### 5. Controle de acesso ao link de cadastro (`/cadastro`)
- **Status:** pendente
- **Descrição:** Hoje `/cadastro` é público. Precisamos impedir que curiosos com o link criem conta sem ter pago.
- **Sugestões (escolha uma ou combine):**
  1. **Convite por token (recomendado):** admin/Sure gera link único ` /cadastro?invite=XYZ` após o pagamento; o token é de uso único e expira.
  2. **Código de pagamento:** cliente digita um código enviado no WhatsApp; valida no cadastro e já pode marcar o recebimento como pago com o valor.
  3. **Lista de e-mails/CPFs liberados:** admin cadastra quem pode se registrar; o formulário só aceita esses documentos.
  4. **Cadastro aberto + bloqueio de uso:** deixa cadastrar, mas trava a área do cliente até o financeiro marcar como pago.
- **Ação prevista:** implementar o fluxo escolhido + tela admin para gerar/revogar convites.

## Já resolvido neste ciclo

- [x] Página `/perfil/financeiro` (somente admins allowlist)
- [x] Menu **Financeiro** abaixo de **Clientes**
- [x] Cards de recebimentos e totais líquidos
- [x] Check-list de recebimentos + seção Pagamentos
- [x] Página pública `/cadastro` (nome, CPF, e-mail, senha)
- [x] `registerClient` cria conta `CLIENT` + linha no financeiro (pendente)
- [x] Após cadastro, login automático → área do cliente
- [x] Link “Criar conta” na tela de login

## Como continuar

1. Enviar planilha de recebimentos históricos.
2. Enviar lista/planilha de pagamentos/gastos históricos.
3. Definir qual opção do item 5 (controle do `/cadastro`) preferem.
4. Marcar os itens correspondentes como resolvidos após o import/implementação.
