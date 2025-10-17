const { exec } = require("child_process");

module.exports.config = {
  name: "shell",
  aliases: ["sh"],
  version: "2.0",
  author: "xnil6x",
  role: 2,
  dev: true,
  description: "Execute shell commands",
  category: "system",
  guide: {
    en: "{pn} <command>",
  },
  coolDowns: 5,
};

module.exports.onStart = async ({ message, args }) => {
  if (!args.length) {
    return message.reply("⚠️ Please provide a shell command to execute.");
  }

  const command = args.join(" ");
  const startTime = Date.now();

  exec(command, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    const execTime = ((Date.now() - startTime) / 1000).toFixed(2);

    if (error) {
      return message.reply(
        `❌ Execution Failed\n\n📌 Command: \`${command}\`\n\n⚠️ Error: ${error.message}`
      );
    }

    let output = stdout || stderr || "✅ Command executed successfully with no output.";

   const chunks = splitMessage(output, 1900);

    chunks.forEach((chunk, index) => {
      message.reply(
        `┌───[ ⚡ Shell Executor ⚡ ]───┐\n` +
        `📌 Command: \`${command}\`\n` +
        `📦 Part: ${index + 1}/${chunks.length}\n` +
        `⏱ Execution Time: ${execTime}s\n` +
        `└────────────────────────┘\n\n` +
        `\`\`\`\n${chunk}\n\`\`\``
      );
    });
  });
};

function splitMessage(text, maxLength) {
  const parts = [];
  for (let i = 0; i < text.length; i += maxLength) {
    parts.push(text.substring(i, i + maxLength));
  }
  return parts;
}