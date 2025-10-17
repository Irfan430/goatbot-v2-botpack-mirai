const axios = require("axios");
const fs = require("fs-extra");
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "tikid",
    aliases: ["tiktokuser", "tikuser"],
    version: "1.0",
    author: "xnil6x",
    countDown: 5,
    role: 0,
    description: "Send a random video from a TikTok user",
    category: "media",
    guide: {
      en: "{pn} <username>"
    }
  },

  onStart: async function ({ message, args }) {
    const username = args[0];
    if (!username) return message.reply("❌ Please provide a TikTok username.\n\nExample: /tikid xnil6x");

    const apiUrl = `https://www.tikwm.com/api/user/posts?unique_id=${username}`;

    try {
      const res = await axios.get(apiUrl);
      const data = res.data;

      if (!data || data.data.videos.length === 0)
        return message.reply("⚠ No videos found or user not found.");

      const videos = data.data.videos;
      const randomVideo = videos[Math.floor(Math.random() * videos.length)];
      const videoUrl = randomVideo.play;

      const videoStream = await getStreamFromURL(videoUrl);
      return message.reply({
        body: `🎬 Video from @${username}`,
        attachment: videoStream
      });

    } catch (err) {
      console.error(err);
      return message.reply("❌ Failed to fetch video. Please try again later.");
    }
  }
};
