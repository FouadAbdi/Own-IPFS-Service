const IPFSService = require('../src/service');
const Storage = require('../src/storage');
const IPFSHash = require('../src/hash');
const fs = require('fs-extra');
const path = require('path');

async function runTests() {
  console.log('🧪 Running Own IPFS Service Tests...\n');
  
  // Test 1: Hash Generation
  console.log('1. Testing Hash Generation...');
  const testContent = 'Hello, IPFS World!';
  const hash1 = IPFSHash.generate(testContent);
  const hash2 = IPFSHash.generate(testContent);
  
  console.log(`   Generated hash: ${hash1}`);
  console.log(`   Hash is valid: ${IPFSHash.isValid(hash1)}`);
  console.log(`   Deterministic: ${hash1 === hash2 ? '✅ Pass' : '❌ Fail'}`);
  
  // Test 2: Storage Operations
  console.log('\n2. Testing Storage Operations...');
  const testDir = './test-data';
  const storage = new Storage(testDir);
  
  try {
    // Store content
    const storedHash = await storage.store(testContent, 'test.txt', 'text/plain');
    console.log(`   Stored content with hash: ${storedHash}`);
    
    // Retrieve content
    const retrievedContent = await storage.retrieve(storedHash);
    const contentMatch = retrievedContent.toString() === testContent;
    console.log(`   Content retrieval: ${contentMatch ? '✅ Pass' : '❌ Fail'}`);
    
    // Get metadata
    const metadata = await storage.getMetadata(storedHash);
    console.log(`   Metadata retrieval: ${metadata ? '✅ Pass' : '❌ Fail'}`);
    console.log(`   Filename: ${metadata.filename}`);
    console.log(`   Size: ${metadata.size} bytes`);
    
    // List files
    const fileList = await storage.list();
    const listContainsFile = fileList.some(f => f.hash === storedHash);
    console.log(`   File listing: ${listContainsFile ? '✅ Pass' : '❌ Fail'}`);
    
    // Storage stats
    const stats = await storage.getStats();
    console.log(`   Storage stats: ${stats.totalFiles} files, ${stats.totalSizeFormatted}`);
    
  } catch (error) {
    console.log(`   Storage test failed: ${error.message}`);
  }
  
  // Test 3: API Endpoints (requires service to be running)
  console.log('\n3. Testing API Endpoints...');
  try {
    const service = new IPFSService(3001, testDir);
    
    // Start service
    await new Promise((resolve) => {
      const server = service.app.listen(3001, () => {
        console.log('   Test service started on port 3001');
        resolve();
      });
      
      // Test health endpoint
      setTimeout(async () => {
        try {
          const response = await fetch('http://localhost:3001/health');
          const health = await response.json();
          console.log(`   Health check: ${health.status === 'healthy' ? '✅ Pass' : '❌ Fail'}`);
        } catch (error) {
          console.log(`   Health check failed: ${error.message}`);
        }
        
        server.close();
      }, 1000);
    });
    
  } catch (error) {
    console.log(`   API test failed: ${error.message}`);
  }
  
  // Cleanup
  try {
    await fs.remove(testDir);
    console.log('\n🧹 Test cleanup completed');
  } catch (error) {
    console.log(`\n🧹 Cleanup failed: ${error.message}`);
  }
  
  console.log('\n✅ Tests completed!');
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

runTests().catch(console.error);
