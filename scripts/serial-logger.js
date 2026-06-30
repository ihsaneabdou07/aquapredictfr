import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import { WebSocketServer } from "ws";

// ===== CONFIG =====
const PORT_PATH = "COM3"; // Remplacez par le port série approprié
const BAUD_RATE = 115200;

// ===== SERIAL =====
const port = new SerialPort({
  path: PORT_PATH,
  baudRate: BAUD_RATE,
});

const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

// ===== WEBSOCKET SERVER =====
const wss = new WebSocketServer({ port: 3001 });

wss.on("connection", (ws) => {
  console.log("[WS] Client connecté");

  ws.on("close", () => {
    console.log("[WS] Client déconnecté");
  });
});

// ===== SERIAL EVENTS =====
port.on("open", () => {
  console.log(`[serial] Connecté sur ${PORT_PATH}`);
});

port.on("error", (err) => {
  console.error("[serial] Erreur:", err.message);
});

// ===== DATA PROCESSING =====
parser.on("data", (data) => {
  try {
    const json = JSON.parse(data);

    // ===== EXTRACTION SAFE =====
    const flow1 = json.flow1 ?? 0;
    const flow2 = json.flow2 ?? 0;
    const flow3 = json.flow3 ?? 0;

    const pressure1 = json.pressure1 ?? 0;
    const pressure2 = json.pressure2 ?? 0;
    const pressure3 = json.pressure3 ?? 0;

    const temperature = json.temperature ?? 0;
   
    // Simmulation de données si nécessaire
    /*

    
    const flow1 = +(5.8 + Math.random() * 0.2).toFixed(2);
    const flow2 = +(flow1 - (1 + Math.random() * 0.3)).toFixed(2);
    const flow3 = +(flow2 - (1.3 + Math.random() * 0.5)).toFixed(2);

    const pressure1 = +(4.3 + Math.random() * 0.3).toFixed(2);
    const pressure2 = +(pressure1 - (1 + Math.random() * 0.2)).toFixed(2);
    const pressure3 = +(pressure2 - (1.2 + Math.random() * 0.6)).toFixed(2);
    const temperature = json.temperature ?? 0;
     */
    // ===== DEBUG TERMINAL =====
    console.log(
      `💧 [F1:${flow1.toFixed(2)} | F2:${flow2.toFixed(2)} | F3:${flow3.toFixed(2)}] L/min`
    );
    console.log(
      `📊 [P1:${pressure1.toFixed(2)} | P2:${pressure2.toFixed(2)} | P3:${pressure3.toFixed(2)}] bar`
    );
    console.log(`🌡 Température: ${temperature.toFixed(2)} °C`);
    console.log("--------------------------------------------------");

    // ===== PAYLOAD FRONTEND =====
    const payload = {
      flow1,
      flow2,
      flow3,
      pressure1,
      pressure2,
      pressure3,
      temperature,
    };

    // ===== ENVOI WEBSOCKET =====
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(payload));
      }
    });

  } catch (err) {
    console.log("⚠️ Donnée ignorée:", data);
  }
});
