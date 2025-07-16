const bcrypt = require('bcrypt');
const { getDb } = require('../database/connection');

class User {
  static async create(username, password) {
    const passwordHash = await bcrypt.hash(password, 10);
    const db = getDb();
    
    try {
      const result = await db.execute({
        sql: 'INSERT INTO users (username, password_hash) VALUES (?, ?)',
        args: [username, passwordHash]
      });
      
      return {
        id: result.lastInsertRowid,
        username
      };
    } catch (error) {
      if (error.message.includes('UNIQUE')) {
        throw new Error('Username already exists');
      }
      throw error;
    }
  }

  static async findByUsername(username) {
    const db = getDb();
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE username = ?',
      args: [username]
    });
    return result.rows[0];
  }

  static async validatePassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
  }
}

module.exports = User;