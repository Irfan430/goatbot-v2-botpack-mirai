const axios = require("axios");
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

function formatMoney(n) {
  const units = ["","K","M","B","T"];
  let i = 0;
  while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
  return n.toFixed(1).replace(/\.0$/, '') + units[i];
}

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

async function createSpyCard(opts) {
  const {
    avatarUrl, name, uid, username, gender,
    type, birthday, nickname, location,
    money, rank, moneyRank
  } = opts;

  const W = 490, H = 840;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  // Top & bottom glowing bars
  const makeBar = (y, colors) => {
    ctx.save();
    const grad = ctx.createLinearGradient(0, y, W, y);
    colors.forEach(([stop, color]) => grad.addColorStop(stop, color));
    ctx.fillStyle = grad;
    ctx.shadowColor = colors[1][1];
    ctx.shadowBlur = 20;
    ctx.fillRect(20, y, W - 40, 4);
    ctx.restore();
  };

  makeBar(20, [[0, "#ff00cc"], [0.5, "#00ffff"], [1, "#00ff66"]]);
  makeBar(H - 22, [[0, "#ff00cc"], [0.5, "#ffff00"], [1, "#00ffff"]]);

  // Side glow lines
  const sideColors = ["#00ffcc", "#ff00ff", "#00ff99"];
  const barWidths = [5, 3, 2];
  for (let i = 0; i < sideColors.length; i++) {
    ctx.fillStyle = sideColors[i];
    ctx.fillRect(0, 60 + i, barWidths[i], H - 120 - i * 2);
    ctx.fillRect(W - barWidths[i], 60 + i, barWidths[i], H - 120 - i * 2);
  }

  // Avatar
  let av;
  try { av = await loadImage(avatarUrl); }
  catch { av = await loadImage("https://i.imgur.com/I3VsBEt.png"); }
  const r = 90, cx = W / 2, cy = 140;
  ctx.save();
  ctx.shadowColor = "#ff00ff";
  ctx.shadowBlur = 25;
  drawHex(ctx, cx, cy, r + 8);
  ctx.fill();
  ctx.restore();

  ctx.save();
  drawHex(ctx, cx, cy, r);
  ctx.clip();
  ctx.drawImage(av, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();

  // Name
  ctx.font = "bold 32px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#FFFF66";
  ctx.shadowColor = "#FFFF66";
  ctx.shadowBlur = 20;
  ctx.fillText(`👤 ${toFullWidthBold(name)}`, W / 2, cy + r + 60);

  // Info lines
  const startY = cy + r + 100;
  const pillH = 36, pillW = W - 60;
  const items = [
    ["🆔 UID", uid],
    ["🌐 Username", username.startsWith("@") ? username : `@${username}`],
    ["🚻 Gender", gender],
    ["🎓 Type", type || "User"],
    ["🎂 Birthday", birthday || "Private"],
    ["💬 Nickname", nickname || name],
    ["🌍 Location", location || "Private"],
    ["💰 Money", `$${formatMoney(money)}`],
    ["📈 XP Rank", `#${rank}`],
    ["🏦 Money Rank", `#${moneyRank}`]
  ];

  ctx.font = "18px Arial";
  ctx.textAlign = "left";
  let y = startY;
  for (let i = 0; i < items.length; i++) {
    const [label, val] = items[i];
    const x = 30;

    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(x, y, pillW, pillH);

    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "transparent";
    ctx.fillText(`${label}: `, x + 10, y + pillH / 2 + 6);
    const w = ctx.measureText(`${label}: `).width;

    const color = i % 2 === 0 ? "#00ff00" : "#00ffff";
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillText(toFullWidthBold(val.toString()), x + 10 + w, y + pillH / 2 + 6);
    y += pillH + 12;
  }

  return canvas.toBuffer("image/png");
}

module.exports = {
  config: {
    name: "spy",
    version: "6.6",
    role: 0,
    author: "Ew'r Saim",
    category: "information",
    description: "spy card with Facebook username/handle below UID",
    countDown: 5
  },

  onStart: async ({ api, event, message, usersData }) => {
    try {
      const uid =
        Object.keys(event.mentions || {})[0] ||
        event.messageReply?.senderID ||
        event.senderID;

      const wait = await message.reply("⚡ Generating your neon spy card...");

      const [uInfo, uDB, avatarUrl, allUsers] = await Promise.all([
        api.getUserInfo(uid),
        usersData.get(uid),
        usersData.getAvatarUrl(uid),
        usersData.getAll()
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

      const rank =
        allUsers.sort((a, b) => b.exp - a.exp).findIndex(u => u.userID === uid) + 1;
      const moneyRank =
        allUsers.sort((a, b) => b.money - a.money).findIndex(u => u.userID === uid) + 1;

      const username = info.vanity || `facebook.com/${uid}`;

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
        money: uDB.money,
        rank,
        moneyRank
      });

      const dir = path.join(__dirname, "cache");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
      const file = path.join(dir, `spy_card_${uid}.png`);
      fs.writeFileSync(file, buffer);

      await message.unsend(wait.messageID);
      return message.reply({ attachment: fs.createReadStream(file) });
    } catch (err) {
      console.error(err);
      return message.reply("❌ Failed to generate neon spy card.");
    }
  }
};
