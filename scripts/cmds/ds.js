const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/xnil6x404/Api-Zone/refs/heads/main/Api.json"
  );
  return base.data.x;
};

module.exports = {
  config: {
    name: "deepseek",
    aliases: ["ds"],
    version: "1.4",
    author: "X Nil",
    countDown: 5,
    role: 0,
    shortDescription: "Ask DeepSeek AI with style",
    longDescription: "Send a prompt to DeepSeek AI and receive a stylish response.",
    category: "ai",
    guide: {
      en: "{p}deepseek [your prompt]\n{p}ds [your prompt]"
    }
  },

  onStart: async function ({ message, args, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ Please enter a prompt to send to DeepSeek AI.");

    const reply = await message.reply("🧠 DeepSeek is thinking...");

    // Step-by-step loading animation
    setTimeout(() => api.editMessage("🤔 Still thinking...", reply.messageID), 1000);
    setTimeout(() => api.editMessage("📡 Connecting to DeepSeek AI...", reply.messageID), 2000);

    try {
      const url = `${await baseApiUrl()}/api/ai/deepseek/v4?prompt=${encodeURIComponent(prompt)}`;
      const res = await axios.get(url);

      const result = res.data?.result?.trim();
      const finalMessage = result
        ? `
╭───────[ 🤖 DeepSeek AI ]───────╮
│ ${result.split("\n").join("\n│ ")}  
╰────────────────────────╯`
        : "⚠️ No response received from DeepSeek AI.";

      setTimeout(() => {
        api.editMessage(finalMessage, reply.messageID);
      }, 3000);
    } catch (e) {
      console.error(e);
      setTimeout(() => {
        api.editMessage("❌ Error: Failed to fetch response from DeepSeek AI.", reply.messageID);
      }, 3000);
    }
  }
};