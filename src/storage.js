const fs = require('fs-extra');
const path = require('path');
const IPFSHash = require('./hash');

class Storage {
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    this.blocksDir = path.join(dataDir, 'blocks');
    this.metadataDir = path.join(dataDir, 'metadata');
    this.init();
  }

  /**
   * Initialize storage directories
   */
  async init() {
    await fs.ensureDir(this.blocksDir);
    await fs.ensureDir(this.metadataDir);
  }

  /**
   * Store content and return hash
   * @param {Buffer|string} content - Content to store
   * @param {string} filename - Original filename
   * @param {string} mimeType - MIME type of the content
   * @returns {Promise<string>} - Hash of stored content
   */
  async store(content, filename = null, mimeType = 'application/octet-stream') {
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
    const hash = IPFSHash.generate(buffer);
    
    // Store the actual content
    const blockPath = this.getBlockPath(hash);
    await fs.ensureDir(path.dirname(blockPath));
    await fs.writeFile(blockPath, buffer);
    
    // Store metadata
    const metadata = {
      hash,
      size: buffer.length,
      filename,
      mimeType,
      timestamp: Date.now(),
      type: 'file'
    };
    
    const metadataPath = this.getMetadataPath(hash);
    await fs.ensureDir(path.dirname(metadataPath));
    await fs.writeJSON(metadataPath, metadata, { spaces: 2 });
    
    return hash;
  }

  /**
   * Retrieve content by hash
   * @param {string} hash - Hash of content to retrieve
   * @returns {Promise<Buffer|null>} - Content buffer or null if not found
   */
  async retrieve(hash) {
    if (!IPFSHash.isValid(hash)) {
      throw new Error('Invalid hash format');
    }

    const blockPath = this.getBlockPath(hash);
    
    if (await fs.pathExists(blockPath)) {
      return await fs.readFile(blockPath);
    }
    
    return null;
  }

  /**
   * Get metadata for a hash
   * @param {string} hash - Hash to get metadata for
   * @returns {Promise<Object|null>} - Metadata object or null
   */
  async getMetadata(hash) {
    if (!IPFSHash.isValid(hash)) {
      throw new Error('Invalid hash format');
    }

    const metadataPath = this.getMetadataPath(hash);
    
    if (await fs.pathExists(metadataPath)) {
      return await fs.readJSON(metadataPath);
    }
    
    return null;
  }

  /**
   * Check if content exists
   * @param {string} hash - Hash to check
   * @returns {Promise<boolean>} - True if exists
   */
  async exists(hash) {
    if (!IPFSHash.isValid(hash)) {
      return false;
    }

    const blockPath = this.getBlockPath(hash);
    return await fs.pathExists(blockPath);
  }

  /**
   * List all stored hashes
   * @returns {Promise<Array>} - Array of hash objects with metadata
   */
  async list() {
    const hashes = [];
    
    try {
      const metadataFiles = await this.getAllMetadataFiles(this.metadataDir);
      
      for (const file of metadataFiles) {
        try {
          const metadata = await fs.readJSON(file);
          hashes.push(metadata);
        } catch (error) {
          console.warn(`Failed to read metadata file ${file}:`, error.message);
        }
      }
    } catch (error) {
      console.warn('Failed to list hashes:', error.message);
    }
    
    return hashes.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Delete content by hash
   * @param {string} hash - Hash to delete
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async delete(hash) {
    if (!IPFSHash.isValid(hash)) {
      return false;
    }

    const blockPath = this.getBlockPath(hash);
    const metadataPath = this.getMetadataPath(hash);
    
    let deleted = false;
    
    if (await fs.pathExists(blockPath)) {
      await fs.remove(blockPath);
      deleted = true;
    }
    
    if (await fs.pathExists(metadataPath)) {
      await fs.remove(metadataPath);
      deleted = true;
    }
    
    return deleted;
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>} - Storage stats
   */
  async getStats() {
    const hashes = await this.list();
    const totalSize = hashes.reduce((sum, item) => sum + (item.size || 0), 0);
    
    return {
      totalFiles: hashes.length,
      totalSize,
      totalSizeFormatted: this.formatBytes(totalSize)
    };
  }

  /**
   * Get block file path for hash
   * @param {string} hash - Hash
   * @returns {string} - File path
   */
  getBlockPath(hash) {
    // Distribute files in subdirectories based on first 2 characters
    const subDir = hash.substring(2, 4);
    return path.join(this.blocksDir, subDir, hash);
  }

  /**
   * Get metadata file path for hash
   * @param {string} hash - Hash
   * @returns {string} - File path
   */
  getMetadataPath(hash) {
    const subDir = hash.substring(2, 4);
    return path.join(this.metadataDir, subDir, `${hash}.json`);
  }

  /**
   * Recursively get all metadata files
   * @param {string} dir - Directory to search
   * @returns {Promise<Array>} - Array of file paths
   */
  async getAllMetadataFiles(dir) {
    const files = [];
    
    if (!(await fs.pathExists(dir))) {
      return files;
    }
    
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await this.getAllMetadataFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.name.endsWith('.json')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  /**
   * Format bytes to human readable string
   * @param {number} bytes - Bytes to format
   * @returns {string} - Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = Storage;
