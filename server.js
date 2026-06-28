import express from "express";
import fs from "fs";
import { WebSocketServer } from "ws";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tidianesarrndiaye04@gmail.com",
    pass: "kxex elfy xsvz sxvm"
  }
});


const wss = new WebSocketServer({ port: 4001 });

wss.on("connection", (ws) => {
  console.log("👤 Client connecté pour alertes");
});

const app = express();
app.use(express.json());

const PORT = 4000;

// ===== DATABASE SIMPLE =====
const USERS_FILE = "./users.json";
const ALERTS_FILE = "./alerts.json";

// init fichiers
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");
if (!fs.existsSync(ALERTS_FILE)) fs.writeFileSync(ALERTS_FILE, "[]");

// ===== REGISTER =====
app.post("/register", (req, res) => {
  const users = JSON.parse(fs.readFileSync(USERS_FILE));

  users.push(req.body);

  fs.writeFileSync(USERS_FILE, JSON.stringify(users));

  res.json({ success: true });
});

// ===== LOGIN =====
app.post("/login", (req, res) => {
  const users = JSON.parse(fs.readFileSync(USERS_FILE));

  const user = users.find(
    (u) => u.email === req.body.email && u.password === req.body.password
  );

  if (user) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// ===== SAVE ALERT =====
app.post("/alert", (req, res) => {
  const alerts = JSON.parse(fs.readFileSync(ALERTS_FILE));

  alerts.push(req.body);

  fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts));

  // ✅ EMAIL AUTOMATIQUE
  const { section, probability } = req.body;
  
// ✅ envoi en temps réel à tous les clients connectés
  wss.clients.forEach(client => {
    client.send(JSON.stringify({
      section,
      probability
    }));
  });


transporter.sendMail({
  from: "AquaPredict",
  to: "mamadiallo944@gmail.com",
  subject: "🚨 Fuite détectée",
  html: `
    <h2>⚠️ Fuite détectée</h2>
    <p><b>Section :</b> ${section}</p>
    <p><b>Probabilité :</b> ${(probability * 100).toFixed(2)}%</p>
    <p>Action recommandée immédiate.</p>
    <a href="http://172.22.6.41:8080/login">Accéder à la plateforme</a>
  `
});
  res.json({ success: true });
});



// ===== GET ALERTS =====
app.get("/alerts", (req, res) => {
  const alerts = JSON.parse(fs.readFileSync(ALERTS_FILE));
  res.json(alerts);
});

app.listen(PORT, () => {
  console.log("✅ Backend running on port", PORT);
});
app.get("/", (req, res) => {
  res.send("✅ AquaPredict Backend OK");
});