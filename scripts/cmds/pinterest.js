const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
    const base = await axios.get(
        `https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`
    );
    return base.data.api;
};

module.exports = {
    config: {
        name: "pin",
        aliases: ["pinterest"],
        version: "1.3",
        author: "Dipto x nil",
        countDown: 15,
        role: 0,
        shortDescription: "Pinterest Image Search",
        longDescription: "Search Pinterest images and return them.",
        category: "image",
        guide: {
            en: "✨ {pn} <query> - <amount>\nExample: {pn} cat - 5",
        },
    },

    onStart: async function ({ api, event, args }) {
        if (!args.length) {
            return api.sendMessage(
                "❌ | 𝗠𝗶𝘀𝘀𝗶𝗻𝗴 𝗶𝗻𝗽𝘂𝘁!\n\n📌 𝗨𝘀𝗮𝗴𝗲: pin <query> - <amount>\n💡 𝗘𝘅𝗮𝗺𝗽𝗹𝗲: pin cat - 5",
                event.threadID,
                event.messageID
            );
        }

        const queryAndLength = args.join(" ").split("-");
        const q = queryAndLength[0]?.trim() || "";
        const length = queryAndLength[1]?.trim() || "";

        if (!q || !length || isNaN(length) || parseInt(length) <= 0) {
            return api.sendMessage(
                "⚠️ | 𝗜𝗻𝘃𝗮𝗹𝗶𝗱 𝗳𝗼𝗿𝗺𝗮𝘁 𝗼𝗿 𝗻𝘂𝗺𝗯𝗲𝗿!\n\n📌 𝗨𝘀𝗮𝗴𝗲: pin <query> - <amount>\n💡 𝗘𝘅𝗮𝗺𝗽𝗹𝗲: pin cat - 5",
                event.threadID,
                event.messageID
            );
        }

        try {
            const waitingMsg = await api.sendMessage("⏳ | 𝗙𝗲𝘁𝗰𝗵𝗶𝗻𝗴 𝘆𝗼𝘂𝗿 𝗣𝗶𝗻𝘁𝗲𝗿𝗲𝘀𝘁 𝗶𝗺𝗮𝗴𝗲𝘀...", event.threadID);

            const response = await axios.get(
                `${await baseApiUrl()}/pinterest?search=${encodeURIComponent(q)}&limit=${encodeURIComponent(length)}`
            );

            const data = response.data.data;

            if (!data || data.length === 0) {
                await api.unsendMessage(waitingMsg.messageID);
                return api.sendMessage(
                    `⚠️ | 𝗡𝗼 𝗶𝗺𝗮𝗴𝗲𝘀 𝗳𝗼𝘂𝗻𝗱 𝗳𝗼𝗿 “${q}”`,
                    event.threadID,
                    event.messageID
                );
            }

            const attachments = [];
            const totalImagesCount = Math.min(data.length, parseInt(length));

            const assetsFolder = path.join(__dirname, "dvassets");
            await fs.ensureDir(assetsFolder);

            for (let i = 0; i < totalImagesCount; i++) {
                const imgUrl = data[i];
                const imgResponse = await axios.get(imgUrl, { responseType: "arraybuffer" });
                const imgPath = path.join(assetsFolder, `${i + 1}.jpg`);
                await fs.outputFile(imgPath, imgResponse.data);
                attachments.push(fs.createReadStream(imgPath));
            }

            await api.unsendMessage(waitingMsg.messageID);
            await api.sendMessage(
                {
                    body:
`✅ 𝗣𝗶𝗻𝘁𝗲𝗿𝗲𝘀𝘁 𝗦𝗲𝗮𝗿𝗰𝗵 𝗥𝗲𝘀𝘂𝗹𝘁𝘀
━━━━━━━━━━━━━━━
🔍 𝗤𝘂𝗲𝗿𝘆: ${q}
🖼 𝗜𝗺𝗮𝗴𝗲𝘀: ${totalImagesCount}
━━━━━━━━━━━━━━━`,
                    attachment: attachments,
                },
                event.threadID,
                event.messageID
            );
        } catch (error) {
            console.error(error);
            api.sendMessage(
                `❌ | 𝗘𝗿𝗿𝗼𝗿: ${error.message}`,
                event.threadID,
                event.messageID
            );
        }
    },
};
