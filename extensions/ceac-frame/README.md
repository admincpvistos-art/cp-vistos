# CP Vistos — Extensão CEAC (v1.4)

Pasta pronta para instalar em qualquer computador do escritório (Chrome ou Edge).

## O que faz

- Abre o CEAC oficial sobre o quadro do DS-160
- Botão **Transferir para o CEAC** no painel admin: envia os campos da **página atual** para a tela aberta do CEAC
- Mantém a janela do CEAC na frente ao copiar/transferir
- Captcha e avanço de páginas continuam **manuais**
- O botão **Copiar** por campo continua disponível

## Instalação / atualização (Chrome / Edge)

1. Copie esta pasta inteira para o PC (`ceac-frame`)
2. Abra `chrome://extensions` (ou `edge://extensions`)
3. Ative **Modo do desenvolvedor**
4. Se já tiver a extensão: clique em **Atualizar** (ou Remover + Carregar sem compactação de novo)
5. Se for a 1ª vez: **Carregar sem compactação** → selecione esta pasta
6. Recarregue `Preencher DS-160` / `Conferir formulário` no site (Ctrl+F5)

Ou rode `instalar.bat`.

## Uso

1. Abra o cliente em Preencher DS-160 ou Conferir
2. Clique em **Abrir CEAC neste quadro**
3. No CEAC: login / captcha / página correspondente
4. No painel esquerdo: mesma página do DS-160
5. **Transferir para o CEAC**
6. Revise; avance no CEAC e repita

## Observações

- Transferência **por página** (semi-automática)
- Se um campo não bater, use **Copiar**
- Funciona em `www.cpvistos.com.br`, `*.vercel.app` e `localhost`

## Arquivos

| Arquivo | Função |
|---|---|
| `manifest.json` | Configuração MV3 (v1.4.0) |
| `background.js` | Janela CEAC + foco + transferência |
| `content-admin.js` | Ponte com o site CP Vistos |
| `content-ceac.js` | Preenche campos no site do governo |
| `sidepanel.html` / `sidepanel.js` | Painel lateral opcional |
| `instalar.bat` | Atalho de instalação no Windows |
