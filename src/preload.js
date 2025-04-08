const { contextBridge } = require('electron');
const { io } = require('socket.io-client');
const Peer = require('simple-peer');
const socket = io('http://localhost:3000'); 

contextBridge.exposeInMainWorld('p2pAPI', {
  on: (event, callback) => {
    socket.on(event, (...args) => callback(...args));
  },
  emit: (event, ...args) => {
    socket.emit(event, ...args);
  },
  off: (event, callback) => {
    socket.off(event, callback);
  },

  createPeer: (opts) => new Peer(opts),
});
