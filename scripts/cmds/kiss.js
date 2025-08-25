const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "kiss",
        aliases: ["kiss"],
        version: "1.3",
        author: "xnil",
        countDown: 5,
        role: 0,
        shortDescription: "KISS",
        longDescription: "",
        category: "fun",
        guide: "{pn} @tag / UID / reply"
    },

    onStart: async function ({ api, message, event, args, usersData }) {
        let one = event.senderID;
        let two;

        if (event.type === "message_reply") {
            two = event.messageReply.senderID;
        } else if (Object.keys(event.mentions).length > 0) {
            two = Object.keys(event.mentions)[0];
        } else if (args[0] && /^\d+$/.test(args[0])) {
            two = args[0];
        }

        if (!two) {
            return message.reply("⚠️ Please mention someone, reply to their message, or give a UID!");
        }

        const tmpDir = path.join(__dirname, "tmp");
        fs.ensureDirSync(tmpDir);

        try {
            // Get avatars
            const avatarURL1 = await usersData.getAvatarUrl(one) || `https://graph.facebook.com/${one}/picture?width=512&height=512`;
            const avatarURL2 = await usersData.getAvatarUrl(two) || `https://graph.facebook.com/${two}/picture?width=512&height=512`;

            // Create image
            const img = await new DIG.Kiss().getImage(avatarURL1, avatarURL2);
            const pathSave = path.join(tmpDir, `${one}_${two}_kiss.png`);
            fs.writeFileSync(pathSave, img);

            // Get names with fallback
            let nameOne = await usersData.getName(one);
            let nameTwo = await usersData.getName(two);

            if (!nameOne || nameOne === "null") {
                const info = await api.getUserInfo(one);
                nameOne = info[one]?.name || "Unknown User";
            }
            if (!nameTwo || nameTwo === "null") {
                const info = await api.getUserInfo(two);
                nameTwo = info[two]?.name || "Unknown User";
            }

            const content = `😘 ${nameOne} kissed ${nameTwo}`;

            message.reply({
                body: content,
                attachment: fs.createReadStream(pathSave)
            }, () => fs.unlinkSync(pathSave));

        } catch (err) {
            console.error(err);
            message.reply("❌ Failed to create kiss image!");
        }
    }
};