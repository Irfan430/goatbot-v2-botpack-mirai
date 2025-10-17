const axios = require("axios");

module.exports = {
  config: {
    name: "edit",
    aliases: ["editimg"],
    version: "1.1",
    author: "X Nil",
    premium: true,
    countDown: 5,
    role: 0,
    cost: "100",
    shortDescription: {
      en: "Edit image with girl behind",
    },
    longDescription: {
      en: "Automatically adds a girl behind the person in the replied image using AI",
    },
    category: "image",
    guide: {
      en: "@replied_image + text (e.g., 'Add a girl behind him')",
    }
  },

  onStart: async function ({ api, event }) {
    try {
      const reply = event.messageReply;
      if (!reply || !reply.attachments || reply.attachments[0].type !== "photo") {
        return api.sendMessage("📸 Please reply to an image with your edit prompt!", event.threadID, event.messageID);
      }

      const prompt = event.body;
      const imageUrl = reply.attachments[0].url;

      const loading = await api.sendMessage("🧠 Processing image ...", event.threadID);

      const apiUrl = `https://xnil.xnil.work.gd/xnil/edit?prompt=${encodeURIComponent(prompt)}&imageurl=${encodeURIComponent(imageUrl)}`;

      const response = await axios.get(apiUrl, { responseType: "stream" });

      api.sendMessage({
        body: "✅ Here is your edited image:",
        attachment: response.data
      }, event.threadID, loading.messageID);

    } catch (e) {
      console.error(e);
      api.sendMessage("❌ An error occurred while processing your request.", event.threadID, event.messageID);
    }
  }
};