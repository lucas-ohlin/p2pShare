window.addEventListener('DOMContentLoaded', () => {
  const { on, emit, createPeer } = window.p2pAPI;

  document.getElementById('roomInfo').style.display = 'none';
  document.getElementById('participantsBox').style.display = 'none';
  document.getElementById('leaveBtn').style.display = 'none';

  let peer = null;
  let isPeerConnected = false;
  let peerInitiator = false;
  let currentRoom = '';

  const log = msg => {
    document.getElementById('log').innerHTML += `<p>${msg}</p>`;
  };

  const fileSection = document.getElementById('file-section');
  const roomSection = document.getElementById('roomSection');
  const header = document.getElementById('header');
  const roomTitle = document.getElementById('roomTitle');
  const leaveBtn = document.getElementById('leaveBtn');

  document.getElementById('joinBtn').onclick = () => {
    document.getElementById('roomInfo').style.display = 'block';
    document.getElementById('participantsBox').style.display = 'block';
    document.getElementById('leaveBtn').style.display = 'inline-block';
    document.getElementById('appTitle').style.display = 'none';
    document.getElementById('mainTitle').classList.add('hidden');
  
    const room = document.getElementById('roomInput').value.trim();
    if (!room) return alert('Please enter a room name.');
  
    currentRoom = room;
    emit('join', room);
    log(`Joined room: ${room}`);
  
    roomSection.style.display = 'none';
    fileSection.style.display = 'block';
    roomTitle.textContent = room;  
  };
  
  on('initiator', isFirst => {
    peerInitiator = isFirst;
    log(`I am ${isFirst ? 'the initiator' : 'waiting for connection'}...`);
    setupPeer();
  });

  on('userJoined', ({ user, message }) => {
    log(message);
  });
  
  on('userLeft', ({ user, message }) => {
    log(message);
  });

  const updateParticipantList = (list) => {
    const container = document.getElementById('participantList');
    container.innerHTML = ''; 
    list.forEach(user => {
      const li = document.createElement('li');
      li.textContent = user;
      container.appendChild(li);
    });
  };
  
  
  on('participants', userList => {
    participants = userList;
    updateParticipantList(userList);
  });  

  on('signal', data => {
    if (peer && typeof peer.signal === 'function') {
      peer.signal(data);
    }
  });

  const setupPeer = () => {
    peer = createPeer({ initiator: peerInitiator, trickle: false });
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
  };

  leaveBtn.onclick = () => {
    document.getElementById('roomInfo').style.display = 'none';
    document.getElementById('participantsBox').style.display = 'none';
    document.getElementById('leaveBtn').style.display = 'none';
    document.getElementById('appTitle').style.display = 'block';
    document.getElementById('mainTitle').classList.remove('hidden');
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
    emit('leave');
    log(`Left room`);
  };

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
        log(`File "${file.name}" sent.`);
      } catch (err) {
        log('Error sending file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };
});
