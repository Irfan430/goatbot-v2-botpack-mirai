const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "kiss",
        aliases: ["kiss"],
        version: "1.2",
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
            return message.reply("Please mention someone, reply to their message, or give a UID!");
        }

        const tmpDir = path.join(__dirname, "tmp");
        fs.ensureDirSync(tmpDir);

        try {
            const avatarURL1 = await usersData.getAvatarUrl(one) || "https://i.imgur.com/placeholder1.png";
            const avatarURL2 = await usersData.getAvatarUrl(two) || "https://i.imgur.com/placeholder2.png";

            const img = await new DIG.Kiss().getImage(avatarURL1, avatarURL2);
            const pathSave = path.join(tmpDir, `${one}_${two}_kiss.png`);
            fs.writeFileSync(pathSave, img);

            const nameOne = await usersData.getName(one);
            const nameTwo = await usersData.getName(two);
            const content = `😘 ${nameOne} (UID: ${one}) kissed ${nameTwo} (UID: ${two})`;

            message.reply({
                body: content,
                mentions: [
                    { id: one, tag: nameOne },
                    { id: two, tag: nameTwo }
                ],
                attachment: fs.createReadStream(pathSave)
            }, () => fs.unlinkSync(pathSave));

        } catch (err) {
            console.error(err);
            message.reply("❌ Failed to create kiss image!");
        }
    }
};
