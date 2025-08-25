const fs = require("fs-extra");
const request = require("request");
const { createCanvas, loadImage, registerFont } = require("canvas");

// বাংলা ফন্ট লোড করা
registerFont(__dirname + "/assets/font/NotoSansBengali-Regular.ttf", { family: "Bangla" });

module.exports = {
  config: {
    name: "groupinfo",
    aliases: ["boxinfo", "gcinfo"],
    version: "3.6",
    author: "xnil6x",
    countDown: 5,
    role: 0,
    shortDescription: "Stylish Group Info (Bangla supported)",
    longDescription: "Display stylish group information using Canvas image card with Bangla font",
    category: "box chat",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event }) {
    try {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const threadName = threadInfo.threadName || "No Name Available";
      const threadID = event.threadID;
      const approvalMode = threadInfo.approvalMode ? "✅ on" : "❌ off";
      const emoji = threadInfo.emoji || "None";
      const memberCount = threadInfo.participantIDs.length;

      let maleCount = 0, femaleCount = 0, unknownGender = 0;
      for (const user of threadInfo.userInfo) {
        if (user.gender === "MALE") maleCount++;
        else if (user.gender === "FEMALE") femaleCount++;
        else unknownGender++;
      }

      let adminList = [];
      if (threadInfo.adminIDs?.length > 0) {
        threadInfo.adminIDs.forEach(admin => {
          const user = threadInfo.userInfo.find(u => u.id == admin.id);
          adminList.push(user?.name || `User [${admin.id}]`);
        });
      }

      let groupImage = null;
      if (threadInfo.imageSrc) {
        const imagePath = __dirname + "/cache/group_image.jpg";
        await new Promise((resolve) => {
          request(encodeURI(threadInfo.imageSrc))
            .pipe(fs.createWriteStream(imagePath))
            .on("close", resolve);
        });
        groupImage = await loadImage(imagePath);
      }

      const baseHeight = 600;
      const extraHeight = adminList.length * 35;
      const height = baseHeight + extraHeight;
      const width = 950;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, "#141E30");
      bgGradient.addColorStop(1, "#243B55");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      const headerGradient = ctx.createLinearGradient(0, 0, width, 0);
      headerGradient.addColorStop(0, "#ff512f");
      headerGradient.addColorStop(1, "#dd2476");
      ctx.fillStyle = headerGradient;
      ctx.fillRect(0, 0, width, 100);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 42px Bangla";
      ctx.fillText("📌 Group Information", 30, 65);

      if (groupImage) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(120, 220, 90, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(groupImage, 30, 130, 180, 180);
        ctx.restore();
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px Sans";
      ctx.fillText(`🏷️ Name: ${threadName}`, 250, 170);       // Group name as-is
      ctx.fillText(`🆔 ID: ${threadID}`, 250, 210);
      ctx.fillText(`🔹 Emoji: ${emoji}`, 250, 250);
      ctx.fillText(`🔑 Approval: ${approvalMode}`, 250, 290);

      ctx.fillStyle = "#00ffcc";
      ctx.font = "bold 30px Sans";
      ctx.fillText("📊 Member Statistics:", 30, 360);

      ctx.fillStyle = "#ffffff";
      ctx.font = "24px Sans";
      ctx.fillText(`Total: ${memberCount}`, 60, 400);
      ctx.fillText(`Male: ${maleCount}`, 60, 440);
      ctx.fillText(`Female: ${femaleCount}`, 200, 440);
      ctx.fillText(`Unknown: ${unknownGender}`, 380, 440);

      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 32px Sans";
      ctx.fillText(`👑 Admins (${adminList.length})`, 30, 500);

      const colors = ["#ff4b1f", "#1fddff", "#28a745", "#f9a825", "#e040fb", "#ff6f61", "#00e5ff"];
      ctx.font = "30px Sans";

      adminList.forEach((name, i) => {
          ctx.fillStyle = colors[i % colors.length];
          ctx.fillText(`✦ ${name}`, 60, 540 + i * 35);  // Admin name as-is
      });

      const imgPath = __dirname + "/cache/groupInfoCard.png";
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(imgPath, buffer);

      await api.sendMessage(
        {
          body: `⭐ Group info: ${threadName}`,
          attachment: fs.createReadStream(imgPath)
        },
        event.threadID,
        () => {
          fs.unlinkSync(imgPath);
          if (threadInfo.imageSrc) fs.unlinkSync(__dirname + "/cache/group_image.jpg");
        }
      );

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ group card error", event.threadID);
    }
  }
};