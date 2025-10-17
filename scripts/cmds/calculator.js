const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const WIDTH = 480;
const HEIGHT = 720;

const BUTTONS = [
  ["C", "()", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "-"],
  ["1", "2", "3", "+"],
  ["0", ".", "⌫", "="]
];

function convertExpression(expr) {
  return expr.replace(/÷/g, "/").replace(/×/g, "*");
}

function safeEval(expr) {
  try {
    if (!/^[0-9+\-*/%. ()]+$/.test(expr)) return "Error";
    const res = eval(expr);
    return res === undefined ? "" : res.toString();
  } catch {
    return "Error";
  }
}

function drawRoundedRect(ctx, x, y, w, h, r, fillStyle) {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function getDhakaTime12hr() {
  const date = new Date();
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const dhakaTime = new Date(utc + 3600000 * 6);
  let hour = dhakaTime.getHours();
  const min = dhakaTime.getMinutes().toString().padStart(2, "0");
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour.toString().padStart(2, "0")}:${min} ${ampm}`;
}

async function createCalculatorCard(expression) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#001a33";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Top bar
  ctx.fillStyle = "#001122";
  ctx.fillRect(0, 0, WIDTH, 40);

  // Time
  const timeStr = getDhakaTime12hr();
  ctx.fillStyle = "#ffffff";
  ctx.font = "14px Arial";
  ctx.textBaseline = "middle";
  ctx.fillText(timeStr, 12, 20);

  // Signal
  ctx.font = "16px Arial";
  ctx.fillText("📶", WIDTH - 90, 20);

  // Battery
  ctx.strokeStyle = "#eee";
  ctx.lineWidth = 2;
  ctx.strokeRect(WIDTH - 60, 10, 40, 20);
  ctx.fillStyle = "#eee";
  ctx.fillRect(WIDTH - 60, 10, 32, 20);
  ctx.fillStyle = "#001a33";
  ctx.fillRect(WIDTH - 28, 15, 6, 10);

  // Display panel
  drawRoundedRect(ctx, 20, 60, WIDTH - 40, 120, 20, "#002244");

  // Expression text
  ctx.fillStyle = "#66d9ff";
  ctx.font = "36px Arial";
  ctx.textAlign = "right";
  ctx.fillText(expression, WIDTH - 40, 110);

  // Result
  const result = safeEval(convertExpression(expression));
  ctx.font = "56px Arial";
  ctx.fillStyle = "#66d9ff";
  ctx.fillText(result, WIDTH - 40, 150);

  // Buttons
  const btnW = (WIDTH - 50) / 4;
  const btnH = 80;
  const startY = 200;

  for (let row = 0; row < BUTTONS.length; row++) {
    for (let col = 0; col < BUTTONS[row].length; col++) {
      const x = 10 + col * (btnW + 10);
      const y = startY + row * (btnH + 10);
      const btn = BUTTONS[row][col];

      // Background
      ctx.fillStyle = "#003355";
      drawRoundedRect(ctx, x, y, btnW, btnH, 20, ctx.fillStyle);

      // Text color based on type
      let textColor = "#00ffff"; // default for symbols
      if (/^\d$/.test(btn)) textColor = "#00ff88"; // digits
      else if (["+", "-", "×", "÷", "=", "%"].includes(btn)) textColor = "#ffcc00";

      ctx.fillStyle = textColor;
      ctx.font = "bold 38px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(btn, x + btnW / 2, y + btnH / 2);
    }
  }

  // Bottom phone navigation bar
  ctx.fillStyle = "#001122";
  ctx.fillRect(0, HEIGHT - 40, WIDTH, 40);

  // Buttons (◀ ● ■)
  ctx.fillStyle = "#ffffff";
  ctx.font = "24px Arial";
  ctx.textAlign = "center";
  ctx.fillText("◀", WIDTH / 4, HEIGHT - 15);
  ctx.fillText("●", WIDTH / 2, HEIGHT - 15);
  ctx.fillText("■", (WIDTH * 3) / 4, HEIGHT - 15);

  return canvas.toBuffer("image/png");
}

module.exports = {
  config: {
    name: "calculator",
    version: "2.1",
    author: "Ew'r Saim",
    countDown: 3,
    role: 0,
    shortDescription: "Stylish calculator with bottom phone nav bar",
    category: "tools"
  },

  onStart: async ({ message, args }) => {
    const expression = args.join(" ") || "0";
    const buffer = await createCalculatorCard(expression);
    const filePath = path.join(__dirname, "cache", "calculator.png");
    fs.writeFileSync(filePath, buffer);
    return message.reply({ attachment: fs.createReadStream(filePath) });
  }
};
