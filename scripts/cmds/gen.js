const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "gen",
    aliases: ["genimg", "aiimg"],
    version: "1.2",
    author: "XNil",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Generate AI image from text"
    },
    longDescription: {
      en: "Generate an AI-generated image using a text prompt"
    },
    category: "ai",
    guide: {
      en: "{pn} [your prompt]\nExample: {pn} cute cat in a spaceship"
    }
  },

  onStart: async function ({ message, args }) {
    const prompt = args.join(" ");
    if (!prompt) {
      return message.reply("❌ Please provide a prompt.\nExample: gen a futuristic robot");
    }

    const apiUrl = `https://xnil6xapihub.onrender.com/api/ai/image/text2img?prompt=${encodeURIComponent(prompt)}`;
    const filePath = path.join(__dirname, "ai-gen.jpg");

    try {
      const res = await axios.get(apiUrl);
      const imageUrl = res.data.url;

      if (!imageUrl) {
        return message.reply("⚠️ Failed to get image. Try again later.");
      }

      const response = await axios({
        method: "GET",
        url: imageUrl,
        responseType: "stream"
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        message.reply({
          body: `🖼️ Generated image for:\n"${prompt}"`,
          attachment: fs.createReadStream(filePath)
        }, () => fs.unlinkSync(filePath)); // Clean up
      });

      writer.on("error", (err) => {
        console.error("File stream error:", err);
        message.reply("❌ Failed to save the image.");
      });
    } catch (err) {
      console.error("Generation error:", err);
      message.reply("❌ An error occurred while generating the image.");
    }
  }
};
