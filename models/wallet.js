const bitcoin = require('bitcoinjs-lib');
const { getDb } = require('../database/connection');

class Wallet {
  static async create(userId) {
    const keyPair = bitcoin.ECPair.makeRandom();
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
    
    const db = getDb();
    const result = await db.execute({
      sql: 'INSERT INTO wallets (user_id, address, private_key, public_key) VALUES (?, ?, ?, ?)',
      args: [
        userId,
        address,
        keyPair.privateKey.toString('hex'),
        keyPair.publicKey.toString('hex')
      ]
    });
    
    return {
      id: result.lastInsertRowid,
      address,
      balance: 0
    };
  }

  static async findByUserId(userId) {
    const db = getDb();
    const result = await db.execute({
      sql: 'SELECT id, address, balance FROM wallets WHERE user_id = ?',
      args: [userId]
    });
    return result.rows;
  }

  static async findById(walletId) {
    const db = getDb();
    const result = await db.execute({
      sql: 'SELECT * FROM wallets WHERE id = ?',
      args: [walletId]
    });
    return result.rows[0];
  }

  static async updateBalance(walletId, amount) {
    const db = getDb();
    await db.execute({
      sql: 'UPDATE wallets SET balance = balance + ? WHERE id = ?',
      args: [amount, walletId]
    });
  }

  static async getTransactions(walletId) {
    const db = getDb();
    const result = await db.execute({
      sql: 'SELECT * FROM transactions WHERE wallet_id = ? ORDER BY created_at DESC',
      args: [walletId]
    });
    return result.rows;
  }

  static async createTransaction(walletId, type, amount, address, txHash = null) {
    const db = getDb();
    const result = await db.execute({
      sql: 'INSERT INTO transactions (wallet_id, type, amount, address, tx_hash) VALUES (?, ?, ?, ?, ?)',
      args: [walletId, type, amount, address, txHash]
    });
    return result.lastInsertRowid;
  }
}

module.exports = Wallet;