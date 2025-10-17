const { exec } = require('child_process');

module.exports.config = {
    name: "shell",
    aliases: ["sh"],
    version: "1.0",
    author: "Dipto",
    role: 2,
    description: "Execute shell commands",
    category: "system",
    guide: {
      en: "{pn} <command>",
    },
    coolDowns: 5
};

module.exports.onStart = async ({ message, args }) => {
     // const admin = ["1 admin uid"]
    //if (!admin.includes(event.senderID)) { 
      //  return message.reply("You do not have permission to execute shell commands.");
   // }

    if (!args.length) {
        return message.reply("Please provide a command to execute.");
    }
    const command = args.join(' ');

    exec(command, (error, stdout, stderr) => {
        if (error) {
            return message.reply(`Error executing command: ${error.message}`);
        }
        if (stderr) {
            return message.reply(`Shell Error: ${stderr}`);
        }

 const output = stdout || "Command executed successfully with no output.";
        message.reply(`${output}`);
    });
};
