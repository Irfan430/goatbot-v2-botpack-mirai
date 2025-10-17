const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/xnil6x404/Api-Zone/refs/heads/main/Api.json"
  );
  return base.data.x;
};

module.exports = {
  config: {
    name: "mistral",
    aliases: ["ms"],
    version: "1.0",
    author: "X Nil",
    countDown: 5,
    role: 0,
    shortDescription: "Ask Mistral AI (via Heurist)",
    longDescription: "Send a prompt to Mistral AI through Heurist API and receive a stylish response.",
    category: "ai",
    guide: {
      en: "{p}mistral [your prompt]\n{p}ms [your prompt]"
    }
  },

  onStart: async function ({ message, args, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ Please enter a prompt to send to Mistral AI.");

    const reply = await message.reply("🧠 Mistral is thinking...");
    setTimeout(() => api.editMessage("🤔 Still thinking...", reply.messageID), 1000);
    setTimeout(() => api.editMessage("📡 Connecting to Mistral AI...", reply.messageID), 2000);

    try {
      const url = `${await baseApiUrl()}/api/ai/heurist/pondera?action=chat&message=${encodeURIComponent(prompt)}`;
      const res = await axios.get(url);
      const result = res.data?.result?.trim();

      const finalMessage = result
        ? `╭───────[ 🤖 Mistral AI ]────────╮\n│ ${result.split("\n").join("\n│ ")}\n╰────────────────────────╯`
        : "⚠️ No response received from Mistral AI.";

      setTimeout(() => {
        api.editMessage(finalMessage, reply.messageID);
      }, 3000);
    } catch (e) {
      console.error(e);
      setTimeout(() => {
        api.editMessage("❌ Error: Failed to fetch response from Mistral AI.", reply.messageID);
      }, 3000);
    }
  }
};
