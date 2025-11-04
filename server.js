/**
 * servidor.js -- Puppeteer-based extractor for ElephantBet Aviator
 * - Opens the target page in headless Chromium
 * - Attaches to CDP Network to capture websocket frames
 * - Polls DOM as a fallback
 * - Broadcasts { multiplier, ts } via WebSocket (ws) to connected clients
 *
 * NOTE: Running Puppeteer on Render may require a larger instance and apt packages.
 *       If Render denies Puppeteer, run on a VPS or local machine instead.
 */
import fs from 'fs';
import http from 'http';
import express from 'express';
import { WebSocketServer } from 'ws';
import puppeteer from 'puppeteer';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const TARGET_URL = process.env.TARGET_URL || 'https://www.elephantbet.co.ao/pt/casino/game-view/806666/aviator';
const POLL_MS = Number(process.env.POLL_MS || '2000');
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

let browser = null;
let page = null;

// Broadcast helper
function broadcast(obj) {
  const json = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      try { client.send(json); } catch (err) { console.warn('ws send err', err.message); }
    }
  }
}

// Simple parse: find first number like 3.45 in a string
function extractMultiplierFromString(s) {
  if (!s) return null;
  const m = (s + '').match(/([0-9]+\.[0-9]{2})/);
  if (m) return Number(m[1]);
  return null;
}

// Start puppeteer and monitoring
async function startMonitoring() {
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    // enable network & websocket frame capture
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');

    client.on('Network.webSocketFrameReceived', ({ requestId, timestamp, response }) => {
      try {
        const payload = response.payloadData;
        // try JSON parse
        if (typeof payload === 'string') {
          try {
            const parsed = JSON.parse(payload);
            // adapt heuristics depending on payload structure
            if (parsed && (parsed.multiplier || parsed.mult || parsed.value)) {
              const multiplier = Number(parsed.multiplier || parsed.mult || parsed.value);
              if (!isNaN(multiplier)) {
                broadcast({ multiplier, ts: Date.now(), source: 'ws-frame' });
                return;
              }
            }
          } catch (e) {
            // not JSON, try regex to find number
            const m = (payload + '').match(/([0-9]+\.[0-9]{2})/);
            if (m) {
              const multiplier = Number(m[1]);
              broadcast({ multiplier, ts: Date.now(), source: 'ws-frame-regex' });
              return;
            }
          }
        }
      } catch (err) {
        console.warn('frame handler error', err.message);
      }
    });

    // Navigate
    console.log('Navigating to', TARGET_URL);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 }).catch(err => {
      console.warn('page.goto error', err.message);
    });

    // Periodic DOM polling fallback
    setInterval(async () => {
      try {
        const res = await page.evaluate(() => {
          // Heuristics: look for elements that likely contain last round multiplier
          const selectors = [
            '[data-test*="multiplier"]',
            '[class*="multiplier"]',
            '.crash-value',
            '.round-result',
            '.last-result',
            '.result-number',
            '.amount'
          ];
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText) return el.innerText;
          }
          // search for visible numbers in the page text
          const bodyText = document.body ? document.body.innerText : null;
          return bodyText ? bodyText.slice(0, 2000) : null;
        });
        if (res) {
          const m = extractMultiplierFromString(res);
          if (m) {
            broadcast({ multiplier: m, ts: Date.now(), source: 'dom-poll' });
          }
        }
      } catch (err) {
        // ignore
        console.warn('poll error', err.message);
      }
    }, POLL_MS);

    console.log('Puppeteer monitoring active.');

  } catch (err) {
    console.error('Fatal puppeteer error', err);
    process.exit(1);
  }
}

// Start server & ws
app.get('/', (req, res) => {
  res.send('BotMax ElephantBet WebSocket server is running.');
});

wss.on('connection', (ws) => {
  console.log('Client connected. total:', wss.clients.size);
  ws.send(JSON.stringify({ status: 'connected', ts: Date.now() }));
  ws.on('message', (msg) => {
    // simple ping handler
    if (msg === 'ping') ws.send('pong');
  });
  ws.on('close', () => {
    console.log('Client disconnected. total:', wss.clients.size);
  });
});

server.listen(PORT, async () => {
  console.log('Server listening on port', PORT);
  // start puppeteer monitoring after server listening
  await startMonitoring();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT received, closing...');
  try { if (browser) await browser.close(); } catch(e) {}
  process.exit(0);
});
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing...');
  try { if (browser) await browser.close(); } catch(e) {}
  process.exit(0);
});
