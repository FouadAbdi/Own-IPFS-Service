#!/usr/bin/env node

// Example script demonstrating Own IPFS Service functionality
const axios = require('axios');
const fs = require('fs-extra');

const API_BASE = 'http://localhost:8080/api';

async function demonstrateIPFS() {
  console.log('🌟 Own IPFS Service Demonstration\n');

  try {
    // 1. Upload text content
    console.log('1. Uploading text content...');
    const textResponse = await axios.post(`${API_BASE}/add`, {
      content: 'Hello, decentralized world!',
      filename: 'greeting.txt',
      mimeType: 'text/plain'
    });
    
    const textHash = textResponse.data.hash;
    console.log(`   ✅ Text uploaded with hash: ${textHash}`);
    console.log(`   📊 Size: ${textResponse.data.size} bytes\n`);

    // 2. Retrieve the content
    console.log('2. Retrieving content...');
    const retrieveResponse = await axios.get(`${API_BASE}/cat/${textHash}`);
    console.log(`   ✅ Retrieved content: "${retrieveResponse.data}"\n`);

    // 3. Get metadata
    console.log('3. Getting file metadata...');
    const metadataResponse = await axios.get(`${API_BASE}/metadata/${textHash}`);
    const metadata = metadataResponse.data;
    console.log(`   ✅ Filename: ${metadata.filename}`);
    console.log(`   ✅ MIME Type: ${metadata.mimeType}`);
    console.log(`   ✅ Uploaded: ${new Date(metadata.timestamp).toLocaleString()}\n`);

    // 4. List all files
    console.log('4. Listing all stored files...');
    const listResponse = await axios.get(`${API_BASE}/list`);
    const files = listResponse.data;
    console.log(`   ✅ Total files stored: ${files.length}`);
    files.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.filename} (${file.hash.substring(0, 12)}...)`);
    });
    console.log('');

    // 5. Get storage statistics
    console.log('5. Getting storage statistics...');
    const statsResponse = await axios.get(`${API_BASE}/stats`);
    const stats = statsResponse.data;
    console.log(`   ✅ Total Files: ${stats.totalFiles}`);
    console.log(`   ✅ Total Size: ${stats.totalSizeFormatted}\n`);

    // 6. Check peer connections
    console.log('6. Checking P2P network...');
    const peersResponse = await axios.get(`${API_BASE}/peers`);
    const peers = peersResponse.data;
    console.log(`   ✅ Connected peers: ${peers.length}`);
    if (peers.length > 0) {
      peers.forEach((peer, index) => {
        console.log(`   ${index + 1}. ${peer.id} (${peer.connected ? 'Online' : 'Offline'})`);
      });
    } else {
      console.log('   ℹ️  No peers connected (this is normal for a single node)');
    }
    console.log('');

    // 7. Health check
    console.log('7. Service health check...');
    const healthResponse = await axios.get('http://localhost:8080/health');
    const health = healthResponse.data;
    console.log(`   ✅ Status: ${health.status}`);
    console.log(`   ✅ Timestamp: ${health.timestamp}`);
    console.log(`   ✅ Peers: ${health.peers}\n`);

    console.log('🎉 Demonstration completed successfully!');
    console.log('💡 Try the web interface at: http://localhost:8080');
    
  } catch (error) {
    console.error('❌ Error during demonstration:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the IPFS service is running: npm start');
    }
  }
}

// Run demonstration if this file is executed directly
if (require.main === module) {
  demonstrateIPFS();
}

module.exports = { demonstrateIPFS };
