const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");
const { createCanvas, loadImage } = require("canvas");

const deltaNext = 5;

function expToLevel(exp) {
  return Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNext)) / 2);
}

function levelToExp(level) {
  return Math.floor(((level ** 2 - level) * deltaNext) / 2);
}

function randomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function drawHex(ctx, cx, cy, r, stroke, lineWidth = 3, glow = false) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.shadowColor = glow ? stroke : "transparent";
  ctx.shadowBlur = glow ? 15 : 0;
  ctx.stroke();
}

function clipHex(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.clip();
}

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
}

async function drawRankCard(data) {
  const W = 1200, H = 600;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // 🎨 Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0b0c2a");
  bg.addColorStop(1, "#3b0066");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ❄️ Snow particles
  for (let i = 0; i < 100; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 2 + 1, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fill();
  }

  // 💠 Glowing border frame (offset 13)
  const offset = 13;
  ctx.save();
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = 30;
  ctx.strokeStyle = "rgba(0,255,255,0.4)";
  ctx.lineWidth = 8;
  roundRect(ctx, offset, offset, W - offset * 2, H - offset * 2, 40);
  ctx.stroke();
  ctx.restore();

  // 🔷 Avatar hex position
  const centerX = 600, centerY = 160, radius = 100;

  // Glow hex layers
  for (let i = 3; i > 0; i--) {
    drawHex(ctx, centerX, centerY, radius + i * 15, `rgba(0,255,255,${0.1 * i})`, 4);
  }
  drawHex(ctx, centerX, centerY, radius + 4, "rgba(173,216,230,0.8)", 2, true);

  // Draw avatar inside clipped hexagon
  ctx.save();
  clipHex(ctx, centerX, centerY, radius);
  ctx.drawImage(data.avatar, centerX - radius, centerY - radius, radius * 2, radius * 2);
  ctx.restore();

  // 🧑 Name below avatar (white with dark blue glow)
  ctx.font = "bold 44px Arial";
  ctx.fillStyle = "#ffffff";           // white text
  ctx.textAlign = "center";
  ctx.shadowColor = "#00008b";         // dark blue glow
  ctx.shadowBlur = 15;
  ctx.fillText(data.name, W / 2, 320);

  // 📝 Info Sections
  const leftX = 133, topY = 370, gap = 42;
  ctx.font = "28px Arial";
  ctx.textAlign = "left";

  // Left section
  ctx.fillStyle = "#00ffee";
  [
    `🆔 UID: ${data.uid}`,
    `💬 Nickname: ${data.nickname || data.name}`,
    `🚻 Gender: ${data.gender === 1 ? "Female" : data.gender === 2 ? "Male" : "Other"}`,
    `🌐 Username: ${data.username}`,
    `⭐ Level: ${data.level}`
  ].forEach((text, i) => ctx.fillText(text, leftX, topY + i * gap));

  // Right section
  const rightX = 700;
  ctx.fillStyle = "#ff99ff";
  [
    `⚡ Total EXP: ${data.totalExp.toLocaleString()}`,
    `📊 Progress: ${data.currentExp} / ${data.requiredExp}`,
    `🏆 Rank: #${data.rank}`,
    `💰 Money: ${data.money.toLocaleString()}`,
    `💸 Money Rank: #${data.moneyRank || "N/A"}`
  ].forEach((text, i) => ctx.fillText(text, rightX, topY + i * gap));

  // 📅 Footer
  ctx.font = "20px Arial";
  ctx.fillStyle = "#cccccc";
  ctx.textAlign = "center";
  ctx.shadowBlur = 0;
  ctx.fillText(`🕓 Updated: ${moment().tz("Asia/Dhaka").format("YYYY-MM-DD hh:mm A")}`, W / 2, H - 30);

  // 📤 Save to file
  const fileName = `rank_${data.uid}_${randomString(6)}.png`;
  const filePath = path.join(__dirname, "cache", fileName);
  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }
  fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
  return filePath;
}

module.exports = {
  config: {
    name: "rank",
    version: "5.3",
    author: "Ew'r Saim |with help from fahad",
    countDown: 5,
    role: 0,
    shortDescription: "Show stylish neon rank card",
    category: "rank",
    guide: "{pn} [@mention or blank for self]"
  },

  onStart: async function ({ api, event, args, usersData, threadsData, message }) {
    try {
      const { senderID, mentions, messageReply } = event;
      const uid = Object.keys(mentions)[0] || args[0] || (messageReply?.senderID || senderID);
      
      // Get user data
      const userData = await usersData.get(uid);
      const allUsers = await usersData.getAll();
      
      // Calculate level and required experience
      const level = expToLevel(userData.exp);
      const expForCurrentLevel = levelToExp(level);
      const expForNextLevel = levelToExp(level + 1);
      const requiredExp = expForNextLevel - expForCurrentLevel;
      const currentExp = userData.exp - expForCurrentLevel; // Current level progress
      
      // Calculate rank based on experience
      const sortedUsers = allUsers.sort((a, b) => b.exp - a.exp);
      const rank = sortedUsers.findIndex(user => user.userID === uid) + 1;
      
      // Get money rank
      const sortedByMoney = allUsers.sort((a, b) => b.money - a.money);
      const moneyRank = sortedByMoney.findIndex(user => user.userID === uid) + 1;
      
      // Load avatar
      const avatarURL = `https://graph.facebook.com/${uid}/picture?width=400&height=400&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatar = await loadImage(avatarURL);
      
      // Prepare data for the rank card
      const cardData = {
        uid: uid,
        name: userData.name,
        nickname: userData.nickname,
        gender: userData.gender,
        username: userData.vanity || "No username",
        totalExp: userData.exp, // Total EXP
        currentExp: currentExp, // Current level progress
        requiredExp: requiredExp,
        level: level,
        rank: rank,
        money: userData.money,
        moneyRank: moneyRank,
        avatar: avatar
      };
      
      // Generate the rank card
      const filePath = await drawRankCard(cardData);
      
      // Send the rank card
      message.reply({
        body: `🌟 Rank Card for ${userData.name}\nLevel: ${level} | Total EXP: ${userData.exp.toLocaleString()} | Rank: #${rank}`,
        attachment: fs.createReadStream(filePath)
      });
    } catch (error) {
      console.error(error);
      message.reply("❌ An error occurred while generating the rank card.");
    }
  }
};