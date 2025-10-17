const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "rip",
        aliases: ["rip"],
        version: "1.0",
        author: "xnil",
        countDown: 5,
        role: 0,
        shortDescription: "RIP someone 💀",
        longDescription: "",
        category: "fun",
        guide: "{pn} @tag / UID / reply"
    },

    onStart: async function ({ api, message, event, args, usersData }) {
        let target;

        if (event.type === "message_reply") {
            target = event.messageReply.senderID;
        } else if (Object.keys(event.mentions).length > 0) {
            target = Object.keys(event.mentions)[0];
        } else if (args[0] && /^\d+$/.test(args[0])) {
            target = args[0];
        }

        if (!target) {
            return message.reply("Please mention someone, reply to their message, or give a UID!");
        }

        const tmpDir = path.join(__dirname, "tmp");
        fs.ensureDirSync(tmpDir);

        try {
            const avatarURL = await usersData.getAvatarUrl(target) || "https://i.imgur.com/placeholder1.png";

            const img = await new DIG.Rip().getImage(avatarURL);
            const pathSave = path.join(tmpDir, `${target}_rip.png`);
            fs.writeFileSync(pathSave, img);

            const name = await usersData.getName(target);
            const content = `💀 Rest in peace, ${name}...`;

            message.reply({
                body: content,
                mentions: [{ id: target, tag: name }],
                attachment: fs.createReadStream(pathSave)
            }, () => fs.unlinkSync(pathSave));

        } catch (err) {
            console.error(err);
            message.reply("❌ Failed to create RIP image!");
        }
    }
};
