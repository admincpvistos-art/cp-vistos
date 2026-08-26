# CP Vistos — Extensão CEAC (v1.3)

Pasta pronta para instalar em qualquer computador do escritório (Chrome ou Edge).

## O que faz

- Abre o CEAC oficial sobre o quadro do DS-160
- Botão **Transferir para o CEAC** no painel admin: envia os campos da **página atual** para a tela aberta do CEAC
- Captcha e avanço de páginas continuam **manuais**
- O botão **Copiar** por campo continua disponível

## Instalação (Chrome / Edge)

1. Copie esta pasta inteira para o PC (`ceac-frame`)
2. Abra `chrome://extensions` (ou `edge://extensions`)
3. Ative **Modo do desenvolvedor**
4. Remova a versão antiga da extensão CP Vistos, se existir
5. Clique em **Carregar sem compactação**
6. Selecione **esta pasta** (`ceac-frame`)
7. Recarregue `Preencher DS-160` / `Conferir formulário` no site

Ou rode `instalar.bat` (abre a pasta + a tela de extensões).

## Uso

1. Abra o cliente em Preencher DS-160 ou Conferir
2. Clique em **Abrir CEAC neste quadro** (extensão ativa)
3. No CEAC: faça login / captcha / chegue na página correspondente
4. No painel esquerdo: escolha a mesma página do DS-160
5. Clique em **Transferir para o CEAC**
6. Revise o que foi preenchido; avance no CEAC e repita na próxima página

## Observações

- A transferência é **por página** (semi-automática), não do formulário inteiro de uma vez
- Se algum campo não bater (layout do CEAC mudou), use **Copiar** naquela linha
- Funciona em `www.cpvistos.com.br` e também em `localhost` para testes

## Arquivos

| Arquivo | Função |
|---|---|
| `manifest.json` | Configuração MV3 |
| `background.js` | Janela CEAC + roteamento da transferência |
| `content-admin.js` | Ponte com o site CP Vistos |
| `content-ceac.js` | Preenche campos no site do governo |
| `sidepanel.html` / `sidepanel.js` | Painel lateral opcional |
| `instalar.bat` | Atalho de instalação no Windows |
