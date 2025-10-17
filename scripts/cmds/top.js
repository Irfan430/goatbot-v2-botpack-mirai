const fs = require("fs");

function formatMoney(amount) {
  const units = ["", "K", "M", "B", "T", "Qa", "Qi"];
  let i = 0;
  while (amount >= 1000 && i < units.length - 1) {
    amount /= 1000;
    i++;
  }
  return amount.toFixed(2).replace(/\.00$/, '') + units[i] + "$";
}

module.exports = {
  config: {
    name: "top",
    version: "1.0",
    author: "XNil",
    countDown: 5,
    role: 0,
    category: "economy",
    shortDescription: "Show top richest users",
    longDescription: "Displays a leaderboard of users with the highest balance.",
    guide: "{pn}"
  },

  onStart: async function ({ message, usersData }) {
    let allUsers = await usersData.getAll();

    allUsers = allUsers
      .filter(user => user.money && user.money > 0)
      .sort((a, b) => b.money - a.money)
      .slice(0, 10); // Top 10 users

    if (allUsers.length === 0) {
      return message.reply("📛 Currently no users with balance found.");
    }

    let msg = "🏆 𝐓𝐎𝐏 𝟏𝟎 𝐑𝐈𝐂𝐇𝐄𝐒𝐓 𝐔𝐒𝐄𝐑𝐒 🏆\n━━━━━━━━━━━━━━━\n";
    for (let i = 0; i < allUsers.length; i++) {
      msg += `👑 ${i + 1}. ${allUsers[i].name || "Unknown"}\n💰 Balance: ${formatMoney(allUsers[i].money)}\n\n`;
    }

    return message.reply(msg.trim());
  }
};
