# 🌟 Own IPFS Service

A complete IPFS-like distributed file storage service built from scratch with Node.js. Store, share, and distribute files across a peer-to-peer network without relying on external IPFS services.

## ✨ Features

- **Content-Addressed Storage**: Files are stored using cryptographic hashes (IPFS-compatible format)
- **Peer-to-Peer Network**: Connect multiple nodes to share and distribute files
- **Web Interface**: Beautiful, modern web UI for easy file management
- **REST API**: Complete API for programmatic access
- **CLI Tools**: Command-line interface for advanced users
- **Real-time Stats**: Monitor storage usage and network status
- **File Metadata**: Track file information, sizes, and timestamps
- **Drag & Drop Upload**: Easy file uploading with drag and drop support

## 🚀 Quick Start

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/FouadAbdi/Own-IPFS-Service.git
   cd Own-IPFS-Service
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the service:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   - Web Interface: http://localhost:8080
   - API Documentation: http://localhost:8080/api

### Development Mode

```bash
npm run dev
```

This starts the service with auto-reload on file changes.

## 📖 How to Use

### Web Interface

1. **Upload Files:**
   - Drag and drop files onto the upload area
   - Or click "Select Files" to browse
   - Or paste text content directly

2. **Retrieve Files:**
   - Enter an IPFS hash (starting with "Qm")
   - Click "Retrieve" to download
   - Click "Get Info" for metadata

3. **Manage Files:**
   - View all stored files in the "Stored Files" section
   - Download, copy hash, or delete files
   - Monitor storage statistics

4. **P2P Network:**
   - Connect to other nodes using WebSocket URLs
   - Share files automatically across the network
   - Monitor connected peers

### API Endpoints

#### Upload File
```bash
# Upload a file
curl -X POST -F "file=@example.txt" http://localhost:8080/api/add

# Upload text content
curl -X POST -H "Content-Type: application/json" \
  -d '{"content":"Hello World","filename":"hello.txt"}' \
  http://localhost:8080/api/add
```

#### Retrieve File
```bash
# Get file content
curl http://localhost:8080/api/cat/QmYourHashHere

# Get file metadata
curl http://localhost:8080/api/metadata/QmYourHashHere
```

#### List Files
```bash
# List all stored files
curl http://localhost:8080/api/list

# Get storage statistics
curl http://localhost:8080/api/stats
```

#### P2P Network
```bash
# Get connected peers
curl http://localhost:8080/api/peers

# Connect to a peer
curl -X POST -H "Content-Type: application/json" \
  -d '{"peerUrl":"ws://localhost:9080"}' \
  http://localhost:8080/api/peers/connect
```

### CLI Usage

The service includes a command-line interface for advanced operations:

```bash
# Start the service
node cli.js start --port 8080 --data ./my-data

# Add a file
node cli.js add ./path/to/file.txt

# Retrieve a file
node cli.js cat QmYourHashHere --output ./downloaded-file.txt

# List all files
node cli.js list

# Show statistics
node cli.js stats

# Generate hash for content
node cli.js hash "Hello, World!"
```

## 🏗️ Architecture

### Core Components

1. **Hash Generator (`src/hash.js`)**
   - Generates IPFS-compatible hashes using SHA-256
   - Base58 encoding with "Qm" prefix
   - Deterministic content addressing

2. **Storage System (`src/storage.js`)**
   - Content-addressed block storage
   - Metadata management
   - Efficient file organization with subdirectories

3. **P2P Network (`src/p2p.js`)**
   - WebSocket-based peer communication
   - File sharing and discovery
   - Network topology management

4. **HTTP Service (`src/service.js`)**
   - Express.js REST API
   - File upload/download handling
   - Web interface serving

5. **Web Interface (`public/index.html`)**
   - Modern, responsive UI
   - Real-time updates
   - Drag & drop functionality

### File Storage Structure

```
data/
├── blocks/           # Raw file content (organized by hash)
│   ├── 12/
│   │   └── Qm12abc... 
│   └── 34/
│       └── Qm34def...
└── metadata/         # File metadata (JSON)
    ├── 12/
    │   └── Qm12abc....json
    └── 34/
        └── Qm34def....json
```

## 🔧 Configuration

### Environment Variables

- `PORT`: HTTP server port (default: 8080)
- `DATA_DIR`: Data storage directory (default: ./data)

### Programmatic Configuration

```javascript
const IPFSService = require('./src/service');

const service = new IPFSService({
  port: 3000,
  dataDir: '/custom/data/path'
});

await service.start();
```

## 🌐 P2P Network Setup

### Single Node
```bash
npm start
```

### Multiple Nodes Network

1. **Start first node:**
   ```bash
   PORT=8080 npm start
   ```

2. **Start second node:**
   ```bash
   PORT=8081 npm start
   ```

3. **Connect nodes:**
   - Open http://localhost:8080
   - Go to "P2P Network" section
   - Enter: `ws://localhost:9081`
   - Click "Connect to Peer"

4. **Verify connection:**
   - Check "Connected Peers" in both nodes
   - Upload a file to one node
   - Try to retrieve it from the other node

## 🧪 Testing

Run the test suite:

```bash
npm test
```

The tests cover:
- Hash generation and validation
- Storage operations (store, retrieve, list)
- API endpoints functionality
- P2P network communication

## 📁 Project Structure

```
Own-IPFS-Service/
├── src/
│   ├── index.js      # Main entry point
│   ├── service.js    # HTTP service and API
│   ├── storage.js    # File storage system
│   ├── hash.js       # Hash generation
│   └── p2p.js        # P2P networking
├── public/
│   └── index.html    # Web interface
├── test/
│   └── test.js       # Test suite
├── cli.js            # Command-line interface
├── package.json      # Dependencies and scripts
└── README.md         # This file
```

## 🔒 Security Considerations

- Files are stored using cryptographic hashes (SHA-256)
- Content integrity is guaranteed by hash verification
- P2P connections use WebSocket protocol
- File size limits prevent resource exhaustion
- Input validation on all API endpoints

## 🚀 Advanced Usage

### Custom Storage Backend

```javascript
const { Storage } = require('./src/storage');

class CustomStorage extends Storage {
  async store(content, filename, mimeType) {
    // Custom storage logic
    return super.store(content, filename, mimeType);
  }
}
```

### Custom P2P Protocol

```javascript
const { P2PNetwork } = require('./src/p2p');

class CustomP2P extends P2PNetwork {
  async handleMessage(peerId, data) {
    // Custom message handling
    return super.handleMessage(peerId, data);
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by the IPFS (InterPlanetary File System) project
- Built with modern web technologies
- Designed for educational and practical use

## 📞 Support

- Create an issue for bugs or feature requests
- Check the test suite for usage examples  
- Review the API documentation in the code

## 👨‍💻 Author

**Fouad Abdi**
- GitHub: [@FouadAbdi](https://github.com/FouadAbdi)
- Email: fouad.abdi78@gmail.com

## 🔗 Repository

- **GitHub**: https://github.com/FouadAbdi/Own-IPFS-Service
- **Issues**: https://github.com/FouadAbdi/Own-IPFS-Service/issues
- **License**: MIT

---

*Built with ❤️ by [Fouad Abdi](https://github.com/FouadAbdi) - Happy file sharing! 🎉*
