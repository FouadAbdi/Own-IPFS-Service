const WebSocket = require('ws');
const axios = require('axios');

class P2PNetwork {
  constructor(port = 8080, storage) {
    this.port = port;
    this.storage = storage;
    this.peers = new Map(); // peerId -> { ws, url, lastSeen }
    this.knownPeers = new Set();
    this.server = null;
    this.isRunning = false;
  }

  /**
   * Start P2P network
   */
  start() {
    if (this.isRunning) return;

    this.server = new WebSocket.Server({ port: parseInt(this.port) + 1000 }); // Use different port for P2P
    
    this.server.on('connection', (ws, req) => {
      const peerId = this.generatePeerId();
      console.log(`New peer connected: ${peerId}`);
      
      this.peers.set(peerId, {
        ws,
        url: req.headers.origin || 'unknown',
        lastSeen: Date.now()
      });

      ws.on('message', (data) => {
        this.handleMessage(peerId, data);
      });

      ws.on('close', () => {
        console.log(`Peer disconnected: ${peerId}`);
        this.peers.delete(peerId);
      });

      ws.on('error', (error) => {
        console.error(`Peer ${peerId} error:`, error.message);
        this.peers.delete(peerId);
      });

      // Send welcome message
      this.sendToPeer(peerId, {
        type: 'welcome',
        peerId: this.getMyPeerId(),
        timestamp: Date.now()
      });
    });

    this.isRunning = true;
    console.log(`P2P network started on port ${parseInt(this.port) + 1000}`);
  }

  /**
   * Stop P2P network
   */
  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    this.peers.clear();
    this.isRunning = false;
    console.log('P2P network stopped');
  }

  /**
   * Connect to a peer
   * @param {string} peerUrl - URL of peer to connect to
   */
  async connectToPeer(peerUrl) {
    if (this.knownPeers.has(peerUrl)) {
      return;
    }

    try {
      const ws = new WebSocket(peerUrl);
      const peerId = this.generatePeerId();

      ws.on('open', () => {
        console.log(`Connected to peer: ${peerUrl}`);
        this.peers.set(peerId, {
          ws,
          url: peerUrl,
          lastSeen: Date.now()
        });
        this.knownPeers.add(peerUrl);

        // Send introduction
        this.sendToPeer(peerId, {
          type: 'introduction',
          peerId: this.getMyPeerId(),
          timestamp: Date.now()
        });
      });

      ws.on('message', (data) => {
        this.handleMessage(peerId, data);
      });

      ws.on('close', () => {
        console.log(`Disconnected from peer: ${peerUrl}`);
        this.peers.delete(peerId);
        this.knownPeers.delete(peerUrl);
      });

      ws.on('error', (error) => {
        console.error(`Connection error to ${peerUrl}:`, error.message);
        this.peers.delete(peerId);
        this.knownPeers.delete(peerUrl);
      });

    } catch (error) {
      console.error(`Failed to connect to peer ${peerUrl}:`, error.message);
    }
  }

  /**
   * Handle incoming messages
   * @param {string} peerId - ID of the peer
   * @param {Buffer} data - Message data
   */
  async handleMessage(peerId, data) {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'welcome':
        case 'introduction':
          console.log(`Received ${message.type} from peer ${peerId}`);
          break;
          
        case 'requestFile':
          await this.handleFileRequest(peerId, message);
          break;
          
        case 'fileResponse':
          await this.handleFileResponse(peerId, message);
          break;
          
        case 'announceFile':
          await this.handleFileAnnouncement(peerId, message);
          break;
          
        default:
          console.log(`Unknown message type from ${peerId}:`, message.type);
      }
    } catch (error) {
      console.error(`Error handling message from ${peerId}:`, error.message);
    }
  }

  /**
   * Handle file request from peer
   */
  async handleFileRequest(peerId, message) {
    const { hash } = message;
    
    if (await this.storage.exists(hash)) {
      const content = await this.storage.retrieve(hash);
      const metadata = await this.storage.getMetadata(hash);
      
      this.sendToPeer(peerId, {
        type: 'fileResponse',
        hash,
        found: true,
        content: content.toString('base64'),
        metadata
      });
    } else {
      this.sendToPeer(peerId, {
        type: 'fileResponse',
        hash,
        found: false
      });
    }
  }

  /**
   * Handle file response from peer
   */
  async handleFileResponse(peerId, message) {
    const { hash, found, content, metadata } = message;
    
    if (found && content && metadata) {
      try {
        const buffer = Buffer.from(content, 'base64');
        await this.storage.store(buffer, metadata.filename, metadata.mimeType);
        console.log(`Received file ${hash} from peer ${peerId}`);
      } catch (error) {
        console.error(`Failed to store file from peer:`, error.message);
      }
    }
  }

  /**
   * Handle file announcement from peer
   */
  async handleFileAnnouncement(peerId, message) {
    const { hash, metadata } = message;
    console.log(`Peer ${peerId} announced file: ${hash} (${metadata.filename})`);
  }

  /**
   * Request file from peers
   * @param {string} hash - Hash of file to request
   * @returns {Promise<boolean>} - True if file was found
   */
  async requestFileFromPeers(hash) {
    if (this.peers.size === 0) {
      return false;
    }

    const promises = [];
    
    for (const [peerId] of this.peers) {
      promises.push(this.requestFileFromPeer(peerId, hash));
    }

    const results = await Promise.allSettled(promises);
    return results.some(result => result.status === 'fulfilled' && result.value);
  }

  /**
   * Request file from specific peer
   */
  async requestFileFromPeer(peerId, hash) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 5000); // 5 second timeout
      
      const originalHandler = this.handleMessage.bind(this);
      this.handleMessage = async (id, data) => {
        if (id === peerId) {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'fileResponse' && message.hash === hash) {
              clearTimeout(timeout);
              this.handleMessage = originalHandler;
              resolve(message.found);
              return;
            }
          } catch (error) {
            // Ignore parsing errors
          }
        }
        await originalHandler(id, data);
      };

      this.sendToPeer(peerId, {
        type: 'requestFile',
        hash,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Announce new file to peers
   * @param {string} hash - Hash of new file
   * @param {Object} metadata - File metadata
   */
  announceFile(hash, metadata) {
    this.broadcast({
      type: 'announceFile',
      hash,
      metadata,
      timestamp: Date.now()
    });
  }

  /**
   * Send message to specific peer
   * @param {string} peerId - Peer ID
   * @param {Object} message - Message to send
   */
  sendToPeer(peerId, message) {
    const peer = this.peers.get(peerId);
    if (peer && peer.ws.readyState === WebSocket.OPEN) {
      peer.ws.send(JSON.stringify(message));
      peer.lastSeen = Date.now();
    }
  }

  /**
   * Broadcast message to all peers
   * @param {Object} message - Message to broadcast
   */
  broadcast(message) {
    for (const [peerId] of this.peers) {
      this.sendToPeer(peerId, message);
    }
  }

  /**
   * Get connected peers info
   */
  getPeersInfo() {
    const peersInfo = [];
    for (const [peerId, peer] of this.peers) {
      peersInfo.push({
        id: peerId,
        url: peer.url,
        lastSeen: peer.lastSeen,
        connected: peer.ws.readyState === WebSocket.OPEN
      });
    }
    return peersInfo;
  }

  /**
   * Generate random peer ID
   */
  generatePeerId() {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Get my peer ID
   */
  getMyPeerId() {
    return `node-${this.port}`;
  }
}

module.exports = P2PNetwork;
