#!/usr/bin/env node

// Multi-node P2P network example
const IPFSService = require('./src/service');

async function startMultiNodeNetwork() {
  console.log('🌐 Starting Multi-Node IPFS Network...\n');

  // Start multiple nodes
  const nodes = [];
  const ports = [8080, 8081, 8082];

  for (let i = 0; i < ports.length; i++) {
    const port = ports[i];
    const dataDir = `./data-node-${port}`;
    
    console.log(`📡 Starting node ${i + 1} on port ${port}...`);
    
    const service = new IPFSService(port, dataDir);
    nodes.push(service);
    
    // Start service
    await service.start();
    
    // Wait a bit before starting next node
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n✅ All nodes started successfully!');
  console.log('\n🔗 Network Information:');
  nodes.forEach((node, index) => {
    const port = ports[index];
    console.log(`   Node ${index + 1}: http://localhost:${port} (P2P: ws://localhost:${port + 1000})`);
  });

  console.log('\n💡 To connect nodes manually:');
  console.log('   1. Open any node\'s web interface');
  console.log('   2. Go to "P2P Network" section');
  console.log('   3. Enter another node\'s WebSocket URL (e.g., ws://localhost:9081)');
  console.log('   4. Click "Connect to Peer"');

  console.log('\n🎯 Try uploading a file to one node and retrieving it from another!');
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down all nodes...');
    nodes.forEach(node => node.stop());
    process.exit(0);
  });
}

if (require.main === module) {
  startMultiNodeNetwork().catch(console.error);
}

module.exports = { startMultiNodeNetwork };
