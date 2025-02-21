# botCam - Phone Camera to PC Webcam

Turn your phone's camera into a wireless webcam for your PC using WebRTC technology. This solution provides high-quality camera streaming that continues to work even after disconnecting from the initial server.

## Overview

botCam creates a peer-to-peer connection between your phone and PC using WebRTC, allowing your phone's camera to function as a wireless webcam. The connection persists even after the signaling server is shut down, thanks to the direct WebRTC connection.

## Features

- Wireless camera streaming from phone to PC
- Multiple camera support (switch between front/back cameras)
- Video rotation capabilities
- Real-time stream monitoring and debugging tools
- Secure HTTPS connections with signed certificates
- Persistent connection (continues after server shutdown)
- NAT traversal using Google STUN servers

## Technical Architecture

The system consists of three main components:

1. **Phone Client** (phone.html): Handles camera access and WebRTC streaming
2. **PC Client** (pc.html): Receives and displays the video stream
3. **Signaling Server**: Facilitates initial connection establishment

### Connection Flow

1. Both devices connect to the WebSocket signaling server
2. Phone initiates WebRTC peer connection
3. SDP and ICE candidate exchange occurs through the signaling server
4. Direct P2P connection established between phone and PC
5. Video streams directly from phone to PC
6. Signaling server can be disconnected

## Technologies Used

- WebRTC (UDP connection)
- Node.js with Express
- WebSocket for signaling
- Google STUN servers for NAT traversal
- OpenSSL for certificate generation
- Python for certificate management

## Prerequisites

- Node.js
- Python 3.x
- OpenSSL
- Modern web browser with WebRTC support
- Phone with working camera
- OBS Studio installed in PC

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Generate certificates using the provided Python script
4. Start the signaling server:

```bash
node server.js
```

## Usage Guide

For detailed instructions on how to use botCam, please refer to `How_To_Use_Guide_botCam.pdf` in the repository.

## Security

- HTTPS encryption for all connections
- Secure WebSocket (WSS) for signaling
- Custom certificate generation and management
- Direct P2P encryption for video streams

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
