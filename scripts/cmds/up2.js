const fs = require("fs-extra");
const axios = require("axios");
const moment = require("moment-timezone");
const os = require('os');
const { createCanvas } = require('canvas');
const GIFEncoder = require('gifencoder');

const manilaTime = moment.tz('Asia/Manila');
const spinner = ['🌍','🚀','⚡','🔥','💎','🎯','🎶','⭐','💫','🔮'];

module.exports = {
  config: {
    name: "uptime2",
    aliases: ["up2"],
    version: "2.0",
    author: "XNIL6X",
    countDown: 5,
    role: 0,
    description: { en: "Bot uptime & system info in colourful GIF" },
    category: "𝗽𝗶𝗻𝗴 𝗥𝗼𝗯𝗼𝘁",
    guide: { en: "{pn} to show bot uptime info" }
  },

  onStart: async function ({ message, api, event }) {
    const uptime = process.uptime();
    const formattedUptime = formatMilliseconds(uptime * 1000);
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const cpu = os.cpus()[0];
    const speed = cpu.speed;
    const totalMem = totalMemory / (1024 ** 3);
    const usedMem = usedMemory / (1024 ** 3);
    const currentTime = manilaTime.format('MMMM D, YYYY h:mm A');
    const serverUptimeString = formatUptime(os.uptime());

    // GIF Encoder
    const encoder = new GIFEncoder(500, 350);
    const gifPath = './uptime.gif';
    const stream = fs.createWriteStream(gifPath);
    encoder.createReadStream().pipe(stream);
    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(1200);
    encoder.setQuality(10);

    const canvas = createCanvas(500, 350);
    const ctx = canvas.getContext('2d');

    const gradients = [
      ["#ff9a9e","#fad0c4"],
      ["#a18cd1","#fbc2eb"],
      ["#84fab0","#8fd3f4"],
      ["#ffecd2","#fcb69f"],
      ["#ff6a00","#ee0979"]
    ];

    const rainbow = ["#ff0000","#ff7f00","#ffff00","#00ff00","#0000ff","#4b0082","#8b00ff"];

    for (let i = 0; i < gradients.length; i++) {
      // Gradient BG
      const gradient = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
      gradient.addColorStop(0, gradients[i][0]);
      gradient.addColorStop(1, gradients[i][1]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0,0,canvas.width,canvas.height);

      ctx.shadowColor = "black";
      ctx.shadowBlur = 8;

      ctx.font = "bold 24px Arial";
      ctx.fillStyle = rainbow[i % rainbow.length];
      ctx.fillText("✨ Your Stylish Bot Uptime ✨", 100, 40);

      ctx.shadowBlur = 0;
      ctx.font = "20px Consolas";

      ctx.fillStyle = "#ffffff";
      ctx.fillText(`🤖 Bot Uptime: ${formattedUptime}`, 30, 90);
      ctx.fillText(`🖥 Server Uptime: ${serverUptimeString}`, 30, 120);
      ctx.fillText(`⚡ CPU Speed: ${speed} MHz`, 30, 150);
      ctx.fillText(`💾 Memory Used: ${usedMem.toFixed(2)} GB / ${totalMem.toFixed(2)} GB`, 30, 180);
      ctx.fillText(`🧠 CPU: ${cpu.model}`, 30, 210);
      ctx.fillText(`🌐 Platform: ${os.platform()} (${os.arch()})`, 30, 240);
      ctx.fillText(`🛡 OS: ${os.type()} ${os.release()}`, 30, 270);
      ctx.fillText(`⏰ Manila Time: ${currentTime}`, 30, 300);

      encoder.addFrame(ctx);
    }
    encoder.finish();

    // Ping Test
    const start = Date.now();
    await axios.get('https://google.com');
    const BotPing = Date.now() - start;

    return message.reply({
      body: `✅ Pookiee Uptime Report:\nPing: ${BotPing}ms\nEnjoy your stylish report!`,
      attachment: fs.createReadStream(gifPath)
    }, event.threadID);
  }
};

// Helpers
function formatMilliseconds(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
function formatUptime(seconds) {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const secs = Math.floor(seconds % 60);
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}