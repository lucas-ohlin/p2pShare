const { log } = require("./utils");

window.addEventListener('DOMContentLoaded', () => {
  const { on, emit, off, createPeer } = window.p2pAPI;
  let isPeerConnected = false;
  let peer = null;
  let currentRoom = '';

  const fileSection = document.getElementById('file-section');
  const roomSection = document.getElementById('roomSection');
  const header = document.getElementById('header');
  const roomTitle = document.getElementById('roomTitle');
  const leaveBtn = document.getElementById('leaveBtn');

  document.getElementById('joinBtn').onclick = () => {
    const room = document.getElementById('roomInput').value.trim();
    if (!room) return alert('Please enter a room name.');

    currentRoom = room;
    emit('join', room);
    log(`Joined room: ${room}`);

    roomSection.style.display = 'none';
    fileSection.style.display = 'block';
    header.style.display = 'flex';
    roomTitle.textContent = `Room: ${room}`;
  };

  leaveBtn.onclick = () => {
    roomSection.style.display = 'block';
    fileSection.style.display = 'none';
    header.style.display = 'none';
    document.getElementById('log').innerHTML = '';

    if (peer && typeof peer.destroy === 'function') {
      peer.destroy();
      peer = null;
      isPeerConnected = false;
    }
    
    currentRoom = '';
    log(`Left room`);
  };

  on('signal', data => {
    if (peer && typeof peer.signal === 'function') {
      peer.signal(data);
    }
  });

  on('connect', () => {
    peer = createPeer({ initiator: false, trickle: false });
    peer.on('signal', data => {
      if (currentRoom) {
        emit('signal', { room: currentRoom, data });
      }
    });

    peer.on('connect', () => {
      isPeerConnected = true;
      log('Connected to peer!');
    });

    peer.on('data', data => {
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'received_file';
      a.textContent = '⬇️ Click to download received file';
      document.getElementById('log').appendChild(a);
    });
  });

  document.getElementById('sendFileBtn').onclick = () => {
    const file = document.getElementById('fileInput').files[0];
  
    if (!file) {
      log('No file selected.');
      return;
    }
  
    if (!peer || !isPeerConnected || typeof peer.send !== 'function') {
      log('Peer not connected or invalid.');
      return;
    }
  
    const reader = new FileReader();
    reader.onload = () => {
      try {
        peer.send(reader.result);
        log(`📤 File "${file.name}" sent.`);
      } catch (err) {
        log('❌ Error sending file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };
  
});
