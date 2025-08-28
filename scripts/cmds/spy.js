const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

// Full-width bold converter
function toFullWidthBold(str) {
  const map = {
    A:'𝐀',B:'𝐁',C:'𝐂',D:'𝐃',E:'𝐄',F:'𝐅',G:'𝐆',
    H:'𝐇',I:'𝐈',J:'𝐉',K:'𝐊',L:'𝐋',M:'𝐌',N:'𝐍',
    O:'𝐎',P:'𝐏',Q:'𝐐',R:'𝐑',S:'𝐒',T:'𝐓',U:'𝐔',
    V:'𝐕',W:'𝐖',X:'𝐗',Y:'𝐘',Z:'𝐙',
    a:'𝐚',b:'𝐛',c:'𝐜',d:'𝐝',e:'𝐞',f:'𝐟',g:'𝐠',
    h:'𝐡',i:'𝐢',j:'𝐣',k:'𝐤',l:'𝐥',m:'𝐦',n:'𝐧',
    o:'𝐨',p:'𝐩',q:'𝐪',r:'𝐫',s:'𝐬',t:'𝐭',u:'𝐮',
    v:'𝐯',w:'𝐰',x:'𝐱',y:'𝐲',z:'𝐳',
    0:'𝟎',1:'𝟏',2:'𝟐',3:'𝟑',4:'𝟒',5:'𝟓',
    6:'𝟔',7:'𝟕',8:'𝟖',9:'𝟗'
  };
  return str.split('').map(c => map[c] || c).join('');
}

// Format Money (short version)
function formatMoney(n) {
  const units = ["","K","M","B","T"];
  let i = 0;
  while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
  return n.toFixed(1).replace(/\.0$/, '') + units[i];
}

// Hexagon Draw
function drawHex(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 3 * i - Math.PI / 6;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// Draw rounded rectangle
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Spy Card Generator
async function createSpyCard(opts) {
  const {
    avatarUrl, name, uid, username, gender,
    type, birthday, nickname, location,
    money, rank, moneyRank,
    isDev, isPremium
  } = opts;

  const W = 520, H = 1000;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Create vibrant gradient background
  const bgGradient = ctx.createLinearGradient(0, 0, W, H);
  bgGradient.addColorStop(0, "#0f0c29");
  bgGradient.addColorStop(0.5, "#24243e");
  bgGradient.addColorStop(1, "#302b63");

  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, W, H);

  // Add glowing particles in background
  ctx.save();
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const size = Math.random() * 3 + 1;
    const colors = ["#ff00cc", "#00ffff", "#ffcc00", "#00ff66"];
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Top & Bottom Glowing Bars with animation effect
  const makeBar = (y, colors, width = W - 40) => {
    ctx.save();
    const grad = ctx.createLinearGradient(0, y, width, y);
    colors.forEach(([stop, color]) => grad.addColorStop(stop, color));
    ctx.fillStyle = grad;
    ctx.shadowColor = colors[1][1];
    ctx.shadowBlur = 25;

    // Draw rounded bar
    drawRoundedRect(ctx, 20, y, width, 6, 3);
    ctx.fill();

    ctx.restore();
  };

  // Multiple animated bars
  makeBar(20, [[0, "#ff00cc"], [0.5, "#00ffff"], [1, "#00ff66"]]);
  makeBar(30, [[0, "#ffcc00"], [0.5, "#ff00cc"], [1, "#00ffff"]], W - 80);
  makeBar(H - 25, [[0, "#ff00cc"], [0.5, "#ffff00"], [1, "#00ffff"]]);
  makeBar(H - 35, [[0, "#00ff66"], [0.5, "#ff00cc"], [1, "#ffcc00"]], W - 80);

  // Side Glow with gradient
  const sideGradient = (y, height) => {
    const grad = ctx.createLinearGradient(0, y, 0, y + height);
    grad.addColorStop(0, "#00ffcc");
    grad.addColorStop(0.5, "#ff00ff");
    grad.addColorStop(1, "#00ff99");
    return grad;
  };

  ctx.fillStyle = sideGradient(60, H - 120);
  ctx.fillRect(0, 60, 5, H - 120);
  ctx.fillRect(W - 5, 60, 5, H - 120);

  ctx.fillStyle = sideGradient(65, H - 130);
  ctx.fillRect(5, 65, 3, H - 130);
  ctx.fillRect(W - 8, 65, 3, H - 130);

  ctx.fillStyle = sideGradient(70, H - 140);
  ctx.fillRect(8, 70, 2, H - 140);
  ctx.fillRect(W - 10, 70, 2, H - 140);

  // Avatar with glowing hexagon
  let av;
  try { 
    av = await loadImage(avatarUrl); 
  } catch (error) { 
    console.error("Error loading avatar:", error);
    av = await loadImage("https://i.imgur.com/I3VsBEt.png");
  }

  const r = 95, cx = W / 2, cy = 150;

  // Outer glow
  ctx.save();
  const hexGradient = ctx.createRadialGradient(cx, cy, r, cx, cy, r + 15);
  hexGradient.addColorStop(0, "rgba(255, 0, 204, 0.8)");
  hexGradient.addColorStop(1, "rgba(255, 0, 204, 0)");

  ctx.fillStyle = hexGradient;
  ctx.shadowColor = "#ff00ff";
  ctx.shadowBlur = 30;
  drawHex(ctx, cx, cy, r + 10);
  ctx.fill();
  ctx.restore();

  // Inner hexagon with gradient border
  ctx.save();
  const borderGradient = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
  borderGradient.addColorStop(0, "#ff00cc");
  borderGradient.addColorStop(0.5, "#00ffff");
  borderGradient.addColorStop(1, "#00ff66");

  ctx.strokeStyle = borderGradient;
  ctx.lineWidth = 4;
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = 15;
  drawHex(ctx, cx, cy, r);
  ctx.stroke();
  ctx.restore();

  // Avatar clip
  ctx.save();
  drawHex(ctx, cx, cy, r - 2);
  ctx.clip();
  ctx.drawImage(av, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();

  // Name with vibrant gradient
  ctx.font = "bold 20px 'Arial', sans-serif";
  ctx.textAlign = "center";

  const nameGradient = ctx.createLinearGradient(cx - 150, cy + r + 50, cx + 150, cy + r + 50);
  nameGradient.addColorStop(0, "#FFFF66");
  nameGradient.addColorStop(0.5, "#ff00cc");
  nameGradient.addColorStop(1, "#00ffff");

  ctx.fillStyle = nameGradient;
  ctx.shadowColor = "#FFFF66";
  ctx.shadowBlur = 15;
  ctx.fillText(`👤 ${toFullWidthBold(name)}`, cx, cy + r + 60);

  // Info Lines with colorful design
  const startY = cy + r + 90;
  const pillH = 40, pillW = W - 60, pillRadius = 10;

  const items = [
    ["🆔 UID", uid, "#ff00cc"],
    ["🌐 Username", username.startsWith("@") ? username : `@${username}`, "#00ffff"],
    ["🚻 Gender", gender, "#ffcc00"],
    ["🎓 Type", type || "User", "#00ff66"],
    ["🎂 Birthday", birthday || "Private", "#ff66cc"],
    ["💬 Nickname", nickname || name, "#66ffcc"],
    ["🌍 Location", location || "Private", "#cc66ff"],
    ["💰 Money", `$${formatMoney(money)}`, "#ff6666"],
    ["📈 XP Rank", `#${rank}`, "#66ff66"],
    ["🏦 Money Rank", `#${moneyRank}`, "#6666ff"],
    ["👑 Dev Permission", isDev ? "✅ Available" : "❌ Not available", isDev ? "#00ff00" : "#ff0000"],
    ["⭐ Premium User", isPremium ? "✅ Yes" : "❌ No", isPremium ? "#ffcc00" : "#ff0000"]
  ];

  ctx.font = "bold 25px 'Arial', sans-serif";
  ctx.textAlign = "left";
  let y = startY;

  for (let i = 0; i < items.length; i++) {
    const [label, val, color] = items[i];
    const x = 30;

    // Background with gradient
    const pillGradient = ctx.createLinearGradient(x, y, x + pillW, y + pillH);
    pillGradient.addColorStop(0, "rgba(0, 0, 0, 0.7)");
    pillGradient.addColorStop(1, "rgba(0, 0, 0, 0.9)");

    ctx.fillStyle = pillGradient;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    drawRoundedRect(ctx, x, y, pillW, pillH, pillRadius);
    ctx.fill();

    // Label
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.fillText(`${label}:`, x + 15, y + pillH / 2 + 5);
    const w = ctx.measureText(`${label}:`).width;

    // Value with color and glow
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 5;
    ctx.fillText(toFullWidthBold(val.toString()), x + 20 + w, y + pillH / 2 + 5);

    y += pillH + 15;
  }

  // Add decorative elements
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const size = Math.random() * 2 + 1;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  return canvas.toBuffer("image/png");
}

// Command Export
module.exports = {
  config: {
    name: "spy",
    version: "6.9",
    role: 0,
    author: "Ew'r Saim + Nil",
    category: "information",
    description: "Spy card with dev & premium info - Vibrant Neon Edition",
    countDown: 5
  },

  onStart: async ({ api, event, message, usersData }) => {
    try {
      const uid =
        Object.keys(event.mentions || {})[0] ||
        event.messageReply?.senderID ||
        event.senderID;

      const wait = await message.reply("🎨 Generating your spy card...");

      const [uInfo, uDB] = await Promise.all([
        api.getUserInfo(uid),
        usersData.get(uid)
      ]);

      const info = uInfo[uid];
      const genderMap = {
        1: "𝙶𝚒𝚛𝚕 🙋🏻‍♀️",
        2: "𝙱𝚘𝚢 🙋🏻‍♂️",
        0: "𝙶𝚊𝚢 🤷🏻‍♂️"
      };

      const nickname =
        typeof info.alternateName === "string" && info.alternateName.trim().length > 0
          ? info.alternateName.trim()
          : info.name;

      const location = info.location?.name || "Private";

      // Get all users for ranking
      const allUsers = await usersData.getAll();

      const rank =
        allUsers.sort((a, b) => b.exp - a.exp).findIndex(u => u.userID === uid) + 1;
      const moneyRank =
        allUsers.sort((a, b) => b.money - a.money).findIndex(u => u.userID === uid) + 1;

      const username = info.vanity || `facebook.com/${uid}`;

      // Get avatar URL safely
      let avatarUrl;
      try {
        avatarUrl = await usersData.getAvatarUrl(uid);
      } catch (error) {
        console.error("Error getting avatar URL:", error);
        avatarUrl = "https://i.imgur.com/I3VsBEt.png";
      }

      const buffer = await createSpyCard({
        avatarUrl,
        name: info.name,
        uid,
        username,
        gender: genderMap[info.gender] || "Unknown",
        type: info.type || "User",
        birthday: info.isBirthday !== false ? info.isBirthday : "Private",
        nickname,
        location,
        money: uDB.money || 0,
        rank,
        moneyRank,
        isDev: uDB.data?.dev === true,
        isPremium: uDB.data?.premium === true
      });

      // Save File
      const dir = path.join(__dirname, "cache");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const filePath = path.join(dir, `spy_card_${uid}.png`);
      fs.writeFileSync(filePath, buffer);

      await message.unsend(wait.messageID);
      return message.reply({
        body: "✨ Here's your spy card!",
        attachment: fs.createReadStream(filePath)
      });
    } catch (err) {
      console.error("Spy card error:", err);
      return message.reply("❌ Failed to generate neon spy card. Please try again later.");
    }
  }
};