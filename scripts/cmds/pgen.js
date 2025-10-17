const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get(
    `https://raw.githubusercontent.com/xnil6x404/Api-Zone/refs/heads/main/Api.json`,
  );
  return base.data.x;
};

module.exports = {
  config: {
    name: "pgen",
    version: "1.1",
    author: "xnil6x",
    shortDescription: "🧠 Generate AI-based text from a prompt",
    longDescription: "Uses xnil6xapihub's AI to generate text output from a user prompt",
    category: "ai",
    guide: {
      en: "{p}pgen <your prompt>"
    }
  },

  onStart: async function ({ api, event, args }) {
    const prompt = args.join(" ");

    if (!prompt) {
      return api.sendMessage(
        "❌ Please provide a prompt.\nExample: pgen Write a story about a robot cat",
        event.threadID,
        event.messageID
      );
    }

    try {
      const res = await axios.get(`${await baseApiUrl()}/api/ai/texta?prompt=${encodeURIComponent(prompt)}`);
      const result = res.data.res || "⚠️ No response from AI.";

      return api.sendMessage(`🧠 Prompt: ${prompt}\n\n💬 Response:\n${result}`, event.threadID, event.messageID);
    } catch (err) {
      return api.sendMessage(`🚫 Error: ${err.message}`, event.threadID, event.messageID);
    }
  }
};
