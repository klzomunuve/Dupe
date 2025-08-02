// index.js import makeWASocket, { DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys"; import { Boom } from "@hapi/boom"; import pino from "pino"; import fs from "fs";

// Load environment variables import dotenv from "dotenv"; dotenv.config();

// Constants from .env const OWNER_NAME = process.env.OWNER_NAME || "Alfredo"; const PREFIX = process.env.PREFIX || "."; const PUBLIC_MODE = process.env.PUBLIC_MODE === "yes"; const BOT_NAME = process.env.BOT_NAME || "Alfredo bot"; const NUMERO_OWNER = process.env.NUMERO_OWNER || "254759729937"; const IMAGE_MENU = process.env.IMAGE_MENU || "https://telegra.ph/file/0c225f7da5616cdcbec80.jpg";

// Auth state (Baileys V2 uses multi-file auth) const startBot = async () => { const { state, saveCreds } = await useMultiFileAuthState("session");

const sock = makeWASocket({ printQRInTerminal: true, auth: state, logger: pino({ level: "silent" }), downloadHistory: false, markOnlineOnConnect: true, });

// Connection update sock.ev.on("connection.update", async (update) => { const { connection, lastDisconnect } = update; if (connection === "close") { const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut; if (shouldReconnect) startBot(); } else if (connection === "open") { console.log(✅ ${BOT_NAME} is online as ${sock.user.name}); } });

// Handle messages sock.ev.on("messages.upsert", async ({ messages, type }) => { if (type !== "notify") return; const msg = messages[0]; if (!msg.message || msg.key.fromMe) return;

const from = msg.key.remoteJid;
const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

// Commands
if (text.startsWith(PREFIX)) {
  const command = text.slice(1).trim().split(" ")[0].toLowerCase();

  switch (command) {
    case "menu":
      await sock.sendMessage(from, {
        image: { url: IMAGE_MENU },
        caption: `✨ Hello! I'm ${BOT_NAME}\n👑 Owner: ${OWNER_NAME}\n\nAvailable Commands:\n- ${PREFIX}menu\n- ${PREFIX}info`,
      });
      break;

    case "info":
      await sock.sendMessage(from, {
        text: `🤖 *${BOT_NAME} Info*\n• Owner: ${OWNER_NAME}\n• Public: ${PUBLIC_MODE}\n• Prefix: ${PREFIX}`,
      });
      break;

    default:
      await sock.sendMessage(from, { text: "❌ Unknown command." });
  }
}

});

// Save credentials sock.ev.on("creds.update", saveCreds); };

startBot();

