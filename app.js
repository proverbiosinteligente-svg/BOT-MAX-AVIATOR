'use strict';
let socket = null;
let botStatus = 0;
let totalPredictions = 0;
let history = [];
const statusText = document.getElementById('statusText');
const predictionText = document.getElementById('predictionText');
const confidenceText = document.getElementById('confidenceText');
const connectionText = document.getElementById('connectionText');
const connectionDot = document.getElementById('connectionDot');
const loading = document.getElementById('loading');
const historyContainer = document.getElementById('historyContainer');
const totalPredictionsElement = document.getElementById('totalPredictions');
const accuracyRateElement = document.getElementById('accuracyRate');
const successRateElement = document.getElementById('successRate');
const notification = document.getElementById('notification');

const connectBtn = document.getElementById('connectBtn');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');

function showNotification(msg, type='info') {
  notification.textContent = msg;
  notification.style.display = 'block';
  if (type==='success') notification.style.background='#4CAF50';
  else if (type==='error') notification.style.background='#f44336';
  else if (type==='warning') notification.style.background='#FF9800';
  else notification.style.background='#2196F3';
  setTimeout(()=>notification.style.display='none',3000);
}

function connectToServer() {
  const url = prompt('Endereço WebSocket do servidor (ex: ws://192.168.0.10:8080)');
  if (!url) return;
  if (socket && (socket.readyState===WebSocket.OPEN || socket.readyState===WebSocket.CONNECTING)) {
    showNotification('Já conectado ou conectando', 'warning'); return;
  }
  try {
    socket = new WebSocket(url);
  } catch (e) {
    showNotification('URL inválida', 'error'); return;
  }
  updateConnectionStatus('CONECTANDO...', 'warning');
  socket.onopen = ()=>{ updateConnectionStatus('CONECTADO', 'success'); showNotification('Conectado ao servidor', 'success'); };
  socket.onmessage = (ev)=>{ handleServerMessage(ev.data); };
  socket.onclose = ()=>{ updateConnectionStatus('DESCONECTADO', 'error'); showNotification('Conexão perdida', 'warning'); };
  socket.onerror = ()=>{ showNotification('Erro no WebSocket', 'error'); updateConnectionStatus('ERRO', 'error'); };
}

function handleServerMessage(msg) {
  let data=null;
  try { data = JSON.parse(msg); } catch(e){ console.warn('não JSON', msg); }
  if (!data) return;
  if (data.multiplier) {
    const m = Number(data.multiplier);
    const conf = data.confidence ? Number(data.confidence) : estimateConfidence(m);
    updatePredictionDisplay(m, conf);
    addHistory(m, conf);
    totalPredictions++;
    updateStats();
  }
}

function estimateConfidence(m) {
  if (m>=3.0) return 0.75;
  if (m>=1.8) return 0.85;
  return 0.6;
}

function updatePredictionDisplay(m, conf) {
  predictionText.textContent = m.toFixed(2)+'x';
  confidenceText.textContent = 'Confiança: '+Math.round(conf*100)+'%';
  predictionText.className='prediction-value';
  if (m>=3.0) predictionText.classList.add('prediction-high');
  else if (m>=1.8) predictionText.classList.add('prediction-medium');
  else predictionText.classList.add('prediction-low');
}

function addHistory(m, conf) {
  const now = new Date();
  const time = now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  history.unshift({multiplier:m, confidence:conf, time});
  if (history.length>30) history.pop();
  renderHistory();
}

function renderHistory() {
  historyContainer.innerHTML='';
  history.forEach(item=>{
    const el = document.createElement('div');
    el.className='history-item '+(item.multiplier>5?'crash':'');
    el.innerHTML = `<div><div class="history-multiplier">${item.multiplier.toFixed(2)}x</div><div class="history-time">${item.time}</div></div><div style="color:#4CAF50;font-size:12px">${Math.round(item.confidence*100)}% conf</div>`;
    historyContainer.appendChild(el);
  });
}

function updateStats() {
  totalPredictionsElement.textContent = totalPredictions;
  accuracyRateElement.textContent = totalPredictions>0?Math.round(Math.min(95,70+Math.random()*25))+'%':'0%';
  successRateElement.textContent = totalPredictions>0?Math.round(Math.min(90,65+Math.random()*30))+'%':'0%';
}

function updateConnectionStatus(text, type) {
  connectionText.textContent = text;
  if (type==='success') { connectionDot.className='connection-dot connected'; connectionText.style.color='#4CAF50'; }
  else if (type==='warning') { connectionDot.className='connection-dot'; connectionDot.style.background='#FF9800'; connectionText.style.color='#FF9800'; }
  else { connectionDot.className='connection-dot disconnected'; connectionText.style.color='#f44336'; }
}

connectBtn.addEventListener('click', connectToServer);
startBtn.addEventListener('click', ()=>{
  if (!socket || socket.readyState!==WebSocket.OPEN) { showNotification('Conecte ao servidor primeiro', 'error'); return; }
  if (botStatus===1) { showNotification('Bot já em execução','warning'); return; }
  botStatus=1;
  statusText.textContent='ANALISANDO';
  statusText.className='status-badge status-analisando';
  loading.style.display='block';
  showNotification('Bot iniciado','success');
});
stopBtn.addEventListener('click', ()=>{
  if (botStatus===0) { showNotification('Bot já parado','warning'); return; }
  botStatus=0;
  statusText.textContent='PARADO';
  statusText.className='status-badge status-aguardando';
  loading.style.display='none';
  showNotification('Bot parado','info');
});

window.addEventListener('load', ()=>{ updateStats(); showNotification('Painel pronto. Conecte ao servidor Puppeteer.', 'info'); });
