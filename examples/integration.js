// Integration examples for Own IPFS Service
// These examples show how to integrate the IPFS service into your applications

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class IPFSClient {
  constructor(baseUrl = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
    this.apiUrl = `${baseUrl}/api`;
  }

  /**
   * Upload a file and return its hash
   */
  async uploadFile(filePath) {
    const content = await fs.readFile(filePath);
    const filename = path.basename(filePath);
    
    const formData = new FormData();
    formData.append('file', new Blob([content]), filename);
    
    const response = await axios.post(`${this.apiUrl}/add`, formData);
    return response.data;
  }

  /**
   * Upload text content
   */
  async uploadText(content, filename = 'text-file.txt') {
    const response = await axios.post(`${this.apiUrl}/add`, {
      content,
      filename,
      mimeType: 'text/plain'
    });
    return response.data;
  }

  /**
   * Download file by hash
   */
  async downloadFile(hash, outputPath = null) {
    const response = await axios.get(`${this.apiUrl}/cat/${hash}`, {
      responseType: 'arraybuffer'
    });
    
    if (outputPath) {
      await fs.writeFile(outputPath, response.data);
      return outputPath;
    }
    
    return Buffer.from(response.data);
  }

  /**
   * Get file metadata
   */
  async getMetadata(hash) {
    const response = await axios.get(`${this.apiUrl}/metadata/${hash}`);
    return response.data;
  }

  /**
   * List all files
   */
  async listFiles() {
    const response = await axios.get(`${this.apiUrl}/list`);
    return response.data;
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    const response = await axios.get(`${this.apiUrl}/stats`);
    return response.data;
  }

  /**
   * Check service health
   */
  async healthCheck() {
    const response = await axios.get(`${this.baseUrl}/health`);
    return response.data;
  }
}

// Example 1: Simple file backup system
class FileBackup {
  constructor(ipfsClient) {
    this.ipfs = ipfsClient;
    this.backupIndex = new Map();
  }

  async backupFile(filePath) {
    console.log(`Backing up: ${filePath}`);
    
    const result = await this.ipfs.uploadFile(filePath);
    this.backupIndex.set(filePath, result.hash);
    
    console.log(`✅ Backed up to: ${result.hash}`);
    return result.hash;
  }

  async restoreFile(filePath, outputDir = './restored') {
    const hash = this.backupIndex.get(filePath);
    if (!hash) {
      throw new Error(`No backup found for: ${filePath}`);
    }

    await fs.ensureDir(outputDir);
    const outputPath = path.join(outputDir, path.basename(filePath));
    
    await this.ipfs.downloadFile(hash, outputPath);
    console.log(`✅ Restored to: ${outputPath}`);
    return outputPath;
  }
}

// Example 2: Document sharing system
class DocumentSharing {
  constructor(ipfsClient) {
    this.ipfs = ipfsClient;
    this.sharedDocs = new Map();
  }

  async shareDocument(content, title) {
    const result = await this.ipfs.uploadText(content, `${title}.md`);
    
    const shareInfo = {
      hash: result.hash,
      title,
      sharedAt: new Date().toISOString(),
      size: result.size
    };
    
    this.sharedDocs.set(result.hash, shareInfo);
    
    console.log(`📄 Document shared: ${title}`);
    console.log(`🔗 Access with hash: ${result.hash}`);
    
    return shareInfo;
  }

  async getDocument(hash) {
    const content = await this.ipfs.downloadFile(hash);
    const metadata = await this.ipfs.getMetadata(hash);
    
    return {
      content: content.toString(),
      metadata
    };
  }

  getSharedDocuments() {
    return Array.from(this.sharedDocs.values());
  }
}

// Example 3: Configuration management
class ConfigManager {
  constructor(ipfsClient) {
    this.ipfs = ipfsClient;
    this.configHashes = new Map();
  }

  async saveConfig(name, config) {
    const content = JSON.stringify(config, null, 2);
    const result = await this.ipfs.uploadText(content, `${name}.json`);
    
    this.configHashes.set(name, result.hash);
    
    console.log(`⚙️ Config '${name}' saved with hash: ${result.hash}`);
    return result.hash;
  }

  async loadConfig(name) {
    const hash = this.configHashes.get(name);
    if (!hash) {
      throw new Error(`Config '${name}' not found`);
    }

    const content = await this.ipfs.downloadFile(hash);
    return JSON.parse(content.toString());
  }

  async listConfigs() {
    const configs = [];
    for (const [name, hash] of this.configHashes) {
      const metadata = await this.ipfs.getMetadata(hash);
      configs.push({
        name,
        hash,
        savedAt: new Date(metadata.timestamp).toISOString(),
        size: metadata.size
      });
    }
    return configs;
  }
}

// Usage examples
async function runExamples() {
  const ipfs = new IPFSClient();
  
  try {
    // Check if service is running
    await ipfs.healthCheck();
    console.log('✅ IPFS service is running\n');
    
    // Example 1: File backup
    console.log('📁 File Backup Example:');
    const backup = new FileBackup(ipfs);
    // await backup.backupFile('./sample.txt');
    // await backup.restoreFile('./sample.txt');
    
    // Example 2: Document sharing
    console.log('\n📄 Document Sharing Example:');
    const docSharing = new DocumentSharing(ipfs);
    await docSharing.shareDocument(
      '# Welcome to IPFS\n\nThis is a shared document!',
      'Welcome Guide'
    );
    
    // Example 3: Configuration management
    console.log('\n⚙️ Configuration Management Example:');
    const configManager = new ConfigManager(ipfs);
    await configManager.saveConfig('app-settings', {
      theme: 'dark',
      language: 'en',
      notifications: true
    });
    
    const config = await configManager.loadConfig('app-settings');
    console.log('Loaded config:', config);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Make sure the IPFS service is running: npm start');
  }
}

module.exports = {
  IPFSClient,
  FileBackup,
  DocumentSharing,
  ConfigManager,
  runExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples();
}
