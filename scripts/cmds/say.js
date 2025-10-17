const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "say",
    aliases: ["speak", "voice"],
    version: "1.1",
    author: "XNil",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Convert text to voice"
    },
    longDescription: {
      en: "Send a voice message of the given text using TTS"
    },
    category: "ai",
    guide: {
      en: "{pn} [text]\nExample: {pn} I love you"
    }
  },

  onStart: async function ({ message, args }) {
    const text = args.join(" ");
    if (!text) return message.reply("❌ Please provide some text to say.");

    const filePath = path.join(__dirname, "say.mp3");
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(text)}`;

    try {
      const response = await axios({
        method: "GET",
        url: ttsUrl,
        responseType: "stream",
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        message.reply({
          body: `🗣️ "${text}"`,
          attachment: fs.createReadStream(filePath)
        }, () => fs.unlinkSync(filePath)); // Clean up after sending
      });

      writer.on("error", err => {
        console.error("Write stream error:", err);
        message.reply("❌ Failed to save voice file.");
      });
    } catch (err) {
      console.error("TTS error:", err);
      message.reply("❌ Couldn't generate voice. Try again.");
    }
  }
};
