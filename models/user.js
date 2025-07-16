const bitcoin = require('bitcoinjs-lib');
const { getDb } = require('../database/connection');

class User {
  static async createFromPrivateKey(privateKeyHex) {
    try {
      // Validate and parse private key
      const keyPair = bitcoin.ECPair.fromPrivateKey(Buffer.from(privateKeyHex, 'hex'));
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

  static validatePrivateKey(privateKeyHex) {
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

  static getAddressFromPrivateKey(privateKeyHex) {
    try {
      const keyPair = bitcoin.ECPair.fromPrivateKey(Buffer.from(privateKeyHex, 'hex'));
      const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
      return address;
    } catch (error) {
      return null;
    }
  }
}

module.exports = User;