// server.js
const https = require("https");
const fs = require("fs");
const express = require("express");
const WebSocket = require("ws");

const app = express();
const options = {
  key: fs.readFileSync("server.key"),
  cert: fs.readFileSync("server.crt"),
};

const server = https.createServer(options, app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static("public"));

// Keep track of connected clients
const clients = new Set();

// WebSocket connection handling
wss.on("connection", (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`New WebSocket connection from ${clientIp}`);
  clients.add(ws);

  // Set binary type to arraybuffer
  ws.binaryType = "arraybuffer";

  ws.on("message", (message) => {
    try {
      // Convert Buffer to string if it's binary
      const messageString =
        message instanceof Buffer ? message.toString() : message;
      const parsedMessage = JSON.parse(message);
      console.log(
        `Received message type: ${parsedMessage.type} from ${clientIp}`
      );

      // Broadcast the message to all connected clients except sender
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          console.log(`Broadcasting ${parsedMessage.type} to client`);
          client.send(messageString);
        }
      });
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });

  ws.on("close", () => {
    console.log(`Client ${clientIp} disconnected`);
    clients.delete(ws);
  });

  ws.on("error", (error) => {
    console.error(`WebSocket error from ${clientIp}:`, error);
  });
});

// Log all connected clients every 5 seconds
setInterval(() => {
  console.log(`Connected clients: ${clients.size}`);
}, 5000);

const PORT = 443;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
