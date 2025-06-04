const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');

class IPFSHash {
  /**
   * Generate IPFS-like hash for content
   * @param {Buffer|string} content - Content to hash
   * @returns {string} - Base58 encoded hash with 'Qm' prefix
   */
  static generate(content) {
    const hash = crypto.createHash('sha256').update(content).digest();
    const base58Hash = this.base58Encode(hash);
    return 'Qm' + base58Hash.substring(0, 44); // IPFS-like format
  }

  /**
   * Base58 encoding (Bitcoin alphabet)
   * @param {Buffer} buffer - Buffer to encode
   * @returns {string} - Base58 encoded string
   */
  static base58Encode(buffer) {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let digits = [0];
    
    for (let i = 0; i < buffer.length; i++) {
      let carry = buffer[i];
      for (let j = 0; j < digits.length; j++) {
        carry += digits[j] << 8;
        digits[j] = carry % 58;
        carry = Math.floor(carry / 58);
      }
      while (carry > 0) {
        digits.push(carry % 58);
        carry = Math.floor(carry / 58);
      }
    }
    
    // Convert to string
    let result = '';
    for (let i = digits.length - 1; i >= 0; i--) {
      result += alphabet[digits[i]];
    }
    
    // Add leading zeros
    for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
      result = alphabet[0] + result;
    }
    
    return result;
  }

  /**
   * Verify if hash is valid IPFS format
   * @param {string} hash - Hash to verify
   * @returns {boolean} - True if valid
   */
  static isValid(hash) {
    return typeof hash === 'string' && hash.startsWith('Qm') && hash.length === 46;
  }
}

module.exports = IPFSHash;
