const { GoatWrapper } = require("fca-liane-utils");

module.exports = {
	config: {
		name: "unsend",
		aliases: ["rmv", "u", "uns"],
		version: "1.2",
		author: "NTKhang",
		countDown: 5,
		role: 0,
		description: {
			vi: "Gỡ tin nhắn của bot",
			en: "Unsend bot's message"
		},
		category: "box chat",
		guide: {
			vi: "Reply tin nhắn muốn gỡ của bot và dùng lệnh {pn}",
			en: "Reply the bot's message you want to unsend and use {pn}"
		}
	},

	onStart: async function ({ message, event, api }) {
		const reply = event.messageReply;
		if (!reply || reply.senderID !== api.getCurrentUserID()) return;

		try {
			await api.unsendMessage(reply.messageID);
		} catch (err) {
			message.reply("❌ Failed to unsend message. It may have already been deleted.");
			console.error("Unsend error:", err);
		}
	}
};

const wrapper = new GoatWrapper(module.exports);
wrapper.applyNoPrefix({ allowPrefix: true });
