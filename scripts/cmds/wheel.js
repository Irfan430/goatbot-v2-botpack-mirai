const LIMIT_INTERVAL_HOURS = 12;
const MAX_PLAYS = 20;
const MAX_BET = 6_000_000;

module.exports = {
  config: {
    name: "wheel",
    version: "3.6",
    author: "xnil6x",
    shortDescription: "🎡 Stylish Wheel Game",
    longDescription: "Spin the wheel, win big or lose your bet!",
    category: "game",
    guide: {
      en: "{p}wheel <bet amount>"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID, messageID } = event;

    if (!args[0]) {
      return api.sendMessage("❌ Please enter your bet amount. Example: wheel 10000", threadID, messageID);
    }

    const bet = parseInt(args[0].replace(/\D/g, ''));
    if (isNaN(bet) || bet <= 0) {
      return api.sendMessage("❌ Invalid bet amount. Please enter a valid number.", threadID, messageID);
    }

    if (bet > MAX_BET) {
      return api.sendMessage(`❌ Maximum bet is ${MAX_BET.toLocaleString()}.`, threadID, messageID);
    }

    // Load user data
    const user = await usersData.get(senderID);
    const now = Date.now();
    const lastSpins = user.data?.lastWheelTimes || [];

    // Filter old spins
    const validSpins = lastSpins.filter(time => now - time < LIMIT_INTERVAL_HOURS * 3600 * 1000);

    if (validSpins.length >= MAX_PLAYS) {
      return api.sendMessage(
        `⛔ You've used all ${MAX_PLAYS} spins in the last ${LIMIT_INTERVAL_HOURS} hours.`,
        threadID, messageID
      );
    }

    if (user.money < bet) {
      return api.sendMessage(
        `❌ You need ${(bet - user.money).toLocaleString()} more to bet ${bet.toLocaleString()}.`,
        threadID, messageID
      );
    }

    // Deduct bet and update spin log
    const updatedMoney = user.money - bet;
    validSpins.push(now);
    await usersData.set(senderID, {
      money: updatedMoney,
      "data.lastWheelTimes": validSpins
    });

    // Spin segments
    const wheelSegments = [
      { label: "💥 Jackpot x10", multiplier: 10, probability: 0.05 },
      { label: "🎉 Big Win x5", multiplier: 5, probability: 0.1 },
      { label: "🔥 Win x3", multiplier: 3, probability: 0.15 },
      { label: "👍 Win x2", multiplier: 2, probability: 0.2 },
      { label: "✨ Small Win x1.5", multiplier: 1.5, probability: 0.2 },
      { label: "😐 No Win x0", multiplier: 0, probability: 0.15 },
      { label: "😞 Lose x0", multiplier: 0, probability: 0.1 },
      { label: "💸 Lose x0", multiplier: 0, probability: 0.05 }
    ];

    // Spinning...
    let spinningMsg;
    try {
      spinningMsg = await api.sendMessage("🎡 | Spinning... /", threadID);
    } catch (e) {
      console.error("Initial message failed:", e);
      return;
    }

    const spinFrames = ["/", "-", ""];
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      try {
        await api.editMessage(`🎡 | Spinning... ${spinFrames[i % spinFrames.length]}`, spinningMsg.messageID);
      } catch (e) {
        console.error("Edit error during spin:", e);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Result logic
    const random = Math.random();
    let cumulativeProb = 0;
    let result;

    for (const segment of wheelSegments) {
      cumulativeProb += segment.probability;
      if (random < cumulativeProb) {
        result = segment;
        break;
      }
    }

    const winnings = Math.floor(bet * result.multiplier);
    let finalMoney = updatedMoney;

    if (winnings > 0) {
      finalMoney += winnings;
      await usersData.set(senderID, {
        money: finalMoney
      });
    }

    const resultMsg = [
      `🎡 FINAL RESULT: ${result.label}`,
      `💰 YOUR BET: ${bet.toLocaleString()}`,
      winnings > 0
        ? `🎉 YOU WON: +${winnings.toLocaleString()}`
        : `💸 YOU LOST: ${bet.toLocaleString()}`,
      `💵 NEW BALANCE: ${finalMoney.toLocaleString()}`,
      `📆 LIMIT USED: ${validSpins.length}/${MAX_PLAYS}`
    ].join("\n");

    try {
      await api.editMessage(resultMsg, spinningMsg.messageID);
      if (winnings >= bet * 5) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await api.sendMessage("🎊 CONGRATULATIONS ON YOUR BIG WIN! 🎊", threadID);
      }
    } catch (e) {
      console.error("Final edit failed:", e);
      await api.sendMessage(resultMsg, threadID);
    }
  }
};