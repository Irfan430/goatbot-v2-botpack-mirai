const fs = require("fs");

const COLORS = ["🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪"];
const LIMIT_INTERVAL_HOURS = 12;
const MAX_PLAYS = 20;

module.exports = {
  config: {
    name: "colorpicker",
    aliases: ["cp"],
    version: "1.0",
    author: "XNil",
    countDown: 5,
    role: 0,
    category: "game",
    shortDescription: { en: "Pick the correct color!" },
    guide: {
      en: "{pn} [amount] - Play the color picker game\n{pn} top - Show leaderboard"
    }
  },

  onStart: async function ({ args, event, message, usersData }) {
    const senderID = event.senderID;

    if (args[0] === "top") {
      const allUsers = await usersData.getAll();
      const topPlayers = allUsers
        .filter(u => u.data?.colorWin)
        .sort((a, b) => (b.data.colorWin || 0) - (a.data.colorWin || 0))
        .slice(0, 20);

      if (topPlayers.length === 0)
        return message.reply("🚫 No top players yet!");

      const leaderboard = topPlayers.map((u, i) =>
        `${i + 1}. ${u.name} - 🏆 ${u.data.colorWin || 0} wins`
      ).join("\n");

      return message.reply(`🎨 TOP 20 COLOR PICKERS 🎨\n\n${leaderboard}`);
    }

    const user = await usersData.get(senderID);
    const amount = parseInt(args[0]);

    if (isNaN(amount) || amount <= 0)
      return message.reply("⚠️ Please enter a valid amount to bet.");
    if (user.money < amount)
      return message.reply("💸 You don't have enough money to play.");

    // Limit system
    const now = Date.now();
    const lastReset = user.data?.colorLastReset || 0;
    const playHistory = user.data?.colorPlayHistory || [];

    if (now - lastReset > LIMIT_INTERVAL_HOURS * 60 * 60 * 1000) {
      await usersData.set(senderID, {
        "data.colorLastReset": now,
        "data.colorPlayHistory": []
      });
      playHistory.length = 0;
    }

    if (playHistory.length >= MAX_PLAYS) {
      return message.reply(`⛔ You've reached the ${MAX_PLAYS} plays limit in ${LIMIT_INTERVAL_HOURS} hours.`);
    }

    const options = [];
    for (let i = 0; i < 3; i++) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      options.push(color);
    }

    const correctIndex = Math.floor(Math.random() * 3);
    const correctColor = options[correctIndex];

    const msg = await message.reply(
      `🎨 PICK THE COLOR!\n\n` +
      `1️⃣ ${options[0]}   2️⃣ ${options[1]}   3️⃣ ${options[2]}\n\n` +
      `Reply with 1, 2, or 3 within 30 seconds!`
    );

    const timeout = setTimeout(() => {
      message.reply("⌛ Time's up! You didn't respond.");
      global.GoatBot.onReply.delete(msg.messageID);
    }, 30 * 1000);

    global.GoatBot.onReply.set(msg.messageID, {
      commandName: this.config.name,
      author: senderID,
      correct: correctIndex + 1,
      emoji: correctColor,
      bet: amount,
      messageID: msg.messageID,
      timeout,
      playHistory
    });
  },

  onReply: async function ({ event, message, Reply, usersData }) {
    const senderID = event.senderID;
    const input = event.body.trim();

    if (!["1", "2", "3"].includes(input))
      return message.reply("⚠️ Please reply with 1, 2 or 3 only.");

    if (senderID !== Reply.author)
      return message.reply("❌ You can't answer others' game!");

    clearTimeout(Reply.timeout);
    global.GoatBot.onReply.delete(Reply.messageID);

    const user = await usersData.get(senderID);
    const guess = parseInt(input);

    const now = Date.now();
    const playHistory = user.data?.colorPlayHistory || [];
    playHistory.push(now);

    await usersData.set(senderID, {
      "data.colorPlayHistory": playHistory
    });

    let resultMessage;

    if (guess === Reply.correct) {
      const newMoney = user.money + Reply.bet * 4;
      const wins = (user.data?.colorWin || 0) + 1;
      await usersData.set(senderID, {
        money: newMoney,
        "data.colorWin": wins
      });

      resultMessage =
        `✅ Correct! The color was ${Reply.emoji}\n` +
        `💰 You won ${Reply.bet * 4} coins!\n` +
        `💵 Balance: ${newMoney} coins\n🎉 Well done!`;
    } else {
      const newMoney = user.money - Reply.bet;
      await usersData.set(senderID, { money: newMoney });

      resultMessage =
        `❌ Wrong! The correct was ${Reply.correct} → ${Reply.emoji}\n` +
        `💸 You lost ${Reply.bet} coins\n` +
        `💵 Balance: ${newMoney} coins\n😢 Try again!`;
    }

    const remaining = MAX_PLAYS - playHistory.length;
    const limitMessage =
      `🎮 Plays: ${playHistory.length}/${MAX_PLAYS} (last ${LIMIT_INTERVAL_HOURS}h)\n` +
      `${remaining > 0 ? `🕹️ You can play ${remaining} more.` : `⛔ No plays left.`}`;

    return message.reply(`${resultMessage}\n\n${limitMessage}`);
  }
};
