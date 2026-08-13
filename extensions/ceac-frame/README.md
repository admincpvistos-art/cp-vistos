# Extensão CP Vistos — CEAC no quadro admin

Uso interno. O site `ceac.state.gov` envia `X-Frame-Options: DENY` e o Chrome recusa o iframe. Esta extensão remove esse header só no computador do escritório.

## Instalação (Chrome ou Edge)

1. Abra `chrome://extensions` (ou `edge://extensions`).
2. Ative **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta `extensions/ceac-frame` deste repositório.
5. Recarregue a página **Preencher DS-160** no CP Vistos.

Não publique na Chrome Web Store. Instale só nas máquinas do admin.
