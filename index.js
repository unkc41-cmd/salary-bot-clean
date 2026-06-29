const express = require("express");
const { Telegraf } = require("telegraf");

const app = express();
app.use(express.json());

const bot = new Telegraf(process.env.BOT_TOKEN);

// 📦 БАЗА ДАНИХ (замість Google Sheets)
const users = {
  "123456789": { name: "Іван", salary: 15000 },
  "987654321": { name: "Оля", salary: 18000 }
};

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
    return ctx.reply("🆔 Твій ID: " + id);
  }

  if (action === "salary") {
    const user = users[id];

    if (!user) {
      return ctx.reply("❌ Тебе немає в базі");
    }

    return ctx.reply(
      `💰 ЗП: ${user.salary} грн\n👤 ${user.name}`
    );
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
