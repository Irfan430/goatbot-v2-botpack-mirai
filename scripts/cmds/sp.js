const fs = require("fs");

const DAILY_LIMIT = 20;
const MAX_BET = 6000000;

module.exports = {
  config: {
    name: "spin",
    aliases: ["sp"],
    version: "1.2",
    author: "xnil6x",
    countDown: 5,
    role: 0,
    category: "game",
    shortDescription: "🎰 Spin to win!",
    longDescription: "Spin using coins. Win or lose based on your luck.",
    guide: {
      en: "{pn} [amount] - Spin using the amount\n{pn} top - Show top 10 spin winners"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID, messageID } = event;
    const user = await usersData.get(senderID);
    if (!user.data) user.data = {};

    // Handle top command
    if (args[0] === "top") {
      const allUsers = await usersData.getAll();
      const top = allUsers
        .filter(u => u.data?.spinWin > 0)
        .sort((a, b) => (b.data.spinWin || 0) - (a.data.spinWin || 0))
        .slice(0, 10);

      if (top.length === 0) {
        return api.sendMessage("❌ No spin winners yet!", threadID, messageID);
      }

      let msg = "🏆 TOP 10 SPIN WINNERS 🏆\n\n";
      top.forEach((u, i) => {
        msg += `${i + 1}. ${u.name} - 🏆 ${u.data.spinWin || 0} wins\n\n`;
      });

      return api.sendMessage(msg.trim(), threadID, messageID);
    }

    // Bet handling
    const bet = parseInt(args[0]);
    if (isNaN(bet) || bet <= 0) {
      return api.sendMessage("⚠️ Please enter a valid amount to spin.", threadID, messageID);
    }

    if (bet > MAX_BET) {
      return api.sendMessage(`⚠️ Max bet allowed is ${MAX_BET.toLocaleString()} coins.`, threadID, messageID);
    }

    const balance = user.money || 0;
    if (bet > balance) {
      return api.sendMessage("❌ You don't have enough balance to spin.", threadID, messageID);
    }

    // Bangladesh time date string
    const bdNow = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    const today = new Date(bdNow).toDateString();

    // Daily spin limit check
    if (!user.data.lastSpinDay || user.data.lastSpinDay !== today) {
      user.data.spinCount = 0;
      user.data.lastSpinDay = today;
    }

    if (user.data.spinCount >= DAILY_LIMIT) {
      return api.sendMessage(`⛔ Daily spin limit reached (${DAILY_LIMIT}/day). Try again tomorrow.`, threadID, messageID);
    }

    // Generate slots
    const emojis = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎"];
    const getRandom = () => emojis[Math.floor(Math.random() * emojis.length)];

    const slot1 = getRandom();
    const slot2 = getRandom();
    const slot3 = getRandom();

    const msg1 = `🎰 Spinning...\n\n[ ⏳ | ⏳ | ⏳ ]`;
    const msg2 = `🎰 Spinning...\n\n[ ${slot1} | ⏳ | ⏳ ]`;
    const msg3 = `🎰 Spinning...\n\n[ ${slot1} | ${slot2} | ⏳ ]`;
    const final = `🎰 Spin result:\n\n[ ${slot1} | ${slot2} | ${slot3} ]`;

    const isJackpot = slot1 === slot2 && slot2 === slot3;
    const isTwoMatch = slot1 === slot2 || slot2 === slot3 || slot1 === slot3;

    const spinStatus = `🔁 Spins today: ${user.data.spinCount + 1}/${DAILY_LIMIT}`;

    let msgFinal, newBalance = balance;
    if (isJackpot) {
      newBalance += bet * 2;
      user.data.spinWin = (user.data.spinWin || 0) + 1;
      msgFinal = `${final}\n\n🎉 JACKPOT! You won +${bet * 2} coins!\n\n${spinStatus}`;
    } else if (isTwoMatch) {
      const winAmount = Math.floor(bet * 1.5);
      newBalance += winAmount;
      user.data.spinWin = (user.data.spinWin || 0) + 1;
      msgFinal = `${final}\n\n✨ You matched 2! Won +${winAmount} coins!\n\n${spinStatus}`;
    } else {
      newBalance -= bet;
      msgFinal = `${final}\n\n😢 No match. Lost -${bet} coins.\n\n${spinStatus}`;
    }

    // Update user data
    user.money = newBalance;
    user.data.spinCount += 1;

    // Show animated messages
    api.sendMessage(msg1, threadID, async (err, info) => {
      await new Promise(r => setTimeout(r, 1000));
      api.editMessage(msg2, info.messageID);
      await new Promise(r => setTimeout(r, 1000));
      api.editMessage(msg3, info.messageID);
      await new Promise(r => setTimeout(r, 1000));
      api.editMessage(msgFinal, info.messageID);
    });

    await usersData.set(senderID, user);
  }
};
