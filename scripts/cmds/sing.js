const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: 'sing',
    author: 'Nyx',
    usePrefix: false,
    category: 'Music'
  },
  onStart: async ({ event, api, args, message }) => {
    try {
      const query = args.join(' ');
      if (!query) return message.reply('Please provide a search query!');
      api.setMessageReaction("⏳", event.messageID, () => {}, true);
      // 🔄 Updated search API
      const searchResponse = await axios.get(`https://www.x-noobs-apis.42web.io/mostakim/ytSearch?search=${encodeURIComponent(query)}`);
      

      const parseDuration = (timestamp) => {
        const parts = timestamp.split(':').map(part => parseInt(part));
        let seconds = 0;

        if (parts.length === 3) {
          seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
          seconds = parts[0] * 60 + parts[1];
        }

        return seconds;
      };

      const filteredVideos = searchResponse.data.filter(video => {
        try {
          const totalSeconds = parseDuration(video.timestamp);
          return totalSeconds < 600; // 10 মিনিটের নিচে
        } catch {
          return false;
        }
      });

      if (filteredVideos.length === 0) {
api.setMessageReaction("❌", event.messageID, () => {}, true);
        return message.reply('No short videos found (under 10 minutes)!');
      }

      const selectedVideo = filteredVideos[0];
      const tempFilePath = path.join(__dirname, `${Date.now()}_${event.senderID}.m4a`);

      // ✅ একই মতো গান ডাউনলোড API ঠিক রাখা হয়েছে
      const apiResponse = await axios.get(`https://www.x-noobs-apis.42web.io/m/sing?url=${selectedVideo.url}`);
      
      if (!apiResponse.data.url) {
        throw new Error('No audio URL found in response');
      }

      const writer = fs.createWriteStream(tempFilePath);
      const audioResponse = await axios({
        url: apiResponse.data.url,
        method: 'GET',
        responseType: 'stream'
      });

      audioResponse.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      await message.reply({
        body: `🎧 Now playing: ${selectedVideo.title}\nDuration: ${selectedVideo.timestamp}`,
        attachment: fs.createReadStream(tempFilePath)
      });

      fs.unlink(tempFilePath, (err) => {
        if (err) message.reply(`Error deleting temp file: ${err.message}`);
      });

    } catch (error) {
api.setMessageReaction("❌", event.messageID, () => {}, true);
     return message.reply(`❌ Error: ${error.message}`);
    }
  }
};