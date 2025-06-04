const IPFSService = require('./service');

// Configuration
const PORT = process.env.PORT || 8080;
const DATA_DIR = process.env.DATA_DIR || './data';

// Create and start the service
const ipfsService = new IPFSService(PORT, DATA_DIR);

console.log('🌟 Starting Own IPFS Service...');
console.log(`📁 Data directory: ${DATA_DIR}`);
console.log(`🌐 Port: ${PORT}`);

ipfsService.start().catch(error => {
  console.error('Failed to start service:', error);
  process.exit(1);
});
