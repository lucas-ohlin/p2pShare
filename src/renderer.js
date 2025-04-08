window.addEventListener('DOMContentLoaded', () => {
  const { on, emit, createPeer } = window.p2pAPI;

  document.getElementById('roomInfo').style.display = 'none';
  document.getElementById('participantsBox').style.display = 'none';
  document.getElementById('leaveBtn').style.display = 'none';

  let peer = null;
  let isPeerConnected = false;
  let peerInitiator = false;
  let currentRoom = '';
  let peerCreated = false;

  const log = msg => {
    document.getElementById('log').innerHTML += `<p>${msg}</p>`;
  };

  const fileSection = document.getElementById('file-section');
  const sendFileBtn = document.getElementById('sendFileBtn');
  sendFileBtn.disabled = true;

  const roomSection = document.getElementById('roomSection');
  const header = document.getElementById('header');
  const roomTitle = document.getElementById('roomTitle');
  const leaveBtn = document.getElementById('leaveBtn');

  document.getElementById('joinBtn').onclick = () => {
    document.getElementById('log').innerHTML = ''; 
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
  
    const uniqueUsers = [...new Set(list)];
    uniqueUsers.forEach(user => {
      const li = document.createElement('li');
      li.textContent = user;
      container.appendChild(li);
    });
  };
  
  on('participants', userList => {
    participants = userList;
    updateParticipantList(userList);
  });  

  on('signal', payload => {
    log('Signal received');
  
    if (!peer) {
      log('Creating peer on signal (non-initiator)');
      peerCreated = true;
      peer = createPeer({ initiator: false, trickle: false });
  
      peer.on('signal', data => {
        if (currentRoom) {
          emit('signal', { room: currentRoom, data });
        }
      });
  
      peer.on('connect', () => {
        isPeerConnected = true;
        sendFileBtn.disabled = false;
        log('Peer connection established');
      });
  
      peer.on('data', data => {
        const blob = new Blob([data]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'received_file';
        a.textContent = '📥 Download received file';
        a.style.display = 'block';
        document.getElementById('log').appendChild(a);
      });
  
      peer.on('error', err => {
        log(`Peer error: ${err.message}`);
      });
  
      peer.on('close', () => {
        isPeerConnected = false;
        peerCreated = false;
        peer = null;
        sendFileBtn.disabled = true;
        log('Peer connection closed');
      });
  
      setTimeout(() => {
        try {
          peer.signal(payload.data);
          log('Buffered signal passed to peer.');
        } catch (err) {
          log(`Failed to signal peer: ${err.message}`);
        }
      }, 50);
  
      return;
    }
  
    try {
      peer.signal(payload.data);
      log('Signal received and passed to peer.');
    } catch (err) {
      log(`Failed to signal peer: ${err.message}`);
    }
  });
  

  const setupPeer = () => {
    if (peerCreated) return;
  
    peerCreated = true;
    peer = createPeer({ initiator: peerInitiator, trickle: false });
    log('Peer created');
  
    peer.on('signal', data => {
      emit('signal', { room: currentRoom, data });
    });
  
    peer.on('connect', () => {
      isPeerConnected = true;
      log('Peer connection established');
    });
  
    peer.on('data', data => {
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'received_file';
      a.textContent = 'Download received file';
      document.getElementById('log').appendChild(a);
    });
  
    peer.on('error', err => {
      log(`Peer error: ${err.message}`);
    });
  
    peer.on('close', () => {
      log('Peer connection closed');
      isPeerConnected = false;
      peerCreated = false;
      peer = null;
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
  
    if (peer && typeof peer.destroy === 'function') {
      peer.destroy();
    }
  
    peer = null;
    peerCreated = false;
    isPeerConnected = false;
    currentRoom = '';
  
    document.getElementById('log').innerHTML = '';
    emit('leave');
  };
    
  document.getElementById('sendFileBtn').onclick = () => {
    const file = document.getElementById('fileInput').files[0];

    if (!file) {
      log('No file selected.');
      return;
    }

    if (!peer) {
      log('Peer is null or undefined.');
      return;
    }

    if (!isPeerConnected) {
      log('Peer is not connected yet.');
      return;
    }

    if (typeof peer.send !== 'function') {
      log('peer.send is not a function');
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
