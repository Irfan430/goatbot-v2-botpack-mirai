const axios = require("axios");
const fs = require("fs");
const path = require("path");

const TASK_JSON = path.join(__dirname, "midj_tasks.json");
if (!fs.existsSync(TASK_JSON)) fs.writeFileSync(TASK_JSON, "{}");

// === CONFIG ===
const BASE_URL = "https://midjanuarybyxnil.onrender.com";

module.exports = {
  config: {
    name: "midjourney",
    aliases: ["midj", "mj"],
    author: "xnil6x",
    version: "2.4",
    role: 0,
    shortDescription: "AI image generation (fast MJ API)",
    longDescription: "Generate and upscale Midjourney-style images using fast API",
    category: "image",
    guide: "{pn} <prompt>"
  },

  onStart: async function ({ args, message, event }) {
    try {
      const prompt = args.join(" ").trim();
      if (!prompt) return message.reply("⚠️ Please provide a prompt.");

      const processingMsg = await message.reply("🎨 Generating your image...");

      // === Request Image Generation ===
      const genRes = await axios.get(`${BASE_URL}/imagine?prompt=${encodeURIComponent(prompt)}`);
      const data = genRes.data;

      console.log("🔍 API Response:", data);

      // ✅ এখন শুধুই murl চেক করবে
      if (!data || !data.murl) {
        await message.unsend(processingMsg.messageID);
        return message.reply("❌ Failed to start generation or invalid response from server.");
      }

      const taskId = data.taskId || "unknown";
      const murl = data.murl;

      // === Store task ===
      const tasks = JSON.parse(fs.readFileSync(TASK_JSON, "utf8"));
      tasks[event.threadID] = taskId;
      fs.writeFileSync(TASK_JSON, JSON.stringify(tasks, null, 2));

      // === Send Generated Image ===
      await message.unsend(processingMsg.messageID);

      const imgStream = await global.utils.getStreamFromURL(murl);
      const bodyText = "🖼️ Generated Image\n💬 Reply with U1–U4 to Upscale.";

      const sentMsg = await message.reply({
        body: bodyText,
        attachment: imgStream
      });

      // === Save Reply Context ===
      global.GoatBot.onReply.set(sentMsg.messageID, {
        commandName: this.config.name,
        taskId,
        threadID: event.threadID,
        messageID: sentMsg.messageID
      });

    } catch (err) {
      console.error("Generation Error:", err);
      return message.reply("❌ Failed to generate image. Please try again later.");
    }
  },

  onReply: async function ({ event, Reply, message }) {
    try {
      const action = event.body.toLowerCase();
      if (!["u1", "u2", "u3", "u4"].includes(action)) return;

      const cid = action.replace("u", "");
      const processingMsg = await message.reply(`🔄 Upscaling ${action.toUpperCase()}...`);

      const res = await axios.get(`${BASE_URL}/up?tid=${Reply.taskId}&cid=${cid}`);
      const data = res.data;

      console.log("🔍 Upscale Response:", data);

      // ✅ শুধুমাত্র url চেক করবে (murl নয়)
      if (!data || !data.url) {
        await message.unsend(processingMsg.messageID);
        return message.reply(`❌ Upscale failed for ${action.toUpperCase()}. Please try again.`);
      }

      await message.unsend(processingMsg.messageID);

      const imgStream = await global.utils.getStreamFromURL(data.url);
      const resultMsg = `✅ Upscaled ${action.toUpperCase()}\n💬 You can reply again with U1–U4.`;

      const sentMsg = await message.reply({
        body: resultMsg,
        attachment: imgStream
      });

      global.GoatBot.onReply.set(sentMsg.messageID, {
        commandName: Reply.commandName,
        taskId: data.tid || Reply.taskId,
        threadID: event.threadID,
        messageID: sentMsg.messageID
      });

    } catch (err) {
      console.error("Upscale Error:", err);
      return message.reply("❌ Error processing upscale request.");
    }
  }
};