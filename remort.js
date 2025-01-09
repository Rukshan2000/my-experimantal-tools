const PRE = "DELTA"
const SUF = "CONTROL"
var room_id;
var peer = null;
var currentPeer = null;

function createRoom() {
    console.log("Creating Room");
    let room = document.getElementById("room-input").value;
    if (room == " " || room == "") {
        alert("Please enter room number");
        return;
    }
    room_id = PRE + room + SUF;
    peer = new Peer(room_id);
    peer.on('open', (id) => {
        console.log("Peer Connected with ID: ", id);
        hideModal();
        notify("Waiting for peer to join.");
    });

    peer.on('connection', (conn) => {
        conn.on('data', (data) => {
            processRemoteCommand(data);
        });
    });
}

function joinRoom() {
    console.log("Joining Room");
    let room = document.getElementById("room-input").value;
    if (room == " " || room == "") {
        alert("Please enter room number");
        return;
    }
    room_id = PRE + room + SUF;
    hideModal();
    peer = new Peer();
    peer.on('open', (id) => {
        console.log("Connected with Id: " + id);
        notify("Joining peer");
        const conn = peer.connect(room_id);
        setupRemoteControl(conn);
    });
}

function hideModal() {
    document.getElementById("entry-modal").hidden = true;
}

function notify(msg) {
    let notification = document.getElementById("notification");
    notification.innerHTML = msg;
    notification.hidden = false;
    setTimeout(() => {
        notification.hidden = true;
    }, 3000);
}

// Process incoming commands from the remote peer
function processRemoteCommand(command) {
    console.log("Received command:", command);

    // Example: handle different commands like mouse movements, key presses, etc.
    if (command.type === "mouse") {
        simulateMouseMove(command.x, command.y);
    } else if (command.type === "keyboard") {
        simulateKeyPress(command.key);
    }
}

// Setup remote control events for the client
function setupRemoteControl(conn) {
    document.addEventListener("mousemove", (event) => {
        const command = {
            type: "mouse",
            x: event.clientX,
            y: event.clientY,
        };
        conn.send(command);
    });

    document.addEventListener("keydown", (event) => {
        const command = {
            type: "keyboard",
            key: event.key,
        };
        conn.send(command);
    });
}

function simulateMouseMove(x, y) {
    console.log(`Simulating mouse move to: (${x}, ${y})`);
    // Logic to simulate mouse movement on the controlled machine
}

function simulateKeyPress(key) {
    console.log(`Simulating key press: ${key}`);
    // Logic to simulate keyboard press on the controlled machine
}
