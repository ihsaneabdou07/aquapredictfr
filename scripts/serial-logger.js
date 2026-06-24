import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import * as fs from "node:fs";

const PORT_PATH = process.env.SERIAL_PORT ?? "COM3";
const BAUD_RATE = Number(process.env.SERIAL_BAUD ?? 115200);
const OUTPUT_FILE = process.env.SERIAL_OUTPUT_FILE ?? "data.txt";

// Optionnel: envoi des donnees vers la fonction Supabase
const ENABLE_SUPABASE_SEND = process.env.SERIAL_SEND_TO_SUPABASE === "true";
const SUPABASE_FUNCTION_URL = process.env.SUPABASE_FUNCTION_URL ?? "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";
const ID_TRONCON = process.env.ID_TRONCON ?? "TR-Z1-042";

const port = new SerialPort({
  path: PORT_PATH,
  baudRate: BAUD_RATE,
});

const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const normalizePayload = (json) => {
  // Accepte plusieurs noms de champs capteur courants
  const flowRate = toNumber(json.flow_rate ?? json.flow ?? json.debit);
  const pressure = toNumber(json.pressure ?? json.pression);
  const temperature = toNumber(json.temperature ?? json.temp);

  if (typeof flowRate !== "number" || typeof pressure !== "number") {
    return undefined;
  }

  return {
    flow_rate: flowRate,
    pressure,
    temperature: typeof temperature === "number" ? temperature : 18.5,
    idTroncon: json.idTroncon ?? ID_TRONCON,
  };
};

const sendToSupabase = async (payload) => {
  if (!ENABLE_SUPABASE_SEND) return;

  if (!SUPABASE_FUNCTION_URL) {
    console.error("[serial] SUPABASE_FUNCTION_URL manquante: envoi ignore.");
    return;
  }

  const headers = {
    "Content-Type": "application/json",
  };

  if (SUPABASE_ANON_KEY) {
    headers.apikey = SUPABASE_ANON_KEY;
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  }

  try {
    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[serial] Erreur envoi Supabase (${response.status}): ${text}`);
      return;
    }

    const result = await response.json().catch(() => ({}));
    console.log("[serial] Envoi Supabase OK", result?.alert_triggered ? "(alerte declenchee)" : "");
  } catch (error) {
    console.error("[serial] Echec envoi Supabase:", error?.message ?? String(error));
  }
};

port.on("open", () => {
  console.log(`[serial] Port ouvert: ${PORT_PATH} @ ${BAUD_RATE}`);
  console.log(`[serial] Sauvegarde dans: ${OUTPUT_FILE}`);
  console.log(`[serial] Envoi Supabase: ${ENABLE_SUPABASE_SEND ? "active" : "desactive"}`);
});

port.on("error", (error) => {
  console.error("[serial] Erreur port serie:", error.message);
});

parser.on("data", async (data) => {
  try {
    const json = JSON.parse(data);

    console.log("Debit:", json.flow ?? json.flow_rate ?? json.debit, "L/min");

    // Sauvegarde continue des mesures en JSONL (une ligne par mesure)
    fs.appendFileSync(OUTPUT_FILE, JSON.stringify(json) + "\n", "utf8");

    const normalized = normalizePayload(json);
    if (!normalized) {
      console.warn("[serial] Donnee ignoree: champs flow/pressure introuvables.");
      return;
    }

    await sendToSupabase(normalized);
  } catch {
    // Ignore les lignes non-JSON ou corrompues
  }
});
