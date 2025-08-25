const axios = require('axios');
const jimp = require("jimp");
const fs = require("fs");

module.exports = {
    config: {
        name: "propose",
        aliases: ["propos"],
        version: "1.0",
        author: "xnil6x",
        countDown: 5,
        role: 0,
        shortDescription: "Purpose Your Beb",
        longDescription: "Purpose Your Beb",
        category: "love",
        guide: {
            vi: "{pn} @tag ",
            en: "{pn} @tag "
        }
    },
    onStart: async function ({ message, args, event, api }) {
        const mention = Object.keys(event.mentions);
        if (mention.length == 0) return message.reply("Please mention someone");
        else if (mention.length == 1) {
            const one = event.senderID, two = mention[0];
            bal(one, two).then(ptth => { message.reply({ body: "Please Babe Accept My Love </3", attachment: fs.createReadStream(ptth) }) })
        } else {
            const one = mention[1], two = mention[0];
            bal(one, two).then(ptth => { message.reply({ body: "Please Babe Accept My Love </3", attachment: fs.createReadStream(ptth) }) })
        }
    }
};

async function bal(one, two) {
    const avone = await jimp.read(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
    avone.circle();
    const avtwo = await jimp.read(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
    avtwo.circle();
    const pth = "abcd.png";
    const img = await jimp.read("https://i.ibb.co/4gDf933F/image.jpg");
    img.resize(1077, 718).composite(avone.resize(80, 80), 280, 200).composite(avtwo.resize(80, 80), 530, 365);
    await img.writeAsync(pth);
    return pth;
}