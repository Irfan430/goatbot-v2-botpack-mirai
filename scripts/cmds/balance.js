module.exports = {
  config: {
    name: "balance",
    aliases: ["bal", "$", "cash"],
    version: "3.3",
    author: "xnil6x",
    countDown: 3,
    role: 0,
    description: "💰 Economy System ",
    category: "economy",
    guide: {
      en: "╔════✦ Usage Guide ✦════╗\n"
        + "║ ➤ {pn} - Check your balance\n"
        + "║ ➤ {pn} @user - Check others\n"
        + "║ ➤ {pn} t @user amount - Transfer\n"
        + "║ ➤ {pn} [reply] - Check replied user's balance\n"
        + "╚══════════════════════╝"
    }
  },

  onStart: async function ({ message, event, args, usersData, prefix }) {
    const { senderID, messageReply, mentions } = event;

    const formatMoney = (amount) => {
      if (isNaN(amount)) return "$0";
      amount = Number(amount);
      const scales = [
        { value: 1e15, suffix: 'Q' },
        { value: 1e12, suffix: 'T' },
        { value: 1e9, suffix: 'B' },
        { value: 1e6, suffix: 'M' },
        { value: 1e3, suffix: 'k' }
      ];
      const scale = scales.find(s => amount >= s.value);
      if (scale) {
        const scaledValue = amount / scale.value;
        return `$${scaledValue.toFixed(1)}${scale.suffix}`;
      }
      return `$${amount.toLocaleString()}`;
    };

    const createFlatDisplay = (title, contentLines) => {
      return `✨ ${title} ✨\n` + contentLines.map(line => `➤ ${line}`).join('\n') + '\n';
    };

    // Transfer Command
    if (args[0]?.toLowerCase() === 't') {
      let targetID = Object.keys(mentions)[0]
        || messageReply?.senderID
        || args[1];

      const amountRaw = args[args.length - 1];
      const amount = parseFloat(amountRaw);

      if (!targetID || isNaN(amount)) {
        return message.reply(createFlatDisplay("Invalid Usage", [
          `Use: ${prefix}balance t @user amount`
        ]));
      }

      if (amount <= 0) return message.reply(createFlatDisplay("Error", ["Amount must be positive."]));
      if (targetID == senderID) return message.reply(createFlatDisplay("Error", ["You can't send money to yourself."]));

      const [sender, receiver] = await Promise.all([
        usersData.get(senderID),
        usersData.get(targetID)
      ]);

      if (!receiver) {
        return message.reply(createFlatDisplay("Error", ["Target user not found."]));
      }

      const taxRate = 5; // 5% tax
      const tax = Math.ceil(amount * taxRate / 100);
      const total = amount + tax;

      if (sender.money < total) {
        return message.reply(createFlatDisplay("Insufficient Balance", [
          `Total needed (with tax): ${formatMoney(total)}`,
          `You are short by: ${formatMoney(total - sender.money)}`
        ]));
      }

      await Promise.all([
        usersData.set(senderID, { ...sender, money: sender.money - total }),
        usersData.set(targetID, { ...receiver, money: receiver.money + amount })
      ]);

      const receiverName = await usersData.getName(targetID);
      return message.reply(createFlatDisplay("Transfer Complete", [
        `To: ${receiverName}`,
        `Sent: ${formatMoney(amount)}`,
        `Tax (5%): ${formatMoney(tax)}`,
        `Total Deducted: ${formatMoney(total)}`,
        `Your New Balance: ${formatMoney(sender.money - total)}`
      ]));
    }

    // Balance of replied user
    if (messageReply?.senderID && !args[0]) {
      const targetID = messageReply.senderID;
      const name = await usersData.getName(targetID);
      const money = await usersData.get(targetID, "money");
      return message.reply(createFlatDisplay(`${name}'s Balance`, [
        `💰 Balance: ${formatMoney(money)}`
      ]));
    }

    // Mentioned users
    if (Object.keys(mentions).length > 0) {
      const balances = await Promise.all(
        Object.entries(mentions).map(async ([uid, name]) => {
          const money = await usersData.get(uid, "money");
          return `${name.replace('@', '')}: ${formatMoney(money)}`;
        })
      );
      return message.reply(createFlatDisplay("User Balances", balances));
    }

    // Own balance
    const userMoney = await usersData.get(senderID, "money");
    return message.reply(createFlatDisplay("Your Balance", [
      `💵 ${formatMoney(userMoney)}`,
    ]));
  }
};
