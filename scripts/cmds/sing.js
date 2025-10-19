const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: 'sing',
    author: 'xnil6x',
    usePrefix: false,
    category: 'Music'
  },

  onStart: async ({ event, api, args, message }) => {
    try {
      const query = args.join(' ');
      if (!query) return message.reply('🎵 Please provide a song name to search!');

      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      // 🔍 Search YouTube
      const searchURL = `https://xnil-rest-api6x.vercel.app/xnil/search/youtube?q=${encodeURIComponent(query)}`;
      const searchResponse = await axios.get(searchURL);

      if (!searchResponse.data || !Array.isArray(searchResponse.data.data)) {
        throw new Error('Invalid search response from API');
      }

      // ⏱️ Parse duration
      const parseDuration = (timestamp) => {
        const parts = timestamp.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return 0;
      };

      // 🎧 Filter short songs (< 10 min)
      const filteredVideos = searchResponse.data.data.filter(video => {
        try {
          const totalSeconds = parseDuration(video.duration);
          return totalSeconds > 0 && totalSeconds < 600;
        } catch {
          return false;
        }
      });

      if (filteredVideos.length === 0) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return message.reply('❌ No short videos found (under 10 minutes)!');
      }

      const selectedVideo = filteredVideos[0];
      const tempFilePath = path.join(__dirname, `${Date.now()}_${event.senderID}.mp3`);

      // 🎵 Download audio
      const downloadURL = `https://xnil-rest-api6x.vercel.app/xnil/download/youtube?url=${encodeURIComponent(selectedVideo.link)}&format=mp3`;
      const apiResponse = await axios.get(downloadURL);

      if (!apiResponse.data?.data?.url) {
        throw new Error('No downloadable URL found');
      }

      const writer = fs.createWriteStream(tempFilePath);
      const audioResponse = await axios({
        url: apiResponse.data.data.url,
        method: 'GET',
        responseType: 'stream'
      });

      audioResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      // 🎶 Send music file
      await message.reply({
        body: `🎧 Now playing: ${selectedVideo.title}\n📺 Channel: ${selectedVideo.channel}\n⏱ Duration: ${selectedVideo.duration}`,
        attachment: fs.createReadStream(tempFilePath)
      });

      // 🧹 Clean temp file
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error('Temp file delete error:', err.message);
      });

    } catch (error) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply(`❌ Error: ${error.message}`);
    }
  }
};