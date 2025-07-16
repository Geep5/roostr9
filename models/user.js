const bitcoin = require('bitcoinjs-lib');
const { getDb } = require('../database/connection');

class User {
  static async createFromPrivateKey(privateKeyInput) {
    try {
      let keyPair;
      
      // Check if it's WIF format or hex format
      if (this.isWIF(privateKeyInput)) {
        keyPair = bitcoin.ECPair.fromWIF(privateKeyInput);
      } else if (this.validatePrivateKeyHex(privateKeyInput)) {
        keyPair = bitcoin.ECPair.fromPrivateKey(Buffer.from(privateKeyInput, 'hex'));
      } else {
        throw new Error('Invalid private key format');
      }
      
      const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
      
      const db = getDb();
      
      // Check if user already exists
      const existing = await this.findByAddress(address);
      if (existing) {
        return existing;
      }
      
      // Create new user
      const result = await db.execute({
        sql: 'INSERT INTO users (address, public_key) VALUES (?, ?)',
        args: [address, keyPair.publicKey.toString('hex')]
      });
      
      return {
        id: result.lastInsertRowid,
        address
      };
    } catch (error) {
      if (error.message.includes('UNIQUE')) {
        throw new Error('User already exists');
      }
      throw new Error('Invalid private key');
    }
  }

  static async findByAddress(address) {
    const db = getDb();
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE address = ?',
      args: [address]
    });
    return result.rows[0];
  }

  static async findById(id) {
    const db = getDb();
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [id]
    });
    return result.rows[0];
  }

  static validatePrivateKey(privateKeyInput) {
    return this.isWIF(privateKeyInput) || this.validatePrivateKeyHex(privateKeyInput);
  }
  
  static validatePrivateKeyHex(privateKeyHex) {
    try {
      // Remove any whitespace and validate hex format
      const cleanKey = privateKeyHex.trim();
      if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
        return false;
      }
      
      // Try to create key pair
      bitcoin.ECPair.fromPrivateKey(Buffer.from(cleanKey, 'hex'));
      return true;
    } catch (error) {
      return false;
    }
  }
  
  static isWIF(privateKeyInput) {
    try {
      const cleanKey = privateKeyInput.trim();
      // WIF format starts with K, L (compressed) or 5 (uncompressed)
      if (!/^[KL5][1-9A-HJ-NP-Za-km-z]{50,51}$/.test(cleanKey)) {
        return false;
      }
      // Try to decode it
      bitcoin.ECPair.fromWIF(cleanKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  static getAddressFromPrivateKey(privateKeyInput) {
    try {
      let keyPair;
      
      if (this.isWIF(privateKeyInput)) {
        keyPair = bitcoin.ECPair.fromWIF(privateKeyInput);
      } else if (this.validatePrivateKeyHex(privateKeyInput)) {
        keyPair = bitcoin.ECPair.fromPrivateKey(Buffer.from(privateKeyInput, 'hex'));
      } else {
        return null;
      }
      
      const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
      return address;
    } catch (error) {
      return null;
    }
  }
}

module.exports = User;