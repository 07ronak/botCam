const localVideo = document.getElementById("localVideo");
const status = document.getElementById("status");
const debug = document.getElementById("debug");
let peerConnection;
let currentFacingMode = "environment"; // Default to back camera
let localStream;

// WebSocket connection
const ws = new WebSocket("wss://" + window.location.hostname + ":443");

// WebRTC configuration
const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

async function startStream() {
  try {
    if (localStream) {
      // Stop any active tracks if switching cameras or reloading
      localStream.getTracks().forEach((track) => track.stop());
    }

    log(`Requesting ${currentFacingMode} camera...`);
    localStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: currentFacingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    });

    localVideo.srcObject = localStream;
    initializePeerConnection(); // Fully reinitialize the connection
  } catch (err) {
    log(`Error accessing camera: ${err.message}`);
    status.textContent = "Error: " + err.message;
  }
}

function switchCamera() {
  currentFacingMode =
    currentFacingMode === "environment" ? "user" : "environment";
  startStream(); // Restart the stream with the new camera
}

function reloadStream() {
  log("Reloading stream...");
  startStream(); // Restart the current stream
}

async function initializePeerConnection() {
  // Close the existing connection if any
  if (peerConnection) {
    peerConnection.close();
    log("Closed existing peer connection");
  }

  // Create a new peer connection
  peerConnection = new RTCPeerConnection(configuration);

  // Add tracks from local stream
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      ws.send(
        JSON.stringify({ type: "candidate", candidate: event.candidate })
      );
    }
  };

  // Handle WebRTC signaling
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  ws.send(JSON.stringify({ type: "offer", offer }));
  log("New peer connection initialized and offer sent");
}

ws.onopen = () => {
  log("WebSocket connected");
  startStream(); // Start with the default camera
};

ws.onmessage = async (event) => {
  const message = JSON.parse(event.data);
  if (message.type === "answer") {
    await peerConnection.setRemoteDescription(message.answer);
  } else if (message.type === "candidate") {
    await peerConnection.addIceCandidate(message.candidate);
  }
};

function log(message) {
  console.log(message);
  debug.textContent += new Date().toLocaleTimeString() + ": " + message + "\n";
}
setTimeout(reloadStream, 5000);
