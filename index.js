const express = require("express");
const { Telegraf } = require("telegraf");
const { google } = require("googleapis");

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SHEET_ID = process.env.SHEET_ID;

const bot = new Telegraf(BOT_TOKEN);

// 🔑 ПРОСТА АВТОРИЗАЦІЯ (без credentials.json)
const auth = new google.auth.GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
});

async function getSheets() {
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

// ---------------- START ----------------
bot.start((ctx) => {
  return ctx.reply("👇 Обери дію:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "💰 Моя ЗП", callback_data: "salary" }],
        [{ text: "🆔 Мій ID", callback_data: "id" }]
      ]
    }
  });
});

// ---------------- CALLBACK (СТАБІЛЬНИЙ) ----------------
bot.on("callback_query", async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const action = ctx.callbackQuery.data;
    const chatId = String(ctx.from.id);

    if (action === "id") {
      return ctx.reply("🆔 " + chatId);
    }

  if (action === "salary") {
  try {
    const sheets = await sheetsClient();

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Лист1!A:C"
    });

    const rows = res.data.values || [];

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(chatId)) {
        return ctx.reply("💰 ЗП: " + (rows[i][2] || 0) + " грн");
      }
    }

    return ctx.reply("❌ ID не знайдено");
  } catch (e) {
    console.log("SHEETS ERROR:", e);
    return ctx.reply("⚠️ Sheets error (дивись logs)");
  }
}
// ---------------- WEBHOOK ----------------
app.post("/webhook", (req, res) => {
  bot.handleUpdate(req.body);
  res.send("ok");
});

app.get("/", (req, res) => {
  res.send("Bot is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("RUNNING ON", PORT));
