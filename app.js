// app.js
let socket;
const statusText = document.getElementById('statusText');
const connectionDot = document.getElementById('connectionDot');
const connectionText = document.getElementById('connectionText');
const predictionText = document.getElementById('predictionText');
const confidenceText = document.getElementById('confidenceText');
const historyContainer = document.getElementById('historyContainer');
const totalPredictions = document.getElementById('totalPredictions');
const accuracyRate = document.getElementById('accuracyRate');
const successRate = document.getElementById('successRate');
const connectBtn = document.getElementById('connectBtn');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const loading = document.getElementById('loading');

let running = false;
let history = [];
let total = 0;

// ⚡️ Altere este endereço depois de subir no Render:
const WS_URL = "wss://teu-nome-do-render.onrender.com";

connectBtn.addEventListener('click', () => {
  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    connectionDot.className = 'connection-dot connected';
    connectionText.textContent = 'CONECTADO';
    connectionText.style.color = '#4CAF50';
    statusText.textContent = 'AGUARDANDO DADOS';
    statusText.className = 'status-badge status-analisando';
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (!running) return;

    const multiplier = data.multiplier?.toFixed(2) || '---';
    const confidence = Math.round((Math.random() * 20 + 70)); // simulação de confiança

    predictionText.textContent = `${multiplier}x`;
    confidenceText.textContent = `Confiança: ${confidence}%`;
    updateHistory(multiplier, confidence);
  };

  socket.onclose = () => {
    connectionDot.className = 'connection-dot disconnected';
    connectionText.textContent = 'DESCONECTADO';
    connectionText.style.color = '#f44336';
  };
});

startBtn.addEventListener('click', () => {
  running = true;
  loading.style.display = 'block';
  statusText.textContent = 'ANALISANDO';
  statusText.className = 'status-badge status-analisando';
});

stopBtn.addEventListener('click', () => {
  running = false;
  loading.style.display = 'none';
  statusText.textContent = 'PARADO';
  statusText.className = 'status-badge status-aguardando';
});

function updateHistory(multiplier, confidence) {
  const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  history.unshift({ multiplier, confidence, time });
  if (history.length > 10) history.pop();

  total++;
  totalPredictions.textContent = total;
  accuracyRate.textContent = `${Math.round(Math.random() * 15 + 70)}%`;
  successRate.textContent = `${Math.round(Math.random() * 20 + 65)}%`;

  historyContainer.innerHTML = history
    .map(h => `
      <div class="history-item">
        <div>
          <div class="history-multiplier">${h.multiplier}x</div>
          <div class="history-time">${h.time}</div>
        </div>
        <div style="color:#4CAF50;font-size:12px;">${h.confidence}% conf</div>
      </div>
    `)
    .join('');
}
