const videoContainer = document.getElementById("videoContainer");
let rotation = 0; // Tracks the current rotation angle

function rotateVideo() {
  rotation = (rotation + 90) % 360; // Increment rotation by 90 degrees
  videoContainer.style.transform = `rotate(${rotation}deg)`;
}

const remoteVideo = document.getElementById("remoteVideo");
const status = document.getElementById("status");
const debug = document.getElementById("debug");
const videoStats = document.getElementById("videoStats");
let peerConnection;

function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${timestamp}: ${message}`);
  debug.textContent = `${timestamp}: ${message}\n` + debug.textContent;
}

function updateVideoStats() {
  if (remoteVideo.srcObject) {
    const videoTrack = remoteVideo.srcObject.getVideoTracks()[0];
    if (videoTrack) {
      videoStats.textContent = `
            Video Track: ${videoTrack.label || "unnamed"}
            Enabled: ${videoTrack.enabled}
            State: ${videoTrack.readyState}
            Muted: ${videoTrack.muted}
            Width: ${remoteVideo.videoWidth}
            Height: ${remoteVideo.videoHeight}
        `;
    }
  }
}

function checkVideoState() {
  const stream = remoteVideo.srcObject;
  if (stream) {
    const tracks = stream.getTracks();
    log(`Stream has ${tracks.length} tracks`);
    tracks.forEach((track) => {
      log(
        `Track kind: ${track.kind}, enabled: ${track.enabled}, state: ${track.readyState}`
      );
      log(
        `Video resolution: ${remoteVideo.videoWidth}x${remoteVideo.videoHeight}`
      );
    });
  } else {
    log("No stream attached to video element");
  }
  updateVideoStats();
}

function reloadVideo() {
  if (remoteVideo.srcObject) {
    const stream = remoteVideo.srcObject;
    remoteVideo.srcObject = null;
    setTimeout(() => {
      remoteVideo.srcObject = stream;
      log("Video stream reattached");
    }, 1000);
  }
}

// Monitor video element events
remoteVideo.onloadedmetadata = () => {
  log(
    `Video metadata loaded: ${remoteVideo.videoWidth}x${remoteVideo.videoHeight}`
  );
  updateVideoStats();
};

remoteVideo.onplay = () => log("Video started playing");
remoteVideo.onpause = () => log("Video paused");
remoteVideo.onwaiting = () => log("Video buffering");
remoteVideo.onerror = (e) =>
  log(`Video error: ${remoteVideo.error?.message || e}`);

// WebSocket setup
const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const ws = new WebSocket("wss://" + window.location.hostname + ":443");
ws.binaryType = "blob"; // Set to handle binary data (default)

// WebRTC configuration
const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

ws.onmessage = async (event) => {
  try {
    // Handle both blob and text data
    let messageText;
    if (event.data instanceof Blob) {
      messageText = await event.data.text();
    } else {
      messageText = event.data;
    }

    const message = JSON.parse(event.data);
    log("Received message type: " + message.type);

    if (message.type === "offer") {
      log("Received offer, creating peer connection");
      // Create peer connection if it doesn't exist
      if (!peerConnection) {
        log("Creating new RTCPeerConnection");
        peerConnection = new RTCPeerConnection(configuration);

        // Handle incoming tracks
        peerConnection.ontrack = (event) => {
          log("Received track: " + event.track.kind);
          if (event.streams && event.streams[0]) {
            remoteVideo.srcObject = event.streams[0];
            status.textContent = "Receiving stream...";
            log("Set video stream to element");

            // Monitor track status
            event.track.onmute = () => log("Track muted");
            event.track.onunmute = () => log("Track unmuted");
            event.track.onended = () => log("Track ended");

            updateVideoStats();
          } else {
            log("Warning: No streams in track event");
          }
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            log("Sending ICE candidate");
            ws.send(
              JSON.stringify({
                type: "candidate",
                candidate: event.candidate,
              })
            );
          }
        };

        peerConnection.oniceconnectionstatechange = () => {
          const state = peerConnection.iceConnectionState;
          log("ICE Connection State: " + state);
          status.textContent = "ICE State: " + state;
        };

        peerConnection.onconnectionstatechange = () => {
          log("Connection State: " + peerConnection.connectionState);
        };
      }

      try {
        log("Setting remote description");
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(message.offer)
        );

        log("Creating answer");
        const answer = await peerConnection.createAnswer();

        log("Setting local description");
        await peerConnection.setLocalDescription(answer);

        log("Sending answer");
        ws.send(
          JSON.stringify({
            type: "answer",
            answer: answer,
          })
        );
      } catch (e) {
        log("Error in offer handling: " + e.message);
      }
    } else if (message.type === "candidate" && message.candidate) {
      if (peerConnection) {
        log("Adding ICE candidate");
        try {
          await peerConnection.addIceCandidate(
            new RTCIceCandidate(message.candidate)
          );
          log("Successfully added ICE candidate");
        } catch (e) {
          log("Error adding ICE candidate: " + e.message);
        }
      }
    }
  } catch (e) {
    log("Error parsing message: " + e.message);
  }
};

ws.onopen = () => {
  status.textContent = "Connected to server, waiting for stream...";
  log("WebSocket connected");
};

ws.onerror = (error) => {
  status.textContent = "WebSocket Error";
  log("WebSocket Error: " + error);
};

// Check video state periodically
setInterval(updateVideoStats, 5000);
