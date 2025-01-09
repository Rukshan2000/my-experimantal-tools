const PRE = "DELTA"
const SUF = "MEET"
var room_id;
var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
var local_stream;
var screenStream;
var peer = null;
var currentPeer = null
var screenSharing = false
var audioEnabled = true;  // Track audio state
var videoEnabled = true;  // Track video state

function createRoom() {
    console.log("Creating Room");
    let room = document.getElementById("room-input").value;
    if (room.trim() === "") {
        alert("Please enter room number");
        return;
    }

    room_id = PRE + room + SUF;
    peer = new Peer(room_id);
    peer.on('open', (id) => {
        console.log("Peer Connected with ID: ", id);
        hideModal();
        getUserMedia({ video: true, audio: true }, (stream) => {
            local_stream = stream;
            setLocalStream(local_stream);
        }, (err) => {
            console.log(err);
        });
        notify("Waiting for peer to join.");

        // Create and display the join link
        const joinURL = `${window.location.origin}?room=${room}`;
        document.getElementById("join-link").value = joinURL;
        document.getElementById("join-link-container").hidden = false;  // Show the join link container
    });

    peer.on('call', (call) => {
        call.answer(local_stream);
        call.on('stream', (stream) => {
            setRemoteStream(stream);
        });
        currentPeer = call;
    });
}
function copyJoinLink() {
    const joinLinkInput = document.getElementById("join-link");
    joinLinkInput.select();
    joinLinkInput.setSelectionRange(0, 99999); // For mobile devices
    document.execCommand("copy"); // Copy the text to the clipboard
    alert("Join link copied: " + joinLinkInput.value);
}


function setLocalStream(stream) {
    let video = document.getElementById("local-video");
    video.srcObject = stream;
    video.muted = true;
    video.play();
}

function setRemoteStream(stream) {
    let video = document.getElementById("remote-video");
    video.srcObject = stream;
    video.play();
}

function hideModal() {
    document.getElementById("entry-modal").hidden = true
}

function notify(msg) {
    let notification = document.getElementById("notification")
    notification.innerHTML = msg
    notification.hidden = false
    setTimeout(() => {
        notification.hidden = true;
    }, 3000)
}

function joinRoom() {
    console.log("Joining Room");

    // Get the room number from the URL (e.g., ?room=123 or #123)
    const urlParams = new URLSearchParams(window.location.search);
    let room = urlParams.get('room') || window.location.hash.substring(1); // Check query or hash part

    // If no room number is provided in the URL, check the input field
    if (!room || room.trim() === "") {
        room = document.getElementById("room-input").value;
        if (!room || room.trim() === "") {
            alert("Please enter room number");
            return;
        }
    }

    room_id = PRE + room + SUF;
    console.log("Room ID: " + room_id);
    hideModal();

    peer = new Peer();
    peer.on('open', (id) => {
        console.log("Connected with ID: " + id);
        getUserMedia({ video: true, audio: true }, (stream) => {
            local_stream = stream;
            setLocalStream(local_stream);
            notify("Joining peer");

            // Call the room ID using the stream
            let call = peer.call(room_id, stream);
            call.on('stream', (stream) => {
                setRemoteStream(stream);
            });
            currentPeer = call;
        }, (err) => {
            console.log(err);
        });
    });
}

function startScreenShare() {
    if (screenSharing) {
        stopScreenSharing()
    }
    navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream) => {
        screenStream = stream;
        let videoTrack = screenStream.getVideoTracks()[0];
        videoTrack.onended = () => {
            stopScreenSharing()
        }
        if (peer) {
            let sender = currentPeer.peerConnection.getSenders().find(function (s) {
                return s.track.kind == videoTrack.kind;
            })
            sender.replaceTrack(videoTrack)
            screenSharing = true
        }
        console.log(screenStream)
    })
}

function stopScreenSharing() {
    if (!screenSharing) return;
    let videoTrack = local_stream.getVideoTracks()[0];
    if (peer) {
        let sender = currentPeer.peerConnection.getSenders().find(function (s) {
            return s.track.kind == videoTrack.kind;
        })
        sender.replaceTrack(videoTrack)
    }
    screenStream.getTracks().forEach(function (track) {
        track.stop();
    });
    screenSharing = false
}

// Toggle microphone (audio) on/off
function toggleMic() {
    audioEnabled = !audioEnabled;
    local_stream.getAudioTracks()[0].enabled = audioEnabled;
    let micBtn = document.getElementById("mic-btn");
    micBtn.innerHTML = audioEnabled ? "Mic On" : "Mic Off";
}

// Toggle camera (video) on/off
function toggleVideo() {
    videoEnabled = !videoEnabled;
    local_stream.getVideoTracks()[0].enabled = videoEnabled;
    let videoBtn = document.getElementById("video-btn");
    videoBtn.innerHTML = videoEnabled ? "Video On" : "Video Off";
}
