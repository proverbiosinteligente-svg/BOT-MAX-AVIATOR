// ======== BOT MAX AVIATOR - Servidor WebSocket ========
// Compatível com Render.com (porta dinâmica) e GitHub Pages frontend

import express from "express";
import { WebSocketServer } from "ws";
import http from "http";

const app = express();
const server = http.createServer(app);

// Cria servidor WebSocket
const wss = new WebSocketServer({ server });

// Exibe status no console
console.log("🧠 BOT MAX AVIATOR - Servidor WebSocket iniciado...");

// Quando um cliente se conecta
wss.on("connection", (ws) => {
  console.log("✅ Novo cliente conectado");

  ws.send(JSON.stringify({
    status: "Conectado ao servidor BOT MAX AVIATOR",
  }));

  // Envia previsões a cada 5 segundos (exemplo)
  const intervalo = setInterval(() => {
    const previsao = (Math.random() * (5 - 1) + 1).toFixed(2);
    const confianca = Math.floor(Math.random() * 100);

    ws.send(
      JSON.stringify({
        proxima: previsao + "x",
        confianca: confianca + "%",
        status: "ANALISANDO",
      })
    );
  }, 5000);

  // Quando o cliente se desconecta
  ws.on("close", () => {
    console.log("❌ Cliente desconectado");
    clearInterval(intervalo);
  });

  ws.on("error", (err) => console.error("⚠️ Erro no WebSocket:", err.message));
});

// Endpoint raiz (só para testar)
app.get("/", (req, res) => {
  res.send("🚀 Servidor BOT MAX AVIATOR está ativo!");
});

// Render usa a porta dinâmica fornecida no ambiente
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🌍 Servidor rodando na porta ${PORT}`);
});
