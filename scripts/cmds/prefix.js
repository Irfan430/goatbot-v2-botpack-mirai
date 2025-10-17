const axios = require('axios');
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "prefix",
    version: "2.1",
    author: "XNil",
    countDown: 5,
    role: 0,
    category: "utility"
  },

  onStart: async function ({ args, threadsData, event, message }) {
    const threadID = event.threadID;
    const firstArg = args[0]?.toLowerCase();
    const secondArg = args[1]?.toLowerCase();

    // Handle image preview toggle
    if (["-i", "-image"].includes(firstArg)) {
      if (secondArg === "on") {
        await threadsData.set(threadID, true, "data.prefixImage");
        return message.reply("✅ 𝐈𝐦𝐚𝐠𝐞 𝐩𝐫𝐞𝐯𝐢𝐞𝐰 𝐢𝐬 𝐧𝐨𝐰 𝐞𝐧𝐚𝐛𝐥𝐞𝐝.");
      }

      if (secondArg === "off") {
        await threadsData.set(threadID, false, "data.prefixImage");
        return message.reply("❌ 𝐈𝐦𝐚𝐠𝐞 𝐩𝐫𝐞𝐯𝐢𝐞𝐰 𝐢𝐬 𝐧𝐨𝐰 𝐝𝐢𝐬𝐚𝐛𝐥𝐞𝐝.");
      }

      return message.reply("📌 𝐔𝐬𝐚𝐠𝐞: `prefix -i on` / `prefix -i off`");
    }

    // Handle setting a new prefix
    if (firstArg) {
      if (firstArg.length > 5) return message.reply("⚠️ 𝐏𝐫𝐞𝐟𝐢𝐱 𝐭𝐨𝐨 𝐥𝐨𝐧𝐠! 𝐌𝐚𝐱 5 𝐜𝐡𝐚𝐫𝐬.");
      await threadsData.set(threadID, firstArg, "data.prefix");
      return message.reply(`✅ 𝐏𝐫𝐞𝐟𝐢𝐱 𝐜𝐡𝐚𝐧𝐠𝐞𝐝 𝐭𝐨: \`${firstArg}\``);
    }

    // Default usage info if no valid args
    return message.reply(
      "📝 𝐔𝐬𝐚𝐠𝐞 𝐢𝐧𝐟𝐨:\n" +
      "• `prefix -i on` / `prefix -i off` → 𝐓𝐨𝐠𝐠𝐥𝐞 𝐢𝐦𝐚𝐠𝐞 𝐦𝐨𝐝𝐞 📷\n" +
      "• `prefix <yourPrefix>` → 𝐒𝐞𝐭 𝐚 𝐧𝐞𝐰 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐩𝐫𝐞𝐟𝐢𝐱 ✏️\n\n" +
      "🔍 𝐄𝐱𝐚𝐦𝐩𝐥𝐞:\n" +
      "`prefix !`\n" +
      "`prefix -i off`"
    );
  },

  onChat: async function ({ event, message, threadsData, usersData }) {
    const { threadID, body } = event;
    if (!body || body.trim().toLowerCase() !== "prefix") return;

    const imageEnabled = await threadsData.get(threadID, "data.prefixImage") || false;
    const customPrefix = await threadsData.get(threadID, "data.prefix") || global.GoatBot.config.prefix;
    const adminID = global.GoatBot.config.adminBot[0];
    const adminData = await usersData.get(adminID);

    const msg =
      `🤖 𝐁𝐨𝐭 𝐍𝐚𝐦𝐞: ${global.GoatBot.config.nickNameBot}\n` +
      `💬 𝐏𝐫𝐞𝐟𝐢𝐱: ${customPrefix}\n` +
      `👑 𝐀𝐝𝐦𝐢𝐧: ${adminData.name}\n` +
      `🌟 𝐇𝐚𝐯𝐞 𝐚 𝐧𝐢𝐜𝐞 𝐝𝐚𝐲!\n` +
      `🔗 𝐀𝐝𝐦𝐢𝐧 𝐅𝐁: https://facebook.com/profile.php?id=${adminID}`;

    if (imageEnabled) {
      try {
        const res = await axios.get("https://i.imgur.com/pp6T2Jv.mp4", {
          responseType: 'stream',
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        return message.reply({
          body: msg,
          attachment: res.data
        });
      } catch (err) {
        return message.reply("⚠️ 𝐂𝐨𝐮𝐥𝐝 𝐧𝐨𝐭 𝐥𝐨𝐚𝐝 𝐢𝐦𝐚𝐠𝐞.");
      }
    } else {
      return message.reply(msg);
    }
  }
};
