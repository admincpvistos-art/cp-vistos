# CP Vistos — Extensão CEAC (v1.5.1)

Pasta pronta para instalar em qualquer computador do escritório (Chrome ou Edge).

## O que faz

- Abre o CEAC oficial sobre o quadro do DS-160
- Mantém a janela do CEAC **na frente** enquanto o Preencher DS-160 está aberto (Copiar, Transferir ou qualquer clique)
- Botão **Transferir para o CEAC**: envia os campos da **página atual** para a tela aberta do CEAC
- Captcha e avanço de páginas continuam **manuais**
- O botão **Copiar** por campo continua disponível

## Instalação / atualização (Chrome / Edge)

1. Copie esta pasta inteira para o PC (`ceac-frame`)
2. Abra `chrome://extensions` (ou `edge://extensions`)
3. Ative **Modo do desenvolvedor**
4. Se já tiver a extensão: clique em **Atualizar** (ou Remover + Carregar sem compactação de novo)
5. Se for a 1ª vez: **Carregar sem compactação** → selecione esta pasta
6. Recarregue `Preencher DS-160` no site (Ctrl+F5)

Ou rode `instalar.bat`.

Confirme que a versão exibida no quadro CEAC é **v1.5.1**.

## Uso

1. Abra o cliente em Preencher DS-160
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
| `manifest.json` | Configuração MV3 (v1.5.1) |
| `background.js` | Janela CEAC + pin + transferência |
| `content-admin.js` | Ponte com o site CP Vistos |
| `content-ceac.js` | Preenche campos no site do governo |
| `sidepanel.html` / `sidepanel.js` | Painel lateral opcional |
| `instalar.bat` | Atalho de instalação no Windows |
