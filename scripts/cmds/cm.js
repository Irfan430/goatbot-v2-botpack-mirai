const axios = require("axios");
const jimp = require("jimp");
const fs = require("fs");
const path = require("path");
const { findUid } = global.utils;

const regExCheckURL = /^(http|https):\/\/[^ "]+$/;

module.exports = {
  config: {
    name: "mistake",
    aliases: ["cm"],
    version: "2.1",
    author: "xnil6x",
    countDown: 2,
    role: 0,
    description: "𝗔 𝘀𝗺𝗮𝗹𝗹 𝗺𝗶𝘀𝘁𝗮𝗸𝗲",
    category: "fun",
    guide: "{pn} (mention/uid/idurl/reply to msg)"
  },

  onStart: async function ({ message, event, args }) {
    let uid;

    try {
      if (event.mentions && Object.keys(event.mentions).length === 1) {
        uid = Object.keys(event.mentions)[0];
      } else if (args[0]) {
        if (regExCheckURL.test(args[0])) {
          try {
            uid = await findUid(args[0]);
          } catch (e) {
            return message.reply("⚠️ Couldn't fetch UID from link.");
          }
        } else {
          uid = args[0];
        }
      } else if (event.messageReply) {
        uid = event.messageReply.senderID;
      }

      if (!uid) {
        return message.reply("❌ Please mention someone, reply to a message, or provide UID/link.");
      }

      const imagePath = await bal(uid);

      await message.reply({
        body: "🌍 The Biggest Mistake on Earth 🌍",
        attachment: fs.createReadStream(imagePath)
      });

      setTimeout(() => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }, 10 * 1000);

    } catch (error) {
      console.error("❌ Error in mistake command:", error);
      await message.reply("⚠️ An unexpected error occurred.");
    }
  }
};

async function bal(uid) {
  try {
    const avatar = await jimp.read(
      `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
    );

    const bg = await jimp.read("https://i.postimg.cc/2ST7x1Dw/received-6010166635719509.jpg");

    bg.resize(512, 512).composite(avatar.resize(220, 203), 145, 305);

    const tmpDir = path.join(__dirname, "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    const imagePath = path.join(tmpDir, `${uid}.png`);
    await bg.writeAsync(imagePath);

    return imagePath;
  } catch (err) {
    throw new Error("Failed to process image: " + err.message);
  }
}