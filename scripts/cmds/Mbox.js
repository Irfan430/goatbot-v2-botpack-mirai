const moment = require("moment-timezone");

const COOLDOWN_HOURS = 12;
const MIN_PRIZE = 1000;
const MAX_PRIZE = 1000000;
const OPEN_COST = 100;

module.exports = {
  config: {
    name: "mysterybox",
    aliases: ["mbox", "mystery"],
    version: "1.6",
    author: "xnil6x",
    countDown: 5,
    role: 0,
    description: "🎁 Open a mystery box every 12 hours with smooth animation!",
    category: "game",
    guide: {
      en: "Use: {pn} to open a mystery box once every 12 hours.\nCheck top winners with {pn} top"
    }
  },

  onStart: async function({ api, event, args, usersData }) {
    const { senderID, threadID, messageID } = event;

    // Load user
    let user = await usersData.get(senderID);
    if (!user) user = { data: {} };
    if (!user.data) user.data = {};
    if (typeof user.data.balance !== "number") user.data.balance = 0;
    if (typeof user.data.mysteryLastOpen !== "number") user.data.mysteryLastOpen = 0;
    if (typeof user.data.mysteryMaxWin !== "number") user.data.mysteryMaxWin = 0;

    // TOP command
    if (args[0] && args[0].toLowerCase() === "top") {
      const allUsers = await usersData.getAll();
      let now = moment().tz("Asia/Dhaka");
      let hour = now.hour();
      let windowStart = now.clone().hour(hour < 6 ? 18 : 6).minute(0).second(0).millisecond(0);
      if (hour < 6) windowStart.subtract(1, 'day');

      let filtered = allUsers.filter(u => {
        if (!u.data) return false;
        let lastOpen = u.data.mysteryLastOpen || 0;
        let maxWin = u.data.mysteryMaxWin || 0;
        return lastOpen >= windowStart.valueOf() && maxWin > 0;
      });

      filtered.sort((a, b) => (b.data.mysteryMaxWin || 0) - (a.data.mysteryMaxWin || 0));
      let top = filtered.slice(0, 10);

      if (top.length === 0) {
        return api.sendMessage("❗ No mystery box winners in this 12-hour period yet.", threadID, messageID);
      }

      let text = "╔════════════════════════════╗\n";
      text += "║  🏆 MYSTERY BOX LEADERBOARD  ║\n";
      text += "╠════════════════════════════╣\n";
      top.forEach((u, i) => {
        text += `║ ${i + 1}. ${(u.name || "Unknown").substring(0, 15).padEnd(15)} - ${(u.data.mysteryMaxWin).toLocaleString().padStart(8)} ৳ ║\n`;
      });
      text += "╚════════════════════════════╝";

      return api.sendMessage(text, threadID, messageID);
    }

    // Cooldown check
    let nowTs = Date.now();
    let lastOpen = user.data.mysteryLastOpen || 0;

    if (nowTs - lastOpen < COOLDOWN_HOURS * 3600 * 1000) {
      let remainMs = (COOLDOWN_HOURS * 3600 * 1000) - (nowTs - lastOpen);
      let h = Math.floor(remainMs / (3600 * 1000));
      let m = Math.floor((remainMs % (3600 * 1000)) / (60 * 1000));
      let s = Math.floor((remainMs % (60 * 1000)) / 1000);

      let cooldownMessage = "╔════════════════════════════╗\n";
      cooldownMessage += "║     ⏳ COOLDOWN ACTIVE ⏳     ║\n";
      cooldownMessage += "╠════════════════════════════╣\n";
      cooldownMessage += `║ Time remaining: ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s ║\n`;
      cooldownMessage += "╚════════════════════════════╝";

      return api.sendMessage(cooldownMessage, threadID, messageID);
    }

    // Check balance
    if (user.data.balance < OPEN_COST) {
      return api.sendMessage(
        `❌ You need at least ${OPEN_COST} ৳ to open the mystery box.\nYour balance: ${user.data.balance.toLocaleString()} ৳`,
        threadID,
        messageID
      );
    }

    // Deduct open cost
    user.data.balance -= OPEN_COST;
    await usersData.set(senderID, user);

    // Animation
    const animationFrames = [
      "╔════════════════════════════╗\n║  🎁 OPENING MYSTERY BOX 🎁  ║\n╠════════════════════════════╣\n║  [■□□□□] 20% complete...  ║\n╚════════════════════════════╝",
      "╔════════════════════════════╗\n║  🎁 OPENING MYSTERY BOX 🎁  ║\n╠════════════════════════════╣\n║  [■■□□□] 40% complete...  ║\n╚════════════════════════════╝",
      "╔════════════════════════════╗\n║  🎁 OPENING MYSTERY BOX 🎁  ║\n╠════════════════════════════╣\n║  [■■■□□] 60% complete...  ║\n╚════════════════════════════╝",
      "╔════════════════════════════╗\n║  🎁 OPENING MYSTERY BOX 🎁  ║\n╠════════════════════════════╣\n║  [■■■■□] 80% complete...  ║\n╚════════════════════════════╝",
      "╔════════════════════════════╗\n║  🎁 OPENING MYSTERY BOX 🎁  ║\n╠════════════════════════════╣\n║  [■■■■■] 100% complete!   ║\n╚════════════════════════════╝"
    ];

    let loadingMessage = await api.sendMessage(animationFrames[0], threadID);
    for (let i = 1; i < animationFrames.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        await api.editMessage(animationFrames[i], loadingMessage.messageID);
      } catch (e) {
        loadingMessage = await api.sendMessage(animationFrames[i], threadID);
      }
    }

    // Prize
    let prize = Math.floor(Math.random() * (MAX_PRIZE - MIN_PRIZE + 1)) + MIN_PRIZE;
    let netPrize = prize - OPEN_COST;

    // Update balance
    user.data.balance += prize;
    user.data.mysteryLastOpen = nowTs;
    if (prize > (user.data.mysteryMaxWin || 0)) {
      user.data.mysteryMaxWin = prize;
    }

    await usersData.set(senderID, user);

    // Final message
    let prizeMessage = "╔════════════════════════════╗\n";
    prizeMessage += "║      🎉 YOU WON! 🎉      ║\n";
    prizeMessage += "╠════════════════════════════╣\n";
    prizeMessage += `║ Prize:      ${String(prize.toLocaleString()).padStart(10)} ৳ ║\n`;
    prizeMessage += `║ Open Cost:  ${String(OPEN_COST).padStart(10)} ৳ ║\n`;
    prizeMessage += `║ Net Gain:   ${String(netPrize.toLocaleString()).padStart(10)} ৳ ║\n`;
    prizeMessage += `║ Balance:    ${String(user.data.balance.toLocaleString()).padStart(10)} ৳ ║\n`;
    prizeMessage += "╠════════════════════════════╣\n";
    prizeMessage += "║ Next box available in 12h  ║\n";
    prizeMessage += "╚════════════════════════════╝";

    try {
      await api.editMessage(prizeMessage, loadingMessage.messageID);
    } catch (e) {
      await api.sendMessage(prizeMessage, threadID);
    }
  }
};
