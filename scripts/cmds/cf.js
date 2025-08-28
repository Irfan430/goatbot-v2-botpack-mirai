const axios = require('axios');
module.exports = {
  config: {
    name: "coinflip",
    aliases: ["cf"],
    version: "1.0",
    author: "xnil6x",
    countDown: 15,
    role: 0,
    shortDescription: "Flip the coin",
    longDescription: "Flip the coin",
    category: "fun",
    guide: {
      en: "{n}"
    },
  },

  onStart: async function ({ message, event, args, commandName, api, usersData }) {
    const isFaceUp = Math.random() > 0.5;
    let link, body;

    if (isFaceUp) {
      const headsImages = [
        "https://i.ibb.co/xSsMRL9/image.png",
        "https://i.ibb.co/4Zf3M07/image.png",
        "https://i.ibb.co/PCKdPg6/image.png"
      ];
      link = headsImages[Math.floor(Math.random() * headsImages.length)];
      body = "🪙 Face is UP!";
    } else {
      link = "https://i.ibb.co/FhMwzL9/image.png";
      body = "🪙 Face is DOWN!";
    }

    const msg = {
      body,
      attachment: await global.utils.getStreamFromURL(link)
    };
    await api.sendMessage(msg, event.threadID);
  }
};