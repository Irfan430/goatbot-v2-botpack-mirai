const DAILY_LIMIT = 20;
const MAX_BET = 6000000;

module.exports = {
  config: {
    name: "sicbo",
    aliases: ["sic"],
    version: "2.0",
    author: "xnil6x",
    countDown: 5,
    role: 0,
    category: "game",
    shortDescription: "🎲 Sic Bo dice game",
    longDescription: "Bet on Small or Big and roll dice to win!",
    guide: {
      en: "{pn} small [amount] — Bet on Small (4-10)\n{pn} big [amount] — Bet on Big (11-17)\n{pn} top — Show top 10 winners"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID, messageID } = event;
    const user = await usersData.get(senderID);
    if (!user.data) user.data = {};

    // 🏆 Show leaderboard
    if (args[0] === "top") {
      const allUsers = await usersData.getAll();
      const top = allUsers
        .filter(u => u.data?.sicboWin > 0)
        .sort((a, b) => (b.data.sicboWin || 0) - (a.data.sicboWin || 0))
        .slice(0, 10);

      if (top.length === 0)
        return api.sendMessage("❌ No winners yet!", threadID, messageID);

      let msg = "🏆 𝗧𝗢𝗣 𝟭𝟬 𝗦𝗜𝗖𝗕𝗢 𝗪𝗜𝗡𝗡𝗘𝗥𝗦 🏆\n━━━━━━━━━━━━━━━\n";
      top.forEach((u, i) => {
        msg += ` ${i + 1}. ${u.name} - 🏅 ${u.data.sicboWin || 0} wins\n`;
      });

      return api.sendMessage(msg.trim(), threadID, messageID);
    }

    const choice = args[0]?.toLowerCase();
    const bet = parseInt(args[1]);
    if (!["small", "big"].includes(choice) || isNaN(bet) || bet <= 0)
      return api.sendMessage("⚠️ Use: /sicbo small [amount] or /sicbo big [amount]", threadID, messageID);

    if (bet > MAX_BET)
      return api.sendMessage(`⚠️ Max bet is ${MAX_BET.toLocaleString()} coins.`, threadID, messageID);

    const balance = user.money || 0;
    if (bet > balance)
      return api.sendMessage("❌ You don't have enough coins to bet.", threadID, messageID);

    // 🌐 Date for daily limit
    const bdNow = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    const today = new Date(bdNow).toDateString();
    if (!user.data.lastSicboDay || user.data.lastSicboDay !== today) {
      user.data.sicboCount = 0;
      user.data.lastSicboDay = today;
    }

    if (user.data.sicboCount >= DAILY_LIMIT)
      return api.sendMessage(`⛔ Daily SicBo limit reached (${DAILY_LIMIT}/day).`, threadID, messageID);

    // 🎲 Roll dice
    const d1 = Math.ceil(Math.random() * 6);
    const d2 = Math.ceil(Math.random() * 6);
    const d3 = Math.ceil(Math.random() * 6);
    const total = d1 + d2 + d3;

    const result = total >= 11 && total <= 17 ? "big" : total >= 4 && total <= 10 ? "small" : "triple";

    // 💫 Animation frames
    const anim1 = `🎲 Rolling the dice...\n\n┌────────────┐\n│ ⏳ | ⏳ | ⏳ │\n└────────────┘`;
    const anim2 = `🎲 Rolling the dice...\n\n┌────────────┐\n│ ${d1}️⃣ | ⏳ | ⏳ │\n└────────────┘`;
    const anim3 = `🎲 Rolling the dice...\n\n┌────────────┐\n│ ${d1}️⃣ | ${d2}️⃣ | ⏳ │\n└────────────┘`;
    const finalBox = `🎲 𝗗𝗜𝗖𝗘 𝗥𝗘𝗦𝗨𝗟𝗧\n\n┌────────────┐\n│ ${d1}️⃣ | ${d2}️⃣ | ${d3}️⃣ │\n└────────────┘\n🎯 𝗧𝗢𝗧𝗔𝗟: ${total}`;

    // 💰 Result logic
    let newBalance = balance;
    let won = false;
    let resultText;

    if (result === choice) {
      const winAmount = bet * 2;
      newBalance += winAmount;
      user.data.sicboWin = (user.data.sicboWin || 0) + 1;
      won = true;
      resultText = `🎉 𝗬𝗢𝗨 𝗪𝗢𝗡! (+${winAmount} coins)`;
    } else {
      newBalance = Math.max(0, newBalance - bet);
      resultText = `😢 𝗬𝗢𝗨 𝗟𝗢𝗦𝗧! (-${bet} coins)`;
    }

    user.money = newBalance;
    user.data.sicboCount += 1;

    const status = `🔁 Plays today: ${user.data.sicboCount}/${DAILY_LIMIT}`;
    const balMsg = `💰 Balance: ${newBalance.toLocaleString()} coins`;
    const finalMsg = `✨ 𝗬𝗢𝗨 𝗖𝗛𝗢𝗦𝗘: ${choice.toUpperCase()}\n\n${finalBox}\n\n${resultText}\n\n${status}\n${balMsg}`;

    // 🎬 Show animated message
    api.sendMessage(anim1, threadID, async (err, info) => {
      await new Promise(r => setTimeout(r, 1000));
      api.editMessage(anim2, info.messageID);
      await new Promise(r => setTimeout(r, 1000));
      api.editMessage(anim3, info.messageID);
      await new Promise(r => setTimeout(r, 1000));
      api.editMessage(finalMsg, info.messageID);
    });

    await usersData.set(senderID, user);
  }
};
