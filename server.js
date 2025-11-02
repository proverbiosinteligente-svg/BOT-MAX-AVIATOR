// server.js
// Node.js server that uses Puppeteer to open ElephantBet Aviator page,
// extracts multiplier data (via WebSocket frames or DOM polling) and broadcasts to clients via ws.

const WebSocket = require('ws');
const puppeteer = require('puppeteer');

const WS_PORT = process.env.WS_PORT ? Number(process.env.WS_PORT) : 8080;
const TARGET_URL = process.env.TARGET_URL || 'https://www.elephantbet.co.ao/pt/casino/game-view/806666/aviator';

const wss = new WebSocket.Server({ port: WS_PORT });
console.log(`WebSocket broadcaster listening on :${WS_PORT}`);

// Broadcast helper
function broadcast(obj) {
  const json = JSON.stringify(obj);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

(async () => {
  // Start Puppeteer
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Enable Network domain to capture WebSocket frames via CDP
  const client = await page.target().createCDPSession();
  await client.send('Network.enable');

  client.on('Network.webSocketFrameReceived', ({ requestId, timestamp, response }) => {
    try {
      const payload = response.payloadData;
      // Try to extract JSON with multiplier
      if (typeof payload === 'string' && payload.includes('multiplier')) {
        try {
          const parsed = JSON.parse(payload);
          if (parsed && parsed.multiplier) {
            const multiplier = Number(parsed.multiplier);
            const ts = Date.now();
            console.log('WS frame multiplier:', multiplier);
            broadcast({ multiplier, confidence: null, ts });
          }
        } catch (e) {
          // not pure JSON, try regex
          const m = payload.match(/([0-9]+\.[0-9]{2})/);
          if (m) {
            const multiplier = Number(m[1]);
            broadcast({ multiplier, confidence: null, ts: Date.now() });
          }
        }
      } else {
        // fallback: look for numbers like 3.45 in payload
        const m = (payload || '').match(/([0-9]+\.[0-9]{2})/);
        if (m) {
          const multiplier = Number(m[1]);
          console.log('WS frame numeric found:', multiplier);
          broadcast({ multiplier, confidence: null, ts: Date.now() });
        }
      }
    } catch (err) {
      console.warn('Error handling WS frame', err);
    }
  });

  // Also periodically poll DOM for visible multiplier elements (fallback)
  async function pollDOMForMultiplier() {
    try {
      const res = await page.evaluate(() => {
        // try common patterns
        const selectors = [
          '[data-test*=multiplier]',
          '.multiplier',
          '.crash-value',
          '[class*=multiplier]',
          '.round-value',
          '#multiplier',
          '.game-result'
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.innerText) return el.innerText;
        }
        // try reading from some known global game state if available
        if (window.game && window.game.current) {
          return JSON.stringify(window.game.current);
        }
        return null;
      });
      if (res) {
        const m = (res + '').match(/([0-9]+\.[0-9]{2})/);
        if (m) {
          const multiplier = Number(m[1]);
          broadcast({ multiplier, confidence:null, ts: Date.now() });
        }
      }
    } catch (err) {
      // ignore
      console.warn('pollDOM error', err.message);
    }
  }

  // Navigate to target
  console.log('Navigating to:', TARGET_URL);
  await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });

  // Periodically poll DOM
  setInterval(pollDOMForMultiplier, 3000);

  console.log('Puppeteer monitoring started for', TARGET_URL);

  // Keep process alive
})().catch(err => {
  console.error('Fatal puppeteer error', err);
  process.exit(1);
});

