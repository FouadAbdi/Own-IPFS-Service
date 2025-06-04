const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const Storage = require('./storage');
const P2PNetwork = require('./p2p');

class IPFSService {
  constructor(port = 8080, dataDir = './data') {
    this.port = port;
    this.app = express();
    this.storage = new Storage(dataDir);
    this.p2p = new P2PNetwork(port, this.storage);
    this.server = null;
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '100mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '100mb' }));
    
    // Setup multer for file uploads
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
    });
    
    this.upload = upload;
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Serve static web interface
    this.app.use(express.static(path.join(__dirname, '../public')));

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        peers: this.p2p.getPeersInfo().length
      });
    });

    // Add file (upload)
    this.app.post('/api/add', this.upload.single('file'), async (req, res) => {
      try {
        if (!req.file && !req.body.content) {
          return res.status(400).json({ error: 'No file or content provided' });
        }

        let content, filename, mimeType;
        
        if (req.file) {
          content = req.file.buffer;
          filename = req.file.originalname;
          mimeType = req.file.mimetype;
        } else {
          content = req.body.content;
          filename = req.body.filename || 'unnamed';
          mimeType = req.body.mimeType || 'text/plain';
        }

        const hash = await this.storage.store(content, filename, mimeType);
        const metadata = await this.storage.getMetadata(hash);
        
        // Announce to peers
        this.p2p.announceFile(hash, metadata);
        
        res.json({ 
          hash, 
          size: metadata.size,
          filename: metadata.filename,
          mimeType: metadata.mimeType
        });
      } catch (error) {
        console.error('Error adding file:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get file by hash
    this.app.get('/api/cat/:hash', async (req, res) => {
      try {
        const { hash } = req.params;
        let content = await this.storage.retrieve(hash);
        
        // If not found locally, try to get from peers
        if (!content) {
          const found = await this.p2p.requestFileFromPeers(hash);
          if (found) {
            content = await this.storage.retrieve(hash);
          }
        }
        
        if (!content) {
          return res.status(404).json({ error: 'File not found' });
        }

        const metadata = await this.storage.getMetadata(hash);
        
        res.set({
          'Content-Type': metadata?.mimeType || 'application/octet-stream',
          'Content-Length': content.length,
          'X-IPFS-Hash': hash
        });
        
        if (metadata?.filename) {
          res.set('Content-Disposition', `inline; filename="${metadata.filename}"`);
        }
        
        res.send(content);
      } catch (error) {
        console.error('Error retrieving file:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get file metadata
    this.app.get('/api/metadata/:hash', async (req, res) => {
      try {
        const { hash } = req.params;
        const metadata = await this.storage.getMetadata(hash);
        
        if (!metadata) {
          return res.status(404).json({ error: 'File not found' });
        }
        
        res.json(metadata);
      } catch (error) {
        console.error('Error getting metadata:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // List all files
    this.app.get('/api/list', async (req, res) => {
      try {
        const files = await this.storage.list();
        res.json(files);
      } catch (error) {
        console.error('Error listing files:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Delete file
    this.app.delete('/api/delete/:hash', async (req, res) => {
      try {
        const { hash } = req.params;
        const deleted = await this.storage.delete(hash);
        
        if (deleted) {
          res.json({ message: 'File deleted successfully' });
        } else {
          res.status(404).json({ error: 'File not found' });
        }
      } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get storage stats
    this.app.get('/api/stats', async (req, res) => {
      try {
        const stats = await this.storage.getStats();
        res.json(stats);
      } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // P2P endpoints
    this.app.get('/api/peers', (req, res) => {
      const peers = this.p2p.getPeersInfo();
      res.json(peers);
    });

    this.app.post('/api/peers/connect', async (req, res) => {
      try {
        const { peerUrl } = req.body;
        if (!peerUrl) {
          return res.status(400).json({ error: 'Peer URL is required' });
        }
        
        await this.p2p.connectToPeer(peerUrl);
        res.json({ message: 'Connection initiated' });
      } catch (error) {
        console.error('Error connecting to peer:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Serve web interface at root
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
  }

  /**
   * Start the IPFS service
   */
  async start() {
    try {
      await this.storage.init();
      
      this.server = this.app.listen(this.port, () => {
        console.log(`🚀 Own IPFS Service running on http://localhost:${this.port}`);
        console.log(`📊 Web interface: http://localhost:${this.port}`);
        console.log(`🔗 API endpoint: http://localhost:${this.port}/api`);
      });

      // Start P2P network
      this.p2p.start();
      
      // Graceful shutdown
      process.on('SIGINT', () => {
        console.log('\\nShutting down gracefully...');
        this.stop();
      });
      
    } catch (error) {
      console.error('Failed to start IPFS service:', error);
      process.exit(1);
    }
  }

  /**
   * Stop the IPFS service
   */
  stop() {
    if (this.server) {
      this.server.close();
    }
    this.p2p.stop();
    console.log('IPFS service stopped');
    process.exit(0);
  }
}

module.exports = IPFSService;
