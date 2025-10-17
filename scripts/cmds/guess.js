const guessOptions = ["🐣", "🙂", "🍀", "🌸", "🌼", "🐟", "🍎", "🍪", "🦄", "🍀"];
const fs = require("fs");

const LIMIT_INTERVAL_HOURS = 12;
const MAX_PLAYS = 20;

module.exports = {
  config: {
    name: "guess",
    version: "1.4",
    author: "XNil",
    countDown: 5,
    role: 0,
    category: "game",
    shortDescription: {
      en: "Guess the emoji!"
    },
    guide: {
      en: "{pn} [amount] - Play guessing game\n{pn} top - See leaderboard"
    }
  },

  onStart: async function ({ args, event, message, usersData }) {
    const senderID = event.senderID;

    if (args[0] === "top") {
      const allUsers = await usersData.getAll();
      const filtered = allUsers
        .filter(u => u.data?.guessWin)
        .sort((a, b) => (b.data.guessWin || 0) - (a.data.guessWin || 0))
        .slice(0, 20);

      if (filtered.length === 0)
        return message.reply("🚫 No winners yet!");

      const topList = filtered.map((u, i) =>
        `${i + 1}. ${u.name} - 🏆 ${u.data.guessWin || 0} wins`
      ).join("\n");

      return message.reply(`🏆 TOP 20 GUESS WINNERS 🏆\n\n${topList}`);
    }

    const user = await usersData.get(senderID);
    const amount = parseInt(args[0]);

    if (isNaN(amount) || amount <= 0)
      return message.reply("⚠️ Please enter a valid positive amount to bet.");

    if (user.money < amount)
      return message.reply("💸 You don't have enough money to play.");

    // Limit logic
    const now = Date.now();
    const lastReset = user.data?.guessLastReset || 0;
    const playHistory = user.data?.guessPlayHistory || [];

    // If last reset was over 12 hours ago, reset the play history
    if (now - lastReset > LIMIT_INTERVAL_HOURS * 60 * 60 * 1000) {
      playHistory.length = 0;
      await usersData.set(senderID, {
        "data.guessLastReset": now,
        "data.guessPlayHistory": []
      });
    }

    if (playHistory.length >= MAX_PLAYS) {
      return message.reply(`⛔ You've reached the limit of ${MAX_PLAYS} plays in ${LIMIT_INTERVAL_HOURS} hours.\n⏳ Please wait and try again later.`);
    }

    const options = [];
    for (let i = 0; i < 3; i++) {
      const emoji = guessOptions[Math.floor(Math.random() * guessOptions.length)];
      options.push(emoji);
    }

    const correctIndex = Math.floor(Math.random() * 3);
    const correctEmoji = options[correctIndex];

    const msg = await message.reply(
      `🎯 GUESS THE EMOJI!\n\n` +
      `1️⃣ ${options[0]}    2️⃣ ${options[1]}    3️⃣ ${options[2]}\n\n` +
      `Reply with 1, 2, or 3 within 30 seconds to guess.`
    );

    const timeout = setTimeout(() => {
      message.reply("⌛ Time's up! You didn't guess in time.");
      global.GoatBot.onReply.delete(msg.messageID);
    }, 30 * 1000);

    global.GoatBot.onReply.set(msg.messageID, {
      commandName: this.config.name,
      author: senderID,
      correct: correctIndex + 1,
      bet: amount,
      emoji: correctEmoji,
      messageID: msg.messageID,
      timeout,
      playHistory
    });

    const remaining = MAX_PLAYS - playHistory.length - 1;
  },

  onReply: async function ({ event, message, Reply, usersData }) {
    const senderID = event.senderID;

    if (!["1", "2", "3"].includes(event.body.trim()))
      return message.reply("⚠️ Please reply with 1, 2, or 3 only.");

    if (senderID !== Reply.author)
      return message.reply("❌ This is not your game!");

    clearTimeout(Reply.timeout);
    global.GoatBot.onReply.delete(Reply.messageID);

    const user = await usersData.get(senderID);
    const guess = parseInt(event.body.trim());

    const now = Date.now();
    const playHistory = user.data?.guessPlayHistory || [];

    // Add current time to history
    playHistory.push(now);
    await usersData.set(senderID, {
      "data.guessPlayHistory": playHistory
    });

    let resultMessage = "";

    if (guess === Reply.correct) {
      const newMoney = user.money + Reply.bet * 4;
      const wins = (user.data?.guessWin || 0) + 1;
      await usersData.set(senderID, {
        money: newMoney,
        "data.guessWin": wins
      });

      resultMessage =
        `✅ Correct! The emoji was ${Reply.emoji}\n\n` +
        `💰 You won: ${Reply.bet * 4} coins\n` +
        `💵 Your new balance: ${newMoney} coins\n\n` +
        `🎉 Congratulations!`;
    } else {
      const newMoney = user.money - Reply.bet;
      await usersData.set(senderID, { money: newMoney });

      resultMessage =
        `❌ Wrong! The correct answer was ${Reply.correct} → ${Reply.emoji}\n\n` +
        `💸 You lost: ${Reply.bet} coins\n` +
        `💵 Your new balance: ${newMoney} coins\n\n` +
        `😢 Better luck next time!`;
    }

    const remaining = MAX_PLAYS - playHistory.length;
    const limitInfo =
      `🎮 You've played ${playHistory.length}/${MAX_PLAYS} times in the last ${LIMIT_INTERVAL_HOURS} hours.\n` +
      `${remaining > 0 ? `🕹️ You can play ${remaining} more time(s).` : `⛔ No more plays left.`}`;

    return message.reply(`${resultMessage}\n\n${limitInfo}`);
  }
};
