window.addEventListener('DOMContentLoaded', () => {
  const { onSocket, emit, createPeer } = window.p2pAPI;

  let peers = {};
  let currentRoom = '';

  const log = msg => {
    document.getElementById('log').innerHTML += `<p>${msg}</p>`;
  };

  document.getElementById('roomInfo').style.display = 'none';
  document.getElementById('participantsBox').style.display = 'none';
  document.getElementById('leaveBtn').style.display = 'none';
  document.getElementById('file-section').style.display = 'none';

  document.getElementById('joinBtn').onclick = () => {
    const room = document.getElementById('roomInput').value.trim();
    if (!room) return alert('Please enter a room name.');

    currentRoom = room;
    emit('join', room);

    document.getElementById('roomSection').style.display = 'none';
    document.getElementById('file-section').style.display = 'block';
    document.getElementById('roomInfo').style.display = 'block';
    document.getElementById('participantsBox').style.display = 'block';
    document.getElementById('leaveBtn').style.display = 'inline-block';
    document.getElementById('appTitle').style.display = 'none';
    document.getElementById('mainTitle').classList.add('hidden');
    document.getElementById('roomTitle').textContent = room;
  };

  function createPeerConnection(userId, initiator) {
    const peer = createPeer({ initiator, trickle: false });
    peers[userId] = peer;

    peer.on('signal', data => {
      emit('signal', { room: currentRoom, data, to: userId });
    });

    peer.on('connect', () => {
      log(`Connected to ${userId}`);
      document.getElementById('sendFileBtn').disabled = false;
    });

    peer.on('data', data => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'file') {
          displayFile(parsed);
          log(`Received file (via P2P): ${parsed.name}`);
        }
      } catch (err) {
        log(`Error handling data: ${err.message}`);
      }
    });

    peer.on('error', err => log(`Peer error: ${err.message}`));
    peer.on('close', () => {
      delete peers[userId];
      log(`Disconnected from ${userId}`);
    });
  }

	// Socket handling
  onSocket('userJoined', ({ user }) => {
		log(`${user} joined.`);
    if (!peers[user]) {
      createPeerConnection(user, true);
    }
  });

  onSocket('signal', ({ from, data }) => {
    if (!peers[from]) {
      createPeerConnection(from, false);
    }
    peers[from].signal(data);
  });

  onSocket('participants', userList => {
    const container = document.getElementById('participantList');
    container.innerHTML = '';
    userList.forEach(user => {
      const li = document.createElement('li');
      li.textContent = user;
      container.appendChild(li);
    });
  });

  onSocket('fileMessage', (fileData) => {
    displayFile(fileData);
    log(`Received file: ${fileData.name}`);
  });

  // Display file with download link along with a download button 
	function displayFile(fileData) {
		const blob = new Blob([fileData.content], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
	
		const li = document.createElement('li');
		li.style.display = 'flex';
		li.style.alignItems = 'center';
		li.style.gap = '10px';
		li.style.marginBottom = '8px';
	
		const downloadBtn = document.createElement('a');
		downloadBtn.href = url;
		downloadBtn.download = fileData.name;
		downloadBtn.textContent = 'Download';
		downloadBtn.className = 'download-btn'; 
	
		const fileLabel = document.createElement('span');
		fileLabel.textContent = fileData.name;
		fileLabel.style.fontWeight = 'bold';
	
		li.appendChild(downloadBtn);
		li.appendChild(fileLabel);
		document.getElementById('fileListItems').appendChild(li);
	}
	
  document.getElementById('sendFileBtn').onclick = () => {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
      log('No file selected');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = {
        type: 'file',
        name: file.name,
        content: e.target.result,
      };

      Object.values(peers).forEach(peer => {
        if (peer.connected) {
          peer.send(JSON.stringify(fileData));
        }
      });

      emit('fileMessage', { room: currentRoom, fileData });
      displayFile(fileData);
      log(`Sent file: ${file.name}`);

      fileInput.value = '';
    };

		reader.readAsArrayBuffer(file); 
  };

	leaveBtn.onclick = () => {
   	document.getElementById('roomSection').style.display = 'block';
    document.getElementById('file-section').style.display = 'none';
    document.getElementById('roomInfo').style.display = 'none';
    document.getElementById('participantsBox').style.display = 'none';
    document.getElementById('leaveBtn').style.display = 'none';
    document.getElementById('appTitle').style.display = 'block';
    document.getElementById('mainTitle').classList.remove('hidden');
    document.getElementById('log').innerHTML = '';
    document.getElementById('fileListItems').innerHTML = '';
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
});
