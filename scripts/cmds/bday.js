module.exports = {
  config: {
    name: "birthday",
    aliases: ["bday", "hbday"],
    version: "1.2",
    author: "xnil",
    countDown: 5,
    role: 0,
    shortDescription: { en: "birthday wish" },
    category: "fun",
    guide: { en: "{pn} @mention" }
  },

  onStart: async function ({ api, event }) {
    try {
      if (!event.mentions || Object.keys(event.mentions).length === 0)
        return api.sendMessage("🎂 দয়া করে জন্মদিনের শুভেচ্ছা পাঠানোর জন্য কাউকে মেনশন করুন!\nউদাহরণ: birthday @friend", event.threadID, event.messageID);

      const mentionId = Object.keys(event.mentions)[0];
      const mentionName = event.mentions[mentionId];

      // সুন্দর বাংলা ক্যাপশন অ্যারে
      const captions = [
        `🎉 জন্মদিনের শুভেচ্ছা, ${mentionName}! 🥳`,
        `🎂 আপনার দিনটি মিষ্টি কেক এবং আনন্দে ভরা হোক, ${mentionName}! 🍰`,
        `✨ এই নতুন বছরে আপনার সব স্বপ্ন পূরণ হোক, ${mentionName}! ✨`,
        `🎁 আপনার বিশেষ দিনে অনেক আনন্দ এবং ভালোবাসা কামনা করি, ${mentionName}! 🎈`,
        `💖 সবসময় সুখী, সুস্থ ও সুন্দর থাকুন, ${mentionName}! 💖`,
        `🌸 নতুন বছরের শুরু হোক হাসি আর মধুর মুহূর্তে, ${mentionName}! 🌸`,
        `🎶 আজ আপনার দিন, ${mentionName}! গান, আনন্দ আর ভালোবাসায় ভরে উঠুক! 🎶`
      ];

      // একটার পর একটা মেসেজ পাঠানো
      for (const caption of captions) {
        await api.sendMessage({
          body: caption,
          mentions: [{ id: mentionId, tag: mentionName }]
        }, event.threadID);

        // 2 সেকেন্ড অপেক্ষা
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (err) {
      console.error(err);
      await api.sendMessage(`❌ ত্রুটি: ${err.message}`, event.threadID, event.messageID);
    }
  }
};