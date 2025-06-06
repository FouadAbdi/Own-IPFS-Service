# IPFS Service Tutorial

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Installation and Setup](#installation-and-setup)
5. [Core Components](#core-components)
6. [Configuration](#configuration)
7. [Running the Service](#running-the-service)
8. [API Usage](#api-usage)
9. [Web Interface](#web-interface)
10. [Docker Deployment](#docker-deployment)
11. [Testing](#testing)
12. [Troubleshooting](#troubleshooting)
13. [Advanced Features](#advanced-features)

## Introduction

This tutorial will guide you through building and using a custom IPFS (InterPlanetary File System) service. The service provides distributed file storage capabilities with a web interface and REST API.

### What is IPFS?

IPFS is a distributed system for storing and accessing files, websites, applications, and data. It uses content-addressing to uniquely identify each file in a global namespace connecting all computing devices.

### Key Features of This Service

- Distributed file storage and retrieval
- Content-addressed storage using cryptographic hashes
- P2P networking capabilities
- RESTful API interface
- Web-based user interface
- Docker containerization support
- Built-in testing suite

## Project Structure

```
Own-IPFS-Service/
├── src/
│   ├── index.js          # Main application entry point
│   ├── service.js        # Core IPFS service implementation
│   ├── hash.js           # Content hashing utilities
│   ├── storage.js        # File storage management
│   └── p2p.js           # Peer-to-peer networking
├── public/
│   ├── index.html        # Web interface
│   ├── style.css         # Styling
│   └── script.js         # Client-side JavaScript
├── test/
│   └── test.js           # Test suite
├── cli.js                # Command-line interface
├── config.json           # Configuration file
├── package.json          # Node.js dependencies
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose setup
└── README.md             # Project documentation
```

## Prerequisites

Before starting, ensure you have the following installed:

- Node.js (version 14 or higher)
- npm (Node Package Manager)
- Git
- Docker (optional, for containerized deployment)

## Installation and Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Own-IPFS-Service
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Verify Installation

```bash
npm test
```

## Core Components

### 1. Hash Module (`src/hash.js`)

The hash module provides content-addressing functionality:

```javascript
// Generate a hash for content
const hash = generateHash(content);

// Verify content integrity
const isValid = verifyHash(content, expectedHash);
```

**Key Functions:**
- `generateHash(content)`: Creates SHA-256 hash of content
- `verifyHash(content, hash)`: Validates content against hash
- `createContentAddress(data)`: Generates IPFS-style content address

### 2. Storage Module (`src/storage.js`)

Manages file storage and retrieval:

```javascript
// Store content
const address = await storage.store(content);

// Retrieve content
const content = await storage.retrieve(address);
```

**Key Functions:**
- `store(content)`: Saves content and returns address
- `retrieve(address)`: Fetches content by address
- `exists(address)`: Checks if content exists
- `delete(address)`: Removes stored content

### 3. P2P Module (`src/p2p.js`)

Handles peer-to-peer networking:

```javascript
// Connect to peer
await p2p.connect(peerAddress);

// Broadcast content
p2p.broadcast(contentAddress);
```

**Key Functions:**
- `connect(peer)`: Establishes connection with peer
- `disconnect(peer)`: Closes peer connection
- `broadcast(message)`: Sends message to all peers
- `discover()`: Finds available peers

### 4. Service Module (`src/service.js`)

Core IPFS service implementation:

```javascript
// Initialize service
const service = new IPFSService(config);
await service.start();

// Add content
const hash = await service.add(content);

// Get content
const content = await service.get(hash);
```

## Configuration

The `config.json` file contains service settings:

```json
{
  "port": 3000,
  "storage": {
    "path": "./data",
    "maxSize": "1GB"
  },
  "network": {
    "peers": [],
    "discoveryInterval": 30000
  },
  "api": {
    "cors": true,
    "rateLimit": 100
  }
}
```

### Configuration Options

- **port**: HTTP server port
- **storage.path**: Directory for stored files
- **storage.maxSize**: Maximum storage capacity
- **network.peers**: Initial peer list
- **network.discoveryInterval**: Peer discovery frequency
- **api.cors**: Enable CORS support
- **api.rateLimit**: Requests per minute limit

## Running the Service

### Development Mode

```bash
npm start
```

### Production Mode

```bash
npm run prod
```

### Command Line Interface

```bash
# Add a file
node cli.js add ./path/to/file

# Get a file
node cli.js get <hash> ./output/path

# List stored files
node cli.js list

# Show service status
node cli.js status
```

## API Usage

The service provides a RESTful API:

### Add Content

```http
POST /api/add
Content-Type: multipart/form-data

{file: [binary data]}
```

Response:
```json
{
  "hash": "QmX...",
  "size": 1024,
  "name": "example.txt"
}
```

### Retrieve Content

```http
GET /api/get/:hash
```

Response:
```http
Content-Type: application/octet-stream
[binary data]
```

### List Content

```http
GET /api/list
```

Response:
```json
{
  "items": [
    {
      "hash": "QmX...",
      "size": 1024,
      "timestamp": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### Service Status

```http
GET /api/status
```

Response:
```json
{
  "status": "running",
  "peers": 5,
  "stored_files": 42,
  "storage_used": "256MB"
}
```

## Web Interface

Access the web interface at `http://localhost:3000`:

### Features

1. **File Upload**: Drag and drop files or click to select
2. **File Browser**: View stored files with metadata
3. **Download**: Retrieve files by hash
4. **Network Status**: View connected peers and service health
5. **Settings**: Configure service parameters

### Usage Examples

1. **Upload a File**:
   - Open web interface
   - Click "Upload File" or drop file into upload area
   - Copy the returned hash for later retrieval

2. **Download a File**:
   - Enter the file hash in the download field
   - Click "Download" to retrieve the file

3. **Browse Files**:
   - View all stored files in the file browser
   - Click on any file to view details or download

## Docker Deployment

### Build Image

```bash
docker build -t ipfs-service .
```

### Run Container

```bash
docker run -p 3000:3000 -v $(pwd)/data:/app/data ipfs-service
```

### Docker Compose

```bash
docker-compose up -d
```

This starts the service with persistent storage and network configuration.

### Environment Variables

- `PORT`: Service port (default: 3000)
- `STORAGE_PATH`: Storage directory path
- `MAX_STORAGE`: Maximum storage size
- `PEERS`: Comma-separated list of initial peers

## Testing

### Run All Tests

```bash
npm test
```

### Test Categories

1. **Unit Tests**: Individual component testing
2. **Integration Tests**: API endpoint testing
3. **P2P Tests**: Network communication testing
4. **Storage Tests**: File storage and retrieval

### Writing Tests

Add new tests to `test/test.js`:

```javascript
describe('New Feature', () => {
  it('should perform expected behavior', async () => {
    // Test implementation
    const result = await newFeature();
    expect(result).toBe(expectedValue);
  });
});
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```
   Error: EADDRINUSE
   ```
   Solution: Change port in config.json or stop conflicting service

2. **Storage Permission Denied**
   ```
   Error: EACCES
   ```
   Solution: Check directory permissions for storage path

3. **Peer Connection Failed**
   ```
   Error: Connection timeout
   ```
   Solution: Verify peer addresses and network connectivity

4. **Hash Verification Failed**
   ```
   Error: Content hash mismatch
   ```
   Solution: Content may be corrupted, re-upload file

### Debug Mode

Enable debug logging:

```bash
DEBUG=ipfs:* npm start
```

### Log Analysis

Check service logs in `logs/` directory:
- `service.log`: General service events
- `p2p.log`: Network communication
- `storage.log`: File operations
- `error.log`: Error messages

## Advanced Features

### Custom Hash Algorithms

Extend the hash module to support different algorithms:

```javascript
const customHash = createHasher({
  algorithm: 'sha3-256',
  encoding: 'base58'
});
```

### Encryption Support

Add encryption for sensitive content:

```javascript
const encryptedContent = await encrypt(content, key);
const hash = await service.add(encryptedContent);
```

### Content Pinning

Pin important content to prevent garbage collection:

```javascript
await service.pin(hash);
await service.unpin(hash);
```

### Bandwidth Management

Configure bandwidth limits:

```json
{
  "bandwidth": {
    "upload": "1MB/s",
    "download": "5MB/s"
  }
}
```

### Custom Protocols

Implement custom P2P protocols:

```javascript
const protocol = new Protocol('custom-protocol', handler);
p2p.registerProtocol(protocol);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

For questions and support:
- Create an issue on GitHub
- Check the documentation
- Review the test cases for usage examples

---

This tutorial provides a comprehensive guide to building and using the IPFS service. For additional information, refer to the source code comments and API documentation.