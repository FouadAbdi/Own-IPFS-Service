# 🚀 Quick Start Guide

This guide will help you get your Own IPFS Service up and running in minutes!

## Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

## Installation & Setup

1. **Clone and install:**
   ```powershell
   git clone https://github.com/FouadAbdi/Own-IPFS-Service.git
   cd Own-IPFS-Service
   npm install
   ```

2. **Start the service:**
   ```powershell
   npm start
   ```

3. **Open your browser:**
   - Go to: http://localhost:8080
   - You should see the beautiful web interface!

## Basic Usage Examples

### 1. Upload Your First File

**Via Web Interface:**
- Drag and drop any file onto the upload area
- Or click "Select Files" to browse
- Get an IPFS hash like: `QmYourHashHere...`

**Via API:**
```powershell
# Upload text content
$body = @{
    content = "Hello, IPFS!"
    filename = "hello.txt"
    mimeType = "text/plain"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/add" -Method Post -Body $body -ContentType "application/json"
Write-Host "File hash: $($response.hash)"
```

**Via CLI:**
```powershell
# Add a file
node cli.js add sample.txt

# List all files
node cli.js list

# Get statistics
node cli.js stats
```

### 2. Retrieve Files

**Via Web Interface:**
- Enter the hash in the "Retrieve Files" section
- Click "Retrieve" to download
- Click "Get Info" for metadata

**Via API:**
```powershell
# Get file content
$content = Invoke-RestMethod -Uri "http://localhost:8080/api/cat/QmYourHashHere"
Write-Host $content

# Get file metadata
$metadata = Invoke-RestMethod -Uri "http://localhost:8080/api/metadata/QmYourHashHere"
$metadata | ConvertTo-Json
```

**Via CLI:**
```powershell
# Retrieve file content
node cli.js cat QmYourHashHere

# Save to file
node cli.js cat QmYourHashHere --output downloaded-file.txt
```

### 3. Set Up P2P Network

**Single Command Multi-Node Setup:**
```powershell
npm run multi-node
```

This starts 3 nodes on ports 8080, 8081, and 8082.

**Manual P2P Connection:**
1. Start first node: `npm start`
2. Start second node: `PORT=8081 npm start` (Linux/Mac) or set PORT in environment
3. In web interface, connect nodes using: `ws://localhost:9081`

## Advanced Examples

### Programmatic Usage

```javascript
const IPFSService = require('./src/service');

// Create custom service
const service = new IPFSService(3000, './my-data');
await service.start();

// Use storage directly
const { Storage } = require('./src/storage');
const storage = new Storage('./my-storage');

const hash = await storage.store('Hello World', 'hello.txt');
const content = await storage.retrieve(hash);
```

### Custom Configuration

```javascript
// Environment variables
process.env.PORT = '9000';
process.env.DATA_DIR = '/custom/path';

// Or programmatically
const service = new IPFSService({
  port: 9000,
  dataDir: '/custom/path',
  maxFileSize: 50 * 1024 * 1024 // 50MB
});
```

## Testing Your Setup

1. **Run tests:**
   ```powershell
   npm test
   ```

2. **Run demo:**
   ```powershell
   npm run demo
   ```

3. **Health check:**
   ```powershell
   $health = Invoke-RestMethod -Uri "http://localhost:8080/health"
   $health | ConvertTo-Json
   ```

## Troubleshooting

### Service Won't Start
- Check if port 8080 is available
- Try a different port: `$env:PORT=8081; npm start`
- Check Node.js version: `node --version`

### Can't Connect to Peers
- Ensure both nodes are running
- Check firewall settings
- Verify WebSocket URLs (should start with `ws://`)

### File Upload Fails
- Check file size (default limit: 100MB)
- Verify file permissions
- Check available disk space

## Next Steps

1. **Customize the web interface** in `public/index.html`
2. **Extend the API** in `src/service.js`
3. **Add custom storage backends** in `src/storage.js`
4. **Implement custom P2P protocols** in `src/p2p.js`

## Directory Structure After Setup

```
Own-IPFS-Service/
├── data/                 # Your files storage
│   ├── blocks/          # Raw file content
│   └── metadata/        # File information
├── src/                 # Source code
├── public/              # Web interface
├── test/                # Test suite
└── node_modules/        # Dependencies
```

Happy decentralizing! 🎉

---

## 👨‍💻 Author

**Fouad Abdi**
- GitHub: [@FouadAbdi](https://github.com/FouadAbdi)
- Email: fouad.abdi78@gmail.com

*Built with ❤️ by [Fouad Abdi](https://github.com/FouadAbdi)*
