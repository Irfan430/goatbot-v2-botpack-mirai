const { getTime, drive } = global.utils;
const { config: botConfig } = global.GoatBot;

if (!global.temp.welcomeEvent) global.temp.welcomeEvent = {};

module.exports = {
	config: {
		name: "welcome",
		version: "2.0",
		author: "NTKhang",
		category: "events"
	},

	langs: {
		en: {
			session1: "Morning ☀️",
			session2: "Noon 🌞",
			session3: "Evening 🌆",
			session4: "Night 🌙",

			welcomeMessage:
`🌟 𝗧𝗵𝗮𝗻𝗸 𝘆𝗼𝘂 𝗳𝗼𝗿 𝗮𝗱𝗱𝗶𝗻𝗴 𝗺𝗲 𝘁𝗼 𝘁𝗵𝗶𝘀 𝗴𝗿𝗼𝘂𝗽!

🤖 𝗕𝗼𝘁 𝗣𝗿𝗲𝗳𝗶𝘅: %1
📚 𝗧𝘆𝗽𝗲: %1help 𝘁𝗼 𝘀𝗲𝗲 𝗮𝗹𝗹 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝘀

✨ 𝗜'𝗺 𝗮𝗹𝘄𝗮𝘆𝘀 𝗵𝗲𝗿𝗲 𝘁𝗼 𝗵𝗲𝗹𝗽 𝘆𝗼𝘂!`,

			multiple1: "you",
			multiple2: "all of you",

			defaultWelcomeMessage:
`👋 𝗛𝗲𝗹𝗹𝗼 {userNameTag}!

🌸 𝗪𝗲𝗹𝗰𝗼𝗺𝗲 {multiple} 𝘁𝗼 𝘁𝗵𝗲 {boxName} 𝗳𝗮𝗺𝗶𝗹𝘆 💖

💬 𝗚𝗿𝗼𝘂𝗽 𝗚𝘂𝗶𝗱𝗲𝗹𝗶𝗻𝗲𝘀:
• 𝗕𝗲 𝗿𝗲𝘀𝗽𝗲𝗰𝘁𝗳𝘂𝗹 ✅
• 𝗛𝗲𝗹𝗽 𝗲𝗮𝗰𝗵 𝗼𝘁𝗵𝗲𝗿 🤝
• 𝗡𝗼 𝗿𝘂𝗹𝗲 𝘃𝗶𝗼𝗹𝗮𝘁𝗶𝗼𝗻𝘀 🚫

🎉 𝗬𝗼𝘂𝗿 𝗮𝗿𝗿𝗶𝘃𝗮𝗹 𝗯𝗿𝗶𝗴𝗵𝘁𝗲𝗻𝘀 𝗼𝘂𝗿 𝗴𝗿𝗼𝘂𝗽!
𝗪𝗲 𝗵𝗼𝗽𝗲 𝘆𝗼𝘂 𝗵𝗮𝘃𝗲 𝗮 𝗴𝗿𝗲𝗮𝘁 𝘁𝗶𝗺𝗲 𝗵𝗲𝗿𝗲 💖

💡 𝗧𝘆𝗽𝗲: %1help 𝘁𝗼 𝗹𝗲𝗮𝗿𝗻 𝗺𝗼𝗿𝗲`
		}
	},

	onStart: async ({ threadsData, message, event, api, getLang }) => {
		if (event.logMessageType !== "log:subscribe") return;

		return async function () {
			const now = new Date();

			// Time & date in English (Bangladesh timezone)
			const date = new Intl.DateTimeFormat('en-US', {
				timeZone: 'Asia/Dhaka',
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			}).format(now);

			const time = new Intl.DateTimeFormat('en-US', {
				timeZone: 'Asia/Dhaka',
				hour: '2-digit',
				minute: '2-digit',
				hour12: true
			}).format(now);

			const hours = parseInt(new Intl.DateTimeFormat('en-GB', {
				timeZone: 'Asia/Dhaka',
				hour: '2-digit',
				hour12: false
			}).format(now));

			const { threadID } = event;
			const prefix = global.utils.getPrefix(threadID);
			const dataAddedParticipants = event.logMessageData.addedParticipants;

			// If bot itself is added
			if (dataAddedParticipants.some(item => item.userFbId == api.getCurrentUserID())) {
				if (botConfig.nickNameBot)
					api.changeNickname(botConfig.nickNameBot, threadID, api.getCurrentUserID());

				return message.send(getLang("welcomeMessage", prefix));
			}

			if (!global.temp.welcomeEvent[threadID])
				global.temp.welcomeEvent[threadID] = {
					joinTimeout: null,
					dataAddedParticipants: []
				};

			global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
			clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

			global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async function () {
				const threadData = await threadsData.get(threadID);
				if (threadData.settings.sendWelcomeMessage === false) return;

				const dataAddedParticipants = global.temp.welcomeEvent[threadID].dataAddedParticipants;
				const dataBanned = threadData.data.banned_ban || [];
				const threadName = threadData.threadName;

				const userName = [], mentions = [];
				let multiple = dataAddedParticipants.length > 1;

				for (const user of dataAddedParticipants) {
					if (dataBanned.some(b => b.id == user.userFbId)) continue;

					userName.push(user.fullName);
					mentions.push({
						tag: user.fullName,
						id: user.userFbId
					});
				}

				if (userName.length === 0) return;

				let { welcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data;
				const form = {
					mentions: welcomeMessage.includes("{userNameTag}") ? mentions : null
				};

				// Replace placeholders
				welcomeMessage = welcomeMessage
					.replace(/\{userName\}/g, userName.join(", "))
					.replace(/\{userNameTag\}/g, mentions.map(m => m.tag).join(", "))
					.replace(/\{boxName\}|\{threadName\}/g, threadName)
					.replace(/\{multiple\}/g, multiple ? getLang("multiple2") : getLang("multiple1"))
					.replace(/\{session\}/g,
						hours <= 10 ? getLang("session1") :
							hours <= 12 ? getLang("session2") :
								hours <= 18 ? getLang("session3") : getLang("session4")
					)
					.replace(/\{date\}/g, date)
					.replace(/\{time\}/g, time)
					.replace(/%1/g, prefix);

				form.body = welcomeMessage;

				if (threadData.data.welcomeAttachment) {
					const files = threadData.data.welcomeAttachment;
					const attachments = files.map(file => drive.getFile(file, "stream"));

					form.attachment = (await Promise.allSettled(attachments))
						.filter(result => result.status === "fulfilled")
						.map(result => result.value);
				}

				message.send(form);
				delete global.temp.welcomeEvent[threadID];
			}, 1500);
		};
	}
};
