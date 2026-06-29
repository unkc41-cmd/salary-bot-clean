const express = require("express");
const { Telegraf } = require("telegraf");
const axios = require("axios");

const app = express();
app.use(express.json());

const bot = new Telegraf(process.env.BOT_TOKEN);

// 📊 Google Sheets CSV (Лист1)
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1kvGQtRTFeXl18Aoaz5Ig52SORYhMiEydDGoIVQWXmPI/gviz/tq?tqx=out:csv&sheet=Лист1";

// ---------------- ЧИТАННЯ ТАБЛИЦІ ----------------
async function getRows() {
  const res = await axios.get(SHEET_URL);

  const lines = res.data.split("\n");

  return lines.map(line => {
    return line
      .replace(/\r/g, "")
      .split(",")
      .map(cell =>
        cell
          .replace(/"/g, "")
          .trim()
      );
  });
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
    const userId = String(ctx.from.id).trim();

    // 🆔 ID
    if (action === "id") {
      return ctx.reply("🆔 " + userId);
    }

    // 💰 ЗП
    if (action === "salary") {
      const rows = await getRows();

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];

        const sheetId = String(row[0] || "")
          .replace(/"/g, "")
          .replace(/\s/g, "")
          .trim();

        const salary = (row[2] || "0").trim();

        if (sheetId === userId) {
          return ctx.reply(`💰 ЗП: ${salary} грн`);
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
app.post("/webhook", (req, res) => {
  bot.handleUpdate(req.body);
  res.send("ok");
});

app.get("/", (req, res) => {
  res.send("Bot is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("RUNNING ON", PORT));
