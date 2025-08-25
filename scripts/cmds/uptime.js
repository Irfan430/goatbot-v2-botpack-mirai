const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");

// Register a stylish font if available, or use fallback
try {
  registerFont(path.join(__dirname, 'fonts', 'Montserrat-Bold.ttf'), { family: 'Montserrat', weight: 'bold' });
} catch (e) {
  console.log("Custom font not found, using system fonts");
}

module.exports = {
  config: {
    name: "uptime",
    aliases: ["up", "upt"],
    version: "2.2",
    author: "xnil",
    role: 0,
    shortDescription: {
      en: "Check bot uptime with ping and stylish image"
    },
    longDescription: {
      en: "Display how long the bot is running with enhanced visuals and ping time"
    },
    category: "system",
    guide: {
      en: "Type 'up' to see bot uptime"
    }
  },



  onStart: async function ({ event, message, api }) {
    
    const imagePath = path.join(__dirname, "uptime_image.png");

    try {
      // Step 1: Ping Calculation
      const pingMsg = await message.reply("⚡ Checking ping...");
      const start = Date.now();
      await new Promise(res => setTimeout(res, 100));
      const ping = Date.now() - start;

      // Step 2: Uptime Calculation
      const uptime = Math.floor(process.uptime()); // in seconds
      const days = Math.floor(uptime / (3600 * 24));
      const hours = Math.floor((uptime % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = uptime % 60;
      const upTimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      // Step 3: Create Canvas
      const canvas = createCanvas(1200, 600);
      const ctx = canvas.getContext("2d");

      // Step 4: Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#0f0c29");
      gradient.addColorStop(0.5, "#302b63");
      gradient.addColorStop(1, "#24243e");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Step 5: Add decorative elements
      // Circles
      ctx.beginPath();
      ctx.arc(100, 100, 60, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(canvas.width - 80, canvas.height - 80, 100, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.fill();
      
      // Step 6: Load and draw decorative elements if available
      try {
        // You can replace this with any decorative image URL
        const decorUrl = "https://i.imgur.com/b4rDlP9.png"; // A transparent decorative element
        const decoration = await loadImage(decorUrl);
        ctx.drawImage(decoration, canvas.width - 250, 50, 200, 200);
      } catch (e) {
        console.log("Decoration image not loaded, continuing without it");
      }

      // Step 7: Draw Text with better styling
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 50px 'Montserrat', Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      ctx.shadowBlur = 6;

      // Title
      ctx.fillText("🤖 BOT UPTIME STATUS", 60, 100);
      
      // Info with emojis
      ctx.font = "38px 'Montserrat', Arial, sans-serif";
      ctx.fillText(`⏰ Uptime: ${upTimeStr}`, 80, 200);
      ctx.fillText(`⚡ Ping: ${ping}ms`, 80, 270);
      ctx.fillText(`👑 Owner: HOPELESS NIL`, 80, 340);
      ctx.fillText(`💻 Platform: Node.js ${process.version}`, 80, 410);
      ctx.fillText(`📊 Memory: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`, 80, 480);
      
      // Add some decorative lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, 130);
      ctx.lineTo(500, 130);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(60, 510);
      ctx.lineTo(400, 510);
      ctx.stroke();

      // Step 8: Save and Send Image
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(imagePath, buffer);

      await message.unsend(pingMsg.messageID);

      // Step 9: Final Response
      await message.reply({
        body: `❮❮❮ 𝐁𝐎𝐓 𝐒𝐓𝐀𝐓𝐔𝐒 ❯❯❯\n` +
              `• ⏰ 𝐔𝐩𝐭𝐢𝐦𝐞: ${upTimeStr}\n` +
              `• ⚡ 𝐏𝐢𝐧𝐠: ${ping}ms\n` +
              `• 👑 𝐎𝐰𝐧𝐞𝐫: HOPELESS NIL\n` +
              `• 💻 𝐏𝐥𝐚𝐭𝐟𝐨𝐫𝐦: Node.js ${process.version}\n` +
              `• 📊 𝐌𝐞𝐦𝐨𝐫𝐲: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB\n` +
              `•  •  •  •  •  •  •  •  •  •  •  •  •  •`,
        attachment: fs.createReadStream(imagePath)
      });

    } catch (err) {
      console.error("❌ Error in uptime command:", err);
      await message.reply("❌ Something went wrong while generating uptime.");
    } finally {
      // Clean up image
      if (fs.existsSync(imagePath)) {
        setTimeout(() => {
          fs.unlinkSync(imagePath);
        }, 5000);
      }
    }
  }
};