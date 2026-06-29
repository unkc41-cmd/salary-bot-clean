const express = require("express");
const { Telegraf } = require("telegraf");
const axios = require("axios");

const app = express();
app.use(express.json());

const bot = new Telegraf(process.env.BOT_TOKEN);

const SHEET_ID = process.env.SHEET_ID;
const API_KEY = process.env.GOOGLE_API_KEY;

// ---------------- GOOGLE SHEETS ----------------
async function getRows() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Лист1!A:C?key=${API_KEY}`;

  const res = await axios.get(url);
  return res.data.values || [];
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

// ---------------- CALLBACK ----------------
bot.on("callback_query", async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const action = ctx.callbackQuery.data;
    const chatId = String(ctx.from.id);

    if (action === "id") {
      return ctx.reply("🆔 " + chatId);
    }

    if (action === "salary") {
      const rows = await getRows();

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === chatId) {
          return ctx.reply("💰 ЗП: " + (rows[i][2] || 0) + " грн");
        }
      }

      return ctx.reply("❌ Тебе не знайдено в таблиці");
    }

  } catch (err) {
    console.log("ERROR:", err);
    return ctx.reply("⚠️ Помилка сервера");
  }
});

// ---------------- WEBHOOK ----------------
aapp.post("/webhook", (req, res) => {
  bot.handleUpdate(req.body);
  res.send("ok");
});



