// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDQh7W7e5p2atWtxvku6jcxEZ2HDG2TUh0",
    authDomain: "access-c3167.firebaseapp.com",
    projectId: "access-c3167",
    storageBucket: "access-c3167.firebasestorage.app",
    messagingSenderId: "722935786824",
    appId: "1:722935786824:web:d32a967b4a6fbb6d7b977d",
    measurementId: "G-YMDHSQ76WR"
  };
  
  // Initialize Firebase
  const app = firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  
  // Global Variables
  let peerConnection;
  let dataChannel;
  
  // ICE Servers Configuration
  const peerConnectionConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };
  
  // Firestore Signaling Document for communication between peers
  const signalingDoc = db.collection('webrtc-signaling').doc('session');
  
  // Create Offer
  async function createOffer() {
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    dataChannel = peerConnection.createDataChannel('mediaChannel');
  
    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        signalingDoc.set({ candidate: event.candidate }, { merge: true });
      }
    };
  
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    await signalingDoc.set({ offer });
  }
  
  // Listen for incoming offer/answer and candidates
  signalingDoc.onSnapshot(async (snapshot) => {
    const data = snapshot.data();
    if (!peerConnection) return;
  
    if (data.answer && !peerConnection.remoteDescription) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
  
    if (data.candidate) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  });
  
  // Create Answer (for the other peer)
  async function createAnswer() {
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.ondatachannel = event => {
      const receiveChannel = event.channel;
      receiveChannel.onmessage = handleReceivedMedia;
    };
  
    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        signalingDoc.set({ candidate: event.candidate }, { merge: true });
      }
    };
  
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    await signalingDoc.set({ answer });
  }
  
  // Sending Media (File transfer via DataChannel)
  function sendMedia() {
    if (!dataChannel) {
      console.error('Data channel not initialized.');
      return;
    }
  
    const files = document.getElementById('mediaInput').files;
    for (let file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        dataChannel.send(reader.result); // Send file as binary data
      };
      reader.readAsArrayBuffer(file);
    }
  }
  
  // Handle received media
  function handleReceivedMedia(event) {
    const receivedData = event.data;
    const blob = new Blob([receivedData]);
    const mediaDisplay = document.getElementById('mediaDisplay');
  
    const fileType = blob.type.split('/')[0];
  
    if (fileType === 'image') {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(blob);
      mediaDisplay.appendChild(img);
    } else if (fileType === 'video') {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(blob);
      video.controls = true;
      mediaDisplay.appendChild(video);
    } else if (fileType === 'audio') {
      const audio = document.createElement('audio');
      audio.src = URL.createObjectURL(blob);
      audio.controls = true;
      mediaDisplay.appendChild(audio);
    }
  }
  
  // UI-related Functions (To be called by user on the front end)
  function startConnection() {
    createOffer();
  }
  
  function answerConnection() {
    createAnswer();
  }
  