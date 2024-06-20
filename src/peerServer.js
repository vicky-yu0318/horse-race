// peerServer.js

const PeerServer = require("peerjs").PeerServer;
const peerServer = PeerServer({ port: 8000, path: "/myapp" });

module.exports = peerServer;
