const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/xnil6x404/Api-Zone/refs/heads/main/Api.json");
  return base.data.xnil2;
};

module.exports = {
  config: {
    name: "fbcover",
    aliases: ["fbc"],
    version: "2.1",
    author: "X Nil",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Generate Facebook cover with auto UID and avatar"
    },
    longDescription: {
      en: "Generate Facebook cover using your UID and profile picture fetched via api.getUserInfo"
    },
    category: "image",
    guide: {
      en: "{pn} <name> | <address> | <email> | <subname> | <phoneNumber> | <color>"
    }
  },
  
  onStart: async function({ message, event, api, args }) {
    const input = args.join(" ");
    if (!input.includes("|")) {
      return message.reply("❌ | Use the format:\nname | address | email | subname | phoneNumber | color");
    }
    
    const [name, address, email, subname, phoneNumber, color] = input.split("|").map(item => item.trim());
    const uid = event.senderID;
    
    try {
      // Get profile picture using api.getUserInfo
      const userInfo = await api.getUserInfo(uid);
      const avatar = userInfo[uid]?.thumbSrc || null;
      
      if (!avatar) {
        return message.reply("❌ | Couldn't get your profile picture.");
      }
      
      const apiUrl = `${await baseApiUrl()}/fbcoverv1?name=${encodeURIComponent(name)}&uid=${uid}&address=${encodeURIComponent(address)}&email=${encodeURIComponent(email)}&subname=${encodeURIComponent(subname)}&phoneNumber=${encodeURIComponent(phoneNumber)}&color=${encodeURIComponent(color)}&avatar=${encodeURIComponent(avatar)}`;
      
      const res = await axios.get(apiUrl, { responseType: "arraybuffer" });
      const filePath = path.join(__dirname, "cache", `fbcover_${uid}.png`);
      fs.writeFileSync(filePath, Buffer.from(res.data, "binary"));
      
      message.reply({
        body: "✅ | Here is your Facebook cover:",
        attachment: fs.createReadStream(filePath)
      }, () => fs.unlinkSync(filePath));
      
    } catch (err) {
      console.error(err);
      message.reply("❌ | Failed to generate your cover. Try again later.");
    }
  }
};
