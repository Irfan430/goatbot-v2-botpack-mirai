const { loadImage, createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "pair3",
    version: "1.0",
    author: "X Nil",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "She's mine! Anime style"
    },
    longDescription: {
      en: "Shows anime style with 2 users' profile photos"
    },
    category: "fun",
    guide: {
      en: "{pn} @girl"
    }
  },

  onStart: async function({ api, event }) {
    const { threadID, messageID, senderID, mentions } = event;

    if (Object.keys(mentions).length === 0)
      return api.sendMessage("⛔ Please tag a person ", threadID, messageID);

    const girlID = Object.keys(mentions)[0];
    const boyID = senderID;

    const girlAvatar = await getAvatar(girlID);
    const boyAvatar = await getAvatar(boyID);

    const bgURL = "https://i.ibb.co.com/C3yfpv0h/Messenger-creation-1353828559747178.jpg";
    const animePath = path.join(__dirname, "assets", "anime_cutout.png");

    const canvas = createCanvas(800, 500);
    const ctx = canvas.getContext("2d");

    try {
      const bgImg = await loadImage(bgURL);
      ctx.drawImage(bgImg, 0, 0, 800, 500);
    } catch (e) {
      ctx.fillStyle = "#cce0f5";
      ctx.fillRect(0, 0, 800, 500);
    }

    const girlX = 588;
    const girlY = 230;

    const boyX = 385;
    const boyY = 56;

    const girlImg = await loadImage(girlAvatar);
    ctx.save();
    ctx.drawImage(girlImg, girlX, girlY, 178, 230);
    ctx.restore();

    const boyImg = await loadImage(boyAvatar);
    ctx.save();
    ctx.drawImage(boyImg, boyX, boyY, 172, 210);
    ctx.restore();

    if (fs.existsSync(animePath)) {
      const animeCut = await loadImage(animePath);
      ctx.drawImage(animeCut, 250, 100, 300, 300);
    }

    const outPath = path.join(__dirname, "cache", `mine-${Date.now()}.png`);
    const out = fs.createWriteStream(outPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);

    out.on("finish", () => {
      api.sendMessage({
        body: "your pair 🎀!",
        attachment: fs.createReadStream(outPath)
      }, threadID, () => fs.unlinkSync(outPath), messageID);
    });
  }
};

async function getAvatar(uid) {
  const imgUrl = `https://graph.facebook.com/${uid}/picture?height=512&width=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const res = await axios.get(imgUrl, { responseType: "arraybuffer" });
  return Buffer.from(res.data, "binary");
}
