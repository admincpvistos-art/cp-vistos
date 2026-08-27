# Publicar na Chrome Web Store (atualização automática)

A instalação “Carregar sem compactação” **não atualiza sozinha**.
Para atualização automática nos PCs do escritório, publique esta extensão na Chrome Web Store.

## 1. Gerar o zip

Na raiz do projeto:

```bash
node scripts/pack-ceac-extension.mjs
```

Arquivos gerados:
- `extensions/ceac-frame-store.zip` → upload na Store
- `public/downloads/cp-vistos-ceac-extension.zip` → fallback no site

## 2. Conta de desenvolvedor (uma vez)

1. Acesse [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Faça login com a conta Google da empresa (ex.: `cpassessoriavistos@gmail.com`)
3. Pague a taxa única de registro (~US$ 5)
4. Aceite os termos

## 3. Novo item / upload

1. **Novo item** → envie `ceac-frame-store.zip`
2. Preencha:
   - **Nome:** CP Vistos — CEAC Transferir DS-160
   - **Descrição resumida:** Transferência de campos DS-160 para o CEAC oficial (uso interno).
   - **Descrição detalhada:** uso interno da equipe CP Vistos; abre o CEAC ao lado do formulário e preenche campos da página atual.
   - **Categoria:** Produtividade
   - **Ícone:** já está no zip (`icons/icon128.png`)
   - **Capturas:** 1–2 prints da tela Preencher DS-160 (1280×800 ou similar)
3. **Privacidade:**
   - Uso único: facilitar preenchimento CEAC no domínio cpvistos.com.br
   - Não coleta dados pessoais para venda
   - Política: `https://www.cpvistos.com.br/politica-de-privacidade`
4. **Visibilidade:** escolha uma:
   - **Não listada** — só quem tem o link instala (bom para começar)
   - **Privada** — só contas do Google Workspace da empresa (melhor controle)

## 4. Publicar e configurar o site

1. Após aprovação, copie o link da extensão (`https://chromewebstore.google.com/detail/...`)
2. Na Vercel → Environment Variables → Production:
   - `NEXT_PUBLIC_CEAC_EXTENSION_STORE_URL` = esse link
3. Redeploy produção
4. Em cada PC do escritório: abrir o link **uma vez** e clicar em **Usar no Chrome**
5. Remover a extensão antiga “sem compactação” se ainda existir

Daí em diante, ao publicar uma versão nova na Store (ex.: 1.5.5), o Chrome atualiza sozinho.

## 5. Atualizar versão no dia a dia

1. Altere `version` em `manifest.json` e `EXT_VERSION` em `content-admin.js`
2. Altere `CEAC_EXTENSION_EXPECTED_VERSION` em `lib/ds160-ceac-window.ts`
3. `node scripts/pack-ceac-extension.mjs`
4. No Developer Dashboard → a extensão → **Pacote** → enviar novo zip → Publicar
5. Commit + deploy do site (para a versão esperada bater)

## Observação

Enquanto a Store não estiver publicada, use a página
`https://www.cpvistos.com.br/extensao-ceac` e o zip em `/downloads/cp-vistos-ceac-extension.zip`
(instalação manual / sem compactação).
