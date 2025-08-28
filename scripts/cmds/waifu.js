const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/xnil6x404/Api-Zone/refs/heads/main/Api.json"
  );
  return base.data.x;
};


const sfwActions = [
  "waifu", "neko", "shinobu", "megumin", "bully", "cuddle", "cry", "hug", "awoo",
  "kiss", "lick", "pat", "smug", "bonk", "yeet", "blush", "smile", "wave",
  "highfive", "handhold", "nom", "bite", "glomp", "slap", "kill", "kick",
  "happy", "wink", "poke", "dance", "cringe"
];

const nsfwActions = ["waifu", "neko", "trap", "blowjob"];

const nsfwAllowedUsers = [
  "100001986888287",
  "100000180724818"
];

module.exports = {
  config: {
    name: "waifu",
    version: "2.1",
    author: "xnil6x",
    countDown: 0,
    shortDescription: "Get SFW/NSFW anime images",
    longDescription: "Use waifu [action] or waifu nsfw [action]",
    category: "anime",
    guide: {
      en: "{p}waifu kiss\n{p}waifu nsfw blowjob"
    }
  },
  
  onStart: async function({ message, args, event }) {
    const id = event.senderID;
    let type = "sfw";
    let action = "waifu";
    
    if (args[0]?.toLowerCase() === "nsfw") {
      type = "nsfw";
      action = args[1]?.toLowerCase() || "waifu";
      
      // Convert both to string for comparison
      if (!nsfwAllowedUsers.includes(id)) {
        return message.reply("🔞 You are not allowed to use NSFW commands.");
      }
    } else {
      action = args[0]?.toLowerCase() || "waifu";
    }
    
    const validActions = type === "sfw" ? sfwActions : nsfwActions;
    if (!validActions.includes(action)) {
      return message.reply(`❌ Invalid action for ${type.toUpperCase()}.\n✅ Available: ${validActions.join(", ")}`);
    }
    
    const url = `${await baseApiUrl()}/api/anime/waifu?action=${action}&type=${type}`;
    
    try {
      const res = await axios.get(url, { responseType: "stream" });
      
      return message.reply({
        body: `🖼️ ${type.toUpperCase()} - ${action}`,
        attachment: res.data
      });
      
    } catch (err) {
      console.error(err);
      return message.reply("❌ Failed to fetch image. Try again later.");
    }
  }
};