const express = require("express");
const { Telegraf } = require("telegraf");
const axios = require("axios");

const app = express();
app.use(express.json());

const bot = new Telegraf(process.env.BOT_TOKEN);

const SHEET_URL = "https://docs.google.com/spreadsheets/d/1kvGQtRTFeXl18Aoaz5Ig52SORYhMiEydDGoIVQWXmPI/gviz/tq?tqx=out:csv&sheet=Лист1";

// ---------------- ЧИТАЄМО ТАБЛИЦЮ ----------------
async function getData() {
  const res = await axios.get(SHEET_URL);

  return res.data
    .split("\n")
    .map(row => row.replace(/\r/g, "").split(","));
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
  await ctx.answerCbQuery();

  const action = ctx.callbackQuery.data;
  const id = String(ctx.from.id);

  if (action === "id") {
    return ctx.reply("🆔 " + id);
  }

  if (action === "salary") {
    try {
      const data = await getData();

      // пропускаємо заголовок
      for (let i = 1; i < data.length; i++) {
        const row = data[i];

        const telegramId = (row[0] || "").trim();
        const salary = row[2] || "0";

        if (telegramId === id) {
          return ctx.reply("💰 ЗП: " + salary + " грн");
        }
      }

      return ctx.reply("❌ Тебе не знайдено в таблиці");

    } catch (e) {
      console.log(e);
      return ctx.reply("⚠️ Помилка читання таблиці");
    }
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
app.listen(PORT, () => console.log("RUNNING"));
