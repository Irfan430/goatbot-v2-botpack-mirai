const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/xnil6x404/Api-Zone/refs/heads/main/Api.json"
  );
  return base.data.x;
};

module.exports = {
  config: {
    name: "rmbg",
    aliases: ["rbg"],
    version: "1.3",
    author: "X Nil",
    countDown: 5,
    role: 0,
    shortDescription: "Remove background",
    longDescription: "Reply to an image to remove its background using remove-bg API",
    category: "tools",
    guide: {
      en: "{pn} (reply to an image)"
    }
  },

  onStart: async function ({ api, event }) {
    const reply = event.messageReply;

    if (!reply || !reply.attachments || reply.attachments.length === 0 || reply.attachments[0].type !== "photo") {
      return api.sendMessage("❌ Please reply to an image to remove the background.", event.threadID, event.messageID);
    }

    const imageUrl = reply.attachments[0].url;

    try {
      const res = await axios.get(`${await baseApiUrl()}/api/tools/remove-bg/v11?imageUrl=${encodeURIComponent(imageUrl)}`);
      const result = res.data;

      if (!result?.removed_bg_image?.url) {
        return api.sendMessage("❌ Background removal failed or no image returned.", event.threadID, event.messageID);
      }

      const removedBgUrl = result.removed_bg_image.url;

      
      const tinyRes = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(removedBgUrl)}`);
      const shortUrl = tinyRes.data;

      api.sendMessage({
        body: `✅ Background removed!\n🔗 URL: ${shortUrl}`,
        attachment: await global.utils.getStreamFromURL(removedBgUrl)
      }, event.threadID, event.messageID);

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Error removing background. Please try again.", event.threadID, event.messageID);
    }
  }
};
