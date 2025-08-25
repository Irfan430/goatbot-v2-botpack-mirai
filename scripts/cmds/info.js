const fs = require('fs');
const moment = require('moment-timezone');

module.exports = {
  config: {
    name: "info",
    aliases: ["owner", "botinfo"],
    version: "2.0",
    author: "Hopeless Nil",
    countDown: 20,
    role: 0,
    shortDescription: { vi: "", en: "" },
    longDescription: { vi: "", en: "" },
    category: "owner",
    guide: { en: "" },
    envConfig: {}
  },

  onStart: async function ({ message }) {
    // 🕊️ Owner Info (Hopeless Nil Style)
    const authorName = "⩸ Høpêléss Ņîl ⩸";
    const ownAge = "『 22 』";
    const messenger = "m.me/hopelessxnil6x";
    const authorFB = "🌐 fb.com/hopelessxnil6x";
    const authorNumber = "📱 +880160305****";
    const Status = "⌬ Forever Lost, Yet Breathing ⌬";

    // 🖼️ Images (random pick)
    const urls = [
      "https://i.ibb.co.com/pBJZ5hKK/a508d190d25ecfe927ac64b579053bca.jpg",
      "https://i.ibb.co.com/Y4LSBkgf/3288cb9982c02e0e1f8131615f05574d-1.jpg",
"https://i.ibb.co.com/Ywk8TDk/91d639416885b8db2531fe1cbcfa9d46.jpg"
    ];
    const link = urls[Math.floor(Math.random() * urls.length)];

    // ⏳ Time & Uptime
    const now = moment().tz('Asia/Dhaka');
    const date = now.format('MMMM Do YYYY');
    const time = now.format('h:mm:ss A');
    const uptime = process.uptime();
    const seconds = Math.floor(uptime % 60);
    const minutes = Math.floor((uptime / 60) % 60);
    const hours = Math.floor((uptime / (60 * 60)) % 24);
    const days = Math.floor(uptime / (60 * 60 * 24));
    const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    // 📝 Reply
    message.reply({
      body: `☠︎︎ ─── 𝐁𝐎𝐓 & 𝐎𝐖𝐍𝐄𝐑 ─── ☠︎︎
      
✦ 𝑩𝒐𝒕 𝑵𝒂𝒎𝒆 : ${global.GoatBot.config.nickNameBot}
✦ 𝑷𝒓𝒆𝒇𝒊𝒙 : ${global.GoatBot.config.prefix}

❖ 𝑶𝒘𝒏𝒆𝒓 : ${authorName}
❖ 𝑨𝒈𝒆 : ${ownAge}
❖ 𝑺𝒕𝒂𝒕𝒖𝒔 : ${Status}

☏ 𝑾𝒉𝒂𝒕𝒔𝑨𝒑𝒑 : ${authorNumber}
🌐 𝑭𝒂𝒄𝒆𝒃𝒐𝒐𝒌 : ${authorFB}
✉︎ 𝑴𝒆𝒔𝒔𝒆𝒏𝒈𝒆𝒓 : ${messenger}

🗓️ 𝑫𝒂𝒕𝒆 : ${date}
⏰ 𝑻𝒊𝒎𝒆 : ${time}
⚡ 𝑼𝒑𝒕𝒊𝒎𝒆 : ${uptimeString}

────── 𓆩❦𓆪 ──────`,
      attachment: await global.utils.getStreamFromURL(link)
    });
  },

  onChat: async function ({ event, message }) {
    if (event.body && event.body.toLowerCase() === "info") {
      this.onStart({ message });
    }
  }
};