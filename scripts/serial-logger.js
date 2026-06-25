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

    console.log("Débit:", json.data?.flow_rate ?? json.flow_rate);

    // 🔥 envoi temps réel vers frontend
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(json));
      }
    });

  } catch {
    // ignore bruit série
  }
});