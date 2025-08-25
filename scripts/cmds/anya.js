const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
	config: {
		name: "anya",
		author: "xnil",
		version: "2.1",
		cooldowns: 5,
		role: 0,
		shortDescription: {
			en: "Anya Forger Text-to-Speech"
		},
		longDescription: {
			en: "Convert text to speech using Anya Forger's voice from Spy x Family"
		},
		category: "ai",
		guide: {
			en: "{p}anya [text]"
		}
	},

	onStart: async function ({ api, event, args }) {
		try {
			const { createReadStream, unlinkSync } = fs;
			const { resolve } = path;
			const { messageID, threadID, senderID } = event;

			// Stylish greeting messages
			const greetings = [
				"✨ Konichiwa! Anya is ready to speak!",
				"🎭 Anya Forger at your service!",
				"🥜 Heh! Anya wants to say something!",
				"📚 Waku waku! Time for speech!",
				"👑 Anya-sama is here to talk!"
			];

			const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

			// Check if text is provided
			if (!args[0]) {
				return api.sendMessage(
					`╔═════✦❘༻༺❘✦═════╗\n\n` +
					`   🎭 𝗔𝗡𝗬𝗔 𝗙𝗢𝗥𝗚𝗘𝗥 𝗧𝗧𝗦\n\n` +
					`❖ ${randomGreeting}\n` +
					`❖ Usage: ${this.config.guide.en}\n\n` +
					`╚═════✦❘༻༺❘✦═════╝`,
					threadID, messageID
				);
			}

			const text = args.join(" ");
			const encodedText = encodeURIComponent(text);

			// Send processing message
			const processingMsg = await api.sendMessage(
				`╔═════✦❘༻༺❘✦═════╗\n\n` +
				`   ⏳ 𝗣𝗥𝗢𝗖𝗘𝗦𝗦𝗜𝗡𝗚...\n\n` +
				`❖ Anya is preparing to speak!\n` +
				`❖ Text: ${text.slice(0, 50)}${text.length > 50 ? '...' : ''}\n\n` +
				`╚═════✦❘༻༺❘✦═════╝`,
				threadID
			);

			// Get audio from VoiceVox API
			const audioApi = await axios.get(`https://api.tts.quest/v3/voicevox/synthesis?text=${encodedText}&speaker=3`);

			if (!audioApi.data.success) {
				throw new Error(audioApi.data.errorMessage || "Failed to generate audio");
			}

			const audioUrl = audioApi.data.mp3StreamingUrl;
			const audioPath = resolve(__dirname, 'cache', `${threadID}_${senderID}_anya.wav`);

			// Download the audio file
			await global.utils.downloadFile(audioUrl, audioPath);

			// Check if file exists and is valid
			if (!fs.existsSync(audioPath)) {
				throw new Error("Failed to download audio file");
			}

			const audioStream = createReadStream(audioPath);

			// Send the audio with stylish message
			const successMessage = `
╔═════✦❘༻༺❘✦═════╗

	 🎭 𝗔𝗡𝗬𝗔'𝗦 𝗠𝗘𝗦𝗦𝗔𝗚𝗘

❖ "${text}"
❖ Voice: Anya Forger (Spy x Family)
❖ Status: Successfully generated!

╚═════✦❘༻༺❘✦═════╝
			`;

			await api.sendMessage({
				body: successMessage,
				attachment: audioStream
			}, threadID, async () => {
				// Clean up
				try {
					unlinkSync(audioPath);
					api.unsendMessage(processingMsg.messageID);
				} catch (cleanupError) {
					console.log("Cleanup error:", cleanupError);
				}
			});

		} catch (error) {
			console.error("Anya TTS Error:", error);

			const errorMessage = `
╔═════✦❘༻༺❘✦═════╗

	 ❌ 𝗘𝗥𝗥𝗢𝗥

❖ Failed to generate Anya's voice!
❖ Error: ${error.message || "Unknown error"}
❖ Please try again later.

╚═════✦❘༻༺❘✦═════╝
			`;

			api.sendMessage(errorMessage, threadID, messageID);
		}
	}
};