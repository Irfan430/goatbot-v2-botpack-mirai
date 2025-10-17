const { Server } = require("socket.io");
const http = require("http");
const crypto = require("crypto");

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: "*" } // Allow all origins for testing
});

// Token store (you can save to DB or memory)
const validTokens = new Set();

// Generate and print a new token on server start
function generateToken() {
  const token = crypto.randomBytes(32).toString("hex");
  validTokens.add(token);
  return token;
}

const newToken = generateToken();
console.log("Your verifyToken is:", newToken);

// Middleware to validate token
io.use((socket, next) => {
  const token = socket.handshake.query.verifyToken;
  if (validTokens.has(token)) {
    return next();
  }
  return next(new Error("Unauthorized: Invalid verifyToken"));
});

// When connected
io.on("connection", (socket) => {
  console.log("Client connected with token:", socket.handshake.query.verifyToken);

  // Emit something to client
  socket.emit("uptime", {
    status: "connected",
    time: new Date().toISOString(),
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(3001, () => {
  console.log("Socket.IO server running on http://localhost:3001");
});