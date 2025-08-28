const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "dev",
    version: "2.2",
    author: "xnil6x",
    countDown: 5,
    role: 2,
    dev: true,
    description: {
      en: "Add, remove, check or list developer users",
      bn: "কোনো ইউজারকে developer এ add/remove/check বা list করো"
    },
    category: "owner",
    guide: {
      en: "{pn} add <userID | @mention | reply>\n{pn} remove <userID | @mention | reply>\n{pn} check <userID | @mention | reply>\n{pn} list [page]",
      bn: "{pn} add <userID | @mention | reply>\n{pn} remove <userID | @mention | reply}\n{pn} check <userID | @mention | reply>\n{pn} list [page]"
    }
  },

  onStart: async function({ message, args, event, usersData }) {
    if (!args[0]) return message.SyntaxError();

    let type = args[0].toLowerCase(); 
    let targetID;

    // === Developer List with stylish canvas ===
    if (type === "list") {
      const page = parseInt(args[1]) || 1;
      const perPage = 10;

      const allUsers = await usersData.getAll();
      const devUsers = allUsers.filter(u => u?.data?.dev === true);

      if (devUsers.length === 0)
        return message.reply("⚠️ No developer users found.");

      const totalPages = Math.ceil(devUsers.length / perPage);
      if (page > totalPages) return message.reply(`⚠️ Page ${page} not found. Total pages: ${totalPages}`);

      const start = (page - 1) * perPage;
      const usersPage = devUsers.slice(start, start + perPage);

      // Canvas size dynamic based on user count
      const width = 1000;
      const height = 180 + usersPage.length * 70;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // === Gradient Background ===
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, "#0f2027");
      bgGradient.addColorStop(1, "#2c5364");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // === Title ===
      ctx.font = "bold 48px Poppins";
      ctx.textAlign = "center";
      ctx.fillStyle = "#00FFB9";
      ctx.shadowColor = "#0ff";
      ctx.shadowBlur = 20;
      ctx.fillText(`👑 Developer Users (Page ${page}/${totalPages}) 👑`, width / 2, 80);

      // === User Cards ===
      const startY = 140;
      usersPage.forEach((u, i) => {
        const y = startY + i * 70;

        // Rounded card
        const cardWidth = width - 100;
        const cardHeight = 60;
        const cardX = 50;
        const cardY = y;
        const radius = 15;

        // Card gradient
        const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
        cardGradient.addColorStop(0, "#2193b0");
        cardGradient.addColorStop(1, "#6dd5ed");

        ctx.fillStyle = cardGradient;
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 10;

        roundRect(ctx, cardX, cardY, cardWidth, cardHeight, radius).fill();

        // Padding inside card
        const paddingLeft = 30;
        const paddingRight = 30;

        // User index + name
        ctx.font = "bold 28px Arial";
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 5;

        const index = start + i + 1;
        const nameText = `${index}. ${u.name || "Unknown"} 👑`;
        ctx.textAlign = "left";
        ctx.fillText(nameText, cardX + paddingLeft, cardY + 40);

        // UserID smaller and right-aligned inside card
        ctx.font = "20px Arial";
        ctx.fillStyle = "#eee";
        ctx.textAlign = "right";
        ctx.fillText(`(${u.userID})`, cardX + cardWidth - paddingRight, cardY + 40);
      });

      // Save canvas
      const filePath = path.join(__dirname, `dev_list_page${page}.png`);
      fs.writeFileSync(filePath, canvas.toBuffer("image/png"));

      return message.reply({
        body: `👑 Developer Users List (Page ${page}/${totalPages}) 👑`,
        attachment: fs.createReadStream(filePath)
      });
    }

    // === Add / Remove / Check ===
    if (Object.keys(event.mentions).length > 0) targetID = Object.keys(event.mentions)[0];
    else if (event.messageReply) targetID = event.messageReply.senderID;
    else targetID = args[1];

    if (!targetID)
      return message.reply("⚠️ Please provide a userID, mention a user, or reply to a user's message.");

    let userData = await usersData.get(targetID) || {};
    userData.name = userData.name || targetID;
    userData.data = userData.data || {};

    if (type === "add") {
      userData.data.dev = true;
      await usersData.set(targetID, userData);
      return message.reply(`✅ ${userData.name} is now a developer user!`);
    }

    if (type === "remove") {
      userData.data.dev = false;
      await usersData.set(targetID, userData);
      return message.reply(`❌ ${userData.name} is no longer developer.`);
    }

    if (type === "check") {
      if (userData.data.dev) return message.reply(`👑 ${userData.name} is a developer user.`);
      else return message.reply(`⚠️ ${userData.name} is not developer.`);
    }

    return message.SyntaxError();
  }
};

// Rounded rectangle helper
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  return ctx;
}