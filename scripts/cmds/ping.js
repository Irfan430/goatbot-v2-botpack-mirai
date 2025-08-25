const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const cacheDirectory = path.join(__dirname, 'cache');

module.exports = {
  config: {
    name: "ping",
    aliases: ["p"],
    Author: "xnil",
    version: "1.1",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Stylish Ping!"
    },
    longDescription: {
      en: "🔰Checking Bot's ping with a stylish canvas🔰"
    },
    category: "System",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event }) {
    try {
      const startTime = Date.now();
      const tempMsg = await api.sendMessage("🔰Checking Bot's ping...🔰", event.threadID);  
      const ping = Date.now() - startTime;  

      const width = 400;  
      const height = 150;  
      const canvas = createCanvas(width, height);  
      const ctx = canvas.getContext('2d');  

      const grad = ctx.createLinearGradient(0, 0, width, height);  
      grad.addColorStop(0, '#0a0f3c');  
      grad.addColorStop(1, '#3a0057');  
      ctx.fillStyle = grad;  
      ctx.fillRect(0, 0, width, height);  

      const margin = 10;  
      ctx.beginPath();  
      ctx.moveTo(margin, margin);  
      ctx.lineTo(width - margin, margin);  
      ctx.lineTo(width - margin, height - margin);  
      ctx.lineTo(margin, height - margin);  
      ctx.closePath();  
      ctx.strokeStyle = '#ff00ff';  
      ctx.lineWidth = 4;  
      ctx.shadowColor = '#ffb3ff';  
      ctx.shadowBlur = 15;  
      ctx.stroke();  
      ctx.shadowBlur = 0;  

      ctx.font = '24px Arial';  
      ctx.fillStyle = '#fff';  
      ctx.shadowColor = '#ff00ff';  
      ctx.shadowBlur = 10;  
      ctx.fillText("🔰 Bot Ping 🔰", 110, 50);  
      ctx.shadowBlur = 0;  

      ctx.font = 'bold 32px Arial';  
      ctx.fillStyle = '#00ffea';  
      ctx.shadowColor = '#00ffe0';  
      ctx.shadowBlur = 12;  
      ctx.fillText(`${ping} ms`, 130, 110);  
      ctx.shadowBlur = 0;  

      await fs.promises.mkdir(cacheDirectory, { recursive: true });  
      const filePath = path.join(cacheDirectory, 'ping.png');  
      await fs.promises.writeFile(filePath, canvas.toBuffer());  

      await api.unsendMessage(tempMsg.messageID);  
      api.sendMessage({ attachment: fs.createReadStream(filePath) }, event.threadID);  

    } catch (err) {  
      console.error(err);  
      api.sendMessage("❌ Failed to generate ping canvas.", event.threadID);  
    }
  }
};