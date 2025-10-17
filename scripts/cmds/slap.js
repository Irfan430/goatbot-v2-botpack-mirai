const DIG = require("discord-image-generation");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "slap",
    version: "1.1",
    author: "Chitron Bhattacharjee",
    countDown: 5,
    role: 0,
    shortDescription: "Generate a slap image",
    longDescription: "Generates a slap image using the avatars of you and a mentioned user",
    category: "fun",
    guide: {
      en: "{pn} @tag"
    }
  },

  langs: {
    vi: {
      noTag: "Bạn phải tag người bạn muốn tát"
    },
    en: {
      noTag: "You must mention the person you want to slap!"
    }
  },

  onStart: async function ({ event, message, usersData, args, getLang }) {
    const uid1 = event.senderID;
    const uid2 = Object.keys(event.mentions)[0];

    if (!uid2) return message.reply(getLang("noTag"));

    const avatarURL1 = await usersData.getAvatarUrl(uid1);
    const avatarURL2 = await usersData.getAvatarUrl(uid2);

    const img = await new DIG.Batslap().getImage(avatarURL1, avatarURL2);

    const tmpDir = `${__dirname}/tmp`;
    fs.ensureDirSync(tmpDir);

    const pathSave = `${tmpDir}/${uid1}_${uid2}_batslap.png`;
    fs.writeFileSync(pathSave, Buffer.from(img));

    const content = args.join(" ").replace(Object.keys(event.mentions)[0], "");

    message.reply({
      body: "Slapped! 👋💥",
      attachment: fs.createReadStream(pathSave)
    }, () => fs.unlink(pathSave, () => {}));
  }
};