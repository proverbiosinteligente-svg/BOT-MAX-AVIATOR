Bot MAX - ElephantBet Puppeteer WebSocket Server
================================================

Objetivo
--------
Este servidor abre a página do Aviator na ElephantBet usando Puppeteer, captura frames de WebSocket
(via CDP) e faz polling do DOM como fallback. Em seguida, transmite objetos JSON com o multiplicador
via WebSocket para clientes (seu painel no GitHub Pages ou app WebView).

Arquivos
--------
- servidor.js  -> código principal (Puppeteer + WebSocket)
- package.json -> dependências e script start
- README.md    -> este arquivo

Como rodar localmente (teste)
----------------------------
1. Clone este repositório no seu servidor ou máquina local.
2. Instale dependências:
   ```bash
   npm install
   ```
3. Rode:
   ```bash
   TARGET_URL="https://www.elephantbet.co.ao/pt/casino/game-view/806666/aviator" node servidor.js
   ```
4. O servidor irá expor um endpoint HTTP e um WebSocket na porta padrão (8080) ou PORT env var.
   Exemplo de cliente WebSocket: ws://<IP-do-servidor>:8080

Deploy no Render.com
--------------------
1. Conecta teu repositório no Render (New -> Web Service). Autoriza o GitHub se necessário.
2. Configure:
   - Build Command: `npm install`
   - Start Command: `node servidor.js`
3. Em variáveis de ambiente (opcional) defina `TARGET_URL` se quiser alterar a URL alvo.
4. Escolha um plano que permita execução de Puppeteer (instâncias gratuitas podem não suportar devido a sandbox).

Observações importantes
-----------------------
- Rodar Puppeteer em ambientes gerenciados pode exigir instalação de bibliotecas do sistema e mais memória.
- O código tenta capturar frames WebSocket; dependendo do site, o protocolo pode ser ofuscado e será necessário ajustar
  as heurísticas de parsing (seletores DOM ou decodificação de frames).
- Verifique os Termos de Uso da ElephantBet antes de usar em produção. Automação de leitura pode violar políticas.

Segurança
---------
- Em produção, proteja o acesso ao WebSocket (autenticação e TLS).
- Rode atrás de firewall e use medidas de proteção (fail2ban, etc.).
