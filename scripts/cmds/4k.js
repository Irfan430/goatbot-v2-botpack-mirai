const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Load Base API URL from GitHub
const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/xnil6x404/Api-Zone/refs/heads/main/Api.json"
  );
  return base.data.x;
};

// Save image to ./cache folder
const downloadToTempFile = async (url) => {
  const tempDir = path.join(__dirname, "cache");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const tempPath = path.join(tempDir, `${Date.now()}_upscale.jpg`);
  const response = await axios.get(url, { responseType: "stream" });

  const writer = fs.createWriteStream(tempPath);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  return tempPath;
};

module.exports = {
  config: {
    name: "upscale",
    aliases: ["4k"],
    version: "1.2",
    author: "X Nil",
    countDown: 5,
    role: 0,
    shortDescription: "Upscale image to 4K",
    longDescription: "Reply to an image to upscale it to 4K with a TinyURL",
    category: "tools",
    guide: {
      en: "{pn} (reply to an image)"
    }
  },

  onStart: async function ({ api, event }) {
    const reply = event.messageReply;

    if (!reply || !reply.attachments || reply.attachments.length === 0 || reply.attachments[0].type !== "photo") {
      return api.sendMessage("❌ Please reply to an image to upscale it to 4K.", event.threadID, event.messageID);
    }

    const imageUrl = reply.attachments[0].url;

    try {
      const res = await axios.get(`${await baseApiUrl()}/api/tools/upscale/v1?url=${encodeURIComponent(imageUrl)}`);
      const upscaleUrl = res.data?.result;

      if (!upscaleUrl) {
        return api.sendMessage("❌ Upscale failed. No image returned.", event.threadID, event.messageID);
      }

      const tinyRes = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(upscaleUrl)}`);
      const shortUrl = tinyRes.data;

      const filePath = await downloadToTempFile(upscaleUrl);
      const fileStream = fs.createReadStream(filePath);

      api.sendMessage({
        body: `✅ Upscaled to 4K!\n🔗 URL: ${shortUrl}`,
        attachment: fileStream
      }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Error upscaling image. Please try again later.", event.threadID, event.messageID);
    }
  }
};
