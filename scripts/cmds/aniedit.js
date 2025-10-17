const axios = require("axios");

module.exports = {
  config: {
    name: "aniedit",
    aliases: ["anieditimg"],
    version: "1.2",
    author: "X Nil",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Edit image anime style",
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

      const apiUrl = `https://api-hub-v2.vercel.app/xnil/animeai?imageUrl=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}&key=admin727684`;

      const result = await axios.get(apiUrl);
      const editedImageUrl = result.data?.imageUrl;

      if (!editedImageUrl) {
        return api.sendMessage("❌ Failed to get the edited image.", event.threadID, event.messageID);
      }

      const imageStream = await axios.get(editedImageUrl, { responseType: "stream" });

      api.sendMessage({
        body: "✅ Here is your edited image:",
        attachment: imageStream.data
      }, event.threadID, loading.messageID);

    } catch (e) {
      console.error(e);
      api.sendMessage("❌ An error occurred while processing your request.", event.threadID, event.messageID);
    }
  }
};
