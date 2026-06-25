import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import { WebSocketServer } from "ws";

// ===== CONFIG =====
const PORT_PATH = "COM3";
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

    // ✅ récupérer toutes les valeurs
    const flow =
      json?.data?.flow_rate ??
      json.flow_rate ??
      json.flow ??
      0;

    const pressure =
      json?.data?.pressure ??
      json.pressure ??
      0;

    const temperature =
      json?.data?.temperature ??
      json.temperature ??
      0;

    // ✅ DEBUG dans le terminal Node
    console.log(
      `💧 Débit: ${flow} L/min | 📊 Pression: ${pressure} bar | 🌡 Température: ${temperature} °C`
    );

    // ✅ payload envoyé au frontend
    const payload = {
      flow_rate: flow,
      pressure: pressure,
      temperature: temperature
    };

    // ✅ envoi WebSocket
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(payload));
      }
    });

  } catch (err) {
    // ignore bruit série
    console.log("⚠️ Donnée ignorée:", data);
  }
});