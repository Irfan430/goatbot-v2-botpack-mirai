module.exports = {
	config: {
		name: "support",
		version: "1.1",
		author: "xnil6x",
		countDown: 5,
		role: 0,
		shortDescription: {
			en: "Join the support group",
		},
		longDescription: {
			en: "Adds you to the official admin support group for assistance and queries.",
		},
		category: "support",
		guide: {
			en: "Type: {pn} to request joining the support group.",
		},
	},

	onStart: async function ({ api, message, event }) {
		const supportGroupId = "26336087379390115"; // Replace with your support group ID
		const threadID = event.threadID;
		const userID = event.senderID;

		try {
			const threadInfo = await api.getThreadInfo(supportGroupId);
			const isMember = threadInfo.participantIDs.includes(userID);

			if (isMember) {
				api.sendMessage(
					"🌟 You are already in the Support Group!\n📥 If you can't find it, check your Message Requests or Spam folder.",
					threadID
				);
			} else {
				api.addUserToGroup(userID, supportGroupId, (err) => {
					if (err) {
						console.error("Failed to add user to support group:", err);
						api.sendMessage(
							"❌ Unable to add you.\n🔒 Please make sure your account allows group invitations and that you’ve added me as a friend.\n📩 Then try again.",
							threadID
						);
					} else {
						api.sendMessage(
							"✅ You’ve been added to the Admin Support Group!\n📥 If it’s not in your inbox, check your Message Requests or Spam folder.",
							threadID
						);
					}
				});
			}
		} catch (error) {
			console.error(error);
			api.sendMessage("⚠️ Something went wrong while processing your request.", threadID);
		}
	},
};
