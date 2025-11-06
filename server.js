// server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.get("/", (req, res) => {
  res.send("🚀 Servidor BOT MAX AVIATOR está ativo e enviando previsões simuladas!");
});

wss.on("connection", (ws) => {
  console.log("Cliente conectado ✅");

  ws.send(JSON.stringify({ status: "conectado" }));

  // Enviar previsões simuladas a cada 5 segundos
  const sendPrediction = () => {
    const multiplier = (Math.random() * 10 + 1).toFixed(2); // Exemplo: 2.56x
    const confidence = (Math.random() * 40 + 60).toFixed(1); // 60–100%

    const data = {
      status: "analisando",
      prediction: `${multiplier}x`,
      confidence: `${confidence}%`,
      timestamp: new Date().toLocaleTimeString("pt-BR"),
    };

    ws.send(JSON.stringify(data));
  };

  const interval = setInterval(sendPrediction, 5000);

  ws.on("close", () => {
    console.log("Cliente desconectado ❌");
    clearInterval(interval);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Servidor WebSocket ativo na porta ${PORT}`));
