# CP Vistos — Extensão CEAC (v1.5.4)

## Atualização automática

Instale pela **Chrome Web Store** (link em https://www.cpvistos.com.br/extensao-ceac após publicar).
O Chrome atualiza sozinho quando publicamos uma versão nova.

Guia completo: [PUBLISH.md](./PUBLISH.md)

## O que faz

- Abre o CEAC oficial no tamanho do quadro direito do DS-160
- Mantém a janela na frente após Copiar / Transferir
- **Transferir para o CEAC**: preenche os campos da página atual
- Captcha e avanço de páginas continuam manuais

## Instalação rápida (fallback sem Store)

1. Baixe o zip em `/downloads/cp-vistos-ceac-extension.zip` ou rode `instalar.bat`
2. `chrome://extensions` → Modo do desenvolvedor → Carregar sem compactação
3. Ctrl+F5 em Preencher DS-160
4. Confirme **v1.5.4** no quadro CEAC

## Empacotar

```bash
node scripts/pack-ceac-extension.mjs
```

## Arquivos

| Arquivo | Função |
|---|---|
| `manifest.json` | MV3 v1.5.4 + ícones |
| `background.js` | Janela + pin + transferência |
| `content-admin.js` | Ponte com o site |
| `content-ceac.js` | Preenche o CEAC |
| `icons/` | Ícones da Store |
| `PUBLISH.md` | Publicação / auto-update |
