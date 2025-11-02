# Bot MAX - Integração Real com ElephantBet (Aviator)

**Conteúdo do pacote**
- `index.html`, `styles.css`, `app.js` — painel cliente que recebe dados via WebSocket.
- `server.js` — servidor Node.js que usa Puppeteer para abrir a página da ElephantBet e extrair dados em tempo real (via WebSocket frames ou polling DOM).
- `package.json` — dependências (puppeteer, ws).
- `android/MainActivity.java` — exemplo de como usar WebView para carregar o jogo no app Android.

## Observações importantes (leia antes de rodar)
1. **Legalidade & Termos de Uso**: Automatizar leitura de dados de um site de terceiros pode violate the site's Terms of Use. Verifique permissões e políticas da ElephantBet before using in production.
2. **Bloqueios e Proteções**: Sites de cassino frequentemente usam obfuscação, WebSockets proprietários ou proteção anti-bot. O script aqui usa técnicas gerais (captura de frames WebSocket via CDP e polling do DOM) — pode ser necessário adaptar seletores ou lógica para o site específico.
3. **Requerimentos**:
   - Node.js 18+ (recomendado)
   - Conexão de internet
   - Permissões para executar Puppeteer (download de Chromium pode ocorrer na primeira execução)
4. **Uso**:
   - Instale dependências: `npm install`
   - Rode: `TARGET_URL="https://www.elephantbet.co.ao/pt/casino/game-view/806666/aviator" node server.js`
   - Abra `index.html` no navegador (ou hospede) e, ao clicar em "CONECTAR", informe o endereço do WebSocket: `ws://<servidor>:8080`

## Android WebView
O arquivo `android/MainActivity.java` contem um exemplo simples que carrega:
```
https://www.elephantbet.co.ao/pt/casino/game-view/806666/aviator
```
dentro de uma `WebView`. Para usar, crie um projeto Android e substitua a Activity.

## Segurança
- Em produção, use `wss://` e autenticação entre servidor e clientes.
- Não exponha o servidor sem proteção.

## Ajustes possíveis
- Melhorar parsing de WebSocket frames para o protocolo específico.
- Capturar eventos via CDP mais precisos (Network.webSocketFrameReceived já é usado).
- Executar Puppeteer em modo não-headless with devtools for debugging.
