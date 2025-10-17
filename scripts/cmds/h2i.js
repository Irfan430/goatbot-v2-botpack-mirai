const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/xnil6x404/Api-Zone/refs/heads/main/Api.json"
  );
  return base.data.x;
};

module.exports = {
  config: {
    name: "h2i",
    aliases: [],
    version: "1.1",
    author: "X Nil",
    countDown: 5,
    role: 0,
    shortDescription: "Convert HTML to image",
    longDescription: "Send HTML and get back an image preview",
    category: "tools",
    guide: {
      en: "{pn} <html code>"
    }
  },
  
  onStart: async function({ api, event, args }) {
    const html = args.join(" ");
    if (!html) {
      return api.sendMessage(
        "⚠️ Please provide HTML code.\n\nExample:\n!h2i <html><body><h1>Hello</h1></body></html>",
        event.threadID,
        event.messageID
      );
    }
    
    try {
      const encodedHtml = encodeURIComponent(html);
      const res = await axios.get(`${await baseApiUrl()}/api/tools/html2img/v2?html=${encodedHtml}`);
      
      if (!res.data?.url) {
        return api.sendMessage("❌ Error: Image URL not found in response.", event.threadID, event.messageID);
      }
      
      const imgUrl = res.data.url;
      
      api.sendMessage({
        body: "✅ HTML converted to image:",
        attachment: await global.utils.getStreamFromURL(imgUrl)
      }, event.threadID, event.messageID);
      
    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Failed to convert HTML. Try again later.", event.threadID, event.messageID);
    }
  }
};
